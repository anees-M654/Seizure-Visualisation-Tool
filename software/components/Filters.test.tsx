import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Filters from './Filters';
import React from 'react';

describe('Filters Component', () => {
  const mockFilters = {
    dateRange: ['', ''] as [string, string],
    categories: [],
    subCategories: [],
    cities: [],
    postcodes: [],
    keyword: '',
    spatialFilter: null
  };

  const mockUniqueValues = {
    categories: ['Drugs', 'Weapons'],
    subCategories: ['Class A', 'Knives'],
    cities: ['Leeds', 'York'],
    postcodes: ['LS', 'YO']
  };

  let mockOnFilterChange = vi.fn();

  beforeEach(() => {
    mockOnFilterChange = vi.fn();
  });

  it('renders correctly with initial props', () => {
    render(
      <Filters 
        filters={mockFilters} 
        onFilterChange={mockOnFilterChange} 
        uniqueValues={mockUniqueValues} 
      />
    );
    
    expect(screen.getByPlaceholderText('Search keywords...')).toBeInTheDocument();
    expect(screen.getByText('Drugs')).toBeInTheDocument();
    expect(screen.getByText('Weapons')).toBeInTheDocument();
  });

  it('calls onFilterChange when keyword is typed', () => {
    render(
      <Filters 
        filters={mockFilters} 
        onFilterChange={mockOnFilterChange} 
        uniqueValues={mockUniqueValues} 
      />
    );
    
    const input = screen.getByPlaceholderText('Search keywords...');
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({ keyword: 'test' });
  });

  it('calls onFilterChange when a category is clicked', () => {
    render(
      <Filters 
        filters={mockFilters} 
        onFilterChange={mockOnFilterChange} 
        uniqueValues={mockUniqueValues} 
      />
    );
    
    const categoryBtn = screen.getByRole('button', { name: 'Drugs' });
    fireEvent.click(categoryBtn);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({ categories: ['Drugs'] });
  });

  it('shows selected filter pills and allows removal', () => {
    const filtersWithSelected = {
      ...mockFilters,
      categories: ['Drugs']
    };
    
    render(
      <Filters 
        filters={filtersWithSelected} 
        onFilterChange={mockOnFilterChange} 
        uniqueValues={mockUniqueValues} 
      />
    );
    
    // The pill should be visible. In this component, pills are buttons in a specific container.
    // We search for the specific pill text. 
    // Since "Drugs" is also in the category list, we might get two.
    // Let's use getAllByText and find the one that also contains the "X" (lucide-x).
    const pills = screen.getAllByText('Drugs');
    expect(pills.length).toBeGreaterThanOrEqual(1);
    
    // Click the first one (usually the pill is rendered before the list in the DOM order here)
    fireEvent.click(pills[0]);
    expect(mockOnFilterChange).toHaveBeenCalledWith({ categories: [] });
  });

  it('resets all filters when Clear All is clicked', () => {
    render(
      <Filters 
        filters={mockFilters} 
        onFilterChange={mockOnFilterChange} 
        uniqueValues={mockUniqueValues} 
      />
    );
    
    const clearBtn = screen.getByText('Clear All Filters');
    fireEvent.click(clearBtn);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      dateRange: ['', ''],
      categories: [],
      subCategories: [],
      cities: [],
      postcodes: [],
      keyword: ''
    });
  });

  it('sets date presets correctly', () => {
    render(
      <Filters 
        filters={mockFilters} 
        onFilterChange={mockOnFilterChange} 
        uniqueValues={mockUniqueValues} 
      />
    );
    
    const monthlyBtn = screen.getByText('Monthly');
    fireEvent.click(monthlyBtn);
    
    expect(mockOnFilterChange).toHaveBeenCalled();
    // Find the call that contains dateRange
    const dateRangeCall = mockOnFilterChange.mock.calls.find(call => call[0].dateRange);
    expect(dateRangeCall).toBeDefined();
    expect(dateRangeCall[0].dateRange[0]).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
