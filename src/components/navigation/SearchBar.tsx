"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

const SearchBar = () => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchExpanded) {
      searchInputRef.current?.focus();
    }
  }, [searchExpanded]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log("Searching for:", searchQuery);
    }
  };

  const handleSearchClick = () => setSearchExpanded(true);

  return (
    <div
      className="relative ml-auto flex-1 sm:flex-initial"
      ref={searchContainerRef}
    >
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSearchClick}
          className="relative z-10"
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search games</span>
        </Button>
        <div
          className={`absolute top-0 right-0 flex items-center overflow-hidden transition-all duration-300 ${
            searchExpanded
              ? "w-full opacity-100 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              : "w-0 opacity-0"
          }`}
        >
          <form className="w-full pl-8" onSubmit={handleSubmit}>
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search games..."
              className="w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
