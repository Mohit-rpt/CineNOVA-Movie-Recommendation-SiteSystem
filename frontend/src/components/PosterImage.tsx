import React, { useState, useEffect } from 'react';
import { Film, ImageOff } from 'lucide-react';
import { getTmdbImageUrl } from '../utils/image';

interface PosterImageProps {
  path?: string | null;
  title: string;
  className?: string;
  size?: 'w300' | 'w500' | 'original';
}

export const PosterImage: React.FC<PosterImageProps> = ({
  path,
  title,
  className = '',
  size = 'w500'
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Crucial: Reset error and loaded state whenever image source (path/size) changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [path, size]);

  const imageUrl = getTmdbImageUrl(path, size);

  // Fallback rendering when no path is provided or image loading failed
  if (!imageUrl || hasError) {
    return (
      <div
        className={`w-full h-full aspect-[2/3] bg-gradient-to-br from-[#191D30] to-[#121525] border border-white/5 flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
      >
        <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-3 text-violet-400">
          {hasError ? <ImageOff className="w-6 h-6 text-amber-400/80" /> : <Film className="w-6 h-6 text-violet-400" />}
        </div>
        <p className="text-xs font-semibold text-gray-200 line-clamp-3 leading-tight">{title}</p>
        <span className="text-[10px] text-cyan-400/80 mt-1 uppercase tracking-wider font-mono">
          {hasError ? 'Image Offline' : 'CineNOVA'}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full aspect-[2/3] overflow-hidden bg-[#121525] ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#191D30] via-[#222742] to-[#191D30] animate-pulse" />
      )}
      <img
        src={imageUrl}
        alt={`${title} poster`}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
