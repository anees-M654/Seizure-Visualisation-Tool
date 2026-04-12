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
  });
});
