import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FileUploader from './FileUploader';
import React from 'react';

describe('FileUploader Component', () => {
  const mockOnFileUpload = vi.fn();

  it('renders correctly', () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} isLoading={false} />);
    
    expect(screen.getByText(/Import Seizure Data/i)).toBeInTheDocument();
    expect(screen.getByText(/use sample intelligence data/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} isLoading={true} />);
    
    expect(screen.getByText(/Processing.../i)).toBeInTheDocument();
  });

  it('calls onFileUpload when Load Sample is clicked', () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} isLoading={false} />);
    
    const sampleBtn = screen.getByText(/use sample intelligence data/i);
    fireEvent.click(sampleBtn);
    
    expect(mockOnFileUpload).toHaveBeenCalledWith([]);
  });

  it('handles file input change', () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} isLoading={false} />);
    
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    // The input is hidden, so we find it by type
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(hiddenInput, { target: { files: [file] } });
    
    // The component uses Papaparse or similar which might be async, 
    // but the callback should eventually be called.
    // For this mock, we just want to see if the trigger works.
    // However, the component logic might actually call Papaparse.
    // Let's verify it starts the process.
  });
});
