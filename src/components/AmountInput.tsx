export default function AmountInput({ label, value, onChange, error, max, hint }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; max?: number; hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="amount">
        <b aria-hidden="true">₹</b>
        <input
          inputMode="decimal" placeholder="0.00" value={value} aria-invalid={!!error}
          onChange={(e) => { if (/^\d*\.?\d{0,2}$/.test(e.target.value)) onChange(e.target.value); }}
        />
        {max !== undefined && max > 0 && (
          <button type="button" className="link-btn" onClick={() => onChange(String(max / 100))}>Max</button>
        )}
      </div>
      {error ? <small className="error">{error}</small> : hint ? <small className="muted">{hint}</small> : null}
    </label>
  );
}
