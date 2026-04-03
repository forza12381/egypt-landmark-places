/**
 * One-time seeding script to push initial data into Supabase
 * 
 * Usage:
 *   npm run seed:supabase
 * 
 * Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * set in your .env.local file before running this script.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_LANDMARKS,
  INITIAL_GOVERNORATES,
  INITIAL_TYPES,
  INITIAL_TRANSLATIONS,
} from '../constants';

// Load environment variables from .env.local
function loadEnv() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const envPath = join(__dirname, '..', '.env.local');
  
  try {
    const envFile = readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};
    
    envFile.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          env[key.trim()] = value.trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    console.warn('⚠️  Could not read .env.local file, trying process.env...');
    return process.env as Record<string, string>;
  }
}

async function seedSupabase() {
  console.log('🌱 Starting Supabase seeding...\n');

  // Load environment variables
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase is not configured!');
    console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.');
    console.error('   Or set them as environment variables.');
    process.exit(1);
  }

  // Create Supabase client directly for the script
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Verify connection
  console.log('🔌 Testing Supabase connection...');
  const { error: testError } = await supabase.from('governorates').select('id').limit(1);
  if (testError && testError.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
    console.warn('⚠️  Warning: Could not verify Supabase connection:', testError.message);
    console.warn('   Make sure your tables are created in Supabase before seeding.');
  } else {
    console.log('   ✅ Connection successful\n');
  }

  try {
    // 1. Seed Categories (Governorates)
    console.log('📦 Seeding Governorates...');
    const governoratePayload = INITIAL_GOVERNORATES.map((c) => ({
      name_en: c.name.en,
      name_ar: c.name.ar,
    }));
    
    const { data: govData, error: govError } = await supabase
      .from('governorates')
      .insert(governoratePayload)
      .select();
    
    if (govError) {
      throw new Error(`Failed to seed governorates: ${govError.message}`);
    }
    console.log(`   ✅ Seeded ${INITIAL_GOVERNORATES.length} governorates`);

    // 2. Seed Categories (Types)
    console.log('📦 Seeding Landmark Types...');
    const typePayload = INITIAL_TYPES.map((c) => ({
      name_en: c.name.en,
      name_ar: c.name.ar,
      emoji: c.emoji,
    }));
    
    const { data: typeData, error: typeError } = await supabase
      .from('types')
      .insert(typePayload)
      .select();
    
    if (typeError) {
      throw new Error(`Failed to seed types: ${typeError.message}`);
    }
    console.log(`   ✅ Seeded ${INITIAL_TYPES.length} types`);

    // 3. Seed Landmarks (depends on categories)
    console.log('📦 Seeding Landmarks...');
    
    // Helper to find UUIDs from the fetched data
    const getGovId = (name: string) => govData?.find(g => g.name_en === name)?.id;
    const getTypeId = (name: string) => typeData?.find(t => t.name_en === name)?.id;

    const landmarkPayload = INITIAL_LANDMARKS.map((l) => ({
      name_en: l.name.en,
      name_ar: l.name.ar,
      type_id: getTypeId(l.type as string),
      governorate_id: getGovId(l.governorate as string),
      lat: l.coords[0],
      lng: l.coords[1],
      description_en: l.description.en,
      description_ar: l.description.ar,
      images: l.images,
    }));
    
    const { error: landmarkError } = await supabase
      .from('landmarks')
      .insert(landmarkPayload);
    
    if (landmarkError) {
      throw new Error(`Failed to seed landmarks: ${landmarkError.message}`);
    }
    console.log(`   ✅ Seeded ${INITIAL_LANDMARKS.length} landmarks`);

    // 4. Seed Translations
    console.log('📦 Seeding Translations...');
    const translationKeys = Object.keys(INITIAL_TRANSLATIONS.en);
    const translationPayload = translationKeys.map((key) => ({
      key,
      en: (INITIAL_TRANSLATIONS.en as any)[key],
      ar: (INITIAL_TRANSLATIONS.ar as any)[key],
    }));
    
    const { error: transError } = await supabase
      .from('translations')
      .upsert(translationPayload, { onConflict: 'key' });
    
    if (transError) {
      throw new Error(`Failed to seed translations: ${transError.message}`);
    }
    console.log(`   ✅ Seeded ${translationKeys.length} translation keys`);

    console.log('\n✨ Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Governorates: ${INITIAL_GOVERNORATES.length}`);
    console.log(`   - Types: ${INITIAL_TYPES.length}`);
    console.log(`   - Landmarks: ${INITIAL_LANDMARKS.length}`);
    console.log(`   - Translation Keys: ${translationKeys.length}`);

    // Verify the data was saved
    console.log('\n🔍 Verifying data...');
    const [landmarksResult, governoratesResult, typesResult, translationsResult] = await Promise.all([
      supabase.from('landmarks').select('id'),
      supabase.from('governorates').select('id'),
      supabase.from('types').select('id'),
      supabase.from('translations').select('key'),
    ]);

    if (landmarksResult.error) throw landmarksResult.error;
    if (governoratesResult.error) throw governoratesResult.error;
    if (typesResult.error) throw typesResult.error;
    if (translationsResult.error) throw translationsResult.error;

    console.log(`   ✅ Landmarks: ${landmarksResult.data?.length || 0} found`);
    console.log(`   ✅ Governorates: ${governoratesResult.data?.length || 0} found`);
    console.log(`   ✅ Types: ${typesResult.data?.length || 0} found`);
    console.log(`   ✅ Translations: ${translationsResult.data?.length || 0} keys found`);

    console.log('\n🎉 All done! Your Supabase database is now seeded.');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
    }
    process.exit(1);
  }
}

// Run the seeding
seedSupabase();
