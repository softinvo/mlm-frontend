import { useRef, useState } from 'react';

/** Photos for a message: pick up to 4, each uploads straight away; tap × to remove one. */
export default function AttachPhotos({ value, onChange, upload, max = 4, disabled }: { value: string[]; onChange: (urls: string[]) => void; upload: (file: File) => Promise<string>; max?: number; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState('');

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    const room = max - value.length;
    if (files.length > room) setError(`You can attach up to ${max} photos. Only the first ${room} were added.`);
    const chosen = [...files].slice(0, Math.max(0, room));
    setBusy((n) => n + chosen.length);
    const done: string[] = [];
    await Promise.all(chosen.map(async (f) => {
      try { done.push(await upload(f)); } catch (e) { setError((e as Error).message); } finally { setBusy((n) => n - 1); }
    }));
    if (done.length) onChange([...value, ...done].slice(0, max));
    if (input.current) input.current.value = '';
  }

  return (
    <div className="attach">
      <div className="attach-row">
        {value.map((u) => (
          <span className="attach-thumb" key={u}>
            <img src={u} alt="Attached photo" />
            <button type="button" aria-label="Remove photo" onClick={() => onChange(value.filter((x) => x !== u))} disabled={disabled}>×</button>
          </span>
        ))}
        {busy > 0 && <span className="attach-thumb loading" aria-label="Uploading">…</span>}
        {value.length + busy < max && (
          <button type="button" className="attach-add" disabled={disabled || busy > 0} onClick={() => input.current?.click()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            <span>{value.length ? 'Add another' : 'Add photo'}</span>
          </button>
        )}
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => void pick(e.target.files)} />
      </div>
      {error && <small className="error" role="alert">{error}</small>}
    </div>
  );
}
