import React, { useState } from 'react';

interface CategoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (count: number) => void;
}

export const CategoryImportModal: React.FC<CategoryImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      onImport(3); // Mock imported 3 categories
      onClose();
    }, 1000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Import Categories</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Upload a CSV or Excel file containing your categories list with headers (Name, Type, Status).
          </p>

          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              marginTop: '10px'
            }}
            onClick={() => document.getElementById('category-file-input')?.click()}
          >
            <input
              id="category-file-input"
              type="file"
              accept=".csv, .xlsx, .json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <svg width="32" height="32" fill="none" stroke="#0284c7" viewBox="0 0 24 24" style={{ margin: '0 auto 8px auto' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
              {selectedFile ? selectedFile.name : 'Click to select CSV file'}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Supports .CSV, .XLSX (Max 5MB)'}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary-web" onClick={onClose} disabled={isUploading}>
            Cancel
          </button>
          <button
            className="btn-primary-web"
            disabled={!selectedFile || isUploading}
            onClick={handleUpload}
          >
            {isUploading ? 'Importing...' : 'Upload & Import'}
          </button>
        </div>
      </div>
    </div>
  );
};
