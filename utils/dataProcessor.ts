
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
export const parseRawData = (data: any[]): { records: SeizureRecord[], quality: DataQualityReport } => {
  const records: SeizureRecord[] = [];
  let invalidRows = 0;
  let malformedDates = 0;
  let invalidPostcodes = 0;
  const missingFields: Record<string, number> = {};

  const trackMissing = (field: string) => {
    missingFields[field] = (missingFields[field] || 0) + 1;
  };

  data.forEach((row, index) => {
    // We try to be flexible with column names in case the source spreadsheet changes.
    const dateVal = row.Date || row.date || row.SEIZURE_DATE;
    const cityVal = row.City || row.city || row.LOCATION;
    const postcodeVal = row.Postcode || row.postcode || row.POST_CODE;
    const categoryVal = row.Category || row.category || row.TYPE;
    const subCategoryVal = row.Subcategory || row['Sub-category'] || '';
    const itemVal = row.Item || row.item || row.ITEM_NAME || subCategoryVal;
    const qtyVal = row.Quantity || row.qty || 1;

    // Critical fields check: if we don't have a date or location, we can't map it.
    if (!dateVal) trackMissing('Date');
    if (!postcodeVal) trackMissing('Postcode');
    if (!categoryVal) trackMissing('Category');

    if (!dateVal || !postcodeVal || !categoryVal) {
      invalidRows++;
      return;
    }

    // Date Validation
    const parsedDate = new Date(dateVal);
    if (isNaN(parsedDate.getTime())) {
      malformedDates++;
      invalidRows++;
      return;
    }

    // Postcode Geocoding:
    // We extract the area code (e.g., 'LS' from 'LS1 1UR') and look up coordinates.
    const cleanPostcode = String(postcodeVal).toUpperCase().trim();
    const pcMatch = cleanPostcode.match(/^([A-Z]{1,2})/);
    const pcArea = pcMatch ? pcMatch[1] : null;
    const coords = pcArea ? YORKSHIRE_GEO_MAP[pcArea] : null;

    if (!coords) {
      invalidPostcodes++;
      invalidRows++;
      return;
    }

    // Jitter: we add a tiny bit of randomness to the coordinates.
    // This prevents markers from overlapping perfectly if they share the same postcode area.
    const jitter = () => (Math.random() - 0.5) * 0.02;

    records.push({
      id: `record-${index}`,
      date: parsedDate.toISOString(),
      city: cityVal || 'Unknown',
      postcode: cleanPostcode,
      category: categoryVal,
      subCategory: subCategoryVal,
      item: itemVal,
      itemType: categoryVal,
      quantity: Number(qtyVal),
      cash: Number(row.Cash || row.Value || 0),
      latitude: coords.lat + jitter(),
      longitude: coords.lng + jitter(),
      ...row // We spread the original row so any extra columns are preserved for the table view.
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
