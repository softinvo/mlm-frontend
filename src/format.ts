export const inr = (paise: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(paise / 100);

export const date = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const monthLabel = (ym: string) =>
  new Date(ym + '-01').toLocaleDateString('en-IN', { month: 'short' });

/** "1,234.50" -> 123450 paise. Returns null for empty / invalid / non-positive input. */
export const toPaise = (s: string): number | null => {
  if (!/^\d+(\.\d{1,2})?$/.test(s.trim())) return null;
  const p = Math.round(parseFloat(s) * 100);
  return p > 0 ? p : null;
};
/** 123450 -> "1234.5" (for filling an amount input). */
export const toRupeeString = (paise: number) => String(paise / 100);
