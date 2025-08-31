
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/sidebar";
import {
  Bot,
  GanttChart,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  User,
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
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
                <Link href={item.href}>
                  <SidebarMenuButton
                    asChild
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="justify-start gap-2 w-full p-2 h-auto">
                   <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://picsum.photos/100" alt="Guest" />
                        <AvatarFallback>G</AvatarFallback>
                      </Avatar>
                      <div className="text-left group-data-[collapsible=icon]:hidden">
                        <p className="font-medium text-sm truncate">Guest User</p>
                      </div>
                   </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Guest User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      guest@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile" passHref>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:hidden">
            <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold">TheCanIndian</h1>
            </div>
              <Avatar className="h-8 w-8">
                  <AvatarImage src="https://picsum.photos/100" alt="Guest" />
                  <AvatarFallback>G</AvatarFallback>
              </Avatar>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
