import React from 'react';
import { Film, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-white/5 bg-[#080A12] py-12 px-4 sm:px-8 text-gray-400 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1px]">
              <div className="w-full h-full bg-[#080A12] rounded-[7px] flex items-center justify-center">
                <Film className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="text-base font-extrabold text-white tracking-tight">
              Cine<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">NOVA</span>
            </span>
          </div>
          <p className="text-gray-400 max-w-sm text-[12px] leading-relaxed">
            Discover Beyond the Screen. Personalized recommendations powered by CineNOVA's pretrained AI content model.
          </p>
        </div>

        {/* TMDB Attribution & AI Model Notes */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right max-w-md">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pretrained Model Architecture (45,447 Films)</span>
          </div>
          <p className="text-gray-400 text-[11px] leading-relaxed">
            This product uses the TMDB API for cinematic metadata and media artwork but is not endorsed or certified by TMDB.
          </p>
          <div className="mt-3 flex items-center gap-1 text-gray-400 text-[11px]">
            <span>Crafted for CineNOVA with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
            <span>• Next-Gen Streaming Discovery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
