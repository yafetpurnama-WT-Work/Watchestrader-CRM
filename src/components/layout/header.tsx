"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { LogOut, Menu, Settings as SettingsIcon, User, Sun, Moon } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inbox": "Inbox",
  "/contacts": "Contacts",
  "/pipelines": "Pipelines",
  "/broadcasts": "Broadcasts",
  "/automations": "Automations",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const match = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path),
  );
  return match ? match[1] : "Dashboard";
}

interface HeaderProps {
  onOpenSidebar?: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const title = getPageTitle(pathname);

  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const initial =
    profile?.full_name?.charAt(0)?.toUpperCase() ??
    profile?.email?.charAt(0)?.toUpperCase() ??
    "U";

  const displayName =
    profile?.full_name ||
    profile?.email?.split("@")[0] ||
    "sa";

  const firstName = displayName.split(" ")[0];

  return (
    <header className="flex shrink-0 items-center justify-between px-3 pt-3 pb-1 sm:px-4 sm:pt-4 sm:pb-2 md:px-6 md:pt-6 md:pb-2 bg-transparent transition-colors duration-200">
      <div className="flex flex-1 items-center justify-between rounded-xl border border-theme-border bg-theme-bg-card px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-300">
        <div className="flex min-w-0 items-center gap-3">
          {/* Hamburger — visible on mobile & tablet, hidden on lg+ */}
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-theme-text-secondary transition-colors hover:bg-theme-bg-hover hover:text-theme-text lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-1 text-xs sm:text-sm font-normal text-theme-text-secondary select-none">
            <span className="shrink-0">Welcome,</span>{" "}
            <span className="font-semibold text-theme-text max-w-[85px] sm:max-w-[200px] md:max-w-none truncate inline-block align-bottom">
              <span className="sm:hidden">{firstName}</span>
              <span className="hidden sm:inline">{displayName}</span>
            </span>{" "}
            {mounted && currentTime && (
              <span className="font-semibold text-[#1D4A94] dark:text-[#3b82f6] ml-0.5 select-all shrink-0">
                ({currentTime})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme toggle — small icon button in the header */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-theme-text-secondary transition-colors hover:bg-theme-bg-hover hover:text-theme-text"
          >
            {theme === "dark" ? (
              <Sun className="h-[1.125rem] w-[1.125rem]" />
            ) : (
              <Moon className="h-[1.125rem] w-[1.125rem]" />
            )}
          </button>

          {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-theme-bg-hover focus:bg-theme-bg-hover focus:outline-none sm:gap-3 sm:pl-1 sm:pr-3"
            aria-label="Open account menu"
          >
            <Avatar className="size-8">
              {profile?.avatar_url ? (
                <AvatarImage
                  src={profile.avatar_url}
                  alt={profile.full_name ?? "Avatar"}
                />
              ) : null}
              <AvatarFallback className="bg-violet-500/10 text-sm font-medium text-violet-500">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium text-theme-text sm:inline">
              {profile?.full_name ?? "User"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            className="min-w-56 bg-theme-bg-card text-theme-text ring-theme-border"
          >
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-medium text-theme-text">
                {profile?.full_name ?? "User"}
              </p>
              <p className="truncate text-xs text-theme-text-muted">
                {profile?.email ?? ""}
              </p>
            </div>
            <DropdownMenuSeparator className="bg-theme-border" />
            <DropdownMenuItem
              render={
                <Link
                  href="/settings?tab=profile"
                  className="text-theme-text-secondary focus:bg-theme-bg-hover focus:text-theme-text"
                />
              }
            >
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              render={
                <Link
                  href="/settings?tab=whatsapp"
                  className="text-theme-text-secondary focus:bg-theme-bg-hover focus:text-theme-text"
                />
              }
            >
              <SettingsIcon className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-theme-border" />
            <DropdownMenuItem
              onClick={signOut}
              className="text-theme-text-secondary focus:bg-theme-bg-hover focus:text-theme-text"
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>
  );
}
