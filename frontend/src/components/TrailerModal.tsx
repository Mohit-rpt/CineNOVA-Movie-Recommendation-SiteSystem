import React, { useEffect } from 'react';
import { X, ExternalLink, Play } from 'lucide-react';
import type { VideoItem } from '../types';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  videos?: VideoItem[];
}

export const TrailerModal: React.FC<TrailerModalProps> = ({
  isOpen,
  onClose,
  title,
  videos = []
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Find official trailer or teaser
  const trailer = videos.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  ) || videos.find((v) => v.site === 'YouTube');

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    title + ' official trailer'
  )}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} Trailer`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#121525] border border-violet-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-violet-950/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#191D30]">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            <h3 className="text-base sm:text-lg font-bold text-gray-100 line-clamp-1">
              {title} {trailer ? `— ${trailer.name}` : 'Trailer'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close trailer modal"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Frame */}
        <div className="aspect-video w-full bg-black flex items-center justify-center">
          {trailer ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
              title={`${title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="p-8 text-center flex flex-col items-center max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-4 text-violet-400">
                <Play className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-semibold text-gray-200">Official Trailer Stream</h4>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Trailer direct playback is not embedded in TMDB response for this title. You can watch the official trailer directly on YouTube.
              </p>
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-violet-900/30"
              >
                Watch on YouTube <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
