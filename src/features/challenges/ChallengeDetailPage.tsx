import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  ShieldAlert,
  Award,
  Terminal,
  Star,
  CheckCircle2,
  Lightbulb,
  Lock,
  Unlock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CHALLENGES } from '../../data/challenges';
import { useGameStore } from '../../store/game-store';

export const ChallengeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { challenges, isHintUnlocked, unlockHint } = useGameStore();

  const challenge = CHALLENGES.find((c) => c.id === id) || CHALLENGES[0];
  const progress = challenges[challenge.id];
  const isCompleted = Boolean(progress?.completed);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to missions
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="accent">Mission {challenge.missionNumber}</Badge>
            <Badge variant="default">{challenge.tier}</Badge>
            <span className="text-xs font-mono text-text-muted">{challenge.estimatedDuration}</span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> COMPLETED
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{challenge.title}</h1>
        </div>

        <Link to={`/app/simulate/${challenge.id}`}>
          <Button variant="primary" size="md">
            <Play className="w-4 h-4 fill-white" /> Launch Studio
          </Button>
        </Link>
      </div>

      {/* Overview & Objective */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="space-y-4">
            <h2 className="text-sm font-medium text-text-secondary">Mission briefing</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {challenge.shortDescription}
            </p>

            <div className="p-3 bg-surface-raised rounded border border-border space-y-2">
              <div className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Primary Objective</span>
              </div>
              <p className="text-xs font-mono text-text-primary">{challenge.objective}</p>
            </div>
          </Card>

          {/* Expected Threads */}
          <Card className="space-y-3">
            <h2 className="text-sm font-medium text-text-secondary">Scenario threads</h2>
            <div className="text-xs font-mono text-text-muted mb-2">
              This scenario initializes {challenge.threadCount} concurrent threads:
            </div>
            <div className="space-y-2">
              {challenge.initialThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="flex items-center justify-between p-2 rounded bg-surface-raised border border-border text-xs font-mono"
                >
                  <span className="font-semibold text-text-primary">{thread.name}</span>
                  <span className="text-text-muted">{thread.instructions.length} instructions</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Mission Hints Section */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-medium text-text-secondary">Mission hints & intel</h2>
              </div>
              <span className="text-[11px] font-mono text-text-muted">Cost: -150 pts per hint</span>
            </div>

            <div className="space-y-3">
              {challenge.hints.map((hint, idx) => {
                const unlocked = isHintUnlocked(hint.id);
                const prevUnlocked = idx === 0 || isHintUnlocked(challenge.hints[idx - 1].id);

                return (
                  <div
                    key={hint.id}
                    className={`p-3 rounded-lg border text-xs font-mono ${
                      unlocked
                        ? 'bg-surface-raised border-accent/40'
                        : 'bg-surface/50 border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-text-primary">
                        Tier {hint.tier}: {hint.title}
                      </span>
                      {unlocked ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Unlocked
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 text-[11px] px-2"
                          disabled={!prevUnlocked}
                          onClick={() => unlockHint(hint.id)}
                        >
                          <Lock className="w-2.5 h-2.5 mr-1 text-amber-400" />
                          {prevUnlocked ? 'Unlock Hint' : `Locked (Tier ${idx})`}
                        </Button>
                      )}
                    </div>
                    {unlocked && (
                      <p className="text-text-secondary font-sans leading-relaxed pt-1">
                        {hint.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {isCompleted && progress && (
            <Card className="border-border bg-surface-raised space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-emerald-400">Completed</span>
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
              </div>

              <div className="text-xl font-semibold font-mono text-text-primary tabular-nums">
                {progress.bestScore} <span className="text-xs text-text-muted">pts</span>
              </div>
            </Card>
          )}

          <Card className="space-y-3">
            <h3 className="text-xs font-medium text-text-secondary">Parameters</h3>
            <div className="text-xs font-mono space-y-2">
              <div className="flex justify-between border-b border-border/60 pb-1.5 text-text-muted">
                <span>Concept:</span>
                <span className="text-accent">{challenge.concept}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-1.5 text-text-muted">
                <span>Threads:</span>
                <span className="text-text-primary">{challenge.threadCount}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-1.5 text-text-muted">
                <span>Optimal Steps:</span>
                <span className="text-emerald-400">{challenge.optimalSteps}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-1.5 text-text-muted">
                <span>Difficulty:</span>
                <span className="text-text-primary">{challenge.tier}</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Award className="w-4 h-4" />
              <span>Completion Reward</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Earn score XP based on your step efficiency and unlock achievements in your profile.
            </p>
          </Card>

          <Link to={`/app/simulate/${challenge.id}`} className="block">
            <Button variant="primary" className="w-full">
              <Terminal className="w-4 h-4" /> Start Simulation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
