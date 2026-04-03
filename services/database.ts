
import { Landmark, Category, TranslationMap } from '../types';
import { supabase } from './supabaseClient';
import {
  INITIAL_LANDMARKS,
  INITIAL_GOVERNORATES,
  INITIAL_TYPES,
  INITIAL_TRANSLATIONS,
} from '../constants';

/**
 * Expected Supabase schema (you can adjust names if needed):
 *
 * Table: governorates
 * - id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
 * - name_en     text NOT NULL
 * - name_ar     text NOT NULL
 *
 * Table: types
 * - id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
 * - name_en     text NOT NULL
 * - name_ar     text NOT NULL
 * - emoji       text
 *
 * Table: landmarks
 * - id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
 * - name_en         text NOT NULL
 * - name_ar         text NOT NULL
 * - type_id         uuid REFERENCES types(id)
 * - governorate_id  uuid REFERENCES governorates(id)
 * - lat             double precision
 * - lng             double precision
 * - description_en  text
 * - description_ar  text
 * - images          text[]       -- array of image URLs
 *
 * Table: translations
 * - key   text PRIMARY KEY
 * - en    text NOT NULL
 * - ar    text NOT NULL
 */

class DatabaseService {
  private isRemoteEnabled(): boolean {
    return !!supabase;
  }

  // --- Landmarks Operations ---

