"use client";

import React, { useState, useEffect, memo, useCallback } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import DefaultCard from "@/components/cards/default";
import type { IGDBReturnDataType } from "@/@types";

interface GamesGridProps {
  data: Array<IGDBReturnDataType>;
  itemsPerPage?: number;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

const GamesGridBase = ({ data, itemsPerPage = 20, initialPage = 1, onPageChange }: GamesGridProps) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const offset = (currentPage - 1) * itemsPerPage;
  const currentGames = data.slice(offset, offset + itemsPerPage);

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
    onPageChange?.(page);
  }, [onPageChange]);
  // Assuming we get 20 items per page, if we get less than that, we're on the last page
  const isLastPage = currentGames.length < itemsPerPage;
  const totalPages = isLastPage ? currentPage : currentPage + 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
        {currentGames.map((game) => (
          <DefaultCard key={game.id} {...game} />
        ))}
      </div>

      <Pagination className="mb-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              if (totalPages <= 7) return true;
              if (page === 1 || page === totalPages) return true;
              if (page >= currentPage - 1 && page <= currentPage + 1) return true;
              return false;
            })
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] !== page - 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              </React.Fragment>
            ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

const GamesGrid = memo(GamesGridBase);
export default GamesGrid;