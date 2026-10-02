import React, { useState } from 'react';
import { X, Key, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface TmdbKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
  onKeyUpdated: () => void;
}

export const TmdbKeyModal: React.FC<TmdbKeyModalProps> = ({
  isOpen,
  onClose,
  isConfigured,
  onKeyUpdated
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.updateTmdbKey(apiKey.trim());
      setMessage(res.message || 'TMDB API Key configured successfully!');
      setApiKey('');
      onKeyUpdated();
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="TMDB API Configuration"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#121525] border border-violet-500/30 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">TMDB API Connection</h3>
            <p className="text-xs text-gray-400">Connect your TMDB Key for live streaming data</p>
          </div>
        </div>

        <div className="mb-5 p-3 rounded-xl bg-[#191D30] border border-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-300 font-medium">Current Status:</span>
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> TMDB Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" /> Offline Catalog Mode
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Enter TMDB API Key (v3)
            </label>
            <input
              type="password"
              placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#191D30] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Key is proxied securely by CineNOVA backend
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
              {message}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !apiKey.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/30"
            >
              {isSubmitting ? 'Saving...' : 'Save & Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
