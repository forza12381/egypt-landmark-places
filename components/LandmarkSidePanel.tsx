import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Tag, ChevronLeft, ChevronRight, Info, Navigation } from 'lucide-react';
import { Landmark, Category } from '../types';
import { useLanguage } from './LanguageContext';

interface LandmarkSidePanelProps {
  landmark: Landmark | null;
  onClose: () => void;
  governorates: Category[];
  types: Category[];
}

const LandmarkSidePanel: React.FC<LandmarkSidePanelProps> = ({ landmark, onClose, governorates, types }) => {
  const { language, t, isRTL } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);

  // Reset image index when landmark changes
  useEffect(() => {
    setCurrentImage(0);
  }, [landmark?.id]);

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

  const panelVariants = {
    hidden: { x: isRTL ? '-100%' : '100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: isRTL ? '-100%' : '100%', opacity: 0 }
  };

  return (
    <AnimatePresence mode="wait">
      {landmark && (
        <motion.div
          key={landmark.id}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className={`fixed inset-y-0 ${isRTL ? 'left-0 border-r' : 'right-0 border-l'} z-[100] w-full sm:w-[400px] md:w-[450px] bg-[#fdf6e3] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col border-[#d4af37]/20`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Header Controls - Close Button */}
          {/* Positioned at the "outer" corner relative to the screen edge */}
          <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} z-40 flex items-center`}>
            <button 
              onClick={onClose}
              className="p-2.5 bg-white/90 backdrop-blur-md text-[#5c4033] rounded-full shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all border border-[#d4af37]/30"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>

          {/* Image Gallery Header */}
          <div className="relative h-72 sm:h-80 w-full bg-[#f1e4d0] overflow-hidden group">
            <motion.img 
              key={landmark.images[currentImage]}
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={landmark.images[currentImage]} 
              alt={landmark.name[language]}
              className="w-full h-full object-cover"
            />
            
            {/* Gallery Navigation Arrows */}
            {landmark.images.length > 1 && (
              <>
                {/* Previous Button */}
                <button 
                  onClick={prevImage} 
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} p-3 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm border border-white/20 transition-all z-30 shadow-xl active:scale-90`}
                >
                  {isRTL ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
                </button>

                {/* Next Button */}
                <button 
                  onClick={nextImage} 
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-4' : 'right-4'} p-3 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm border border-white/20 transition-all z-30 shadow-xl active:scale-90`}
                >
                  {isRTL ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-30">
                  {landmark.images.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImage ? 'bg-[#d4af37] w-6 shadow-[0_0_10px_rgba(212,175,55,1)]' : 'bg-white/40 w-1.5'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-8">
            {/* Category Chips - Flex direction handles RTL naturally now */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-[#d4af37]/10 text-[#8b6d1b] rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 border border-[#d4af37]/20">
                <Tag size={12} />
                {currentType ? currentType.name[language] : landmark.type}
              </span>
              <span className="px-3 py-1 bg-[#e2725b]/10 text-[#a6422d] rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 border border-[#e2725b]/20">
                <MapPin size={12} />
                {currentGov ? currentGov.name[language] : landmark.governorate}
              </span>
            </div>

            {/* Title */}
            <h2 className={`text-3xl sm:text-4xl font-bold text-[#5c4033] leading-tight ${isRTL ? 'font-arabic' : 'font-ancient'}`}>
              {landmark.name[language]}
            </h2>

            {/* Description Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#d4af37]">
                <Info size={18} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">{t.explorer}</h3>
              </div>
              <p className={`text-lg leading-relaxed text-[#705c53] ${isRTL ? 'font-arabic leading-loose text-justify' : 'font-serif italic'}`}>
                {landmark.description[language]}
              </p>
            </div>

            {/* Decoration */}
            <div className="pt-12 pb-6 flex justify-center opacity-30">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
              <div className="mx-4 text-[#d4af37]">𓋹</div>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="p-6 bg-white border-t border-[#d4af37]/10 flex gap-3">
             <button 
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${landmark.coords[0]},${landmark.coords[1]}`, '_blank')}
              className="flex-1 py-4 bg-[#d4af37] text-white rounded-2xl font-bold shadow-lg shadow-[#d4af37]/30 hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
             >
                <Navigation size={18} />
                {language === 'en' ? 'Get Directions' : 'احصل على الاتجاهات'}
             </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LandmarkSidePanel;