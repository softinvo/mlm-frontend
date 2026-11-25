import { InputHTMLAttributes } from 'react';

export default function Field({ label, error, ...props }: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} aria-invalid={!!error} />
      {error && <small className="error">{error}</small>}
    </label>
  );
}
