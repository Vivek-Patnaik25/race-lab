import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, FileText, CheckCircle2, Star, Trophy } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CHALLENGES } from '../../data/challenges';
import { useGameStore } from '../../store/game-store';

export const ChallengesPage: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const { challenges: progressMap, xp, completedMissionsCount } = useGameStore();

  const tiers = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredChallenges =
    selectedTier === 'All'
      ? CHALLENGES
      : CHALLENGES.filter((c) => c.tier.toLowerCase() === selectedTier.toLowerCase());

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            Missions Catalogue
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Progressive debugging challenges. Reproduce race conditions, resolve deadlocks, and
            inspect concurrent memory.
          </p>
        </div>

        {/* Global Progress Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-xs font-mono">
            <span className="text-text-muted">Completed:</span>
            <span className="font-semibold text-emerald-400 tabular-nums">
              {completedMissionsCount}/{CHALLENGES.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-xs font-mono">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-amber-400 tabular-nums">{xp} XP</span>
          </div>
        </div>
      </div>

      {/* Tier filter tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-md border border-border">
          {tiers.map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                selectedTier === tier
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges Roster */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredChallenges.map((challenge) => {
          const progress = progressMap[challenge.id];
          const isDone = Boolean(progress?.completed);

          return (
            <Card
              key={challenge.id}
              className={`flex flex-col justify-between transition-colors ${
                isDone ? 'border-emerald-900/60 bg-surface' : 'hover:border-border-subtle'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">Mission {challenge.missionNumber}</Badge>
                    <Badge variant="default">{challenge.tier}</Badge>
                    {isDone && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-text-muted">
                    {challenge.estimatedDuration}
                  </span>
                </div>

                <h2 className="text-base font-semibold text-text-primary mb-1.5">
                  {challenge.title}
                </h2>
                <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                  {challenge.shortDescription}
                </p>

                <div className="text-xs font-mono text-text-muted bg-background/60 p-2.5 rounded border border-border">
                  <span className="text-text-secondary font-medium">Goal:</span>{' '}
                  {challenge.objective}
                </div>

                {isDone && progress && (
                  <div className="mt-3 p-2 bg-emerald-950/20 border border-emerald-900/40 rounded flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3.5 h-3.5 ${
                            starIdx <= progress.stars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-text-muted/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-emerald-400 font-bold">
                      Best: {progress.bestScore} pts
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs font-mono text-accent flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-text-muted" />
                  {challenge.concept}
                </span>

                <div className="flex items-center gap-2">
                  <Link to={`/app/challenges/${challenge.id}`}>
                    <Button variant="ghost" size="sm">
                      <FileText className="w-3.5 h-3.5" /> Details
                    </Button>
                  </Link>
                  <Link to={`/app/simulate/${challenge.id}`}>
                    <Button variant={isDone ? 'secondary' : 'primary'} size="sm">
                      <Play className="w-3.5 h-3.5 fill-current" /> {isDone ? 'Replay' : 'Simulate'}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
