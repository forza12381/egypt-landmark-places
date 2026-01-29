import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Tooltip, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { RotateCcw } from 'lucide-react';
import { Landmark, Category } from '../types';
import { useLanguage } from './LanguageContext';

interface MapProps {
  landmarks: Landmark[];
  onLandmarkSelect: (landmark: Landmark) => void;
  selectedLandmark: Landmark | null;
  governorates: Category[];
  types: Category[];
}

// Custom Marker Icons
const createCustomIcon = (type: string) => {
  const emoji = type === 'pyramid' ? '🏛️' :
                type === 'religious' ? '⛪' :
                type === 'natural' ? '🌿' :
                type === 'museum' ? '🏺' : '📍';
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-10 h-10 bg-white border-2 border-[#d4af37] rounded-full flex items-center justify-center text-xl shadow-lg transform transition-transform hover:scale-110 active:scale-95 cursor-pointer">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20], // Perfectly centered anchor
  });
};

// Component to fix map rendering issues by forcing a size check
const MapInvalidator = () => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately and after a short delay to ensure container is properly sized
    // This fixes the "grey tiles" or "partial load" issue common in single page apps
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    
    // Observe the map container
    if (map.getContainer()) {
      resizeObserver.observe(map.getContainer());
    }

    // Also trigger manually on mount sequences
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
};

const MapController: React.FC<{ target: [number, number] | null }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 12, { duration: 1.5 });
    }
  }, [target, map]);
  return null;
};

const ResetViewControl = () => {
  const map = useMap();
  const { isRTL } = useLanguage();

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    map.flyTo([29.2, 31.0], 9, { duration: 1.5 });
  };

  return (
    <div className={`absolute bottom-28 ${isRTL ? 'left-[10px]' : 'right-[10px]'} z-[400]`}>
      <button
        onClick={handleReset}
        className="bg-white hover:bg-slate-50 text-slate-700 w-[30px] h-[30px] flex items-center justify-center rounded shadow-[0_1px_5px_rgba(0,0,0,0.65)] border-none transition-colors"
        title={isRTL ? "إعادة تعيين الخريطة" : "Reset Map View"}
        aria-label="Reset Map View"
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
};

const EgyptMap: React.FC<MapProps> = ({ landmarks, onLandmarkSelect, selectedLandmark, governorates, types }) => {
  const { language, isRTL } = useLanguage();

  return (
    // CRITICAL FIX: dir="ltr" ensures Leaflet positioning logic (which relies on left/top coordinates)
    // works correctly even when the app is in Arabic mode. The content inside the tooltip
    // manually handles RTL text direction.
    <div className="w-full h-full relative z-0" dir="ltr">
      <MapContainer
        center={[29.2, 31.0]}
        zoom={9}
        className="w-full h-full outline-none"
        zoomControl={false}
      >
        <MapInvalidator />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Map Controls */}
        <ZoomControl position={isRTL ? "bottomleft" : "bottomright"} />
        <ResetViewControl />

        {landmarks.map((landmark) => (
          <Marker
            key={landmark.id}
            position={landmark.coords}
            icon={createCustomIcon(landmark.type)}
            eventHandlers={{
              click: () => onLandmarkSelect(landmark),
            }}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -28]} // Adjusted to float just above the circular marker (20px radius + padding)
              opacity={1} 
              permanent={false}
              className="custom-tooltip"
              sticky={false}
            >
              <div className="relative">
                {/* The card itself */}
                <div 
                  className="custom-tooltip-card"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                  {/* Content area */}
                  <div className={`p-4 flex flex-col items-center text-center ${isRTL ? 'font-arabic' : ''}`}>
                    <span className="text-[10px] uppercase font-black text-[#d4af37] tracking-[0.25em] mb-1.5 opacity-90">
                      {types.find(t => t.id === landmark.type)?.name[language] || landmark.type}
                    </span>
                    
                    <h3 className={`text-lg font-bold text-[#5c4033] leading-tight mb-1 ${isRTL ? 'text-xl' : 'font-ancient'}`}>
                      {landmark.name[language]}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-gray-500 mb-3">
                      <span className="text-[11px] font-medium">
                        {governorates.find(g => g.id === landmark.governorate)?.name[language] || landmark.governorate}
                      </span>
                    </div>

                    <div className="w-full h-32 rounded-xl overflow-hidden border border-[#d4af37]/20 shadow-inner bg-[#f1e4d0]">
                      <img 
                        src={landmark.images[0]} 
                        alt="" 
                        className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Custom arrow centered below the card */}
                <div className="custom-tooltip-arrow" />
              </div>
            </Tooltip>
          </Marker>
        ))}
        <MapController target={selectedLandmark ? selectedLandmark.coords : null} />
      </MapContainer>
    </div>
  );
};

export default EgyptMap;