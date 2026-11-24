import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  Search,
  Sparkles,
  PlayCircle,
  Filter,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CONCEPTS } from '../../data/concepts';

type CategoryFilter = 'ALL' | 'Fundamentals' | 'Synchronization' | 'Pitfalls' | 'Theory';

export const LearningPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredConcepts = CONCEPTS.filter((concept) => {
    const matchesCategory = selectedCategory === 'ALL' || concept.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      concept.title.toLowerCase().includes(query) ||
      concept.summary.toLowerCase().includes(query) ||
      concept.sections.some(
        (s) => s.title.toLowerCase().includes(query) || s.content.toLowerCase().includes(query)
      );
    return matchesCategory && matchesSearch;
  });

  const categories: CategoryFilter[] = [
    'ALL',
    'Fundamentals',
    'Synchronization',
    'Pitfalls',
    'Theory',
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Learning Centre</h1>
        </div>
        <p className="text-sm text-text-secondary">
          Deep-dive visual and mathematical guides to concurrency theory, vector clocks,
          synchronization, and race detection. Each concept includes an interactive sandbox.
        </p>
      </div>

      {/* Controls: Search and Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-accent text-white font-bold shadow-sm shadow-accent/20'
                  : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-raised border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search concepts or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent font-sans"
          />
        </div>
      </div>

      {/* Concept Grid */}
      {filteredConcepts.length === 0 ? (
        <div className="p-8 text-center rounded-lg border border-border/80 bg-surface space-y-3">
          <Filter className="w-8 h-8 text-text-muted mx-auto" />
          <div className="text-sm font-semibold text-text-primary">No matching concepts found</div>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Try clearing your search query or selecting another category filter.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
            className="text-xs font-mono"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredConcepts.map((concept) => (
            <Card key={concept.slug} hoverable className="flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="accent">{concept.category}</Badge>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-raised border border-border/60 text-accent flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Interactive Demo
                    </span>
                  </div>
                  <span className="text-xs font-mono text-text-muted">{concept.readTime}</span>
                </div>

                <h2 className="text-base font-bold text-text-primary mb-1.5 group-hover:text-accent transition-colors">
                  {concept.title}
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">{concept.summary}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-text-muted flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-accent" />
                    Read Guide
                  </span>
                  {concept.relatedMissionId && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/60 flex items-center gap-1">
                      <PlayCircle className="w-3 h-3" /> {concept.relatedMissionId}
                    </span>
                  )}
                </div>

                <Link
                  to={`/app/learn/${concept.slug}`}
                  className="text-xs text-accent hover:underline flex items-center gap-1 font-mono font-medium"
                >
                  Explore <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
