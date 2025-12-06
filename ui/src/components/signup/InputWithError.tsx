import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InputWithErrorProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  icon?: React.ReactNode;
}

export const InputWithError: React.FC<InputWithErrorProps> = ({ 
  id, 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error, 
  icon 
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium">
      {label} <span className="text-destructive">*</span>
    </Label>
    <div className="relative">
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${error ? 'border-destructive' : ''} ${icon ? 'pr-10' : ''}`}
      />
      {icon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {icon}
        </div>
      )}
    </div>
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);
