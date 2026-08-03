"use client";

import { Bell, Menu, Plus, Search } from "lucide-react";
import Link from "next/link";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#dedfd9] bg-[#f5f5f0]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-[#dedfd9] bg-white p-2.5 text-[#30322f] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="relative hidden sm:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8d86]"
          />

          <input
            type="search"
            placeholder="Search Paddock..."
            className="h-11 w-72 rounded-xl border border-[#dedfd9] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-[#a3a69f] focus:border-[#6e725f]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/projects/new"
          className="hidden items-center gap-2 rounded-xl bg-[#171918] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#292c29] sm:flex"
        >
          <Plus size={17} />
          New project
        </Link>

        <button
          type="button"
          className="relative rounded-xl border border-[#dedfd9] bg-white p-2.5 text-[#454842] transition hover:bg-[#edede7]"
          aria-label="Notifications"
        >
          <Bell size={19} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#df6549]" />
        </button>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cacdc5] text-sm font-semibold text-[#30322f]"
          aria-label="Open profile"
        >
          MS
        </button>
      </div>
    </header>
  );
}
