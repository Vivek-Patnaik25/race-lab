import React from 'react';
import {
  Trophy,
  CheckCircle,
  Zap,
  RotateCcw,
  Shield,
  Sliders,
  Lock,
  Award,
  Flame,
  Clock,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useGameStore } from '../../store/game-store';

export const AchievementsPage: React.FC = () => {
  const { achievements, xp } = useGameStore();

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPercent = Math.round((unlockedCount / achievements.length) * 100);

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'zap':
        return <Zap className="w-5 h-5" />;
      case 'rotate-ccw':
        return <RotateCcw className="w-5 h-5" />;
      case 'shield':
        return <Shield className="w-5 h-5" />;
      case 'sliders':
        return <Sliders className="w-5 h-5" />;
      case 'lock':
        return <Lock className="w-5 h-5" />;
      case 'trophy':
        return <Trophy className="w-5 h-5" />;
      case 'award':
        return <Award className="w-5 h-5" />;
      case 'flame':
        return <Flame className="w-5 h-5" />;
      default:
        return <Trophy className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Achievements
            </h1>
          </div>
          <p className="text-sm text-text-secondary">
            Milestones and badges earned by mastering thread interleavings and debugging complex
            concurrency bugs.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised border border-border">
          <span className="text-xs text-text-muted">Total score:</span>
          <span className="font-mono font-semibold text-sm text-amber-400 tabular-nums">
            {xp} XP
          </span>
        </div>
      </div>

      {/* Progress Bar Banner */}
      <div className="p-4 rounded-xl bg-surface-raised/40 border border-border space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-text-muted">
            Progress: <strong className="text-text-primary">{unlockedCount}</strong> of{' '}
            <strong>{achievements.length}</strong> unlocked
          </span>
          <span className="text-amber-400 font-semibold tabular-nums">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface border border-border overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-[width] duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((ach) => (
          <Card
            key={ach.id}
            className={`flex items-start gap-4 transition-colors duration-150 ${
              ach.unlocked ? 'border-border/90 bg-surface-raised' : 'opacity-60 bg-surface/30'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border ${
                ach.unlocked
                  ? 'bg-surface border-border text-amber-400'
                  : 'bg-surface-raised border-border text-text-muted'
              }`}
            >
              {getAchievementIcon(ach.icon)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm text-text-primary truncate">{ach.title}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-mono text-amber-400 font-medium bg-surface px-1.5 py-0.5 rounded border border-border">
                    +{ach.xpReward} XP
                  </span>
                  {ach.unlocked ? (
                    <Badge variant="warning" className="text-[10px]">
                      <CheckCircle className="w-3 h-3 inline mr-1" /> Unlocked
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-[10px]">
                      Locked
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">{ach.description}</p>

              {ach.unlocked && ach.unlockedAt && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted mt-2">
                  <Clock className="w-3 h-3 text-text-muted/60" />
                  <span>Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
