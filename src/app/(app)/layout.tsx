
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  User,
  GraduationCap,
  MailWarning,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { handleSignOut, resendVerificationEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/draw-tracker", icon: GanttChart, label: "Draw Tracker" },
  { href: "/chatbot", icon: Bot, label: "AI Assistant" },
  { href: "/faq", icon: HelpCircle, label: "FAQ" },
  { href: "/profile", icon: User, label: "Profile", hidden: true },
];

function AppLayoutComponent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  const onSignOut = async () => {
    await handleSignOut();
    router.push('/auth');
  }

  const visibleNavItems = user ? navItems.filter(item => !item.hidden) : [];

  // This inner component is necessary to use the useSidebar hook
  const SidebarLayout = ({ children: mainContent }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const { setOpenMobile } = useSidebar();
    const { toast } = useToast();

    const handleLinkClick = () => {
      setOpenMobile(false);
    };

    const handleResendVerification = async () => {
        const { error } = await resendVerificationEmail();
        if (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error,
            });
        } else {
            toast({
                title: "Verification Email Sent",
                description: "A new verification link has been sent to your inbox.",
            });
        }
    };

    const currentPage = navItems.find(item => pathname.startsWith(item.href));
    const pageTitle = currentPage ? currentPage.label : "";

    const isEmailVerified = user?.emailVerified ?? false;


    return (
      <>
        <Sidebar collapsible="icon">
          <SidebarHeader className="h-14 flex items-center p-0 border-b group-data-[collapsible=icon]:justify-center">
             <div className="flex items-center justify-between w-full h-full px-4 group-data-[collapsible=icon]:justify-center">
                <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                   
                   <span className="font-bold text-lg">Immigrateiq</span>
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
              {user && !isEmailVerified && (
                  <div className="p-2 group-data-[collapsible=icon]:p-1">
                      <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 p-3 rounded-md">
                          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                              <MailWarning className="h-5 w-5 shrink-0" />
                              <div className="text-xs group-data-[collapsible=icon]:hidden">
                                  <p className="font-semibold">Verify your email</p>
                                  <Button variant="link" size="sm" className="h-auto p-0 text-current underline" onClick={handleResendVerification}>Resend Email</Button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
              {user ? (
                <div className="w-full flex flex-col gap-2 p-2">
                   <Link href="/profile" onClick={handleLinkClick} className="w-full">
                      <div className="flex items-center justify-start group-data-[collapsible=icon]:justify-center gap-2 w-full p-2 hover:bg-sidebar-accent rounded-md">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                                <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left group-data-[collapsible=icon]:hidden">
                          <p className="font-medium text-sm truncate">{user.displayName ?? user.email}</p>
                          </div>
                      </div>
                    </Link>
                    <Button variant="ghost" onClick={onSignOut} className="w-full justify-start group-data-[collapsible=icon]:justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                      <LogOut className="h-4 w-4 mr-2 group-data-[collapsible=icon]:mr-0"/>
                      <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                    </Button>
                </div>
              ) : (
                 <div className="w-full flex flex-col gap-2 p-2">
                  <Link href="/auth">
                    <Button className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/80">Sign In</Button>
                  </Link>
                </div>
              )}
            </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col h-screen">
          {/* Unified Header for Mobile and Desktop */}
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
              <div className="flex items-center gap-2">
                  <SidebarTrigger className="lg:hidden">
                    <Menu />
                  </SidebarTrigger>
                  <h1 className="text-lg font-semibold">{pageTitle}</h1>
              </div>
               {user && (
                <div className="flex items-center gap-4">
                  <Link href="/profile">
                      <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                      </Avatar>
                   </Link>
                </div>
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
