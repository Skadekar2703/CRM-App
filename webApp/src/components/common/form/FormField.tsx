import React from 'react';

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helperText,
  children,
  className = '',
  style,
}) => {
  return (
    <div className={`form-group ${className}`} style={style}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      {children}
      {error && <div className="form-error-msg">⚠️ {error}</div>}
      {!error && helperText && (
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{helperText}</div>
      )}
    </div>
  );
};
