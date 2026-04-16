import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import SummaryStats from './SummaryStats';
import { SeizureRecord } from '../types';

const mockData: SeizureRecord[] = [
  {
    id: '1',
    date: '2023-01-01',
    city: 'Leeds',
    postcode: 'LS1 1AA',
    category: 'Class A Drugs',
    subCategory: 'Heroin',
    item: 'Heroin',
    itemType: 'Class A Drugs',
    quantity: 10,
    cash: 1000,
    latitude: 53.801,
    longitude: -1.549
  },
  {
    id: '2',
    date: '2023-02-01',
    city: 'Sheffield',
    postcode: 'S1 1AA',
    category: 'Firearms',
    subCategory: 'Handgun',
    item: 'Handgun',
    itemType: 'Firearms',
    quantity: 1,
    cash: 0,
    latitude: 53.381,
    longitude: -1.470
  }
];

describe('SummaryStats Component', () => {
  it('should render the correct total seizures', () => {
    render(<SummaryStats data={mockData} />);
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText(/Total Seizures/i)).toBeDefined();
  });

  it('should display the primary class (top category)', () => {
    render(<SummaryStats data={mockData} />);
    // Both occur once, but sorting might pick one. Let's check for one of them or both exist as text.
    expect(screen.getAllByText(/Primary Class/i).length).toBeGreaterThan(0);
    // Classes are "Class A Drugs" and "Firearms"
    const hasClassA = screen.queryByText(/Class A Drugs/i);
    const hasFirearms = screen.queryByText(/Firearms/i);
    expect(hasClassA || hasFirearms).toBeTruthy();
  });

  it('should display total quantity', () => {
    render(<SummaryStats data={mockData} />);
    // Total quantity is 10 + 1 = 11
    expect(screen.getByText('11')).toBeDefined();
    expect(screen.getAllByText(/Total Quantity/i).length).toBeGreaterThan(0);
  });

  it('should display the top city hub', () => {
    render(<SummaryStats data={mockData} />);
    expect(screen.getAllByText(/Weighted Hub/i).length).toBeGreaterThan(0);
    // Leeds has quantity 10, Sheffield has 1. Leeds should be the hub.
    expect(screen.getByText('Leeds')).toBeDefined();
  });

  it('should return null if no data is provided', () => {
    const { container } = render(<SummaryStats data={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
