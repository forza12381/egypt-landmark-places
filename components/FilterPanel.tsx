import React from 'react';
import { X, MapPin, Tag, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from './LanguageContext';
import { Governorate, LandmarkType, Category } from '../types';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterGovernorate: (gov: Governorate | 'all') => void;
  onFilterType: (type: LandmarkType | 'all') => void;
  currentGov: Governorate | 'all';
  currentType: LandmarkType | 'all';
  availableGovernorates: Category[];
  availableTypes: Category[];
  resultCount?: number;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  isOpen,
  onClose,
  onFilterGovernorate, 
  onFilterType,
  currentGov,
  currentType,
  availableGovernorates,
  availableTypes,
  resultCount
}) => {
  const { t, isRTL, language } = useLanguage();

  const clearAll = () => {
    onFilterGovernorate('all');
    onFilterType('all');
  };

  const FilterChip = ({ label, active, onClick, icon: Icon }: any) => (
    <button
      onClick={onClick}
      className={`
        group relative px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 border select-none
        ${active
          ? 'bg-[#d4af37] text-white border-[#d4af37] shadow-lg shadow-[#d4af37]/30 scale-105'
          : 'bg-white/40 text-[#8b6d1b] border-[#d4af37]/20 hover:bg-[#d4af37]/10 hover:border-[#d4af37]/40'
        }
      `}
    >
      {Icon && <Icon size={12} className={`transition-colors ${active ? 'text-white' : 'text-[#d4af37]'}`} />}
      {label}
      {active && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white/20 rounded-full p-0.5">
          <Check size={10} strokeWidth={4} />
        </motion.div>
      )}
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
          className="w-full bg-[#fdf6e3]/95 backdrop-blur-xl rounded-2xl border border-[#d4af37]/40 shadow-2xl overflow-hidden"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Header within panel for mobile context or clarity */}
            <div className="flex items-center justify-between pb-2 border-b border-[#d4af37]/10">
              <span className="text-sm font-black text-[#5c4033] uppercase tracking-widest">{t.filters}</span>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-[#d4af37]/10 text-[#d4af37] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Filters Grid */}
            <div className="space-y-5">
              {/* Governorate */}
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <MapPin size={14} className="text-[#e2725b]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b6d1b] opacity-80">{t.governorate}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterChip 
                    label={t.all} 
                    active={currentGov === 'all'} 
                    onClick={() => onFilterGovernorate('all')} 
                  />
                  {availableGovernorates.map((gov) => (
                    <FilterChip
                      key={gov.id}
                      label={gov.name[language]}
                      active={currentGov === gov.id}
                      onClick={() => onFilterGovernorate(gov.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Tag size={14} className="text-[#e2725b]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b6d1b] opacity-80">{t.type}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterChip 
                    label={t.all} 
                    active={currentType === 'all'} 
                    onClick={() => onFilterType('all')} 
                  />
                  {availableTypes.map((type) => (
                    <FilterChip
                      key={type.id}
                      label={type.name[language]}
                      active={currentType === type.id}
                      onClick={() => onFilterType(type.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer / Reset */}
            <div className="pt-2 flex items-center justify-between border-t border-[#d4af37]/10 mt-2">
                <span className="text-xs text-[#8b6d1b] font-medium italic opacity-70">
                  {resultCount} {t.noResults ? (resultCount === 1 ? 'result' : 'results') : 'found'}
                </span>
                {(currentGov !== 'all' || currentType !== 'all') && (
                  <button 
                    onClick={clearAll}
                    className="text-xs font-bold text-[#e2725b] hover:bg-[#e2725b]/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <X size={14} />
                    {t.clearFilters}
                  </button>
                )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterPanel;