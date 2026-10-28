import React from 'react';
import { Check, X } from 'lucide-react';

// Single Select Chips - Fully Rounded Pill
interface ChipGroupProps {
  label?: string;
  options: string[];
  selected: string;
  onChange: (val: string) => void;
  allowClear?: boolean;
}

export const ChipGroup: React.FC<ChipGroupProps> = ({
  label,
  options,
  selected,
  onChange,
  allowClear = true,
}) => {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">{label}</label>}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                if (isSelected && allowClear) {
                  onChange('');
                } else {
                  onChange(opt);
                }
              }}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-150 text-left border ${
                isSelected
                  ? 'bg-[#00E4FF] text-[#000611] font-bold border-[#00E4FF] shadow-[0_0_12px_rgba(0,228,255,0.4)]'
                  : 'bg-[#156876]/20 text-[#F5F9FA] border-[#156876]/60 hover:border-[#438D96] hover:bg-[#156876]/40 hover:text-white'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Multi-Select Chips - Fully Rounded Pill
interface MultiChipGroupProps {
  label?: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}

export const MultiChipGroup: React.FC<MultiChipGroupProps> = ({
  label,
  options,
  selected,
  onChange,
}) => {
  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((item) => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">{label}</label>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11px] text-[#00E4FF] hover:underline rounded-full px-2 py-0.5"
            >
              Clear all ({selected.length})
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggleOption(opt)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-150 text-left border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#156876]/60 text-[#00E4FF] font-semibold border-[#00E4FF] shadow-[0_0_10px_rgba(0,228,255,0.3)]'
                  : 'bg-[#156876]/20 text-[#F5F9FA] border-[#156876]/60 hover:border-[#438D96] hover:bg-[#156876]/40 hover:text-white'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-[#00E4FF]" />}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Custom Text Field - Fully Rounded Pill
interface CustomInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  helperText?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  helperText,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] text-[#8CA0A8] hover:text-rose-400 rounded-full px-2 py-0.5"
          >
            Clear
          </button>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 bg-[#000611] border border-[#156876]/60 rounded-full text-xs sm:text-sm text-[#F5F9FA] placeholder-[#8CA0A8]/60 focus:outline-none focus:border-[#00E4FF] focus:ring-1 focus:ring-[#00E4FF] transition-all"
      />
      {helperText && <p className="text-[11px] text-[#8CA0A8]/80 px-2">{helperText}</p>}
    </div>
  );
};

// Custom Textarea - Generously Rounded
interface CustomTextareaProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

export const CustomTextarea: React.FC<CustomTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] text-[#8CA0A8] hover:text-rose-400 rounded-full px-2 py-0.5"
          >
            Clear
          </button>
        )}
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3.5 bg-[#000611] border border-[#156876]/60 rounded-[22px] text-xs sm:text-sm text-[#F5F9FA] placeholder-[#8CA0A8]/60 focus:outline-none focus:border-[#00E4FF] focus:ring-1 focus:ring-[#00E4FF] transition-all resize-y"
      />
    </div>
  );
};
