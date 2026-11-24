import React, { useEffect } from 'react';
import { Trophy, X, Zap } from 'lucide-react';
import { useGameStore } from '../../store/game-store';

export const AchievementToast: React.FC = () => {
  const { recentAchievement, clearRecentAchievement } = useGameStore();

  useEffect(() => {
    if (!recentAchievement) return;

    const timer = setTimeout(() => {
      clearRecentAchievement();
    }, 4500);

    return () => clearTimeout(timer);
  }, [recentAchievement, clearRecentAchievement]);

  if (!recentAchievement) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-xl bg-surface border border-amber-500/40 shadow-2xl shadow-black/80 animate-in slide-in-from-bottom-5 duration-300 max-w-sm"
    >
      <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
        <Trophy className="w-5 h-5" />
      </div>

      <div className="flex-1 pr-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-amber-400">
          <Zap className="w-3 h-3" /> Achievement unlocked
        </div>
        <div className="font-bold text-sm text-text-primary leading-tight mt-0.5">
          {recentAchievement.title}
        </div>
        <div className="text-xs text-text-muted mt-0.5 leading-snug">
          {recentAchievement.description}
        </div>
      </div>

      <button
        onClick={clearRecentAchievement}
        aria-label="Dismiss achievement banner"
        className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
