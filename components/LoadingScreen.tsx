
import React from 'react';
import { Compass, Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#fdf6e3] z-[9999] flex flex-col items-center justify-center p-4">
      <div className="relative mb-8">
        {/* Pulsing Background */}
        <div className="absolute inset-0 bg-[#d4af37]/20 rounded-full animate-ping" />
        
        {/* Main Icon */}
        <div className="relative bg-white p-6 rounded-3xl shadow-xl border-2 border-[#d4af37]">
          <Compass size={64} className="text-[#d4af37] animate-pulse" strokeWidth={1.5} />
        </div>
      </div>

      <h1 className="font-ancient text-3xl font-bold text-[#5c4033] mb-2 tracking-wider">
        EGYPT EXPLORER
      </h1>
      
      <div className="flex items-center gap-3 text-[#8b6d1b] font-medium text-sm bg-[#d4af37]/10 px-4 py-2 rounded-full border border-[#d4af37]/20">
        <Loader2 size={16} className="animate-spin" />
        <span>Loading resources...</span>
      </div>

      {/* Decorative Line */}
      <div className="absolute bottom-10 flex items-center gap-4 opacity-40">
        <div className="h-px w-24 bg-gradient-to-r from-transparent to-[#d4af37]" />
        <span className="text-xl text-[#d4af37]">𓋹</span>
        <div className="h-px w-24 bg-gradient-to-l from-transparent to-[#d4af37]" />
      </div>
    </div>
  );
};

export default LoadingScreen;
