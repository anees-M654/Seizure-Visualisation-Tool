import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateMockData, parseRawData } from './dataProcessor';

describe('dataProcessor', () => {
  describe('generateMockData', () => {
    it('should generate the correct number of records', () => {
      const data = generateMockData(5);
      expect(data).toHaveLength(5);
    });

    it('should include required fields in generated data', () => {
      const data = generateMockData(1);
      const record = data[0];
      
      expect(record).toHaveProperty('Date');
      expect(record).toHaveProperty('City');
      expect(record).toHaveProperty('Postcode');
      expect(record).toHaveProperty('Category');
      expect(record).toHaveProperty('Sub-category');
      expect(record).toHaveProperty('Quantity');
      expect(record).toHaveProperty('Cash');
    });
  });

  describe('parseRawData', () => {
    beforeEach(() => {
      // Mock global fetch for Postcodes.io API
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ result: [] })
        })
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should process empty data array', async () => {
      const result = await parseRawData([]);
      expect(result.records).toHaveLength(0);
      expect(result.quality.totalRows).toBe(0);
      expect(result.quality.validRows).toBe(0);
    });

    it('should map flat object data to SeizureRecord schema', async () => {
      const mockRawData = [{
        Date: '2023-01-01',
        City: 'Leeds',
        Postcode: 'LS1 1AA',
        Category: 'Class A Drugs',
        'Sub-category': 'Heroin',
        Quantity: 5,
        Cash: 500
      }];

      const result = await parseRawData(mockRawData);
      
      expect(result.records).toHaveLength(1);
      const record = result.records[0];
      expect(record.city).toBe('Leeds');
      expect(record.postcode).toBe('LS1 1AA');
      expect(record.category).toBe('Class A Drugs');
      expect(record.quantity).toBe(5);
      expect(record.cash).toBe(500);
      expect(record.latitude).toBeDefined();
      expect(record.longitude).toBeDefined();
    });

    it('should track malformed dates in quality report', async () => {
      const mockRawData = [{
        Date: 'invalid-date-string',
        City: 'Leeds',
        Postcode: 'LS1 1AA',
        Category: 'Firearms',
        Quantity: 1
      }];

      const result = await parseRawData(mockRawData);
      expect(result.quality.malformedDates).toBe(1);
      expect(result.records[0].date).toBe(''); // Should be empty string if invalid
    });

    it('should track invalid postcodes in quality report', async () => {
      const mockRawData = [{
        Date: '2023-01-01',
        Postcode: 'INVALID-PC',
        Category: 'Cash',
        Quantity: 100
      }];

      const result = await parseRawData(mockRawData);
      expect(result.quality.invalidPostcodes).toBe(1);
      expect(result.records[0].latitude).toBe(0);
      expect(result.records[0].longitude).toBe(0);
    });
  });

  describe('exportToCSV', () => {
    beforeEach(() => {
      // Mock global URL and Blob for CSV export test
      global.URL.createObjectURL = vi.fn(() => 'mock-url');
      global.Blob = vi.fn();
      
      // Mock document methods for triggering download
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return {
            setAttribute: vi.fn(),
            click: vi.fn(),
            style: {},
            remove: vi.fn()
          } as any;
        }
        return document.createElement(tagName);
      });
      
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({}) as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({}) as any);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should trigger a download when data is provided', async () => {
      const { exportToCSV } = await import('./dataProcessor');
      const mockRecords = [{
        id: '1', date: '2023-01-01', city: 'Leeds', postcode: 'LS1', category: 'A', 
        subCategory: 'B', item: 'C', itemType: 'D', quantity: 1, cash: 100,
        latitude: 53.8, longitude: -1.5
      } as any];

      exportToCSV(mockRecords);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should not trigger download for empty data', async () => {
      const { exportToCSV } = await import('./dataProcessor');
      exportToCSV([]);
      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    });
  });
});
