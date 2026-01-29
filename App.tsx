
import React, { useState, useMemo, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import Map from './components/Map';
import FilterPanel from './components/FilterPanel';
import LandmarkSidePanel from './components/LandmarkSidePanel';
import AdminPanel from './components/AdminPanel';
import { Landmark, Governorate, LandmarkType, TranslationMap, Category } from './types';
import { INITIAL_LANDMARKS, INITIAL_GOVERNORATES, INITIAL_TYPES, INITIAL_TRANSLATIONS } from './constants';
import { Languages, Compass, Search, SlidersHorizontal, Database } from 'lucide-react';

const STORAGE_KEYS = {
  LANDMARKS: 'egypt-landmarks-db-v1',
  GOVERNORATES: 'egypt-governorates-db-v1',
  TYPES: 'egypt-types-db-v1',
  TRANSLATIONS: 'egypt-translations-db-v1',
};

// Helper to load data synchronously
const loadData = <T,>(key: string, initial: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  } catch (e) {
    console.warn('Failed to load from storage:', e);
    return initial;
  }
};

// Main Application Layout
const MainLayout: React.FC<{
  data: {
    landmarks: Landmark[];
    governorates: Category[];
    types: Category[];
  };
  onUpdateLandmarks: (l: Landmark[]) => void;
  onUpdateGovernorates: (g: Category[]) => void;
  onUpdateTypes: (t: Category[]) => void;
  translations: TranslationMap;
  onUpdateTranslations: (t: TranslationMap) => void;
}> = ({ 
  data, 
  onUpdateLandmarks, 
  onUpdateGovernorates, 
  onUpdateTypes, 
  translations, 
  onUpdateTranslations 
}) => {
  const { language, t, toggleLanguage, isRTL } = useLanguage();
  const [view, setView] = useState<'explorer' | 'admin'>('explorer');
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [govFilter, setGovFilter] = useState<Governorate | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<LandmarkType | 'all'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Hash-based routing for Admin access
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.pathname === '/admin') {
        setView('admin');
      } else {
        setView('explorer');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const filteredLandmarks = useMemo(() => {
    return data.landmarks.filter(landmark => {
      const term = searchTerm.toLowerCase();
      const nameEn = landmark.name.en.toLowerCase();
      const nameAr = landmark.name.ar;
      const matchesSearch = nameEn.includes(term) || nameAr.includes(term);
      const matchesGov = govFilter === 'all' || landmark.governorate === govFilter;
      const matchesType = typeFilter === 'all' || landmark.type === typeFilter;
      return matchesSearch && matchesGov && matchesType;
    });
  }, [data.landmarks, searchTerm, govFilter, typeFilter]);

  const hasActiveFilters = govFilter !== 'all' || typeFilter !== 'all';

  // Exit Admin View
  const handleExitAdmin = () => {
    window.location.hash = '';
    setView('explorer');
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden flex flex-col bg-[#fdf6e3]">
      {/* Public Header */}
      {view === 'explorer' && (
        <header className="fixed top-0 inset-x-0 z-[60] px-4 py-3 sm:px-6 flex items-center justify-between bg-[#fdf6e3]/90 backdrop-blur-md border-b border-[#d4af37]/20 shadow-sm gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="p-2 bg-[#d4af37] rounded-lg text-white shadow-lg">
              <Compass size={24} />
            </div>
            <h1 className={`text-xl sm:text-2xl font-bold text-[#5c4033] hidden lg:block ${isRTL ? 'font-arabic' : 'font-ancient'}`}>
              {t.title}
            </h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg relative group">
            <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} text-[#d4af37] pointer-events-none`}>
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`
                w-full h-10 sm:h-11 
                ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} 
                bg-white/60 border border-[#d4af37]/30 rounded-xl 
                text-[#5c4033] font-bold text-sm sm:text-base placeholder-[#d4af37]/60 
                focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:bg-white 
                transition-all shadow-inner
              `}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`
                relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl shadow-md font-bold transition-all
                ${isFilterOpen || hasActiveFilters 
                  ? 'bg-[#5c4033] text-white hover:bg-[#4a332a]' 
                  : 'bg-[#d4af37] text-white hover:brightness-110'}
              `}
            >
              <SlidersHorizontal size={18} />
              <span className="text-sm sm:text-base hidden sm:inline">{t.filters}</span>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>

            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#fdf6e3] text-[#d4af37] border border-[#d4af37]/30 rounded-xl shadow-sm font-bold hover:bg-white transition-all"
            >
              <Languages size={18} />
              <span className="text-sm sm:text-base hidden sm:inline">{language === 'en' ? 'عربي' : 'EN'}</span>
            </button>
          </div>
        </header>
      )}

      {/* Content Area */}
      <main className={`flex-1 relative ${view === 'explorer' ? 'mt-16' : ''} overflow-hidden`}>
        {view === 'explorer' ? (
          <div className="flex h-full w-full relative">
            <div className="absolute inset-0 z-0">
              <Map 
                landmarks={filteredLandmarks} 
                onLandmarkSelect={setSelectedLandmark}
                selectedLandmark={selectedLandmark}
                governorates={data.governorates}
                types={data.types}
              />
            </div>

            <div className={`absolute top-2 ${isRTL ? 'left-4 sm:left-auto sm:right-20' : 'right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 lg:left-auto lg:right-20 lg:translate-x-0'} z-50 w-[calc(100%-2rem)] sm:w-[400px] max-w-full`}>
                <FilterPanel 
                  isOpen={isFilterOpen}
                  onClose={() => setIsFilterOpen(false)}
                  onFilterGovernorate={setGovFilter}
                  onFilterType={setTypeFilter}
                  currentGov={govFilter}
                  currentType={typeFilter}
                  availableGovernorates={data.governorates}
                  availableTypes={data.types}
                  resultCount={filteredLandmarks.length}
                />
            </div>

            <LandmarkSidePanel 
              landmark={selectedLandmark} 
              onClose={() => setSelectedLandmark(null)} 
              governorates={data.governorates}
              types={data.types}
            />
          </div>
        ) : (
          <div className="h-full bg-slate-50">
            <AdminPanel 
              landmarks={data.landmarks} 
              onUpdateLandmarks={onUpdateLandmarks}
              governorates={data.governorates}
              onUpdateGovernorates={onUpdateGovernorates}
              types={data.types}
              onUpdateTypes={onUpdateTypes}
              translations={translations}
              onUpdateTranslations={onUpdateTranslations}
              onExit={handleExitAdmin}
            />
          </div>
        )}
      </main>

      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>
    </div>
  );
};

