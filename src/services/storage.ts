import { HeaderSettings, SavedPrompt } from '../types/prompt';
import { PRESET_PROMPTS } from '../data/sectionsData';

const DB_NAME = 'CureCraftDB';
const DB_VERSION = 1;
const STORE_SETTINGS = 'settings';
const STORE_PROMPTS = 'saved_prompts';
const LOCAL_STORAGE_PROMPTS_KEY = 'cure_craft_saved_prompts';
const LOCAL_STORAGE_HEADER_KEY = 'cure_craft_header_settings';

// Initialize native IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_PROMPTS)) {
        db.createObjectStore(STORE_PROMPTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Header Settings Storage (IndexedDB + fallback)
export async function getHeaderSettings(): Promise<HeaderSettings> {
  const defaultSettings: HeaderSettings = {
    imageUrl: null,
    imageMode: 'banner',
    darkOverlayOpacity: 65,
    blurAmount: 0,
    positionY: 'center',
  };

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get('header');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve({ ...defaultSettings, ...req.result.value });
        } else {
          // Check localStorage fallback
          const local = localStorage.getItem(LOCAL_STORAGE_HEADER_KEY);
          if (local) {
            try {
              resolve({ ...defaultSettings, ...JSON.parse(local) });
              return;
            } catch {
              // ignore
            }
          }
          resolve(defaultSettings);
        }
      };
      req.onerror = () => resolve(defaultSettings);
    });
  } catch {
    const local = localStorage.getItem(LOCAL_STORAGE_HEADER_KEY);
    if (local) {
      try {
        return { ...defaultSettings, ...JSON.parse(local) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  }
}

export async function saveHeaderSettings(settings: HeaderSettings): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.put({ key: 'header', value: settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed, attempting localStorage fallback', err);
    try {
      // If image is small enough, store in localStorage, otherwise store settings without heavy image
      if (settings.imageUrl && settings.imageUrl.length > 2000000) {
        const lightSettings = { ...settings, imageUrl: null };
        localStorage.setItem(LOCAL_STORAGE_HEADER_KEY, JSON.stringify(lightSettings));
      } else {
        localStorage.setItem(LOCAL_STORAGE_HEADER_KEY, JSON.stringify(settings));
      }
    } catch {
      // ignore
    }
  }
}

// Saved Prompts Library Storage
export async function getSavedPrompts(): Promise<SavedPrompt[]> {
  try {
    const db = await openDB();
    const promptsFromDB = await new Promise<SavedPrompt[]>((resolve) => {
      const tx = db.transaction(STORE_PROMPTS, 'readonly');
      const store = tx.objectStore(STORE_PROMPTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    if (promptsFromDB && promptsFromDB.length > 0) {
      return promptsFromDB.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  } catch {
    // fallback to localStorage
  }

  // Fallback to localStorage or default presets
  const local = localStorage.getItem(LOCAL_STORAGE_PROMPTS_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local) as SavedPrompt[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
      }
    } catch {
      // ignore
    }
  }

  // Initial seed with our high-quality designer presets
  await saveAllPrompts(PRESET_PROMPTS);
  return PRESET_PROMPTS;
}

export async function savePrompt(prompt: SavedPrompt): Promise<void> {
  const all = await getSavedPrompts();
  const existingIdx = all.findIndex((p) => p.id === prompt.id);
  let updatedList: SavedPrompt[];
  if (existingIdx >= 0) {
    updatedList = [...all];
    updatedList[existingIdx] = prompt;
  } else {
    updatedList = [prompt, ...all];
  }
  await saveAllPrompts(updatedList);
}

export async function deletePrompt(id: string): Promise<void> {
  const all = await getSavedPrompts();
  const updatedList = all.filter((p) => p.id !== id);
  await saveAllPrompts(updatedList);
}

export async function saveAllPrompts(prompts: SavedPrompt[]): Promise<void> {
  // Update localStorage for instant sync
  try {
    localStorage.setItem(LOCAL_STORAGE_PROMPTS_KEY, JSON.stringify(prompts));
  } catch {
    // Ignore quota issues
  }

  // Update IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PROMPTS, 'readwrite');
    const store = tx.objectStore(STORE_PROMPTS);
    store.clear();
    for (const prompt of prompts) {
      store.put(prompt);
    }
  } catch (err) {
    console.warn('Failed to save to IndexedDB', err);
  }
}