  async getLandmarks(): Promise<Landmark[]> {
    if (!this.isRemoteEnabled()) {
      return INITIAL_LANDMARKS;
    }

    const { data, error } = await supabase!
      .from('landmarks')
      .select(
        'id,name_en,name_ar,type_id,governorate_id,lat,lng,description_en,description_ar,images'
      );

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] getLandmarks error:', error);
      return INITIAL_LANDMARKS;
    }

    return (data || []).map((row: any): Landmark => ({
      id: row.id,
      name: { en: row.name_en, ar: row.name_ar },
      type: row.type_id,
      governorate: row.governorate_id,
      coords: [row.lat, row.lng],
      images: row.images || [],
      description: { en: row.description_en || '', ar: row.description_ar || '' },
    }));
  }

  async saveLandmarks(landmarks: Landmark[]): Promise<void> {
    if (!this.isRemoteEnabled()) return;

    // Get existing IDs from database
    const { data: existingData } = await supabase!
      .from('landmarks')
      .select('id');

    const existingIds = new Set((existingData || []).map((r: any) => r.id));
    const newIds = new Set(landmarks.map((l) => l.id));

    // Find IDs to delete (exist in DB but not in new array)
    const idsToDelete = Array.from(existingIds).filter((id) => !newIds.has(id));

    // Delete removed landmarks
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase!
        .from('landmarks')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        // eslint-disable-next-line no-console
        console.error('[Supabase] deleteLandmarks error:', deleteError);
      }
    }

    // Upsert remaining landmarks
    const payload = landmarks.map((l) => ({
      id: l.id,
      name_en: l.name.en,
      name_ar: l.name.ar,
      type_id: l.type,
      governorate_id: l.governorate,
      lat: l.coords[0],
      lng: l.coords[1],
      description_en: l.description.en,
      description_ar: l.description.ar,
      images: l.images,
    }));

    const { error } = await supabase!
      .from('landmarks')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] saveLandmarks error:', error);
    }
  }

  async deleteLandmark(id: string): Promise<void> {
    if (!this.isRemoteEnabled()) return;

    const { error } = await supabase!
      .from('landmarks')
      .delete()
      .eq('id', id);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] deleteLandmark error:', error);
      throw error;
    }
  }

  // --- Categories Operations ---

  async getGovernorates(): Promise<Category[]> {
    if (!this.isRemoteEnabled()) {
      return INITIAL_GOVERNORATES;
    }

    const { data, error } = await supabase!
      .from('governorates')
      .select('id,name_en,name_ar');

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] getGovernorates error:', error);
      return INITIAL_GOVERNORATES;
    }

    return (data || []).map(
      (row: any): Category => ({
        id: row.id,
        name: { en: row.name_en, ar: row.name_ar },
      })
    );
  }

  async saveGovernorates(data: Category[]): Promise<void> {
    if (!this.isRemoteEnabled()) return;

    // Get existing IDs from database for governorates
    const { data: existingData } = await supabase!
      .from('governorates')
      .select('id');

    const existingIds = new Set((existingData || []).map((r: any) => r.id));
    const newIds = new Set(data.map((c) => c.id));

    // Find IDs to delete (exist in DB but not in new array)
    const idsToDelete = Array.from(existingIds).filter((id) => !newIds.has(id));

    // Delete removed governorates
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase!
        .from('governorates')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        // eslint-disable-next-line no-console
        console.error('[Supabase] deleteGovernorates error:', deleteError);
      }
    }

    // Upsert remaining governorates
    const payload = data.map((c) => ({
      id: c.id,
      name_en: c.name.en,
      name_ar: c.name.ar,
    }));

    const { error } = await supabase!
      .from('governorates')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] saveGovernorates error:', error);
    }
  }

  async deleteGovernorate(id: string): Promise<void> {
    if (!this.isRemoteEnabled()) return;

    const { error } = await supabase!
      .from('governorates')
      .delete()
      .eq('id', id);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] deleteGovernorate error:', error);
      throw error;
    }
  }

  async getTypes(): Promise<Category[]> {
    if (!this.isRemoteEnabled()) {
      return INITIAL_TYPES;
    }

    const { data, error } = await supabase!
      .from('types')
      .select('id,name_en,name_ar,emoji');

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] getTypes error:', error);
      return INITIAL_TYPES;
    }

    return (data || []).map(
      (row: any): Category => ({
        id: row.id,
        name: { en: row.name_en, ar: row.name_ar },
        emoji: row.emoji,
      })
    );
  }

  async saveTypes(data: Category[]): Promise<void> {
    if (!this.isRemoteEnabled()) return;

    // Get existing IDs from database for types
    const { data: existingData } = await supabase!
      .from('types')
      .select('id');

    const existingIds = new Set((existingData || []).map((r: any) => r.id));
    const newIds = new Set(data.map((c) => c.id));

    // Find IDs to delete (exist in DB but not in new array)
    const idsToDelete = Array.from(existingIds).filter((id) => !newIds.has(id));

    // Delete removed types
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase!
        .from('types')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        // eslint-disable-next-line no-console
        console.error('[Supabase] deleteTypes error:', deleteError);
      }
    }

    // Upsert remaining types
    const payload = data.map((c) => ({
      id: c.id,
      name_en: c.name.en,
      name_ar: c.name.ar,
      emoji: c.emoji,
    }));

    const { error } = await supabase!
      .from('types')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] saveTypes error:', error);
    }
  }

  async deleteType(id: string): Promise<void> {
    if (!this.isRemoteEnabled()) return;

    const { error } = await supabase!
      .from('types')
      .delete()
      .eq('id', id);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] deleteType error:', error);
      throw error;
    }
  }

  // --- Translations Operations ---

  async getTranslations(): Promise<TranslationMap> {
    if (!this.isRemoteEnabled()) {
      return INITIAL_TRANSLATIONS;
    }

    const { data, error } = await supabase!
      .from('translations')
      .select('key,en,ar');

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] getTranslations error:', error);
      return INITIAL_TRANSLATIONS;
    }

    const result: TranslationMap = {
      en: { ...INITIAL_TRANSLATIONS.en },
      ar: { ...INITIAL_TRANSLATIONS.ar },
    };

    (data || []).forEach((row: any) => {
      (result.en as any)[row.key] = row.en;
      (result.ar as any)[row.key] = row.ar;
    });

    return result;
  }

  async saveTranslations(data: TranslationMap): Promise<void> {
    if (!this.isRemoteEnabled()) return;

    // Get existing keys from database
    const { data: existingData } = await supabase!
      .from('translations')
      .select('key');

    const existingKeys = new Set((existingData || []).map((r: any) => r.key));
    const newKeys = new Set(Object.keys(data.en));

    // Find keys to delete (exist in DB but not in new data)
    const keysToDelete = Array.from(existingKeys).filter((key) => !newKeys.has(key));

    // Delete removed translations
    if (keysToDelete.length > 0) {
      const { error: deleteError } = await supabase!
        .from('translations')
        .delete()
        .in('key', keysToDelete);

      if (deleteError) {
        // eslint-disable-next-line no-console
        console.error('[Supabase] deleteTranslations error:', deleteError);
      }
    }

    // Upsert remaining translations
    const keys = Object.keys(data.en);
    const payload = keys.map((key) => ({
      key,
      en: (data.en as any)[key],
      ar: (data.ar as any)[key],
    }));

    const { error } = await supabase!
      .from('translations')
      .upsert(payload, { onConflict: 'key' });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] saveTranslations error:', error);
    }
  }

  async deleteTranslation(key: string): Promise<void> {
    if (!this.isRemoteEnabled()) return;

    const { error } = await supabase!
      .from('translations')
      .delete()
      .eq('key', key);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] deleteTranslation error:', error);
      throw error;
    }
  }
}

export const db = new DatabaseService();
