import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Play, Terminal, ShieldCheck, Zap, ArrowRight, Layers, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col selection:bg-accent/30 selection:text-white">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-border bg-surface/60 backdrop-blur px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-text-primary">
            Race<span className="text-accent">Lab</span>
          </span>
          <Badge variant="accent" className="ml-2">
            v0.1.0-alpha
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/app/learn"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors hidden sm:inline"
          >
            Learn
          </Link>
          <Link
            to="/app/challenges"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors hidden sm:inline"
          >
            Challenges
          </Link>
          <Link to="/app">
            <Button variant="primary" size="sm">
              Launch App <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-raised border border-border text-xs font-mono text-text-secondary mb-6">
          <Zap className="w-3.5 h-3.5 text-accent" />
          <span>Deterministic concurrency laboratory & simulation studio</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-text-primary max-w-3xl leading-snug sm:leading-tight">
          Break concurrency. Understand the chaos.{' '}
          <span className="text-accent">Master the system</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed">
          RaceLab is an interactive, local-first workbench to reproduce race conditions, inspect
          shared memory, observe thread scheduling interleavings, and resolve deadlocks.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/app/challenges/mission-01">
            <Button variant="primary" size="lg">
              <Play className="w-4 h-4 fill-white" /> Start Mission 01
            </Button>
          </Link>
          <Link to="/app">
            <Button variant="secondary" size="lg">
              <Terminal className="w-4 h-4 text-accent" /> Open Dashboard
            </Button>
          </Link>
        </div>

        {/* Visual Engine Preview Stub */}
        <div className="mt-14 w-full rounded-xl border border-border bg-surface p-4 shadow-2xl shadow-black/60 text-left font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3 text-text-muted">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-text-secondary font-medium">
                simulation_studio // lost_update_scenario
              </span>
            </div>
            <Badge variant="danger">Race Detected</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-background/80 rounded border border-border p-3 space-y-2">
              <div className="text-blue-400 font-semibold flex items-center justify-between">
                <span>Thread A</span>
                <span className="text-emerald-400 text-[10px]">PC: 2</span>
              </div>
              <div className="text-text-muted">READ counter INTO a</div>
              <div className="text-text-muted">ADD a BY 1</div>
              <div className="text-blue-300 bg-blue-950/40 px-1 py-0.5 rounded border border-blue-800/40">
                WRITE a INTO counter
              </div>
            </div>

            <div className="bg-background/80 rounded border border-border p-3 space-y-2">
              <div className="text-purple-400 font-semibold flex items-center justify-between">
                <span>Thread B</span>
                <span className="text-emerald-400 text-[10px]">PC: 2</span>
              </div>
              <div className="text-text-muted">READ counter INTO b</div>
              <div className="text-text-muted">ADD b BY 1</div>
              <div className="text-purple-300 bg-purple-950/40 px-1 py-0.5 rounded border border-purple-800/40">
                WRITE b INTO counter
              </div>
            </div>

            <div className="bg-background/80 rounded border border-border p-3 space-y-2">
              <div className="text-amber-400 font-semibold">Shared Memory</div>
              <div className="flex justify-between border-b border-border/40 pb-1 text-text-secondary">
                <span>counter</span>
                <span className="text-rose-400 font-bold">1 (Lost Update)</span>
              </div>
              <div className="text-[11px] text-text-muted pt-1">
                Concurrent write conflict detected across un-ordered vector clocks.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-border w-full">
        <div className="text-center text-xs font-mono text-text-muted mb-1">Architecture</div>
        <h2 className="text-center text-xl font-semibold text-text-primary mb-10">
          Engineered with the precision of developer tooling
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col gap-3">
            <div className="w-9 h-9 rounded-md bg-surface-raised border border-border flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">Visual Foundations</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Step through concurrency fundamentals, happens-before mathematical models, vector
              clocks, and mutual exclusion.
            </p>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="w-9 h-9 rounded-md bg-surface-raised border border-border flex items-center justify-center text-accent">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">Challenge Missions</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Complete curated missions. Reproduce insidious race conditions intentionally, apply
              synchronization guards, and fix deadlocks.
            </p>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="w-9 h-9 rounded-md bg-surface-raised border border-border flex items-center justify-center text-amber-400">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">Simulation Lab</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Construct arbitrary thread programs, toggle between Manual, Round Robin, or Seeded
              Random scheduling, and inspect execution history.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-border px-6 text-center text-xs text-text-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>RaceLab — Local-First Concurrency Engineering & Educational Simulator</div>
          <div className="flex items-center gap-4">
            <Link to="/app" className="hover:text-text-secondary">
              App
            </Link>
            <Link to="/app/challenges" className="hover:text-text-secondary">
              Missions
            </Link>
            <Link to="/app/settings" className="hover:text-text-secondary">
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
