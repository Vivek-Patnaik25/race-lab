import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Cpu, Compass, FlaskConical, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl p-8 space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/40 text-accent flex items-center justify-center mx-auto shadow-inner">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-surface-raised text-rose-400 border border-border">
            404 • Thread unreachable
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-text-primary">
            Instruction Pointer Lost
          </h1>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            The concurrency route or memory offset you requested does not exist in this address
            space.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
          <Link
            to="/app"
            className="p-3 rounded-xl bg-surface-raised/60 hover:bg-surface-raised border border-border transition-colors flex items-center gap-3 group"
          >
            <div className="p-2 rounded-lg bg-accent/15 text-accent border border-accent/30 group-hover:scale-105 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-text-primary">Dashboard</div>
              <div className="text-[11px] text-text-muted">Return to overview</div>
            </div>
          </Link>

          <Link
            to="/app/challenges"
            className="p-3 rounded-xl bg-surface-raised/60 hover:bg-surface-raised border border-border transition-colors flex items-center gap-3 group"
          >
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-text-primary">Challenges</div>
              <div className="text-[11px] text-text-muted">Browse missions</div>
            </div>
          </Link>

          <Link
            to="/app/lab"
            className="p-3 rounded-xl bg-surface-raised/60 hover:bg-surface-raised border border-border transition-colors flex items-center gap-3 group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-text-primary">Simulation Lab</div>
              <div className="text-[11px] text-text-muted">Custom scenarios</div>
            </div>
          </Link>

          <Link
            to="/app/learn"
            className="p-3 rounded-xl bg-surface-raised/60 hover:bg-surface-raised border border-border transition-colors flex items-center gap-3 group"
          >
            <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-text-primary">Learning Centre</div>
              <div className="text-[11px] text-text-muted">Interactive theory</div>
            </div>
          </Link>
        </div>

        <div className="pt-4 border-t border-border flex justify-center">
          <Link to="/app">
            <Button variant="secondary" size="sm" className="gap-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Safety
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
