
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { withAuth, useAuth } from "@/hooks/use-auth";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address.").optional(),
});

const preferencesSchema = z.object({
  drawNotifications: z.boolean().default(false),
  programUpdates: z.boolean().default(true),
  pushNotifications: z.boolean().default(false),
});

function ProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.displayName ?? '',
        email: user.email ?? '',
      });
    }
  }, [user, profileForm]);

  const preferencesForm = useForm<z.infer<typeof preferencesSchema>>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      drawNotifications: true,
      programUpdates: false,
      pushNotifications: false,
    },
  });

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Profile Updated",
      description: "Your personal information has been saved.",
    });
    setLoading(false);
  };
  
  const onPreferencesSubmit = async (values: z.infer<typeof preferencesSchema>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Preferences Saved",
      description: "Your notification settings have been updated.",
    });
    setLoading(false);
  };

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences.
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your name and email address.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} disabled />
                          </FormControl>
                           <FormDescription>You cannot change your email address.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>

            <Card>
              <Form {...preferencesForm}>
                <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)}>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage your email and push notification preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={preferencesForm.control}
                      name="drawNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Draw Notifications</FormLabel>
                            <FormDescription>
                              Receive emails about new Express Entry draws.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={preferencesForm.control}
                      name="pushNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                           <div className="space-y-0.5">
                            <FormLabel className="text-base">Push Notifications</FormLabel>
                            <FormDescription>
                              Get browser notifications about new draws.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={preferencesForm.control}
                      name="programUpdates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                           <div className="space-y-0.5">
                            <FormLabel className="text-base">Program Updates</FormLabel>
                            <FormDescription>
                              Get notified about changes to immigration programs.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Button type="submit" disabled={loading}>
                     {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Preferences
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
        </div>
        <div className="space-y-6">
              <Card className="text-center">
                <CardHeader>
                  <Avatar className="mx-auto h-24 w-24 mb-4">
                    <AvatarImage src={user.photoURL ?? `https://i.pravatar.cc/150?u=${user.uid}`} data-ai-hint="profile avatar" />
                    <AvatarFallback>{user.email?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <CardTitle>{user.displayName ?? "User"}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button>Change Avatar</Button>
                </CardContent>
              </Card>
          <Card>
            <CardHeader>
              <CardTitle>Saved Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">CRS Score:</span>
                    <span className="font-semibold">498</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">FSW Points:</span>
                    <span className="font-semibold">78 / 100</span>
                </div>
            </CardContent>
             <CardFooter>
                <Button variant="outline" className="w-full">Recalculate</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);
