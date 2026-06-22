import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'

interface FieldProps {
  label: string
  error?: string
}

interface TextFieldProps extends FieldProps, InputHTMLAttributes<HTMLInputElement> {}

export function TextField({ label, error, className = '', ...props }: TextFieldProps) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[13px] font-medium text-[#3a4868]">{label}</label>
      <input
        {...props}
        className={`h-[42px] w-full rounded-lg border-[1.5px] bg-[#f7f8fb] px-3 text-sm text-navy outline-none transition-colors focus:border-accent ${
          error ? 'border-[#c0392b]' : 'border-border'
        } ${className}`}
      />
      {error && (
        <p className="mt-1.5 font-mono text-[11px] text-[#c0392b]">⚠ {error}</p>
      )}
    </div>
  )
}

interface SelectFieldProps extends FieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
}

export function SelectField({ label, error, options, className = '', ...props }: SelectFieldProps) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[13px] font-medium text-[#3a4868]">{label}</label>
      <select
        {...props}
        className={`h-[42px] w-full rounded-lg border-[1.5px] bg-[#f7f8fb] px-3 text-sm text-navy outline-none transition-colors focus:border-accent ${
          error ? 'border-[#c0392b]' : 'border-border'
        } ${className}`}
      >
        <option value="">Seleccionar…</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 font-mono text-[11px] text-[#c0392b]">⚠ {error}</p>
      )}
    </div>
  )
}
