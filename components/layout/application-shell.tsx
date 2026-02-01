"use client";

import { Search, Sparkles, FolderOpen, Settings, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";
import { ConnectWallet } from "@/components/connect-wallet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Base nav item - used by simple sidebars
type NavItem = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  isActive?: boolean;
  // Optional children for submenus (Sidebar3+)
  children?: NavItem[];
};

// Nav group with optional collapsible state
type NavGroup = {
  title: string;
  items: NavItem[];
  // Optional: default collapsed state (Sidebar2+)
  defaultOpen?: boolean;
};

// Sidebar data structure (our content)
type SidebarData = {
  logo: {
    title: string;
    description: string;
  };
  navGroups: NavGroup[];
  footerGroup: NavGroup;
};

// Shared sidebar data - our app content
const sidebarData: SidebarData = {
  logo: {
    title: "Based SEO",
    description: "SEO Tools",
  },
  navGroups: [
    {
      title: "Research",
      defaultOpen: true,
      items: [
        { label: "Keyword Overview", icon: Search, href: "/keywords/overview" },
        { label: "Keyword Finder", icon: Sparkles, href: "/keywords/finder" },
        { label: "Saved Keywords", icon: FolderOpen, href: "/keywords/saved" },
      ],
    },
  ],
  footerGroup: {
    title: "Support",
    items: [{ label: "Settings", icon: Settings, href: "/settings" }],
  },
};

const NavMenuItem = ({ item, isActive }: { item: NavItem; isActive: boolean }) => {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
          <Link href={item.href}>
            <Icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={item.isActive} tooltip={item.label}>
            <Icon className="size-4" />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuSubItem key={child.label}>
                <SidebarMenuSubButton asChild isActive={child.isActive}>
                  <Link href={child.href}>{child.label}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <span className="truncate text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Dashboard
          </span>
          <SidebarTrigger className="shrink-0 group-data-[collapsible=icon]:mx-0" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavMenuItem key={item.label} item={item} isActive={pathname === item.href} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>{sidebarData.footerGroup.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarData.footerGroup.items.map((item) => (
                <NavMenuItem key={item.label} item={item} isActive={pathname === item.href} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};

interface ApplicationShellProps {
  className?: string;
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSE_BREAKPOINT = 1280;

function useAutoCollapseSidebar() {
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    const check = () => setOpen(window.innerWidth >= SIDEBAR_COLLAPSE_BREAKPOINT);
    check();
    const mql = window.matchMedia(`(min-width: ${SIDEBAR_COLLAPSE_BREAKPOINT}px)`);
    mql.addEventListener("change", check);
    return () => mql.removeEventListener("change", check);
  }, []);

  return { open, setOpen };
}

export function ApplicationShell({ className, children }: ApplicationShellProps) {
  const { open, setOpen } = useAutoCollapseSidebar();

  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      className={cn("application-shell flex min-h-svh flex-col", className)}
    >
      {/* Navbar: full width at top */}
      <header
        className="flex h-[var(--navbar-height)] w-full shrink-0 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6"
        role="banner"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md transition-opacity hover:opacity-90"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Search className="size-4" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold leading-tight text-foreground md:text-base">
                Based SEO
              </span>
              <span className="text-[10px] leading-tight text-muted-foreground md:text-xs">
                SEO Tools
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <ConnectWallet />
          <div className="hidden h-6 w-px bg-border md:block" aria-hidden />
          <ThemeToggle />
        </div>
      </header>

      {/* Sidebar + main content: both start below navbar */}
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <SidebarInset
          className={cn(
            "relative",
            "border-l border-border/80 dark:border-border/30",
            // Make the separation feel a bit more deliberate, especially in dark mode.
            "dark:shadow-[inset_1px_0_0_rgba(255,255,255,0.06)]",
          )}
        >
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
