
// This utility handles the "heavy lifting" of data parsing and transformation.
// We keep it separate from the UI components to make it easier to test and maintain.

import { SeizureRecord, DataQualityReport } from '../types';
import { YORKSHIRE_GEO_MAP, CATEGORIES, CITIES } from '../constants';

// Generates dummy data for testing the dashboard without a real spreadsheet.
export const generateMockData = (count: number): any[] => {
  const subCategories: Record<string, string[]> = {
    'Class A Drugs': ['Heroin', 'Cocaine', 'Crack', 'Ecstasy'],
    'Class B Drugs': ['Cannabis', 'Ketamine', 'Amphetamine'],
    'Firearms': ['Handgun', 'Shotgun', 'Rifle', 'Ammunition'],
    'Bladed Weapons': ['Knife', 'Machete', 'Sword'],
    'Cash': ['GBP', 'EUR', 'USD'],
    'Tobacco/Alcohol': ['Cigarettes', 'Hand Rolling Tobacco', 'Spirits'],
    'Other': ['Stolen Goods', 'Digital Devices']
  };

  const data = [];
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  for (let i = 0; i < count; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * (CATEGORIES.length - 1)) + 1];
    const city = CITIES[Math.floor(Math.random() * (CITIES.length - 1)) + 1];
    
    // Find a postcode prefix for this city (or just pick one)
    const pcPrefixes = Object.keys(YORKSHIRE_GEO_MAP);
    const postcodePrefix = pcPrefixes[Math.floor(Math.random() * pcPrefixes.length)];
    const postcode = `${postcodePrefix}${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 9)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

    const date = new Date(oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime()));
    const subCat = subCategories[category]?.[Math.floor(Math.random() * subCategories[category].length)] || 'N/A';

    data.push({
      Date: date.toISOString(),
      City: city,
      Postcode: postcode,
      Category: category,
      'Sub-category': subCat,
      Item: subCat, // Using sub-category as the item name for mock data
      Quantity: Math.floor(Math.random() * 100) + 1,
      Cash: Math.floor(Math.random() * 5000)
    });
  }
  return data;
};

// The core parser that converts raw spreadsheet rows into our typed SeizureRecord format.
export const parseRawData = async (data: any[]): Promise<{ records: SeizureRecord[], quality: DataQualityReport }> => {
  const records: SeizureRecord[] = [];
  let invalidRows = 0;
  let malformedDates = 0;
  let invalidPostcodes = 0;
  const missingFields: Record<string, number> = {};

  const trackMissing = (field: string) => {
    missingFields[field] = (missingFields[field] || 0) + 1;
  };

  // Pre-process rows to extract all unique postcodes
  const uniquePostcodes = new Set<string>();
  
  const rawRows = data.map((row, index) => {
    // We try to be flexible with column names in case the source spreadsheet changes.
    const dateVal = row.Date || row.date || row.SEIZURE_DATE;
    const cityVal = row.City || row.city || row.LOCATION;
    const postcodeVal = row.Postcode || row.postcode || row.POST_CODE;
    const categoryVal = row.Category || row.category || row.TYPE;
    const subCategoryVal = row.Subcategory || row['Sub-category'] || '';
    const itemVal = row.Item || row.item || row.ITEM_NAME || subCategoryVal;
    const qtyVal = row.Quantity || row.qty || 1;

    // We now KEEP records with missing location/date fields so they remain searchable in the grid,
    // rather than rejecting them entirely.
    if (!dateVal) trackMissing('Date');
    if (!postcodeVal) trackMissing('Postcode');
    if (!categoryVal) trackMissing('Category');

    // Date Validation
    const parsedDate = new Date(dateVal);
    const isValidDate = !isNaN(parsedDate.getTime());
    if (!isValidDate) malformedDates++;

    const cleanPostcode = postcodeVal ? String(postcodeVal).toUpperCase().trim().replace(/\s+/g, '') : '';
    if (cleanPostcode) uniquePostcodes.add(cleanPostcode);

    return { row, index, isValidDate, parsedDate, cityVal, cleanPostcode, originalPostcode: postcodeVal, categoryVal, subCategoryVal, itemVal, qtyVal };
  });

  // Batch Postcodes.io API lookups at hyper-speed via Promise.all
  const postcodeMap = new Map<string, { lat: number, lng: number } | null>();
  const pcArray = Array.from(uniquePostcodes);
  const CHUNK_SIZE = 100;

  const fetchPromises = [];

  for (let i = 0; i < pcArray.length; i += CHUNK_SIZE) {
    const chunk = pcArray.slice(i, i + CHUNK_SIZE);
    
    // Create the API fetch Promise but do NOT stall the loop waiting for it. 
    // We add it to our array of "waiters" immediately!
    const singleBatchPromise = fetch('https://api.postcodes.io/postcodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postcodes: chunk })
    })
    .then(async (response) => {
      if (response.ok) {
        const result = await response.json();
        result.result.forEach((res: any) => {
           // Because postcodes.io strips spaces on input matches, we index by query stripped
           if (res.result) {
             postcodeMap.set(res.query.replace(/\s+/g, ''), { lat: res.result.latitude, lng: res.result.longitude });
           } else {
             postcodeMap.set(res.query.replace(/\s+/g, ''), null);
           }
        });
      }
    })
    .catch((err) => console.error("Geocoding Parallel Batch Failed", err));

    fetchPromises.push(singleBatchPromise);
  }

  // Wait for all the parallel waiters to return from the internet simultaneously
  await Promise.all(fetchPromises);

  // Final mapping with precision targeting
  rawRows.forEach(parsed => {
    let lat = 0;
    let lng = 0;

    if (parsed.cleanPostcode) {
       const exact = postcodeMap.get(parsed.cleanPostcode);
       if (exact) {
         // Exact rooftop mapping, no random jitter applied
         lat = exact.lat;
         lng = exact.lng;
       } else {
         // Fallback to fuzzy prefix if exact lookup failed (like generated mock data or malformed real data)
         const pcMatch = parsed.cleanPostcode.match(/^([A-Z]{1,2})/);
         const pcArea = pcMatch ? pcMatch[1] : null;
         const fallbackCoords = pcArea ? YORKSHIRE_GEO_MAP[pcArea] : null;
         if (fallbackCoords) {
           // Jitter is ONLY applied to the blurry fallback center to prevent overlapping stacks of dead pins.
           lat = fallbackCoords.lat + ((Math.random() - 0.5) * 0.02);
           lng = fallbackCoords.lng + ((Math.random() - 0.5) * 0.02);
         }
       }
    }

    if (lat === 0 && lng === 0) invalidPostcodes++;

    records.push({
      id: `record-${parsed.index}`,
      date: parsed.isValidDate ? parsed.parsedDate.toISOString() : '',
      city: parsed.cityVal || 'Location Unknown',
      postcode: parsed.originalPostcode ? String(parsed.originalPostcode).toUpperCase().trim() : 'Unknown Area',
      category: parsed.categoryVal || 'Uncategorised',
      subCategory: parsed.subCategoryVal || 'Uncategorised',
      item: parsed.itemVal || 'Unknown',
      itemType: parsed.categoryVal || 'Uncategorised',
      quantity: Number(parsed.qtyVal) || 1,
      cash: Number(parsed.row.Cash || parsed.row.Value || 0),
      latitude: lat,
      longitude: lng,
      ...parsed.row 
    });
  });

  return {
    records,
    quality: {
      totalRows: data.length,
      validRows: records.length,
      missingFields,
      malformedDates,
      invalidPostcodes,
      invalidRows
    }
  };
};

export const exportToCSV = (data: SeizureRecord[]) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]).filter(k => !['latitude', 'longitude', 'id'].includes(k));
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `seizure_data_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
