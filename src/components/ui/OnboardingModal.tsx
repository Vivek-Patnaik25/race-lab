import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Cpu,
  Layers,
  Award,
  FlaskConical,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
} from 'lucide-react';
import { useUIStore } from '../../store/ui-store';

interface OnboardingSlide {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  content: string;
  keyFeatures: string[];
}

export const ONBOARDING_COMPLETED_KEY = 'racelab_onboarding_completed';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, closeOnboarding } = useUIStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const slides: OnboardingSlide[] = [
    {
      title: 'Welcome to RaceLab',
      subtitle: 'The Deterministic Concurrency Laboratory',
      badge: 'Getting Started',
      icon: <Cpu className="w-8 h-8 text-accent" />,
      content:
        'RaceLab is an interactive, client-side engineering workbench built to master multi-threaded programming, race conditions, vector clocks, and mutual exclusion without black-box unpredictability.',
      keyFeatures: [
        '100% deterministic execution — reproducible thread interleavings',
        'Mathematical vector clocks tracking Lamport happens-before relationships',
        'Zero external backends or AI inference — runs entirely offline in your browser',
      ],
    },
    {
      title: 'Simulation Studio',
      subtitle: 'Micro-step Execution & Conflict Detection',
      badge: 'Visual Engine',
      icon: <Layers className="w-8 h-8 text-blue-400" />,
      content:
        'Step forward instruction by instruction, observe per-thread program counters, inspect shared and thread-local registers, and rewind time with lossless execution snapshots.',
      keyFeatures: [
        'Real-time happens-before data race detector (Read/Write & Write/Write)',
        'Cycle-detecting wait-for graph for immediate deadlock alerts',
        'Interactive timeline with event seek and Lamport clock diffs',
      ],
    },
    {
      title: 'Challenge Missions',
      subtitle: 'Debug & Fix Real Concurrency Pitfalls',
      badge: 'Gamified Missions',
      icon: <Award className="w-8 h-8 text-amber-400" />,
      content:
        'Tackle structured engineering challenges from beginner to expert tier. Identify race conditions, insert synchronization guards, and earn stars, XP, and badges.',
      keyFeatures: [
        'Curated scenarios: Lost Update, Bank Deadlock, Producer-Consumer, and more',
        'Tiered intel hints that guide you without spoiling the solution',
        'Step efficiency scoring benchmarked against optimal solutions',
      ],
    },
    {
      title: 'Simulation Lab',
      subtitle: 'Craft & Analyze Custom Thread Scenarios',
      badge: 'Custom Sandbox',
      icon: <FlaskConical className="w-8 h-8 text-emerald-400" />,
      content:
        'Create your own multi-threaded scenarios from scratch. Define shared variables, spin up threads, sequence mutex locks/unlocks, and observe race behavior under different schedulers.',
      keyFeatures: [
        'Real-time syntax and semantic validation with instant error feedback',
        'Round-robin, manual, and preemptive thread scheduling modes',
        'One-click scenario launching directly into the Simulation Studio',
      ],
    },
    {
      title: 'Learning Centre',
      subtitle: 'Deep Theoretical Foundations & Sandboxes',
      badge: 'Masterclass',
      icon: <BookOpen className="w-8 h-8 text-purple-400" />,
      content:
        'Explore 7 in-depth masterclasses covering Amdahl’s Law, Peterson’s Algorithm, Lamport clocks, ABA problems, and memory models with embedded, interactive mini-simulators.',
      keyFeatures: [
        'Interactive mathematical calculators and visual interleaving diagrams',
        'Comprehensive breakdown of lock contention and synchronization overhead',
        'Searchable knowledge base across all concurrency concepts',
      ],
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOnboardingOpen) return;
      if (e.key === 'Escape') {
        handleDismiss();
      } else if (e.key === 'ArrowRight') {
        if (currentSlide < slides.length - 1) {
          setCurrentSlide((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentSlide > 0) {
          setCurrentSlide((prev) => prev - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOnboardingOpen, currentSlide, slides.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOnboardingOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      } catch {
        // ignore localStorage errors
      }
    }
    closeOnboarding();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const slide = slides[currentSlide];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with slide progress indicators */}
        <div className="px-6 py-4 border-b border-border bg-surface-raised/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-accent">
              RaceLab Orientation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-muted">
              {currentSlide + 1} of {slides.length}
            </span>
            <button
              onClick={handleDismiss}
              aria-label="Skip and close onboarding tour"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress dots bar */}
        <div className="grid grid-cols-5 gap-1.5 px-6 pt-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Jump to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                idx === currentSlide
                  ? 'bg-accent shadow-sm shadow-accent/50'
                  : idx < currentSlide
                    ? 'bg-accent/40'
                    : 'bg-surface-raised'
              }`}
            />
          ))}
        </div>

        {/* Slide Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0 shadow-inner">
              {slide.icon}
            </div>
            <div>
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide bg-accent/15 text-accent border border-accent/30 mb-1.5">
                {slide.badge}
              </div>
              <h2
                id="onboarding-modal-title"
                className="text-xl md:text-2xl font-bold tracking-tight text-text-primary"
              >
                {slide.title}
              </h2>
              <p className="text-xs md:text-sm text-text-secondary mt-0.5">{slide.subtitle}</p>
            </div>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed bg-surface-raised/40 p-4 rounded-xl border border-border/60">
            {slide.content}
          </p>

          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-text-muted font-semibold">
              Key Capabilities
            </div>
            <div className="space-y-2">
              {slide.keyFeatures.map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-text-primary">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 border-t border-border bg-surface-raised/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-text-muted hover:text-text-secondary">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-surface border border-border text-accent focus:ring-accent"
            />
            <span>Don't show tour on startup</span>
          </label>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {currentSlide > 0 && (
              <button
                onClick={handleBack}
                className="px-3.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-accent/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {currentSlide === slides.length - 1 ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Start Exploring
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
