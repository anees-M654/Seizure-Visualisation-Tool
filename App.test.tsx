import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import React from 'react';

// Mock generateMockData to keep tests fast and small, but keep the rest of the unit.
vi.mock('./utils/dataProcessor', async () => {
  const actual = await vi.importActual<any>('./utils/dataProcessor');
  return {
    ...actual,
    generateMockData: vi.fn().mockReturnValue([{
      id: '1', 
      date: '2024-01-01', 
      category: 'Drugs', 
      subCategory: 'Class A', 
      itemType: 'Cocaine', 
      quantity: 10, 
      city: 'Leeds', 
      postcode: 'LS1', 
      latitude: 53.8, 
      longitude: -1.5
    }])
  };
});

describe('App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure document is clean of 'dark' class
    document.documentElement.classList.remove('dark');
  });

  const loadSampleData = async () => {
    const sampleBtn = screen.getByText(/use sample intelligence data/i);
    await act(async () => {
      fireEvent.click(sampleBtn);
    });
    
    // App.tsx has a 50ms delay
    await waitFor(() => {
      expect(screen.getByText(/Interactive Hotspot Map/i)).toBeInTheDocument();
    }, { timeout: 10000 }); // Increased timeout for heavier dashboard load
  };

  it('renders the import view initially', () => {
    render(<App />);
    expect(screen.getByText(/Y&H REGIONAL CRIMINAL SEIZURE ANALYTICS/i)).toBeInTheDocument();
    expect(screen.getByText(/Import Seizure Data/i)).toBeInTheDocument();
  });

  it('navigates to dashboard when sample data is loaded', async () => {
    render(<App />);
    await loadSampleData();
    
    expect(screen.getByText(/Export CSV/i)).toBeInTheDocument();
    expect(screen.getByText(/Intelligence Snapshot/i)).toBeInTheDocument();
  });

  it('toggles dark mode', async () => {
    render(<App />);
    await loadSampleData();
    
    const darkModeBtn = screen.getByTitle(/Switch to Dark Mode/i);
    await act(async () => {
      fireEvent.click(darkModeBtn);
    });
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    const lightModeBtn = screen.getByTitle(/Switch to Light Mode/i);
    await act(async () => {
      fireEvent.click(lightModeBtn);
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('returns to import view when New Import is clicked', async () => {
    render(<App />);
    await loadSampleData();
    
    const newImportBtn = screen.getByText(/New Import/i);
    await act(async () => {
      fireEvent.click(newImportBtn);
    });
    
    expect(screen.getByText(/Import Seizure Data/i)).toBeInTheDocument();
  });
});
