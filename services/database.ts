
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

    try {
      // 1. Get existing data to identify orphaned images
      const { data: existingData, error: fetchError } = await supabase!
        .from('landmarks')
        .select('id, images');
      
      if (fetchError) {
        // eslint-disable-next-line no-console
        console.error('[Supabase] saveLandmarks fetch error:', fetchError);
        // If we can't fetch old state, we can't safely identify orphans
        // but we can still proceed with saving the new state.
      }

      const existingLandmarks = existingData || [];
      
      // Identify orphaned images: URLs present in DB but not in the new provided list
      const dbImages = new Set<string>();
      existingLandmarks.forEach((l: any) => {
        if (Array.isArray(l.images)) {
          l.images.forEach(img => {
            if (img && typeof img === 'string') dbImages.add(img);
          });
        }
      });

      const newImages = new Set<string>();
      landmarks.forEach(l => {
        if (Array.isArray(l.images)) {
          l.images.forEach(img => {
            if (img && typeof img === 'string') newImages.add(img);
          });
        }
      });

      // Orphaned means it was in the DB but is no longer in the provided list
      const orphanedImages = Array.from(dbImages).filter(img => !newImages.has(img));

      // 2. Database Sync (Delete removed landmarks records)
      const existingIdsInDb = new Set(existingLandmarks.map((r: any) => r.id));
      const newIds = new Set(landmarks.map((l) => l.id));
      const idsToDelete = Array.from(existingIdsInDb).filter((id) => !newIds.has(id));

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

      // 3. Upsert remaining landmarks
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

      const { error: upsertError } = await supabase!
        .from('landmarks')
        .upsert(payload, { onConflict: 'id' });

      if (upsertError) {
        // eslint-disable-next-line no-console
        console.error('[Supabase] saveLandmarks update error:', upsertError);
      } else {
        // 4. Cleanup orphaned images from storage (only if DB sync succeeded)
        if (orphanedImages.length > 0) {
          await this.deleteStorageFiles(orphanedImages);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] saveLandmarks critical error:', err);
    }
  }

  async deleteLandmark(id: string): Promise<void> {
    if (!this.isRemoteEnabled()) return;

    try {
      // Fetch landmark first to get its images before deleting the record
      const { data: landmark, error: fetchError } = await supabase!
        .from('landmarks')
        .select('images')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        // eslint-disable-next-line no-console
        console.error('[Supabase] deleteLandmark fetch error:', fetchError);
      }

      const { error: deleteError } = await supabase!
        .from('landmarks')
        .delete()
        .eq('id', id);

      if (deleteError) {
        // eslint-disable-next-line no-console
        console.error('[Supabase] deleteLandmark error:', deleteError);
        throw deleteError;
      }

      // Clean up images from storage if record deletion succeeded
      if (landmark?.images && Array.isArray(landmark.images) && landmark.images.length > 0) {
        await this.deleteStorageFiles(landmark.images);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] deleteLandmark operation failed:', error);
      throw error;
    }
  }

  async deleteStorageFiles(urls: string[]): Promise<void> {
    if (!this.isRemoteEnabled() || !urls || urls.length === 0) return;

    // Filter for Supabase storage URLs and extract relative paths
    const bucketName = 'landmark-images';
    const paths = urls
      .map(url => {
        try {
          if (!url || typeof url !== 'string' || !url.includes(`/${bucketName}/`)) return null;

          // Attempt to parse as URL
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;
          
          // The path inside bucket is everything after the bucket name in the pathname
          const marker = `/${bucketName}/`;
          const index = pathname.indexOf(marker);
          if (index !== -1) {
            let path = pathname.substring(index + marker.length);
            // Decode URI component to get the original filename/path (e.g. handle spaces)
            return decodeURIComponent(path);
          }
        } catch (e) {
          // Fallback parsing for non-standard or relative URLs
          const parts = url.split(`/${bucketName}/`);
          if (parts.length > 1) {
            return decodeURIComponent(parts[1].split('?')[0]);
          }
        }
        return null;
      })
      .filter((p): p is string => !!p);

    if (paths.length === 0) return;

    // Use a unique set of paths to avoid redundant requests
    const uniquePaths = Array.from(new Set(paths));

    const { error: storageError } = await supabase!.storage
      .from(bucketName)
      .remove(uniquePaths);

    if (storageError) {
      // eslint-disable-next-line no-console
      console.error(`[Supabase] storage cleanup error for bucket "${bucketName}":`, storageError);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[Supabase] Successfully cleaned up ${uniquePaths.length} orphaned image(s) from storage.`);
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

  // --- Storage Operations ---

  async uploadLandmarkImage(file: File): Promise<string> {
    if (!this.isRemoteEnabled()) {
      throw new Error('Supabase is not enabled');
    }

    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase!.storage
      .from('landmark-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] uploadLandmarkImage error:', uploadError);
      throw uploadError;
    }

    const { data } = supabase!.storage
      .from('landmark-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
}

export const db = new DatabaseService();
