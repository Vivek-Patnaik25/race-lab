import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Skull, Lightbulb, CheckCircle2, Keyboard } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CHALLENGES, type ChallengeDefinition } from '../../data/challenges';
import { calculateScore, type ScoreResult } from '../../engine';
import { useSimulationStore } from '../../store/simulation-store';
import { useGameStore } from '../../store/game-store';
import { useLabStore } from '../../store/lab-store';
import { useUIStore } from '../../store/ui-store';
import { ThreadExplorer } from './components/ThreadExplorer';
import { ExecutionTimeline } from './components/ExecutionTimeline';
import { MemoryInspector } from './components/MemoryInspector';
import { ExecutionControls } from './components/ExecutionControls';
import { HintDrawer } from './components/HintDrawer';
import { MissionCompletionModal } from './components/MissionCompletionModal';

export const SimulationStudioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const labStore = useLabStore();

  const isCustomLab = id === 'custom-lab';
  const currentIdx = CHALLENGES.findIndex((c) => c.id === id);
  const challenge: ChallengeDefinition = isCustomLab
    ? {
        id: 'custom-lab',
        missionNumber: 'LAB',
        title: labStore.title || 'Custom Lab Scenario',
        tier: 'Intermediate',
        estimatedDuration: 'Sandbox',
        concept: 'Custom Interleaving',
        shortDescription: 'Custom scenario constructed in the Simulation Lab.',
        objective:
          'Observe concurrent scheduling, memory mutations, and synchronization in your sandbox.',
        threadCount: labStore.threads.length,
        optimalSteps: 0,
        initialSharedMemory: labStore.sharedMemory,
        initialThreads: labStore.getExecutableState().threads,
        initialMutexes: labStore.getExecutableState().mutexes,
        hints: [],
        explanation:
          'In custom scenarios, observing interleavings helps discover concurrency race conditions and test mutual exclusion guards before running in production.',
        evaluateSuccess: (s) => ({
          isSuccess: true,
          reason: `Custom scenario evaluated successfully! Executed ${s.currentStep} steps across ${s.threads.length} threads with ${s.activeRaces.length} data races detected.`,
        }),
      }
    : currentIdx >= 0
      ? CHALLENGES[currentIdx]
      : CHALLENGES[0];

  const nextChallenge =
    !isCustomLab && currentIdx >= 0 && currentIdx < CHALLENGES.length - 1
      ? CHALLENGES[currentIdx + 1]
      : null;

  const {
    state,
    events,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    schedulerMode,
    setSchedulerMode,
    selectedThreadId,
    setSelectedThreadId,
    loadScenario,
    step,
    stepThread,
    stepBackward,
    seekToStep,
    resetSimulation,
    activeChallengeId,
    setActiveChallengeId,
  } = useSimulationStore();

  const { recordChallengeResult, unlockedHintIds } = useGameStore();
  const { openShortcuts } = useUIStore();

  const [isHintDrawerOpen, setIsHintDrawerOpen] = useState(false);
  const [completionModalState, setCompletionModalState] = useState<{
    isOpen: boolean;
    isSuccess: boolean;
    reason: string;
    scoreResult: ScoreResult | null;
  }>({
    isOpen: false,
    isSuccess: false,
    reason: '',
    scoreResult: null,
  });

  // Calculate unlocked hints for this specific mission
  const hintsUsedCount = challenge.hints.filter((h) => unlockedHintIds.includes(h.id)).length;

  // Load mission scenario on mount or when route changes
  useEffect(() => {
    if (activeChallengeId !== challenge.id || state.threads.length === 0) {
      loadScenario(
        challenge.initialThreads,
        challenge.initialSharedMemory,
        challenge.initialMutexes || []
      );
      setActiveChallengeId(challenge.id);
    }
  }, [challenge.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-play timer adjusted by speed multiplier
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying && state.status !== 'COMPLETED' && state.status !== 'DEADLOCKED') {
      const delayMs = Math.round(700 / speed);
      interval = setInterval(() => {
        const stepped = step();
        if (!stepped) {
          setIsPlaying(false);
        }
      }, delayMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, state.status, speed, step, setIsPlaying]);

  // Keyboard navigation & execution shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        step(selectedThreadId || undefined);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepBackward();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetSimulation();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setIsHintDrawerOpen((prev) => !prev);
      } else if (e.key === '?') {
        e.preventDefault();
        openShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPlaying,
    selectedThreadId,
    step,
    stepBackward,
    resetSimulation,
    setIsPlaying,
    openShortcuts,
  ]);

  const handleStepForward = () => {
    step(selectedThreadId || undefined);
  };

  const handleVerifyObjective = () => {
    const evaluation = challenge.evaluateSuccess(state, events);

    if (evaluation.isSuccess) {
      const score = calculateScore({
        optimalSteps: challenge.optimalSteps,
        actualSteps: state.currentStep,
        hintsUsed: hintsUsedCount,
      });

      recordChallengeResult(challenge.id, {
        score: score.totalScore,
        stars: score.stars,
        actualSteps: state.currentStep,
        optimalSteps: challenge.optimalSteps,
        hintsUsed: hintsUsedCount,
      });

      setCompletionModalState({
        isOpen: true,
        isSuccess: true,
        reason: evaluation.reason,
        scoreResult: score,
      });
    } else {
      setCompletionModalState({
        isOpen: true,
        isSuccess: false,
        reason: evaluation.reason,
        scoreResult: null,
      });
    }
  };

  const handleRetryScenario = () => {
    setCompletionModalState((prev) => ({ ...prev, isOpen: false }));
    resetSimulation();
  };

  const handleNextMission = () => {
    if (nextChallenge) {
      setCompletionModalState((prev) => ({ ...prev, isOpen: false }));
      navigate(`/app/simulate/${nextChallenge.id}`);
    } else {
      navigate('/app/challenges');
    }
  };

  const getStatusBadge = () => {
    switch (state.status) {
      case 'DEADLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800 font-semibold uppercase">
            <Skull className="w-3.5 h-3.5" /> DEADLOCKED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800 font-semibold uppercase">
            <CheckCircle className="w-3.5 h-3.5" /> COMPLETED
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-semibold uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> RUNNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-raised text-text-secondary border border-border font-semibold uppercase">
            STEP READY
          </span>
        );
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background select-none overflow-hidden">
      {/* Studio Header */}
      <div className="h-12 border-b border-border bg-surface px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/app/challenges"
            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-surface-raised"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="accent">Mission {challenge.missionNumber}</Badge>
            <span className="font-bold text-sm text-text-primary">{challenge.title}</span>
          </div>
        </div>

        {/* Central Objective Goal Banner */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-text-muted bg-surface-raised/60 px-3 py-1 rounded border border-border/60 max-w-lg truncate">
          <span className="text-amber-400 font-semibold shrink-0">Goal:</span>
          <span className="truncate">{challenge.objective}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Keyboard Shortcuts Guide Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={openShortcuts}
            className="text-xs h-7 px-2 text-text-muted hover:text-text-primary hidden sm:flex"
            title="View keyboard shortcuts (?)"
            aria-label="View keyboard shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5 text-accent" />
            <span className="hidden md:inline">Keys</span>
            <kbd className="hidden lg:inline text-[10px] font-mono px-1 rounded bg-background border border-border">
              ?
            </kbd>
          </Button>

          {/* Hints Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsHintDrawerOpen(true)}
            className="text-xs h-7 px-2.5"
            title="Open mission hints and intel"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Hints</span>
            {hintsUsedCount > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-1 rounded border border-amber-500/30">
                {hintsUsedCount}/{challenge.hints.length}
              </span>
            )}
          </Button>

          {/* Verify Objective Action Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleVerifyObjective}
            className="text-xs h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            title="Evaluate simulation against mission success conditions"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verify Objective</span>
          </Button>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-text-muted">Status:</span>
            {getStatusBadge()}
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
            <span>Step:</span>
            <span className="text-text-primary font-bold">{state.currentStep}</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* Column 1: Thread Explorer (3 cols) */}
        <div className="col-span-12 md:col-span-3 h-full overflow-hidden">
          <ThreadExplorer
            threads={state.threads}
            mutexes={state.mutexes}
            selectedThreadId={selectedThreadId}
            schedulerMode={schedulerMode}
            onSelectThread={(tid) => setSelectedThreadId(tid)}
            onStepThread={(tid) => stepThread(tid)}
          />
        </div>

        {/* Column 2: Execution Timeline & Interleaving Lane (6 cols) */}
        <div className="col-span-12 md:col-span-6 h-full overflow-hidden">
          <ExecutionTimeline
            threads={state.threads}
            currentStep={state.currentStep}
            events={events}
            activeRaces={state.activeRaces}
            onSeekStep={(stepNum) => seekToStep(stepNum)}
          />
        </div>

        {/* Column 3: Memory Inspector & Race Reports (3 cols) */}
        <div className="col-span-12 md:col-span-3 h-full overflow-hidden">
          <MemoryInspector
            sharedMemory={state.sharedMemory}
            mutexes={state.mutexes}
            activeRaces={state.activeRaces}
            activeDeadlock={state.activeDeadlock}
          />
        </div>
      </div>

      {/* Bottom: Studio Execution Controls */}
      <ExecutionControls
        currentStep={state.currentStep}
        status={state.status}
        isPlaying={isPlaying}
        speed={speed}
        schedulerMode={schedulerMode}
        onStep={handleStepForward}
        onStepBackward={stepBackward}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onReset={resetSimulation}
        onSetSpeed={setSpeed}
        onSetSchedulerMode={setSchedulerMode}
      />

      {/* Slide-over Hint Drawer */}
      <HintDrawer
        hints={challenge.hints}
        isOpen={isHintDrawerOpen}
        onClose={() => setIsHintDrawerOpen(false)}
      />

      {/* Mission Accomplished / Incomplete Modal */}
      <MissionCompletionModal
        isOpen={completionModalState.isOpen}
        isSuccess={completionModalState.isSuccess}
        reason={completionModalState.reason}
        scoreResult={completionModalState.scoreResult}
        challenge={challenge}
        onNextMission={nextChallenge ? handleNextMission : undefined}
        onRetry={handleRetryScenario}
        onClose={() => setCompletionModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
