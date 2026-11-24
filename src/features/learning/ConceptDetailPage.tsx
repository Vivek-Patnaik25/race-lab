import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Lightbulb,
  CheckCircle,
  PlayCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CONCEPTS } from '../../data/concepts';
import { InteractiveConceptWidget } from './components/InteractiveConceptWidget';

export const ConceptDetailPage: React.FC = () => {
  const { concept: slug } = useParams<{ concept: string }>();
  const currentIndex = CONCEPTS.findIndex((c) => c.slug === slug);
  const concept = currentIndex !== -1 ? CONCEPTS[currentIndex] : CONCEPTS[0];

  const prevConcept = currentIndex > 0 ? CONCEPTS[currentIndex - 1] : null;
  const nextConcept =
    currentIndex !== -1 && currentIndex < CONCEPTS.length - 1 ? CONCEPTS[currentIndex + 1] : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/learn"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Learning Centre
        </Link>

        {concept.relatedMissionId && (
          <Link to={`/app/simulate/${concept.relatedMissionId}`}>
            <Button size="sm" variant="secondary" className="text-xs h-7 gap-1.5 font-mono">
              <PlayCircle className="w-3.5 h-3.5 text-accent" />
              Practice in {concept.relatedMissionId}
            </Button>
          </Link>
        )}
      </div>

      {/* Concept Header */}
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="accent">{concept.category}</Badge>
          <span className="text-xs font-mono text-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" /> {concept.readTime}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">{concept.title}</h1>
        <p className="text-sm text-text-secondary mt-2 leading-relaxed">{concept.summary}</p>
      </div>

      {/* Interactive Demonstration Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
          <Lightbulb className="w-4 h-4 text-accent" />
          <span>Interactive Sandbox</span>
        </div>
        <InteractiveConceptWidget type={concept.interactiveType} />
      </div>

      {/* Detailed Technical Sections */}
      <div className="space-y-4">
        {concept.sections.map((section, idx) => (
          <Card key={idx} className="space-y-3.5 font-sans">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-surface-raised border border-border text-accent">
                §{idx + 1}
              </span>
              <span>{section.title}</span>
            </h2>

            <p className="text-sm text-text-secondary leading-relaxed">{section.content}</p>

            {/* Formula Callout */}
            {section.formula && (
              <div className="p-3 bg-background rounded border border-border font-mono text-xs text-text-muted space-y-1">
                <div className="text-accent font-bold text-[10px] uppercase tracking-wider">
                  Formal Mathematical Invariant:
                </div>
                <div className="text-emerald-400 font-semibold overflow-x-auto py-1">
                  <code>{section.formula}</code>
                </div>
              </div>
            )}

            {/* Technical Key Takeaways */}
            {section.takeaways && section.takeaways.length > 0 && (
              <div className="pt-2 border-t border-border/50 space-y-1.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-semibold">
                  Key Takeaways:
                </div>
                <ul className="space-y-1 text-xs text-text-secondary">
                  {section.takeaways.map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Next/Prev Pagination & Practice Footer */}
      <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
        {prevConcept ? (
          <Link
            to={`/app/learn/${prevConcept.slug}`}
            className="text-xs font-mono text-text-muted hover:text-text-primary flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous: {prevConcept.title}
          </Link>
        ) : (
          <div />
        )}

        {nextConcept && (
          <Link
            to={`/app/learn/${nextConcept.slug}`}
            className="text-xs font-mono text-accent hover:underline flex items-center gap-1.5"
          >
            Next: {nextConcept.title} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Related Mission Banner */}
      {concept.relatedMissionId && (
        <div className="p-4 rounded-lg border border-accent/30 bg-accent/5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" />
              Apply Your Knowledge in Simulation
            </h4>
            <p className="text-xs text-text-secondary">
              Step through live thread interleavings and vector clock handoffs in{' '}
              <strong className="text-accent">{concept.relatedMissionId}</strong>.
            </p>
          </div>

          <Link to={`/app/simulate/${concept.relatedMissionId}`}>
            <Button size="sm" variant="primary" className="text-xs font-mono shrink-0">
              Launch Mission →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
