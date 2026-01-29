
import { Landmark, Category, TranslationMap } from '../types';
import { INITIAL_LANDMARKS, INITIAL_GOVERNORATES, INITIAL_TYPES, INITIAL_TRANSLATIONS } from '../constants';

const STORAGE_KEYS = {
  LANDMARKS: 'egypt-landmarks-db-v1',
  GOVERNORATES: 'egypt-governorates-db-v1',
  TYPES: 'egypt-types-db-v1',
  TRANSLATIONS: 'egypt-translations-db-v1',
};

class DatabaseService {
  // --- Generic Helpers ---

  private get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Storage Read Error [${key}]:`, e);
      return fallback;
    }
  }

  private set<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Storage Write Error [${key}]:`, e);
    }
  }

  // --- Landmarks Operations ---

  async getLandmarks(): Promise<Landmark[]> {
    return this.get<Landmark[]>(STORAGE_KEYS.LANDMARKS, INITIAL_LANDMARKS);
  }

  async saveLandmarks(landmarks: Landmark[]): Promise<void> {
    this.set(STORAGE_KEYS.LANDMARKS, landmarks);
  }

  // --- Categories Operations ---

  async getGovernorates(): Promise<Category[]> {
    return this.get<Category[]>(STORAGE_KEYS.GOVERNORATES, INITIAL_GOVERNORATES);
  }

  async saveGovernorates(data: Category[]): Promise<void> {
    this.set(STORAGE_KEYS.GOVERNORATES, data);
  }

  async getTypes(): Promise<Category[]> {
    return this.get<Category[]>(STORAGE_KEYS.TYPES, INITIAL_TYPES);
  }

  async saveTypes(data: Category[]): Promise<void> {
    this.set(STORAGE_KEYS.TYPES, data);
  }

  // --- Translations Operations ---

  async getTranslations(): Promise<TranslationMap> {
    return this.get<TranslationMap>(STORAGE_KEYS.TRANSLATIONS, INITIAL_TRANSLATIONS);
  }

  async saveTranslations(data: TranslationMap): Promise<void> {
    this.set(STORAGE_KEYS.TRANSLATIONS, data);
  }
}

export const db = new DatabaseService();
