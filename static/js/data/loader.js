const STORAGE_KEY = 'cvDataV3';

export async function loadCvData() {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
        try { return JSON.parse(cached); } catch (_) {}
    }
    const res = await fetch('/api/cv-data/');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
}
