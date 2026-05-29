"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useTheme } from "@/hooks/use-theme";
import { useTotalUnread } from "@/hooks/use-total-unread";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  GitBranch,
  Radio,
  Zap,
  Settings,
  LogOut,
  User,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  UserCircle,
  Target,
  Watch,
  Building2,
  Shield,
  Bell,
  ChevronRight,
  ChevronDown,
  FileText,
  UserSquare,
  List,
  Network,
  CheckCircle,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  href?: string;
  label: string;
  icon: any;
  children?: {
    href: string;
    label: string;
    icon: any;
  }[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/pipelines", label: "Pipelines", icon: GitBranch },
  { href: "/automations", label: "Automations", icon: Zap },
];

const managementItems: NavItem[] = [
  { href: "/users", label: "Users", icon: Users },
  { href: "/company", label: "Company", icon: Building2 },
  {
    label: "Customer",
    icon: UserCircle,
    children: [
      { href: "/customers", label: "Contact", icon: UserSquare },
      { href: "/contacts", label: "Detail", icon: FileText },
    ],
  },
  {
    label: "Leads",
    icon: Target,
    children: [
      { href: "/leads", label: "Data Leads", icon: List },
      { href: "/leads/sources", label: "Sources", icon: Network },
      { href: "/leads/statuses", label: "Statuses", icon: CheckCircle },
    ],
  },
  { href: "/products", label: "Products", icon: Watch },
  { href: "/broadcasts", label: "Broadcasts", icon: Radio },
];

