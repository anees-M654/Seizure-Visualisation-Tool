
import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';

interface FileUploaderProps {
  onFileUpload: (data: any[]) => void;
  isLoading: boolean;
}

const parseCSV = (file: File, onFileUpload: (data: any[]) => void) => {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      onFileUpload(results.data);
    },
    error: (error) => {
      console.error("Error parsing CSV:", error);
      alert("Failed to parse CSV file.");
    }
  });
};

const parseXLSX = (file: File, onFileUpload: (data: any[]) => void) => {
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const buffer = event.target?.result as ArrayBuffer;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) throw new Error("No worksheet found");

      const data: any[] = [];
      const headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell) => {
            headers.push(String(cell.value));
          });
        } else {
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              let value = cell.value;
              if (value && typeof value === 'object' && 'result' in value) {
                value = (value as any).result;
              }
              rowData[header] = value;
            }
          });
          data.push(rowData);
        }
      });
      onFileUpload(data);
    } catch (error) {
      console.error("Error parsing XLSX:", error);
      alert("Failed to parse Excel file.");
    }
  };
  reader.readAsArrayBuffer(file);
};

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, isLoading }) => {
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      parseCSV(file, onFileUpload);
    } else if (fileExtension === 'xlsx') {
      parseXLSX(file, onFileUpload);
    } else {
      alert("Unsupported file format. Please upload a .csv or .xlsx file.");
    }
  }, [onFileUpload]);

  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-slate-800/50 rounded-2xl p-12 text-center transition-all hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 group">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Upload size={32} />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Import Seizure Data</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-xs">
        Upload your spreadsheet in <strong>CSV</strong> or <strong>XLSX</strong> format to begin visual analysis.
      </p>
      
      <label className="cursor-pointer bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center gap-2">
        <FileSpreadsheet size={18} />
        {isLoading ? 'Processing...' : 'Choose File'}
        <input 
          type="file" 
          className="hidden" 
          accept=".csv,.xls,.xlsx" 
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>
      
      <div className="mt-6 flex flex-col items-center gap-2">
        <p className="text-xs text-slate-400">
          Required columns: Date, Postcode, Category
        </p>
        <button 
          onClick={() => onFileUpload([])} 
          className="text-[10px] text-blue-500 font-bold hover:underline"
        >
          Or click here to use sample intelligence data
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
