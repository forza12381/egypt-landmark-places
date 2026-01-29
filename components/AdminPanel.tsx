
import React, { useState, useMemo, useEffect } from 'react';
import { Landmark, TranslationMap, Category, Translations, Language } from '../types';
import { 
  Plus, Edit2, Trash2, Save, X, Image as ImageIcon, MapPin, 
  Search, Copy, Tags, Map as MapIcon, Globe, 
  LogOut, BarChart3, Database, Languages as LangIcon, Settings,
  Check, AlertTriangle, ChevronRight, LayoutDashboard, ArrowLeft, Menu, Info
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Interfaces ---

interface AdminPanelProps {
  landmarks: Landmark[];
  onUpdateLandmarks: (newList: Landmark[]) => void;
  governorates: Category[];
  onUpdateGovernorates: (newList: Category[]) => void;
  types: Category[];
  onUpdateTypes: (newList: Category[]) => void;
  translations: TranslationMap;
  onUpdateTranslations: (t: TranslationMap) => void;
  onExit: () => void;
}

type Tab = 'dashboard' | 'landmarks' | 'governorates' | 'types' | 'translations';

// --- Helper Components ---

// Map Helper to update center when coords change
const MapRecenter: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(coords, map.getZoom());
  }, [coords[0], coords[1], map]);
  return null;
};

// Helper to fix map rendering inside dynamic containers
const MapInvalidator = () => {
  const map = useMap();

  useEffect(() => {
    // Force Leaflet to recalculate container size
    const handleResize = () => {
        map.invalidateSize();
    };
    
    // Invalidate immediately
    handleResize();
    
    // Invalidate repeatedly during the slide-in animation duration (approx 300-500ms)
    // This ensures that as the container grows/slides, tiles are fetched
    const timers = [
        setTimeout(handleResize, 100),
        setTimeout(handleResize, 200),
        setTimeout(handleResize, 300),
        setTimeout(handleResize, 400),
        setTimeout(handleResize, 500),
        setTimeout(handleResize, 800) // Safety check
    ];

    const observer = new ResizeObserver(() => handleResize());
    if (map.getContainer()) {
      observer.observe(map.getContainer());
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
      observer.disconnect();
    };
  }, [map]);

  return null;
};

