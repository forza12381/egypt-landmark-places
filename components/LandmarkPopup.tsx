
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Landmark, Category } from '../types';
import { useLanguage } from './LanguageContext';

interface LandmarkPopupProps {
  landmark: Landmark | null;
  onClose: () => void;
  governorates: Category[];
  types: Category[];
}

const LandmarkPopup: React.FC<LandmarkPopupProps> = ({ landmark, onClose, governorates, types }) => {
  const { language, t, isRTL } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);

  if (!landmark) return null;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % landmark.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + landmark.images.length) % landmark.images.length);
  };

  const currentType = types.find(t => t.id === landmark.type);
  const currentGov = governorates.find(g => g.id === landmark.governorate);

  return (
    <AnimatePresence>
      {landmark && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-[#fdf6e3] w-full max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Image Slider */}
            <div className="relative h-64 sm:h-80 w-full bg-gray-200">
              <img 
                src={landmark.images[currentImage]} 
                alt={landmark.name[language]}
                className="w-full h-full object-cover"
              />
              {landmark.images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-white/20 hover:bg-white/40 rounded-full text-white"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/20 hover:bg-white/40 rounded-full text-white"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                    {landmark.images.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full transition-all ${i === currentImage ? 'bg-[#d4af37] w-4' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-320px)]">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-[#d4af37]/20 text-[#8b6d1b] rounded-full text-sm font-semibold flex items-center gap-1">
                  <Tag size={14} />
                  {currentType ? currentType.name[language] : landmark.type}
                </span>
                <span className="px-3 py-1 bg-[#e2725b]/20 text-[#a6422d] rounded-full text-sm font-semibold flex items-center gap-1">
                  <MapPin size={14} />
                  {currentGov ? currentGov.name[language] : landmark.governorate}
                </span>
              </div>

              <h2 className={`text-3xl font-bold mb-4 ${isRTL ? 'font-arabic' : 'font-ancient'} text-[#5c4033]`}>
                {landmark.name[language]}
              </h2>

              <p className={`text-lg leading-relaxed text-[#705c53] ${isRTL ? 'font-arabic' : 'font-sans'}`}>
                {landmark.description[language]}
              </p>
            </div>

            {/* Bottom Decoration */}
            <div className="h-2 w-full bg-gradient-to-r from-[#d4af37] via-[#edc9af] to-[#d4af37]" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LandmarkPopup;
