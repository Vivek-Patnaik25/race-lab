import React, { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoadingFallback } from '../components/ui/LoadingFallback';

// Lazy-loaded route views for code splitting and fast initial bundle load
const LandingPage = lazy(() =>
  import('../features/landing/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ChallengesPage = lazy(() =>
  import('../features/challenges/ChallengesPage').then((m) => ({ default: m.ChallengesPage }))
);
const ChallengeDetailPage = lazy(() =>
  import('../features/challenges/ChallengeDetailPage').then((m) => ({
    default: m.ChallengeDetailPage,
  }))
);
const SimulationStudioPage = lazy(() =>
  import('../features/simulation/SimulationStudioPage').then((m) => ({
    default: m.SimulationStudioPage,
  }))
);
const LabPage = lazy(() => import('../features/lab/LabPage').then((m) => ({ default: m.LabPage })));
const LearningPage = lazy(() =>
  import('../features/learning/LearningPage').then((m) => ({ default: m.LearningPage }))
);
const ConceptDetailPage = lazy(() =>
  import('../features/learning/ConceptDetailPage').then((m) => ({ default: m.ConceptDetailPage }))
);
const AchievementsPage = lazy(() =>
  import('../features/achievements/AchievementsPage').then((m) => ({
    default: m.AchievementsPage,
  }))
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const NotFoundPage = lazy(() =>
  import('../features/not-found/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(LandingPage),
  },
  {
    path: '/app',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: withSuspense(DashboardPage),
      },
      {
        path: 'challenges',
        element: withSuspense(ChallengesPage),
      },
      {
        path: 'challenges/:id',
        element: withSuspense(ChallengeDetailPage),
      },
      {
        path: 'simulate/:id',
        element: withSuspense(SimulationStudioPage),
      },
      {
        path: 'lab',
        element: withSuspense(LabPage),
      },
      {
        path: 'learn',
        element: withSuspense(LearningPage),
      },
      {
        path: 'learn/:concept',
        element: withSuspense(ConceptDetailPage),
      },
      {
        path: 'achievements',
        element: withSuspense(AchievementsPage),
      },
      {
        path: 'settings',
        element: withSuspense(SettingsPage),
      },
      {
        path: '*',
        element: withSuspense(NotFoundPage),
      },
    ],
  },
  {
    path: '*',
    element: withSuspense(NotFoundPage),
  },
]);
