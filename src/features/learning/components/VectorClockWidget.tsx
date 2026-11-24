import React, { useState } from 'react';
import { Plus, Minus, GitMerge, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { createVectorClock, isLessThanOrEqual, mergeClocks } from '../../../engine';

export const VectorClockWidget: React.FC = () => {
  const [clock1, setClock1] = useState<{ A: number; B: number }>({ A: 1, B: 0 });
  const [clock2, setClock2] = useState<{ A: number; B: number }>({ A: 0, B: 1 });
  const [merged, setMerged] = useState<{ A: number; B: number } | null>(null);

  const v1 = createVectorClock({ 'Thread A': clock1.A, 'Thread B': clock1.B });
  const v2 = createVectorClock({ 'Thread A': clock2.A, 'Thread B': clock2.B });

  const le12 = isLessThanOrEqual(v1, v2);
  const le21 = isLessThanOrEqual(v2, v1);
  const areEqual = le12 && le21;
  const areConcurrent = !le12 && !le21;

  const handleMerge = () => {
    const res = mergeClocks(v1, v2);
    setMerged({
      A: res.values['Thread A'] || 0,
      B: res.values['Thread B'] || 0,
    });
  };

  const applyPreset = (preset: 'causal' | 'concurrent' | 'identical') => {
    setMerged(null);
    if (preset === 'causal') {
      setClock1({ A: 1, B: 0 });
      setClock2({ A: 2, B: 1 });
    } else if (preset === 'concurrent') {
      setClock1({ A: 2, B: 0 });
      setClock2({ A: 0, B: 2 });
    } else {
      setClock1({ A: 1, B: 1 });
      setClock2({ A: 1, B: 1 });
    }
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-surface space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            Interactive Vector Clock Comparator
          </h3>
          <p className="text-xs text-text-muted mt-0.5 font-sans">
            Adjust logical timestamps across Thread A and Thread B to see happens-before evaluation.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => applyPreset('causal')}
            className="text-[11px] h-7"
          >
            Preset: Causal
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => applyPreset('concurrent')}
            className="text-[11px] h-7"
          >
            Preset: Concurrent
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => applyPreset('identical')}
            className="text-[11px] h-7"
          >
            Preset: Identical
          </Button>
        </div>
      </div>

      {/* Clocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clock 1 */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
            <span className="font-bold text-blue-400">Vector Clock V₁ (Event 1)</span>
            <span className="text-accent font-semibold">
              [{clock1.A}, {clock1.B}]
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Thread A */}
            <div className="flex items-center justify-between bg-surface/80 p-2 rounded border border-border/40">
              <span className="text-text-secondary font-medium">Thread A:</span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-6 h-6 rounded"
                  onClick={() => {
                    setClock1((c) => ({ ...c, A: Math.max(0, c.A - 1) }));
                    setMerged(null);
                  }}
                  disabled={clock1.A <= 0}
                  aria-label="Decrement V1 Thread A"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-6 text-center font-bold text-text-primary">{clock1.A}</span>
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-6 h-6 rounded"
                  onClick={() => {
                    setClock1((c) => ({ ...c, A: Math.min(10, c.A + 1) }));
                    setMerged(null);
                  }}
                  disabled={clock1.A >= 10}
                  aria-label="Increment V1 Thread A"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Thread B */}
            <div className="flex items-center justify-between bg-surface/80 p-2 rounded border border-border/40">
              <span className="text-text-secondary font-medium">Thread B:</span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-6 h-6 rounded"
                  onClick={() => {
                    setClock1((c) => ({ ...c, B: Math.max(0, c.B - 1) }));
                    setMerged(null);
                  }}
                  disabled={clock1.B <= 0}
                  aria-label="Decrement V1 Thread B"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-6 text-center font-bold text-text-primary">{clock1.B}</span>
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-6 h-6 rounded"
                  onClick={() => {
                    setClock1((c) => ({ ...c, B: Math.min(10, c.B + 1) }));
                    setMerged(null);
                  }}
                  disabled={clock1.B >= 10}
                  aria-label="Increment V1 Thread B"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Clock 2 */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
            <span className="font-bold text-purple-400">Vector Clock V₂ (Event 2)</span>
            <span className="text-accent font-semibold">
              [{clock2.A}, {clock2.B}]
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Thread A */}
            <div className="flex items-center justify-between bg-surface/80 p-2 rounded border border-border/40">
              <span className="text-text-secondary font-medium">Thread A:</span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-6 h-6 rounded"
                  onClick={() => {
                    setClock2((c) => ({ ...c, A: Math.max(0, c.A - 1) }));
                    setMerged(null);
                  }}
                  disabled={clock2.A <= 0}
                  aria-label="Decrement V2 Thread A"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-6 text-center font-bold text-text-primary">{clock2.A}</span>
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-6 h-6 rounded"
                  onClick={() => {
                    setClock2((c) => ({ ...c, A: Math.min(10, c.A + 1) }));
                    setMerged(null);
                  }}
                  disabled={clock2.A >= 10}
                  aria-label="Increment V2 Thread A"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Thread B */}
            <div className="flex items-center justify-between bg-surface/80 p-2 rounded border border-border/40">
              <span className="text-text-secondary font-medium">Thread B:</span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-6 h-6 rounded"
                  onClick={() => {
                    setClock2((c) => ({ ...c, B: Math.max(0, c.B - 1) }));
                    setMerged(null);
                  }}
                  disabled={clock2.B <= 0}
                  aria-label="Decrement V2 Thread B"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-6 text-center font-bold text-text-primary">{clock2.B}</span>
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-6 h-6 rounded"
                  onClick={() => {
                    setClock2((c) => ({ ...c, B: Math.min(10, c.B + 1) }));
                    setMerged(null);
                  }}
                  disabled={clock2.B >= 10}
                  aria-label="Increment V2 Thread B"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Relation Result Box */}
      <div
        className={`p-3.5 rounded-lg border text-xs space-y-1.5 transition-colors ${
          areConcurrent
            ? 'border-rose-800/80 bg-rose-950/30 text-rose-300'
            : areEqual
              ? 'border-blue-800/80 bg-blue-950/30 text-blue-300'
              : 'border-emerald-800/80 bg-emerald-950/30 text-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between font-bold">
          <div className="flex items-center gap-2 text-sm">
            {areConcurrent ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Concurrent: V₁ ∥ V₂ (No Happens-Before Ordering)</span>
              </>
            ) : areEqual ? (
              <>
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Identical Clocks: V₁ = V₂</span>
              </>
            ) : le12 ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Happens-Before: V₁ &lt; V₂ (Event 1 preceded Event 2)</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Happens-Before: V₂ &lt; V₁ (Event 2 preceded Event 1)</span>
              </>
            )}
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleMerge}
            className="text-xs h-7 gap-1.5 bg-surface"
          >
            <GitMerge className="w-3 h-3 text-accent" />
            Merge max(V₁, V₂)
          </Button>
        </div>

        <p className="text-[11px] leading-relaxed text-text-secondary font-sans">
          {areConcurrent
            ? 'Neither V₁ ≤ V₂ nor V₂ ≤ V₁. If these two events access the same shared variable and at least one is a write, a DATA RACE is guaranteed.'
            : areEqual
              ? 'Both logical clock vectors have identical components across all threads.'
              : le12
                ? 'Because every component of V₁ is less than or equal to V₂ and at least one is strictly less, Event 1 happened-before Event 2 (V₁ <_HB V₂).'
                : 'Because every component of V₂ is less than or equal to V₁ and at least one is strictly less, Event 2 happened-before Event 1 (V₂ <_HB V₁).'}
        </p>

        {merged && (
          <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs font-mono text-accent">
            <span>Merged Clock V_merged = max(V₁, V₂):</span>
            <span className="font-bold bg-background px-2 py-0.5 rounded border border-border">
              [Thread A: {merged.A}, Thread B: {merged.B}]
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
