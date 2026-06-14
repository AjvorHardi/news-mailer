import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ id, label, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replaceAll(' ', '-');

  return (
    <label htmlFor={inputId} className="block">
      <span className="text-sm font-medium text-neutral-800">{label}</span>
      <input
        id={inputId}
        className="mt-2 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
        {...props}
      />
    </label>
  );
}
