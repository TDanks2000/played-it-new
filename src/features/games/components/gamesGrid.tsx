'use client';

import { Suspense, memo } from 'react';
import GamesGridBase from './gamesGridBase';
import type { IGDBReturnDataType } from '@/@types';

interface GamesGridProps {
  data: Array<IGDBReturnDataType>;
  initialPage: number;
  onPageChange: (page: number) => void;
}

const GamesGridLoading = memo(function GamesGridLoading() {
  return <div className="animate-pulse h-screen bg-muted/10" />;
});

const GamesGrid = memo(function GamesGrid({ data, initialPage, onPageChange }: GamesGridProps) {
  return (
    <Suspense fallback={<GamesGridLoading />}>
      <GamesGridBase 
        data={data} 
        initialPage={initialPage}
        onPageChange={onPageChange}
      />
    </Suspense>
  );
});

export default GamesGrid;