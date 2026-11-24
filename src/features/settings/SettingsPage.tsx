import React from 'react';
import { Settings, Moon, Sliders, Type, Database } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSettingsStore } from '../../store/settings-store';

export const SettingsPage: React.FC = () => {
  const {
    reducedMotion,
    setReducedMotion,
    defaultExecutionSpeed,
    setDefaultExecutionSpeed,
    codeFont,
  } = useSettingsStore();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Environment Settings
          </h1>
        </div>
        <p className="text-sm text-text-secondary">
          Configure visual preferences, execution stepping speeds, and local state management.
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary font-medium border-b border-border pb-2">
            <Moon className="w-4 h-4 text-accent" />
            <span>Visual theme</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-text-primary">Color Scheme</div>
              <div className="text-xs text-text-muted">Premium dark developer tooling palette</div>
            </div>
            <div className="text-xs font-mono px-3 py-1 bg-surface-raised border border-border rounded text-text-primary">
              Dark Charcoal (Default)
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div>
              <div className="text-sm font-semibold text-text-primary">Reduced Motion</div>
              <div className="text-xs text-text-muted">Disable animated transition effects</div>
            </div>
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                reducedMotion ? 'bg-accent' : 'bg-surface-raised border border-border'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  reducedMotion ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Execution Engine Defaults */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary font-medium border-b border-border pb-2">
            <Sliders className="w-4 h-4 text-accent" />
            <span>Simulation stepping</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-text-primary">Auto-Play Step Delay</div>
              <div className="text-xs text-text-muted">
                Milliseconds between instruction steps ({defaultExecutionSpeed}ms)
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[300, 600, 1000].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setDefaultExecutionSpeed(speed)}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors border ${
                    defaultExecutionSpeed === speed
                      ? 'bg-accent text-white border-accent'
                      : 'bg-surface-raised text-text-secondary border-border hover:text-text-primary'
                  }`}
                >
                  {speed}ms
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Typography */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary font-medium border-b border-border pb-2">
            <Type className="w-4 h-4 text-accent" />
            <span>Typography</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-text-primary">
                Code & Instruction Monospace Font
              </div>
              <div className="text-xs text-text-muted">{codeFont} with mathematical ligatures</div>
            </div>
            <span className="font-mono text-xs px-2 py-1 bg-background border border-border rounded text-accent">
              a += 1; // 0x2A
            </span>
          </div>
        </Card>

        {/* Local Storage */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary font-medium border-b border-border pb-2">
            <Database className="w-4 h-4 text-accent" />
            <span>Data storage</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-text-primary">Local Storage Status</div>
              <div className="text-xs text-text-muted">
                RaceLab operates 100% client-side with zero external network tracking
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                localStorage.clear();
                alert('Local progress and settings have been reset.');
              }}
            >
              Reset Local Data
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
