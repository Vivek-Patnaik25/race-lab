import React, { useState } from 'react';
import { X, Plus, Terminal } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { Instruction } from '../../../engine';

type OpCode = Instruction['op'];

export interface AddInstructionModalProps {
  isOpen: boolean;
  sharedVariables: string[];
  mutexes: string[];
  onAdd: (instruction: Instruction) => void;
  onClose: () => void;
}

export const AddInstructionModal: React.FC<AddInstructionModalProps> = ({
  isOpen,
  sharedVariables,
  mutexes,
  onAdd,
  onClose,
}) => {
  const [op, setOp] = useState<OpCode>('READ');
  const [source, setSource] = useState(sharedVariables[0] || 'counter');
  const [target, setTarget] = useState('a');
  const [value, setValue] = useState(1);
  const [mutexId, setMutexId] = useState(mutexes[0] || 'lock_1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    switch (op) {
      case 'READ':
        onAdd({ op: 'READ', source: source.trim(), target: target.trim() });
        break;
      case 'ADD':
        onAdd({ op: 'ADD', target: target.trim(), value: Number(value) });
        break;
      case 'WRITE':
        onAdd({ op: 'WRITE', source: source.trim(), target: target.trim() });
        break;
      case 'LOCK':
        onAdd({ op: 'LOCK', mutexId: mutexId.trim() });
        break;
      case 'UNLOCK':
        onAdd({ op: 'UNLOCK', mutexId: mutexId.trim() });
        break;
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-instruction-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-raised/40">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent" />
            <h2 id="add-instruction-modal-title" className="text-sm font-bold text-text-primary">
              Add Instruction
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add instruction dialog"
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
              Operation (OpCode)
            </label>
            <select
              value={op}
              onChange={(e) => setOp(e.target.value as OpCode)}
              className="w-full p-2 rounded bg-background border border-border text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="READ">READ (Shared Memory → Local Register)</option>
              <option value="ADD">ADD (Arithmetic Local Register Increment)</option>
              <option value="WRITE">WRITE (Local Register → Shared Memory)</option>
              <option value="LOCK">LOCK (Acquire Mutex Guard)</option>
              <option value="UNLOCK">UNLOCK (Release Mutex Guard)</option>
            </select>
          </div>

          {op === 'READ' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5">
                  Source Shared Variable:
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. counter"
                  list="shared-vars-list"
                  className="w-full p-2 rounded bg-background border border-border text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  required
                />
                <datalist id="shared-vars-list">
                  {sharedVariables.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5">
                  Target Local Register:
                </label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. reg_a"
                  className="w-full p-2 rounded bg-background border border-border text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  required
                />
              </div>
            </div>
          )}

          {op === 'ADD' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5">
                  Target Local Register:
                </label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. reg_a"
                  className="w-full p-2 rounded bg-background border border-border text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5">
                  Numeric Increment Value:
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full p-2 rounded bg-background border border-border text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  required
                />
              </div>
            </div>
          )}

          {op === 'WRITE' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5">
                  Source Local Register:
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. reg_a"
                  className="w-full p-2 rounded bg-background border border-border text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5">
                  Target Shared Variable:
                </label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. counter"
                  list="shared-vars-list-write"
                  className="w-full p-2 rounded bg-background border border-border text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  required
                />
                <datalist id="shared-vars-list-write">
                  {sharedVariables.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
            </div>
          )}

          {(op === 'LOCK' || op === 'UNLOCK') && (
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5">
                Target Mutex Identifier:
              </label>
              <input
                type="text"
                value={mutexId}
                onChange={(e) => setMutexId(e.target.value)}
                placeholder="e.g. mutex_1"
                list="mutexes-list"
                className="w-full p-2 rounded bg-background border border-border text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                required
              />
              <datalist id="mutexes-list">
                {mutexes.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              <Plus className="w-3.5 h-3.5" /> Add to Thread
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
