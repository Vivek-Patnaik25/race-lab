import React from 'react';
import type { ConceptDefinition } from '../../../data/concepts';
import { VectorClockWidget } from './VectorClockWidget';
import { RaceConditionWidget } from './RaceConditionWidget';
import { MutexWidget } from './MutexWidget';
import { DeadlockWidget } from './DeadlockWidget';
import { SemaphoreWidget } from './SemaphoreWidget';
import { StarvationWidget } from './StarvationWidget';
import { SchedulerWidget } from './SchedulerWidget';

export interface InteractiveConceptWidgetProps {
  type: ConceptDefinition['interactiveType'];
}

export const InteractiveConceptWidget: React.FC<InteractiveConceptWidgetProps> = ({ type }) => {
  switch (type) {
    case 'vector-clock-demo':
      return <VectorClockWidget />;
    case 'race-demo':
      return <RaceConditionWidget />;
    case 'mutex-demo':
      return <MutexWidget />;
    case 'deadlock-demo':
      return <DeadlockWidget />;
    case 'semaphore-demo':
      return <SemaphoreWidget />;
    case 'starvation-demo':
      return <StarvationWidget />;
    case 'scheduler-demo':
      return <SchedulerWidget />;
    default:
      return null;
  }
};
