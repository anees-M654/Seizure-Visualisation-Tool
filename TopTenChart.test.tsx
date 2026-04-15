import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TopTenChart from './TopTenChart';
import { SeizureRecord } from './types';
import React from 'react';

describe('TopTenChart Component', () => {
  const mockData: SeizureRecord[] = [
    { id: '1', date: '2024-01-01', category: 'Drugs', subCategory: 'Class A', itemType: 'Cocaine', quantity: 10, city: 'Leeds', postcode: 'LS1', latitude: 53.8, longitude: -1.5 },
    { id: '2', date: '2024-01-02', category: 'Weapons', subCategory: 'Knives', itemType: 'Machete', quantity: 5, city: 'York', postcode: 'YO1', latitude: 53.9, longitude: -1.0 },
    { id: '3', date: '2024-01-03', category: 'Drugs', subCategory: 'Class B', itemType: 'Cannabis', quantity: 20, city: 'Leeds', postcode: 'LS2', latitude: 53.81, longitude: -1.51 },
  ];

  it('renders correctly for city type as bar chart', () => {
    render(
      <TopTenChart 
        data={mockData} 
        type="city" 
        chartType="bar" 
        isDarkMode={false} 
      />
    );
    
    expect(screen.getByText('Top Seizure Locations')).toBeInTheDocument();
  });

  it('renders correctly for category type as pie chart', () => {
    render(
      <TopTenChart 
        data={mockData} 
        type="category" 
        chartType="pie" 
        isDarkMode={true} 
      />
    );
    
    expect(screen.getByText('Classification Distribution')).toBeInTheDocument();
  });

  it('shows no data message when data is empty', () => {
    render(
      <TopTenChart 
        data={[]} 
        type="city" 
        chartType="bar" 
        isDarkMode={false} 
      />
    );
    
    expect(screen.getByText('No Data for Visualization')).toBeInTheDocument();
  });

  it('calculates the top 10 labels correctly', () => {
    render(
      <TopTenChart 
        data={mockData} 
        type="city" 
        chartType="bar" 
        isDarkMode={false} 
      />
    );
    
    // We expect Leeds and York to be in the component
    // If Recharts doesn't render them as plain text, we might find them in SVG
    // Recharts often renders labels multiple times for measurement.
    expect(screen.getAllByText(/Leeds/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/York/i).length).toBeGreaterThanOrEqual(1);
  });
});
