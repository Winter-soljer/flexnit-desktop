import React from "react";
import { PlusCircle } from "lucide-react";
import { useMyListStore } from "../../stores/useMyListStore";
import { MovieCard } from "../home/MovieCard";

export const MyListView: React.FC = () => {
  const { items } = useMyListStore();

  return (
    <div className="pt-24 px-8 md:px-14 min-h-screen text-white select-none pb-20">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-wide">My List</h1>
        <p className="text-xs text-zinc-400 mt-1">
          {items.length} title{items.length === 1 ? "" : "s"} saved to watch
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-2">
          {items.map((item) => (
            <MovieCard key={item.id} media={item} className="w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-28 text-center text-zinc-500">
          <PlusCircle className="w-14 h-14 text-zinc-700 mb-4" />
          <p className="text-base font-semibold text-zinc-300">
            You haven't added any titles to your list yet.
          </p>
          <p className="text-xs text-zinc-500 mt-2 max-w-sm">
            Browse through Movies, Series, and African Cinema to save your favorite titles
            and watch them anytime.
          </p>
        </div>
      )}
    </div>
  );
};
