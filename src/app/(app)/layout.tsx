
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Bot,
  GanttChart,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  Landmark,
} from "lucide-react";
import { Footer } from "@/components/footer";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/draw-tracker", icon: GanttChart, label: "Draw Tracker" },
  { href: "/program-tracker", icon: ListChecks, label: "Program Tracker" },
  { href: "/chatbot", icon: Bot, label: "Chatbot" },
  { href: "/faq", icon: HelpCircle, label: "FAQ" },
];

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Landmark className="w-8 h-8 text-accent" />
            <span className="text-lg font-semibold">TheCanIndian</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} onClick={handleLinkClick}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <Link href="/profile" onClick={handleLinkClick}>
              <div className="flex items-center gap-2 w-full p-2 hover:bg-sidebar-accent rounded-md">
                  <Avatar className="h-8 w-8">
                  <AvatarImage src="https://picsum.photos/100" alt="Guest" data-ai-hint="profile avatar" />
                  <AvatarFallback>G</AvatarFallback>
                  </Avatar>
                  <div className="text-left group-data-[collapsible=icon]:hidden">
                  <p className="font-medium text-sm truncate">Guest User</p>
                  </div>
              </div>
            </Link>
          </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:hidden">
            <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Landmark className="w-6 h-6 text-accent" />
                    <h1 className="text-lg font-semibold">TheCanIndian</h1>
                </Link>
            </div>
              <Link href="/profile">
                <Avatar className="h-8 w-8">
                    <AvatarImage src="https://picsum.photos/100" alt="Guest" data-ai-hint="profile avatar" />
                    <AvatarFallback>G</AvatarFallback>
                </Avatar>
              </Link>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
        <Footer />
      </SidebarInset>
    </>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
