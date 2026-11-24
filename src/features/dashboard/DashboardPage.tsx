import React from 'react';
import { Link } from 'react-router-dom';
import { Play, FlaskConical, Trophy, CheckCircle2, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CHALLENGES } from '../../data/challenges';
import { useGameStore } from '../../store/game-store';

export const DashboardPage: React.FC = () => {
  const { xp, completedMissionsCount, achievements, challenges: progressMap } = useGameStore();
  const nextChallenge = CHALLENGES.find((c) => !progressMap[c.id]?.completed) || CHALLENGES[0];
  const nextProgress = progressMap[nextChallenge.id];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Engineering Console
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Break concurrency bugs. Investigate memory states, scheduling anomalies, and
            synchronization primitives.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/app/simulate/${nextChallenge.id}`}>
            <Button variant="primary">
              <Play className="w-4 h-4 fill-white" /> Continue Mission
            </Button>
          </Link>
          <Link to="/app/lab">
            <Button variant="secondary">
              <FlaskConical className="w-4 h-4 text-accent" /> Custom Lab
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid: Recommended Mission & Quick Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Challenge Card (Col span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Recommended Next Challenge</span>
          </div>

          <Card className="border-accent/40 bg-gradient-to-br from-surface to-surface-raised relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="accent">Mission {nextChallenge.missionNumber}</Badge>
                  <Badge variant="default">{nextChallenge.tier}</Badge>
                  <span className="text-xs font-mono text-text-muted">
                    {nextChallenge.estimatedDuration}
                  </span>
                  {nextProgress?.completed && (
                    <Badge variant="success" className="text-[10px]">
                      COMPLETED
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">{nextChallenge.title}</h2>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {nextChallenge.shortDescription}
                </p>
                <div className="text-xs font-mono text-text-muted bg-background/60 p-2.5 rounded border border-border">
                  <strong className="text-text-secondary">Objective:</strong>{' '}
                  {nextChallenge.objective}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs font-mono text-text-muted">
                Target Concept: <span className="text-accent">{nextChallenge.concept}</span>
              </span>
              <div className="flex items-center gap-2">
                <Link to={`/app/challenges/${nextChallenge.id}`}>
                  <Button variant="ghost" size="sm">
                    Briefing
                  </Button>
                </Link>
                <Link to={`/app/simulate/${nextChallenge.id}`}>
                  <Button variant="primary" size="sm">
                    Enter Studio <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress & Overview (Col span 1) */}
        <div className="space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Progression Overview</span>
          </div>

          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-sm text-text-secondary">Total Experience</span>
              <span className="font-mono font-bold text-amber-400">{xp} XP</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-sm text-text-secondary">Completed Missions</span>
              <span className="font-mono font-bold text-text-primary">
                {completedMissionsCount} / {CHALLENGES.length}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-text-muted mb-2 font-mono">
                <span>Recent Achievement</span>
                <Link to="/app/achievements" className="text-accent hover:underline">
                  View All
                </Link>
              </div>
              {achievements.filter((a) => a.unlocked).length > 0 ? (
                achievements
                  .filter((a) => a.unlocked)
                  .slice(0, 1)
                  .map((ach) => (
                    <div
                      key={ach.id}
                      className="p-2.5 rounded bg-surface-raised border border-border flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded bg-amber-950/40 border border-amber-700/50 flex items-center justify-center text-amber-400">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-text-primary">{ach.title}</div>
                        <div className="text-[11px] text-text-muted">{ach.description}</div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-2.5 rounded bg-surface-raised/40 border border-border/60 text-xs font-mono text-text-muted">
                  No achievements unlocked yet. Step into a mission to earn badges!
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Available Missions Quick Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-text-secondary" />
            <span>Missions Roster</span>
          </div>
          <Link to="/app/challenges" className="text-xs text-accent hover:underline font-mono">
            Full Catalogue →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHALLENGES.slice(0, 3).map((mission) => {
            const isDone = Boolean(progressMap[mission.id]?.completed);

            return (
              <Card key={mission.id} hoverable className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default">Mission {mission.missionNumber}</Badge>
                    <span className="text-[11px] font-mono text-text-muted">
                      {mission.estimatedDuration}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-text-primary mb-1">{mission.title}</h3>
                  <p className="text-xs text-text-secondary line-clamp-2">
                    {mission.shortDescription}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-accent">{mission.concept}</span>
                  <Link to={`/app/simulate/${mission.id}`}>
                    <Button variant={isDone ? 'secondary' : 'ghost'} size="sm">
                      {isDone ? 'Replay' : 'Launch →'}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Lab Mode & Quick Actions */}
      <div className="pt-2">
        <Card className="bg-surface-raised/40 border-dashed border-border flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">Open-Ended Simulation Lab</h3>
              <p className="text-xs text-text-secondary">
                Configure custom thread instructions, inspect memory mutations, and design custom
                race experiments.
              </p>
            </div>
          </div>
          <Link to="/app/lab">
            <Button variant="secondary" size="sm">
              Launch Builder
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};
