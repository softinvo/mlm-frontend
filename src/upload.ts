import { api } from './api';

const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
const MAX = 5 * 1024 * 1024;

/** Uploads one photo for a support ticket straight to storage and returns its address. */
export async function uploadSupportPhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!TYPES[ext]) throw new Error('Photos must be PNG, JPG or WEBP.');
  if (file.size > MAX) throw new Error('That photo is larger than 5 MB. Choose a smaller one.');
  if (import.meta.env.VITE_DEMO === '1') return URL.createObjectURL(file); // demo mode has no storage
  const signed = await api.supportUploadUrl(ext);
  let res: Response;
  try { res = await fetch(signed.uploadUrl, { method: 'PUT', headers: { 'Content-Type': signed.contentType }, body: file }); }
  catch { throw new Error('The photo could not be uploaded. Check your connection and try again.'); }
  if (!res.ok) throw new Error(`The photo could not be uploaded (${res.status}). Try again.`);
  return signed.downloadUrl;
}