const setupItems: NavItem[] = [
  { href: "/roles-access", label: "Roles & Access", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

const bottomNavItems: any[] = [];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  open = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { can, hasMinLevel } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const totalUnread = useTotalUnread();

  const [customerOpen, setCustomerOpen] = useState(
    pathname === "/customers" || pathname === "/contacts"
  );

  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const filteredNavItems = navItems.filter((item) => {
    if (item.children) {
      return can("customers.view");
    }
    return true;
  });

  const filteredMasterItemsMenu = managementItems.filter((item) => {
    if (item.children) {
      return can("customers.view");
    }
    switch (item.href) {
      case "/users": return can("users.view");
      case "/company": return can("companies.view") || can("outlets.view");
      case "/customers": return can("customers.view");
      case "/leads": return can("leads.view");
      case "/leads/sources": return can("leads.view");
      case "/leads/statuses": return can("leads.view");
      case "/products": return can("products.view");
      case "/broadcasts": return true; // Add broadcast permission if exists, or return true
      default: return false;
    }
  });

  const filteredSetupItems = setupItems.filter((item) => {
    switch (item.href) {
      case "/roles-access": return can("roles.view");
      case "/settings": return true; // Settings generally available or add specific perm
      default: return false;
    }
  });

  return (
    <TooltipProvider delay={0}>
      <>
        {/* Backdrop — mobile only */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className={cn(
            "fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden",
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        />

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex h-full flex-col",
            "border-r border-theme-border bg-theme-bg-secondary",
            "transition-all duration-200 ease-out will-change-[transform,width]",
            open ? "translate-x-0" : "-translate-x-full",
            "w-64 sm:w-72",
            "lg:static lg:z-0 lg:translate-x-0",
            collapsed ? "lg:w-[4.5rem]" : "lg:w-60",
          )}
          aria-label="Primary"
        >
          {/* ── Logo row ── */}
          <div
            className={cn(
              "flex h-14 shrink-0 items-center justify-between gap-2 border-b border-theme-border px-3",
              collapsed && "lg:justify-center lg:px-0",
            )}
          >
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-2.5 overflow-hidden",
                collapsed && "lg:justify-center lg:gap-0 lg:w-10 lg:h-10 lg:p-0 lg:mx-auto",
              )}
            >
              <img
                src="/company_logo.png"
                className="h-8 w-8 shrink-0 rounded-lg object-contain"
                alt="Watches Traders Logo"
              />
              <span
                className={cn(
                  "whitespace-nowrap text-sm font-bold tracking-wide text-theme-text transition-opacity duration-200",
                  collapsed && "lg:hidden",
                )}
              >
                CRM Watches Traders
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ── Main navigation ── */}
          <nav className="flex-1 overflow-y-auto px-2 py-3">
            <ul className="flex flex-col gap-1">
              {filteredNavItems.map((item) => {
                if (item.children) {
                  const isActive = pathname === "/customers" || pathname === "/contacts";

                  const groupContent = (
                    <div className="flex w-full flex-col gap-1">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setCustomerOpen(!customerOpen)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setCustomerOpen(!customerOpen);
                            e.preventDefault();
                          }
                        }}
                        className={cn(
                          "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                          collapsed && "lg:justify-center lg:px-0 lg:w-10 lg:h-10 lg:p-0 lg:mx-auto",
                          isActive && !customerOpen
                            ? "bg-violet-500/10 text-violet-500"
                            : "text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text",
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span
                          className={cn(
                            "flex-1 text-left transition-opacity duration-200",
                            collapsed && "lg:hidden",
                          )}
                        >
                          {item.label}
                        </span>
                        {/* MOBILE LAYOUT SIDE BAR ↓ */}
                        <div className={cn("shrink-0 transition-transform duration-200", collapsed && "lg:hidden")}>
                          {customerOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {/* Submenu */}
                      <div
                        className={cn(
                          "flex flex-col gap-1 overflow-hidden transition-all duration-200 ease-in-out",
                          customerOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
                          collapsed && "lg:hidden"
                        )}
                      >
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href;
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ml-9",
                                isChildActive
                                  ? "bg-violet-500/10 text-violet-500"
                                  : "text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text",
                              )}
                            >
                              {ChildIcon && <ChildIcon className="size-4 shrink-0" />}
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );

                  return (
                    <li key={item.label} className="flex justify-center w-full">
                      {collapsed ? (
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger render={<div className="hidden lg:flex w-full justify-center" />}>
                              <DropdownMenuTrigger className="focus:outline-none" render={groupContent} nativeButton={false} />
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8}>
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                          <div className="lg:hidden w-full">{groupContent}</div>
                          <DropdownMenuContent
                            side="right"
                            align="start"
                            sideOffset={8}
                            className="w-48 bg-theme-bg-card"
                          >
                            <div className="px-2 py-1.5 text-sm font-semibold text-theme-text">
                              {item.label}
                            </div>
                            <DropdownMenuSeparator className="bg-theme-border" />
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              return (
                                <DropdownMenuItem
                                  key={child.href}
                                >
                                  <Link
                                    href={child.href}
                                    className={cn(
                                      "flex w-full items-center gap-2 text-sm cursor-pointer",
                                      pathname === child.href
                                        ? "text-violet-500 font-medium"
                                        : "text-theme-text-secondary hover:text-theme-text"
                                    )}
                                  >
                                    {ChildIcon && <ChildIcon className="size-4 shrink-0" />}
                                    {child.label}
                                  </Link>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        groupContent
                      )}
                    </li>
                  );
                }

                const isActive =
                  pathname === item.href ||
                  (item.href && item.href !== "/dashboard" && pathname?.startsWith(item.href));

                const showUnreadDot =
                  item.href === "/inbox" && totalUnread > 0 && !isActive;

                const linkContent = (
                  <Link
                    href={item.href || "#"}
                    className={cn(
                      "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      collapsed && "lg:justify-center lg:px-0 lg:w-10 lg:h-10 lg:p-0 lg:mx-auto",
                      isActive
                        ? "bg-violet-500/10 text-violet-500"
                        : "text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span
                      className={cn(
                        "flex-1 transition-opacity duration-200",
                        collapsed && "lg:hidden",
                      )}
                    >
                      {item.label}
                    </span>
                    {showUnreadDot && (
                      <span
                        aria-label={`${totalUnread} unread`}
                        className={cn(
                          "relative flex h-2 w-2",
                          collapsed && "lg:absolute lg:right-2 lg:top-2",
                        )}
                      >
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                      </span>
                    )}
                  </Link>
                );

                return (
                  <li key={item.href || item.label} className="flex justify-center w-full">
                    {collapsed ? (
                      <Tooltip>
                        <div className="hidden lg:flex w-full justify-center">
                          <TooltipTrigger render={linkContent} />
                        </div>
                        <TooltipContent side="right" sideOffset={8}>
                          {item.label}
                        </TooltipContent>
                        <div className="lg:hidden w-full">{linkContent}</div>
                      </Tooltip>
                    ) : (
                      linkContent
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="my-3 border-t border-theme-border" />

            {filteredMasterItemsMenu.length > 0 && (
              <>
                {/* Management section label */}
                <p
                  className={cn(
                    "mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-theme-text-muted",
                    collapsed && "lg:hidden",
                  )}
                >
                  MASTER MENU
                  {/* Management */}
                </p>

                <ul className="flex flex-col gap-1">
                  {filteredMasterItemsMenu.map((item) => {
                    if (item.children) {
                      const isActive = pathname === "/customers" || pathname === "/contacts";

                      const groupContent = (
                        <div className="flex w-full flex-col gap-1">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setCustomerOpen(!customerOpen)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setCustomerOpen(!customerOpen);
                                e.preventDefault();
                              }
                            }}
                            className={cn(
                              "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                              collapsed && "lg:justify-center lg:px-0 lg:w-10 lg:h-10 lg:p-0 lg:mx-auto",
                              isActive && !customerOpen
                                ? "bg-violet-500/10 text-violet-500"
                                : "text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text",
                            )}
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
                            <span
                              className={cn(
                                "flex-1 text-left transition-opacity duration-200",
                                collapsed && "lg:hidden",
                              )}
                            >
                              {item.label}
                            </span>
                            <div className={cn("shrink-0 transition-transform duration-200", collapsed && "lg:hidden")}>
                              {customerOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>

                          {/* Submenu */}
                          <div
                            className={cn(
                              "flex flex-col gap-1 overflow-hidden transition-all duration-200 ease-in-out",
                              customerOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
                              collapsed && "lg:hidden"
                            )}
                          >
                            {item.children.map((child) => {
                              const isChildActive = pathname === child.href;
                              const ChildIcon = child.icon;
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ml-9",
                                    isChildActive
                                      ? "bg-violet-500/10 text-violet-500"
                                      : "text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text",
                                  )}
                                >
                                  {ChildIcon && <ChildIcon className="size-4 shrink-0" />}
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );

                      return (
                        <li key={item.label} className="flex justify-center w-full">
                          {collapsed ? (
                            <DropdownMenu>
                              <Tooltip>
                                <TooltipTrigger render={<div className="hidden lg:flex w-full justify-center" />}>
                                  <DropdownMenuTrigger className="focus:outline-none" render={groupContent} nativeButton={false} />
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={8}>
                                  {item.label}
                                </TooltipContent>
                              </Tooltip>
                              <div className="lg:hidden w-full">{groupContent}</div>
                              <DropdownMenuContent
                                side="right"
                                align="start"
                                sideOffset={8}
                                className="w-48 bg-theme-bg-card"
                              >
                                <div className="px-2 py-1.5 text-sm font-semibold text-theme-text">
                                  {item.label}
                                </div>
                                <DropdownMenuSeparator className="bg-theme-border" />
                                {item.children.map((child) => {
                                  const ChildIcon = child.icon;
                                  return (
                                    <DropdownMenuItem
                                      key={child.href}
                                    >
                                      <Link
                                        href={child.href}
                                        className={cn(
                                          "flex w-full items-center gap-2 text-sm cursor-pointer",
                                          pathname === child.href
                                            ? "text-violet-500 font-medium"
                                            : "text-theme-text-secondary hover:text-theme-text"
                                        )}
                                      >
                                        {ChildIcon && <ChildIcon className="size-4 shrink-0" />}
                                        {child.label}
                                      </Link>
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            groupContent
                          )}
                        </li>
                      );
                    }

                    const isActive =
                      pathname === item.href ||
                      (item.href && pathname.startsWith(item.href));

                    const linkContent = (
                      <Link
                        href={item.href || "#"}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          collapsed && "lg:justify-center lg:px-0 lg:w-10 lg:h-10 lg:p-0 lg:mx-auto",
                          isActive
                            ? "bg-violet-500/10 text-violet-500"
                            : "text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text",
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span
                          className={cn(
                            "transition-opacity duration-200",
                            collapsed && "lg:hidden",
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );

                    return (
                      <li key={item.href || item.label} className="flex justify-center w-full">
                        {collapsed ? (
                          <Tooltip>
                            <div className="hidden lg:flex w-full justify-center">
                              <TooltipTrigger render={linkContent} />
                            </div>
                            <TooltipContent side="right" sideOffset={8}>
                              {item.label}
                            </TooltipContent>
                            <div className="lg:hidden w-full">{linkContent}</div>
                          </Tooltip>
                        ) : (
                          linkContent
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div className="my-3 border-t border-theme-border" />
              </>
            )}

            {filteredSetupItems.length > 0 && (
              <>
                <p
                  className={cn(
                    "mt-3 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-theme-text-muted",
                    collapsed && "lg:hidden",
                  )}
                >
                  SETUP
                </p>

                <ul className="flex flex-col gap-1">
                  {filteredSetupItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href && pathname.startsWith(item.href));

                    const linkContent = (
                      <Link
                        href={item.href || "#"}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          collapsed && "lg:justify-center lg:px-0 lg:w-10 lg:h-10 lg:p-0 lg:mx-auto",
                          isActive
                            ? "bg-violet-500/10 text-violet-500"
                            : "text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text",
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span
                          className={cn(
                            "transition-opacity duration-200",
                            collapsed && "lg:hidden",
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );

                    return (
                      <li key={item.href || item.label} className="flex justify-center w-full">
                        {collapsed ? (
                          <Tooltip>
                            <div className="hidden lg:flex w-full justify-center">
                              <TooltipTrigger render={linkContent} />
                            </div>
                            <TooltipContent side="right" sideOffset={8}>
                              {item.label}
                            </TooltipContent>
                            <div className="lg:hidden w-full">{linkContent}</div>
                          </Tooltip>
                        ) : (
                          linkContent
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </nav>

          {/* ── Bottom controls: theme toggle + collapse toggle ── */}
          <div className="shrink-0 border-t border-theme-border px-2 py-2">
            {/* Theme toggle
            <Tooltip>
              <TooltipTrigger>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text",
                    collapsed && "lg:justify-center lg:px-0",
                  )}
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5 shrink-0" />
                  ) : (
                    <Moon className="h-5 w-5 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "transition-opacity duration-200",
                      collapsed && "lg:hidden",
                    )}
                  >
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </TooltipContent>
              )}
            </Tooltip>
            */}

            {/* Collapse toggle — desktop only */}
            <Tooltip>
              <TooltipTrigger
                type="button"
                onClick={onToggleCollapse}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={cn(
                  "hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:flex",
                  "text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text",
                  collapsed && "lg:justify-center lg:px-0 lg:w-10 lg:h-10 lg:p-0 lg:mx-auto",
                )}
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-5 w-5 shrink-0" />
                ) : (
                  <PanelLeftClose className="h-5 w-5 shrink-0" />
                )}
                <span
                  className={cn(
                    "transition-opacity duration-200",
                    collapsed && "lg:hidden",
                  )}
                >
                  Collapse
                </span>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  Expand sidebar
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* ── User section ── */}
          <div className="shrink-0 border-t border-theme-border p-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  "hover:bg-theme-bg-hover focus:bg-theme-bg-hover focus:outline-none",
                  collapsed && "lg:justify-center lg:px-0",
                )}
              >
                <Avatar className="size-8 shrink-0">
                  {profile?.avatar_url ? (
                    <AvatarImage
                      src={profile.avatar_url}
                      alt={profile.full_name ?? "Avatar"}
                    />
                  ) : null}
                  <AvatarFallback className="bg-violet-500/10 text-sm font-medium text-violet-500">
                    {profile?.full_name?.charAt(0)?.toUpperCase() ??
                      profile?.email?.charAt(0)?.toUpperCase() ??
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "min-w-0 flex-1",
                    collapsed && "lg:hidden",
                  )}
                >
                  <p className="truncate text-sm font-medium text-theme-text">
                    {profile?.full_name ?? "User"}
                  </p>
                  <p className="truncate text-xs text-theme-text-muted">
                    {profile?.email ?? ""}
                  </p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                sideOffset={6}
                className="min-w-56 bg-theme-bg-card text-theme-text ring-theme-border"
              >
                <DropdownMenuItem
                  render={
                    <Link
                      href="/settings?tab=profile"
                      onClick={onClose}
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
                      onClick={onClose}
                      className="text-theme-text-secondary focus:bg-theme-bg-hover focus:text-theme-text"
                    />
                  }
                >
                  <Settings className="size-4" />
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
        </aside>
      </>
    </TooltipProvider>
  );
}
