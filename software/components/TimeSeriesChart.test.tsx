import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TimeSeriesChart from './TimeSeriesChart';
import { SeizureRecord } from '../types';
import React from 'react';

describe('TimeSeriesChart Component', () => {
  const mockData: SeizureRecord[] = [
    { id: '1', date: '2024-01-01', category: 'Drugs', subCategory: 'Class A', itemType: 'Cocaine', quantity: 10, city: 'Leeds', postcode: 'LS1', latitude: 53.8, longitude: -1.5 },
    { id: '2', date: '2024-02-01', category: 'Weapons', subCategory: 'Knives', itemType: 'Machete', quantity: 5, city: 'York', postcode: 'YO1', latitude: 53.9, longitude: -1.0 },
    { id: '3', date: '2024-03-01', category: 'Drugs', subCategory: 'Class B', itemType: 'Cannabis', quantity: 20, city: 'Leeds', postcode: 'LS2', latitude: 53.81, longitude: -1.51 },
  ];

  it('renders correctly with data', () => {
    render(
      <TimeSeriesChart 
        data={mockData} 
        isDarkMode={false} 
      />
    );
    
    expect(screen.getByText('Temporal Seizure Trend')).toBeInTheDocument();
  });

  it('shows no data message when data is empty', () => {
    render(
      <TimeSeriesChart 
        data={[]} 
        isDarkMode={false} 
      />
    );
    
    expect(screen.getByText('No Temporal Data')).toBeInTheDocument();
  });
});
