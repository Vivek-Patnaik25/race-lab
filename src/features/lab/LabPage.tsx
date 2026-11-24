import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Plus,
  Play,
  Download,
  Upload,
  Trash2,
  Code,
  AlertTriangle,
  Database,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useLabStore } from '../../store/lab-store';
import { useSimulationStore } from '../../store/simulation-store';
import type { SchedulerMode } from '../../engine';
import { formatInstruction } from '../../engine/scenarios/scenario-parser';
import { downloadScenarioFile, importScenarioFromJson } from '../../services/export';
import { AddInstructionModal } from './components/AddInstructionModal';
import { ThreadTextEditorModal } from './components/ThreadTextEditorModal';

export const LabPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    title,
    setTitle,
    schedulerMode,
    setSchedulerMode,
    sharedMemory,
    mutexes,
    threads,
    selectedThreadId,
    setSelectedThreadId,
    validationErrors,
    addSharedVariable,
    removeSharedVariable,
    updateSharedVariable,
    addMutex,
    removeMutex,
    addThread,
    removeThread,
    updateThreadName,
    updateThreadColor,
    addInstruction,
    removeInstruction,
    setThreadInstructionsFromText,
    validate,
    loadPreset,
    loadScenario,
    getCustomScenarioDefinition,
    getExecutableState,
  } = useLabStore();

  const [isAddInstructionOpen, setIsAddInstructionOpen] = useState(false);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);

  // Inline variable & mutex forms
  const [newVarName, setNewVarName] = useState('');
  const [newVarVal, setNewVarVal] = useState(0);
  const [newMutexId, setNewMutexId] = useState('');

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0] || null;

  const handleRunInStudio = () => {
    const isValid = validate();
    if (!isValid) return;

    const execState = getExecutableState();
    const simStore = useSimulationStore.getState();

    simStore.setActiveChallengeId('custom-lab');
    simStore.setSchedulerMode(schedulerMode);
    simStore.loadScenario(execState.threads, execState.sharedMemory, execState.mutexes);

    navigate('/app/simulate/custom-lab');
  };

  const handleExport = () => {
    const definition = getCustomScenarioDefinition();
    const safeTitle = (title || 'scenario').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    downloadScenarioFile(`racelab-${safeTitle}.json`, definition);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importScenarioFromJson(content);
      if (res.success && res.scenario) {
        loadScenario(res.scenario);
      } else {
        alert(`Failed to import scenario:\n${res.errors.join('\n')}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarName.trim()) return;
    addSharedVariable(newVarName.trim(), Number(newVarVal));
    setNewVarName('');
    setNewVarVal(0);
  };

  const handleAddMutex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMutexId.trim()) return;
    addMutex(newMutexId.trim());
    setNewMutexId('');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Banner & Control Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-5 h-5 text-accent" />
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Custom Simulation Lab
            </h1>
            <Badge variant="accent">Sandbox Builder</Badge>
          </div>
          <p className="text-sm text-text-secondary">
            Construct arbitrary thread instructions, configure synchronization mutexes, and inspect
            custom interleavings.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json"
            className="hidden"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Import custom scenario JSON file"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            title="Export scenario definition as JSON"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunInStudio}
            className="bg-emerald-600 hover:bg-emerald-500 font-semibold"
            title="Launch scenario in the Visual Simulator Studio"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Run in Studio
          </Button>
        </div>
      </div>

      {/* Configuration Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-raised/40">
        <div className="flex-1 max-w-md">
          <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">
            Scenario Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm font-bold font-mono px-3 py-1.5 rounded bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
            placeholder="Scenario Title"
          />
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">
              Scheduler Mode
            </label>
            <select
              value={schedulerMode}
              onChange={(e) => setSchedulerMode(e.target.value as SchedulerMode)}
              className="text-xs font-mono px-3 py-1.5 rounded bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="MANUAL">Manual Thread Dispatch</option>
              <option value="ROUND_ROBIN">Round Robin</option>
              <option value="SEEDED_RANDOM">Seeded Random</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">
              Load Preset
            </label>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  loadPreset(
                    e.target.value as 'lost-update' | 'deadlock' | 'mutex-rescue' | 'empty'
                  );
                  e.target.value = '';
                }
              }}
              className="text-xs font-mono px-3 py-1.5 rounded bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="" disabled>
                Select Template...
              </option>
              <option value="lost-update">Template: Lost Update</option>
              <option value="mutex-rescue">Template: Mutex Guard</option>
              <option value="deadlock">Template: Deadlock Cycle</option>
              <option value="empty">Template: Blank Canvas</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Validation Errors Alert Banner */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-300 space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-rose-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Scenario Validation Errors ({validationErrors.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-200 pl-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Threads & Instructions Builder (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Thread Selector Tabs */}
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                    t.id === activeThread?.id
                      ? 'bg-surface-raised border border-accent/60 text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised/40'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      t.color === 'thread-a'
                        ? 'bg-blue-400'
                        : t.color === 'thread-b'
                          ? 'bg-purple-400'
                          : 'bg-amber-400'
                    }`}
                  />
                  <span>{t.name}</span>
                  <span className="text-[10px] text-text-muted">({t.instructions.length})</span>
                </button>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => addThread()}
                className="text-xs h-7 px-2 text-text-muted hover:text-accent"
                title="Add a new worker thread"
              >
                <Plus className="w-3.5 h-3.5" /> Thread
              </Button>
            </div>
          </div>

          {/* Active Thread Editor Card */}
          {activeThread && (
            <Card className="space-y-4">
              {/* Thread Info & Color Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={activeThread.name}
                    onChange={(e) => updateThreadName(activeThread.id, e.target.value)}
                    className="text-sm font-bold font-mono px-2.5 py-1 rounded bg-surface border border-border text-text-primary focus:outline-none focus:border-accent w-48"
                  />

                  {/* Color Selector */}
                  <div className="flex items-center gap-1 bg-surface p-1 rounded border border-border">
                    <button
                      onClick={() => updateThreadColor(activeThread.id, 'thread-a')}
                      className={`w-4 h-4 rounded-full bg-blue-500 transition-transform duration-100 ${
                        activeThread.color === 'thread-a'
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-50'
                      }`}
                      title="Blue"
                    />
                    <button
                      onClick={() => updateThreadColor(activeThread.id, 'thread-b')}
                      className={`w-4 h-4 rounded-full bg-purple-500 transition-transform duration-100 ${
                        activeThread.color === 'thread-b'
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-50'
                      }`}
                      title="Purple"
                    />
                    <button
                      onClick={() => updateThreadColor(activeThread.id, 'thread-c')}
                      className={`w-4 h-4 rounded-full bg-amber-500 transition-transform duration-100 ${
                        activeThread.color === 'thread-c'
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-50'
                      }`}
                      title="Amber"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsTextEditorOpen(true)}
                    className="text-xs h-7 px-2"
                    title="Edit instruction text in assembly editor"
                  >
                    <Code className="w-3 h-3 text-accent" /> Text Edit
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={threads.length <= 1}
                    onClick={() => removeThread(activeThread.id)}
                    className="text-xs h-7 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                    title="Delete thread"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Instruction Stream */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                  <span>Instructions Program</span>
                  <span>{activeThread.instructions.length} steps</span>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  {activeThread.instructions.map((inst, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-surface border border-border/80 hover:border-border transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-[11px] text-text-muted">{i + 1}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            inst.op === 'READ'
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                              : inst.op === 'WRITE'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                                : inst.op === 'ADD'
                                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                  : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {inst.op}
                        </span>
                        <span className="text-text-primary">{formatInstruction(inst)}</span>
                      </div>

                      <button
                        onClick={() => removeInstruction(activeThread.id, i)}
                        aria-label={`Remove instruction ${i + 1}`}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-rose-400 transition-opacity rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs font-mono"
                    onClick={() => setIsAddInstructionOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Instruction
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Shared Resources (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Shared Memory Variables Card */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Database className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold font-mono text-text-primary">
                Shared Memory Variables
              </h2>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {Object.entries(sharedMemory).map(([varName, val]) => (
                <div
                  key={varName}
                  className="flex items-center justify-between p-2 rounded bg-surface border border-border"
                >
                  <span className="font-semibold text-text-primary">{varName}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => updateSharedVariable(varName, Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 rounded bg-background border border-border text-right text-xs text-text-primary"
                    />
                    <button
                      onClick={() => removeSharedVariable(varName)}
                      aria-label={`Delete shared variable ${varName}`}
                      className="p-1 text-text-muted hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Variable Form */}
            <form onSubmit={handleAddVariable} className="pt-2 border-t border-border flex gap-2">
              <input
                type="text"
                placeholder="var_name"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                className="flex-1 text-xs font-mono px-2 py-1 rounded bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
              />
              <input
                type="number"
                value={newVarVal}
                onChange={(e) => setNewVarVal(Number(e.target.value))}
                className="w-16 text-xs font-mono px-2 py-1 rounded bg-surface border border-border text-text-primary text-right focus:outline-none focus:border-accent"
              />
              <Button variant="secondary" size="sm" type="submit" className="px-2">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </form>
          </Card>

          {/* Synchronization Mutexes Card */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Lock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold font-mono text-text-primary">
                Synchronization Mutexes
              </h2>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {mutexes.map((mId) => (
                <div
                  key={mId}
                  className="flex items-center justify-between p-2 rounded bg-surface border border-border"
                >
                  <span className="font-semibold text-text-primary">{mId}</span>
                  <button
                    onClick={() => removeMutex(mId)}
                    aria-label={`Delete mutex ${mId}`}
                    className="p-1 text-text-muted hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Mutex Form */}
            <form onSubmit={handleAddMutex} className="pt-2 border-t border-border flex gap-2">
              <input
                type="text"
                placeholder="mutex_id"
                value={newMutexId}
                onChange={(e) => setNewMutexId(e.target.value)}
                className="flex-1 text-xs font-mono px-2 py-1 rounded bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
              />
              <Button variant="secondary" size="sm" type="submit" className="px-2">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Add Instruction Modal */}
      <AddInstructionModal
        isOpen={isAddInstructionOpen}
        sharedVariables={Object.keys(sharedMemory)}
        mutexes={mutexes}
        onAdd={(inst) => {
          if (activeThread) addInstruction(activeThread.id, inst);
        }}
        onClose={() => setIsAddInstructionOpen(false)}
      />

      {/* Multi-line Assembly Text Editor Modal */}
      <ThreadTextEditorModal
        isOpen={isTextEditorOpen}
        thread={activeThread}
        onSave={(text) => {
          if (activeThread) return setThreadInstructionsFromText(activeThread.id, text);
          return false;
        }}
        onClose={() => setIsTextEditorOpen(false)}
      />
    </div>
  );
};
