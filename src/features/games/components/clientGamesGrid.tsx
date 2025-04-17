'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import GamesGrid from '@/features/games/components/gamesGrid';
import type { IGDBReturnDataType } from '@/@types';

interface ClientGamesGridProps {
  data: Array<IGDBReturnDataType>;
  initialPage: number;
}

export default function ClientGamesGrid({ data, initialPage }: ClientGamesGridProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <GamesGrid 
      data={data} 
      initialPage={initialPage}
      onPageChange={handlePageChange}
    />
  );
}