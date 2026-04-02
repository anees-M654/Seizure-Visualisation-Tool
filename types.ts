
export interface SeizureRecord {
  id: string;
  date: string;
  city: string;
  postcode: string;
  category: string;
  subCategory: string;
  itemType: string;
  quantity: number;
  cash?: number;
  latitude: number;
  longitude: number;
  [key: string]: any;
}

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  missingFields: Record<string, number>;
  malformedDates: number;
  invalidPostcodes: number;
  invalidRows: number;
}

export interface FilterState {
  dateRange: [string, string];
  categories: string[];
  subCategories: string[];
  cities: string[];
  postcodes: string[];
  keyword: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  ERROR = 'ERROR'
}