// 1. Location Picker Map
const LocationPicker: React.FC<{ 
  coords: [number, number]; 
  onChange: (coords: [number, number]) => void; 
}> = ({ coords, onChange }) => {
  
  // Validation: Ensure coords are valid numbers, fallback to Egypt center if not
  const safeCoords: [number, number] = (Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) 
    ? coords 
    : [29.3, 31.0];

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        onChange([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  };

  return (
    <div className="h-[250px] sm:h-[300px] w-full rounded-xl overflow-hidden border-2 border-slate-200 relative z-0">
      <MapContainer center={safeCoords} zoom={6} className="h-full w-full">
        <MapInvalidator />
        <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={safeCoords} />
        <MapEvents />
        <MapRecenter coords={safeCoords} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded shadow text-xs font-bold z-[400] text-slate-800">
        {safeCoords[0].toFixed(4)}, {safeCoords[1].toFixed(4)}
      </div>
    </div>
  );
};

// 2. Tab Button
const SidebarItem = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
      ${active 
        ? 'bg-[#d4af37] text-white shadow-lg shadow-[#d4af37]/20 font-bold rtl:-translate-x-1 ltr:translate-x-1' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }
    `}
  >
    <span className={active ? "text-white" : "text-slate-400"}>{icon}</span>
    <span className="text-sm font-medium">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto opacity-50 rtl:rotate-180" />}
  </button>
);

// 3. Stat Card
const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-1">
    <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
      {React.cloneElement(icon, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
    </div>
    <div>
      <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

// --- Main Component ---

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  landmarks, onUpdateLandmarks,
  governorates, onUpdateGovernorates,
  types, onUpdateTypes,
  translations, onUpdateTranslations,
  onExit
}) => {
  const { isRTL, language, t, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Landmark Editor State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [landmarkForm, setLandmarkForm] = useState<Partial<Landmark>>({});
  const [landmarkSearch, setLandmarkSearch] = useState('');

  // Generic Category Editor State
  const [editingCategory, setEditingCategory] = useState<{id: string, name: {en: string, ar: string}} | null>(null);

  // Close sidebar on tab change (mobile)
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // --- Actions ---

  // Landmarks
  const startEditLandmark = (l?: Landmark) => {
    if (l) {
      setEditingId(l.id);
      setLandmarkForm(JSON.parse(JSON.stringify(l))); // Deep copy
    } else {
      setEditingId(null);
      setLandmarkForm({
        name: { en: '', ar: '' },
        description: { en: '', ar: '' },
        type: types[0]?.id || '',
        governorate: governorates[0]?.id || '',
        coords: [29.3, 31.0],
        images: ['']
      });
    }
    setIsEditorOpen(true);
  };

  const saveLandmark = () => {
    if (!landmarkForm.name?.en || !landmarkForm.name?.ar) return alert("Names are required");
    
    const cleanImages = (landmarkForm.images || []).filter(i => i.trim());
    
    // Ensure coords are valid before saving
    const finalCoords: [number, number] = (landmarkForm.coords && !isNaN(landmarkForm.coords[0]) && !isNaN(landmarkForm.coords[1]))
      ? landmarkForm.coords
      : [29.3, 31.0];

    const finalData = {
      ...landmarkForm,
      coords: finalCoords,
      images: cleanImages.length ? cleanImages : ['https://via.placeholder.com/400'],
      // Ensure IDs exist if they were empty
      type: landmarkForm.type || types[0]?.id,
      governorate: landmarkForm.governorate || governorates[0]?.id,
    } as Landmark;

    if (editingId) {
      onUpdateLandmarks(landmarks.map(l => l.id === editingId ? { ...finalData, id: editingId } : l));
    } else {
      onUpdateLandmarks([{ ...finalData, id: Date.now().toString() }, ...landmarks]);
    }
    setIsEditorOpen(false);
  };

  const deleteLandmark = (id: string) => {
    if (confirm(t.deleteConfirm)) {
      onUpdateLandmarks(landmarks.filter(l => l.id !== id));
    }
  };

  const duplicateLandmark = (l: Landmark) => {
    const copy = {
      ...l,
      id: Date.now().toString(),
      name: { en: `${l.name.en} (Copy)`, ar: `${l.name.ar} (نسخة)` }
    };
    onUpdateLandmarks([copy, ...landmarks]);
  };

  // Categories (Generic)
  const handleSaveCategory = (
    list: Category[], 
    updateList: (l: Category[]) => void, 
    formData: {id: string, name: {en: string, ar: string}},
    isNew: boolean
  ) => {
    if (!formData.name.en || !formData.name.ar) return;

    if (isNew) {
      const id = formData.name.en.toLowerCase().replace(/[^a-z0-9]/g, '-');
      if (list.some(i => i.id === id)) return alert("ID already exists");
      updateList([...list, { id, name: formData.name }]);
    } else {
      updateList(list.map(i => i.id === formData.id ? { ...i, name: formData.name } : i));
    }
    setEditingCategory(null);
  };

  const handleDeleteCategory = (list: Category[], updateList: (l: Category[]) => void, id: string, type: 'gov' | 'type') => {
    // Check usage
    const usageCount = landmarks.filter(l => type === 'gov' ? l.governorate === id : l.type === id).length;
    if (usageCount > 0) {
      if (!confirm(`This category is used by ${usageCount} landmarks. Deleting it may break data display. Continue?`)) return;
    } else {
      if (!confirm("Delete this category?")) return;
    }
    updateList(list.filter(i => i.id !== id));
  };

  // Translations
  const updateTrans = (lang: Language, key: string, val: string) => {
    onUpdateTranslations({
      ...translations,
      [lang]: { ...translations[lang], [key]: val }
    });
  };

  // --- Renderers ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-800">{t.overview}</h2>
        <p className="text-slate-500">{t.welcomeBack}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={t.totalLandmarks} value={landmarks.length} icon={<MapPin/>} color="bg-blue-500" />
        <StatCard label={t.totalGovernorates} value={governorates.length} icon={<MapIcon/>} color="bg-emerald-500" />
        <StatCard label={t.totalCategories} value={types.length} icon={<Tags/>} color="bg-amber-500" />
        <StatCard label={t.totalTranslations} value={Object.keys(translations.en).length} icon={<Globe/>} color="bg-indigo-500" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Database size={18} className="text-[#d4af37]"/> {t.recentInventory}
          </h3>
          <button onClick={() => setActiveTab('landmarks')} className="text-sm font-bold text-[#d4af37] hover:underline">{t.viewAll}</button>
        </div>
        <div className="divide-y divide-slate-100">
          {landmarks.slice(0, 5).map(l => (
            <div key={l.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 truncate">{l.name[language]}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] uppercase font-bold tracking-wider">
                    {types.find(t => t.id === l.type)?.name[language]}
                  </span>
                  <span>•</span>
                  <span>{governorates.find(g => g.id === l.governorate)?.name[language]}</span>
                </div>
              </div>
              <div className="text-xs font-mono text-slate-400">ID: {l.id.slice(0,6)}...</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLandmarks = () => (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      {/* List View */}
      {!isEditorOpen ? (
        <div className="space-y-6 h-full flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 flex-shrink-0">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">{t.manageLandmarks}</h2>
              <p className="text-slate-500 mt-1">{t.manageLandmarksDesc}</p>
            </div>
            <button 
              onClick={() => startEditLandmark()} 
              className="px-6 py-3 bg-[#d4af37] text-white rounded-xl font-bold shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all w-full sm:w-auto justify-center"
            >
              <Plus size={20} /> {t.addLandmark}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
              <div className="relative flex-1">
                <Search className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} text-slate-400`} size={18} />
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder}
                  value={landmarkSearch}
                  onChange={(e) => setLandmarkSearch(e.target.value)}
                  className={`w-full h-10 ${isRTL ? 'pr-10' : 'pl-10'} rounded-lg border border-slate-200 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none transition-all text-slate-800`}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className={`p-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t.nameEn} / {t.nameAr}</th>
                    <th className={`p-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell ${isRTL ? 'text-right' : 'text-left'}`}>{t.type} / {t.location}</th>
                    <th className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {landmarks
                    .filter(l => l.name.en.toLowerCase().includes(landmarkSearch.toLowerCase()) || l.name.ar.includes(landmarkSearch))
                    .map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/80 group transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <img src={l.images[0]} className="w-12 h-12 rounded-lg object-cover bg-slate-200 shadow-sm" loading="lazy" />
                          <div>
                            <div className="font-bold text-slate-800">{l.name[language]}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5 sm:hidden">{types.find(t => t.id === l.type)?.name[language]}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-bold w-fit border border-amber-100">
                            <Tags size={10} />
                            {types.find(t => t.id === l.type)?.name[language]}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold w-fit border border-emerald-100">
                            <MapIcon size={10} />
                            {governorates.find(g => g.id === l.governorate)?.name[language]}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditLandmark(l)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title={t.editLandmark}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => duplicateLandmark(l)} className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors" title={t.duplicate}>
                            <Copy size={16} />
                          </button>
                          <button onClick={() => deleteLandmark(l.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors" title={t.deleteConfirm}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Editor View */
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          {/* Editor Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-500">
                <ArrowLeft size={20} />
              </button>
              <h3 className="font-bold text-xl text-slate-800">
                {editingId ? t.editLandmark : t.addLandmark}
              </h3>
            </div>
            <div className="flex gap-3 w-full sm:w-auto justify-end">
              <button onClick={() => setIsEditorOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg transition-colors">
                {t.cancel}
              </button>
              <button onClick={saveLandmark} className="px-6 py-2 bg-[#d4af37] text-white font-bold rounded-lg shadow-md flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                <Save size={18} /> {t.save}
              </button>
            </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Section: Basic Info */}
              <section className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">{t.basicDetails}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">{t.nameEn}</label>
                    <input 
                      type="text" 
                      value={landmarkForm.name?.en || ''} 
                      onChange={e => setLandmarkForm({...landmarkForm, name: {...(landmarkForm.name || {en:'', ar:''}), en: e.target.value}})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d4af37]/20 focus:border-[#d4af37] outline-none text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">{t.nameAr}</label>
                    <input 
                      dir="rtl"
                      type="text" 
                      value={landmarkForm.name?.ar || ''} 
                      onChange={e => setLandmarkForm({...landmarkForm, name: {...(landmarkForm.name || {en:'', ar:''}), ar: e.target.value}})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d4af37]/20 focus:border-[#d4af37] outline-none font-arabic text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">{t.type}</label>
                    <div className="relative">
                      <select 
                        value={landmarkForm.type || ''} 
                        onChange={e => setLandmarkForm({...landmarkForm, type: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-[#d4af37]/20 focus:border-[#d4af37] outline-none text-slate-800"
                      >
                        <option value="" disabled>Select Type</option>
                        {types.map(t => <option key={t.id} value={t.id}>{t.name[language]}</option>)}
                      </select>
                      <ChevronRight className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none`} size={16} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">{t.governorate}</label>
                    <div className="relative">
                      <select 
                        value={landmarkForm.governorate || ''} 
                        onChange={e => setLandmarkForm({...landmarkForm, governorate: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-[#d4af37]/20 focus:border-[#d4af37] outline-none text-slate-800"
                      >
                         <option value="" disabled>Select Governorate</option>
                        {governorates.map(g => <option key={g.id} value={g.id}>{g.name[language]}</option>)}
                      </select>
                      <ChevronRight className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none`} size={16} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">{t.descriptionEn}</label>
                    <textarea 
                      rows={4}
                      value={landmarkForm.description?.en || ''} 
                      onChange={e => setLandmarkForm({...landmarkForm, description: {...(landmarkForm.description || {en:'', ar:''}), en: e.target.value}})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d4af37]/20 focus:border-[#d4af37] outline-none text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">{t.descriptionAr}</label>
                    <textarea 
                      dir="rtl"
                      rows={4}
                      value={landmarkForm.description?.ar || ''} 
                      onChange={e => setLandmarkForm({...landmarkForm, description: {...(landmarkForm.description || {en:'', ar:''}), ar: e.target.value}})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d4af37]/20 focus:border-[#d4af37] outline-none font-arabic text-slate-800"
                    />
                  </div>
                </div>
              </section>

              {/* Section: Location */}
              <section className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">{t.locationCoordinates}</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <LocationPicker 
                      coords={landmarkForm.coords || [29.3, 31.0]} 
                      onChange={coords => setLandmarkForm({...landmarkForm, coords})} 
                    />
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <Info size={12} /> {t.clickMapTip}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">{t.latitude}</label>
                      <input 
                        type="number" 
                        step="any"
                        value={landmarkForm.coords?.[0] || ''} 
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          const currentLng = landmarkForm.coords?.[1] || 31.0;
                          setLandmarkForm({...landmarkForm, coords: [val, currentLng]});
                        }}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d4af37]/20 focus:border-[#d4af37] outline-none text-slate-800 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">{t.longitude}</label>
                      <input 
                        type="number" 
                        step="any"
                        value={landmarkForm.coords?.[1] || ''} 
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          const currentLat = landmarkForm.coords?.[0] || 29.3;
                          setLandmarkForm({...landmarkForm, coords: [currentLat, val]});
                        }}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d4af37]/20 focus:border-[#d4af37] outline-none text-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Images */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">{t.mediaGallery}</h4>
                   <button 
                     onClick={() => setLandmarkForm({...landmarkForm, images: [...(landmarkForm.images || []), '']})}
                     className="text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                   >
                     <Plus size={14} /> {t.addImage}
                   </button>
                </div>
                
                <div className="space-y-3">
                  {landmarkForm.images?.map((img, idx) => (
                    <div key={idx} className="flex flex-col gap-2 animate-in fade-in duration-300">
                      <div className="flex gap-3 items-start">
                        <div className="w-20 h-16 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative group">
                          {img ? (
                             <img src={img} className="w-full h-full object-cover" alt={`Preview ${idx + 1}`} />
                          ) : (
                             <ImageIcon className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input 
                            type="text" 
                            value={img}
                            onChange={(e) => {
                              const newImages = [...(landmarkForm.images || [])];
                              newImages[idx] = e.target.value;
                              setLandmarkForm({...landmarkForm, images: newImages});
                            }}
                            placeholder="https://..."
                            className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-[#d4af37] outline-none text-slate-800"
                          />
                        </div>
                        <button 
                          onClick={() => setLandmarkForm({...landmarkForm, images: landmarkForm.images?.filter((_, i) => i !== idx)})}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove image"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {(!landmarkForm.images || landmarkForm.images.length === 0) && (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <ImageIcon className="mx-auto text-slate-300 mb-2" size={32} />
                      <p className="text-sm text-slate-400 italic">{t.noImages}</p>
                      <button 
                         onClick={() => setLandmarkForm({...landmarkForm, images: ['']})}
                         className="mt-2 text-xs font-bold text-[#d4af37] hover:underline"
                       >
                         {t.addImage}
                       </button>
                    </div>
                  )}
                </div>
              </section>

            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCategories = (list: Category[], updateList: (l: Category[]) => void, type: 'gov' | 'type') => (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">{type === 'gov' ? t.manageGovernorates : t.manageTypes}</h2>
          <p className="text-slate-500 mt-1">{type === 'gov' ? t.manageGovernoratesDesc : t.manageTypesDesc}</p>
        </div>
        <button 
          onClick={() => setEditingCategory({id: '', name: {en: '', ar: ''}})}
          className="px-6 py-3 bg-[#d4af37] text-white rounded-xl font-bold shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 hover:brightness-110"
        >
          <Plus size={20} /> {type === 'gov' ? t.addRegion : t.addType}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 p-0">
           <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t.key} (ID)</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t.nameEn}</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{t.nameAr}</th>
                <th className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{t.usedByLandmarks}</th>
                <th className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono text-sm text-slate-500">{item.id}</td>
                  <td className="p-4 font-bold text-slate-800">{item.name.en}</td>
                  <td className="p-4 font-bold text-slate-800 font-arabic text-right">{item.name.ar}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {landmarks.filter(l => type === 'gov' ? l.governorate === item.id : l.type === item.id).length}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setEditingCategory(item)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteCategory(list, updateList, item.id, type)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.9, opacity: 0}}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">{editingCategory.id ? t.editCategory : t.newCategory}</h3>
                <button onClick={() => setEditingCategory(null)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">{t.nameEn}</label>
                  <input 
                    type="text" 
                    value={editingCategory.name.en} 
                    onChange={e => setEditingCategory({...editingCategory, name: {...editingCategory.name, en: e.target.value}})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">{t.nameAr}</label>
                  <input 
                    type="text" 
                    dir="rtl"
                    value={editingCategory.name.ar} 
                    onChange={e => setEditingCategory({...editingCategory, name: {...editingCategory.name, ar: e.target.value}})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#d4af37] font-arabic"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                <button onClick={() => setEditingCategory(null)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg">{t.cancel}</button>
                <button 
                  onClick={() => handleSaveCategory(list, updateList, editingCategory, !editingCategory.id)} 
                  className="px-6 py-2 bg-[#d4af37] text-white font-bold rounded-lg hover:brightness-110"
                >
                  {t.saveChanges}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderTranslations = () => (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800">{t.manageTranslations}</h2>
        <p className="text-slate-500 mt-1">{t.manageTranslationsDesc}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">{t.key}</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">{t.english}</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3 text-right">{t.arabic}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.keys(translations.en).map((key) => (
                <tr key={key} className="hover:bg-slate-50">
                  <td className="p-4 font-mono text-xs text-slate-500 break-all">{key}</td>
                  <td className="p-2 align-top">
                    <textarea 
                      rows={1}
                      value={translations.en[key as keyof Translations] || ''}
                      onChange={(e) => updateTrans('en', key, e.target.value)}
                      className="w-full p-2 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#d4af37] focus:bg-slate-50 rounded transition-all outline-none resize-none overflow-hidden text-sm"
                      style={{minHeight: '40px'}}
                    />
                  </td>
                  <td className="p-2 align-top">
                    <textarea 
                      dir="rtl"
                      rows={1}
                      value={translations.ar[key as keyof Translations] || ''}
                      onChange={(e) => updateTrans('ar', key, e.target.value)}
                      className="w-full p-2 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#d4af37] focus:bg-slate-50 rounded transition-all outline-none resize-none overflow-hidden text-sm font-arabic text-right"
                      style={{minHeight: '40px'}}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar - Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#d4af37]">
            <LayoutDashboard size={24} />
            <span className="font-bold text-xl text-slate-800 tracking-tight">{t.adminConsole}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400"><X size={20}/></button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} icon={<BarChart3 size={20}/>} label={t.dashboard} />
          <SidebarItem active={activeTab === 'landmarks'} onClick={() => handleTabChange('landmarks')} icon={<MapPin size={20}/>} label={t.manageLandmarks} />
          <SidebarItem active={activeTab === 'governorates'} onClick={() => handleTabChange('governorates')} icon={<MapIcon size={20}/>} label={t.manageGovernorates} />
          <SidebarItem active={activeTab === 'types'} onClick={() => handleTabChange('types')} icon={<Tags size={20}/>} label={t.manageTypes} />
          <SidebarItem active={activeTab === 'translations'} onClick={() => handleTabChange('translations')} icon={<LangIcon size={20}/>} label={t.manageTranslations} />
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
           <button onClick={toggleLanguage} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <Globe size={20} />
            <span className="text-sm font-medium">{t.switchLanguage}</span>
          </button>
          <button onClick={onExit} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={20} />
            <span className="text-sm font-medium">{t.exit}</span>
          </button>
          <div className="pt-2 text-center">
             <span className="text-[10px] text-slate-400 font-mono">{t.version}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h1 className="font-bold text-lg text-slate-800 capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-[#d4af37] text-white flex items-center justify-center font-bold shadow-md">A</div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 bg-[#f8f9fa]">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'landmarks' && renderLandmarks()}
          {activeTab === 'governorates' && renderCategories(governorates, onUpdateGovernorates, 'gov')}
          {activeTab === 'types' && renderCategories(types, onUpdateTypes, 'type')}
          {activeTab === 'translations' && renderTranslations()}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
