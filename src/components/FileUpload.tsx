import React, { useCallback } from 'react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onDataLoad: (data: any[]) => void;
}

export function FileUpload({ onDataLoad }: FileUploadProps) {
  const processExcelFile = useCallback(async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    
    const allData = [];
    
    // Process all sheets (E0, E1, E2, etc.)
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      allData.push(...jsonData);
    }
    
    return allData;
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    const allFileData = [];
    
    for (let i = 0; i < files.length; i++) {
      const fileData = await processExcelFile(files[i]);
      allFileData.push(...fileData);
    }

    onDataLoad(allFileData);
  }, [onDataLoad, processExcelFile]);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Dosya Yükleme</h2>
      <input
        type="file"
        accept=".xlsx"
        multiple
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      <p className="mt-2 text-sm text-gray-500">
        Birden fazla .xlsx dosyası seçebilirsiniz
      </p>
    </div>
  );
}