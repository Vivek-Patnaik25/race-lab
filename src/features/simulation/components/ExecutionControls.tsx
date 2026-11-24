import React from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sliders,
  Gauge,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { SchedulerMode, SimulationStatus } from '../../../engine';

export interface ExecutionControlsProps {
  currentStep: number;
  status: SimulationStatus;
  isPlaying: boolean;
  speed: number;
  schedulerMode: SchedulerMode;
  onStep: () => void;
  onStepBackward: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
  onSetSchedulerMode: (mode: SchedulerMode) => void;
}

export const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  currentStep,
  status,
  isPlaying,
  speed,
  schedulerMode,
  onStep,
  onStepBackward,
  onTogglePlay,
  onReset,
  onSetSpeed,
  onSetSchedulerMode,
}) => {
  const isTerminal = status === 'COMPLETED' || status === 'DEADLOCKED';

  const speeds = [
    { label: '0.5x', value: 0.5 },
    { label: '1x', value: 1 },
    { label: '2x', value: 2 },
  ];

  return (
    <div className="h-16 border-t border-border bg-surface px-6 flex flex-wrap items-center justify-between gap-4 select-none shrink-0 z-10">
      {/* Primary Stepping Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onStepBackward}
          disabled={currentStep === 0}
          aria-label="Step Backward"
          title="Step Backward (Rewind one instruction in history)"
        >
          <SkipBack className="w-3.5 h-3.5" /> Back
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onTogglePlay}
          disabled={isTerminal}
          aria-label={isPlaying ? 'Pause auto-execution' : 'Start auto-execution'}
          title={isPlaying ? 'Pause auto-execution' : 'Start auto-execution'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-white" /> Pause
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" /> Play
            </>
          )}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onStep}
          disabled={isTerminal}
          aria-label="Execute single instruction step"
          title="Execute single instruction step"
        >
          <SkipForward className="w-3.5 h-3.5" /> Step
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          aria-label="Reset simulation to initial state"
          title="Reset simulation to initial state"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </Button>
      </div>

      {/* Speed Selector */}
      <div className="hidden sm:flex items-center gap-2 border-x border-border/60 px-4">
        <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
          <Gauge className="w-3.5 h-3.5 text-accent" />
          <span>Speed:</span>
        </div>
        <div className="flex items-center gap-1 bg-surface-raised p-0.5 rounded border border-border">
          {speeds.map((s) => (
            <button
              key={s.label}
              onClick={() => onSetSpeed(s.value)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                speed === s.value
                  ? 'bg-accent text-white font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scheduler Mode Picker */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
          <Sliders className="w-3.5 h-3.5 text-accent" />
          <span className="hidden md:inline">Scheduler:</span>
          <Link
            to="/app/learn/schedulers"
            title="Learn about OS Schedulers & Interleavings"
            className="text-text-muted hover:text-accent transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {(['MANUAL', 'ROUND_ROBIN', 'SEEDED_RANDOM'] as SchedulerMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onSetSchedulerMode(mode)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                schedulerMode === mode
                  ? 'bg-accent/20 border-accent text-accent font-semibold'
                  : 'bg-surface-raised border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {mode === 'SEEDED_RANDOM' ? 'RANDOM' : mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
