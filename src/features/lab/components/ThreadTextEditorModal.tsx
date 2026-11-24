import React, { useState } from 'react';
import { X, Code, Check, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import {
  parseInstructionLines,
  formatInstruction,
} from '../../../engine/scenarios/scenario-parser';
import type { LabThreadConfig } from '../../../store/lab-store';

export interface ThreadTextEditorModalProps {
  isOpen: boolean;
  thread: LabThreadConfig | null;
  onSave: (instructionsText: string) => boolean;
  onClose: () => void;
}

export const ThreadTextEditorModal: React.FC<ThreadTextEditorModalProps> = ({
  isOpen,
  thread,
  onSave,
  onClose,
}) => {
  const initialText = thread
    ? thread.instructions.map((inst) => formatInstruction(inst)).join('\n')
    : '';

  const [text, setText] = useState(initialText);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  if (!isOpen || !thread) return null;

  const handleApply = () => {
    const parseRes = parseInstructionLines(text);
    if (parseRes.errors.length > 0) {
      setParseErrors(parseRes.errors.map((e) => `Line ${e.line}: ${e.error} ("${e.raw}")`));
      return;
    }

    const saved = onSave(text);
    if (saved) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="thread-editor-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-raised/40">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-accent" />
            <h2 id="thread-editor-modal-title" className="text-sm font-bold text-text-primary">
              Edit Instructions: {thread.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close instruction editor"
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="text-xs text-text-muted font-mono leading-relaxed">
            Enter one instruction per line:
            <br />
            <code className="text-text-secondary">
              READ &lt;var&gt; INTO &lt;reg&gt; | ADD &lt;reg&gt; BY &lt;num&gt; | WRITE &lt;reg&gt;
              INTO &lt;var&gt; | LOCK &lt;mutex&gt; | UNLOCK &lt;mutex&gt;
            </code>
          </div>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setParseErrors([]);
            }}
            rows={8}
            className="w-full font-mono text-xs p-3 rounded-lg bg-background border border-border text-text-primary focus:outline-none focus:border-accent resize-none leading-relaxed"
            placeholder="READ counter INTO a&#10;ADD a BY 1&#10;WRITE a INTO counter"
          />

          {parseErrors.length > 0 && (
            <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Syntax Errors Detected:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-raised/40 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleApply}>
            <Check className="w-3.5 h-3.5" /> Save Instructions
          </Button>
        </div>
      </div>
    </div>
  );
};