// Root Component
const App: React.FC = () => {
  // Initialize state synchronously
  const [landmarks, setLandmarks] = useState<Landmark[]>(() => loadData(STORAGE_KEYS.LANDMARKS, INITIAL_LANDMARKS));
  const [governorates, setGovernorates] = useState<Category[]>(() => loadData(STORAGE_KEYS.GOVERNORATES, INITIAL_GOVERNORATES));
  const [types, setTypes] = useState<Category[]>(() => loadData(STORAGE_KEYS.TYPES, INITIAL_TYPES));
  const [translations, setTranslations] = useState<TranslationMap>(() => loadData(STORAGE_KEYS.TRANSLATIONS, INITIAL_TRANSLATIONS));

  // Sync Handlers (Direct LocalStorage update)
  const handleUpdateLandmarks = (newData: Landmark[]) => {
    setLandmarks(newData);
    localStorage.setItem(STORAGE_KEYS.LANDMARKS, JSON.stringify(newData));
  };

  const handleUpdateGovernorates = (newData: Category[]) => {
    setGovernorates(newData);
    localStorage.setItem(STORAGE_KEYS.GOVERNORATES, JSON.stringify(newData));
  };

  const handleUpdateTypes = (newData: Category[]) => {
    setTypes(newData);
    localStorage.setItem(STORAGE_KEYS.TYPES, JSON.stringify(newData));
  };

  const handleUpdateTranslations = (newData: TranslationMap) => {
    setTranslations(newData);
    localStorage.setItem(STORAGE_KEYS.TRANSLATIONS, JSON.stringify(newData));
  };

  return (
    <LanguageProvider translations={translations}>
      <MainLayout 
        data={{ landmarks, governorates, types }}
        onUpdateLandmarks={handleUpdateLandmarks}
        onUpdateGovernorates={handleUpdateGovernorates}
        onUpdateTypes={handleUpdateTypes}
        translations={translations}
        onUpdateTranslations={handleUpdateTranslations}
      />
    </LanguageProvider>
  );
};

export default App;
