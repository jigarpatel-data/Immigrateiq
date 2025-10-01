
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  PanelLeft,
  Menu,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { handleSignOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/draw-tracker", icon: GanttChart, label: "Draw Tracker" },
  { href: "/chatbot", icon: Bot, label: "Chatbot" },
  { href: "/faq", icon: HelpCircle, label: "FAQ" },
];

function AppLayoutComponent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  const onSignOut = async () => {
    await handleSignOut();
    router.push('/auth');
  }

  const visibleNavItems = user ? navItems : navItems.slice(0,1);

  // This inner component is necessary to use the useSidebar hook
  const SidebarLayout = ({ children: mainContent }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const { setOpenMobile } = useSidebar();
    
    const handleLinkClick = () => {
      setOpenMobile(false);
    };

    return (
      <>
        <Sidebar collapsible="icon">
          <SidebarHeader>
             <div className="flex items-center justify-between p-2">
                <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                  <Image src="https://firebasestorage.googleapis.com/v0/b/thecanindian.firebasestorage.app/o/android-chrome-192x192.png?alt=media&token=4e79ad3d-2db0-4b6c-bc68-efa3d2633eb8" alt="TheCanIndian Logo" width={48} height={48} />
                </Link>
                <SidebarTrigger>
                  <PanelLeft />
                </SidebarTrigger>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} onClick={handleLinkClick}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                      tooltip={{ children: item.label }}
                    >
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
              {user ? (
                <div className="w-full flex flex-col gap-2 p-2">
                   <Link href="/profile" onClick={handleLinkClick} className="w-full">
                      <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center gap-2 w-full p-2 hover:bg-sidebar-accent rounded-md">
                          <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL ?? `https://i.pravatar.cc/150?u=${user.uid}`} alt={user.displayName ?? "User"} data-ai-hint="profile avatar" />
                          <AvatarFallback>{user.email?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="text-left group-data-[collapsible=icon]:hidden">
                          <p className="font-medium text-sm truncate">{user.displayName ?? user.email}</p>
                          </div>
                      </div>
                    </Link>
                    <Button variant="ghost" onClick={onSignOut} className="w-full justify-start group-data-[collapsible=icon]:justify-center">
                      <LogOut className="h-4 w-4 mr-2 group-data-[collapsible=icon]:mr-0"/>
                      <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                    </Button>
                </div>
              ) : (
                 <div className="w-full flex flex-col gap-2 p-2">
                  <Link href="/auth">
                    <Button className="w-full">Sign In</Button>
                  </Link>
                </div>
              )}
            </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col min-h-screen">
          {/* Unified Header for Mobile and Desktop */}
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
              <div className="flex items-center gap-2">
                  <SidebarTrigger className="lg:hidden">
                    <Menu />
                  </SidebarTrigger>
                  <Link href="/dashboard" className="flex items-center gap-2">
                      <Image src="https://firebasestorage.googleapis.com/v0/b/thecanindian.firebasestorage.app/o/Black%20background-final.png?alt=media&token=9086963b-efba-4599-8ff3-76ca37d7ba1c" alt="TheCanIndian Logo" width={120} height={48} />
                  </Link>
              </div>
               {user && (
                <Link href="/profile" className="lg:hidden">
                  <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL ?? `https://i.pravatar.cc/150?u=${user.uid}`} alt={user.displayName ?? "User"} data-ai-hint="profile avatar" />
                      <AvatarFallback>{user.email?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                </Link>
               )}
          </header>
          <div className="flex-1 overflow-y-auto">
            <main className="p-4 sm:p-6">
              {mainContent}
            </main>
          </div>
        </SidebarInset>
      </>
    );
  };

  return (
    <SidebarProvider>
      <SidebarLayout>{children}</SidebarLayout>
    </SidebarProvider>
  );
}

export default AppLayoutComponent;
