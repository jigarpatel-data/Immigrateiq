
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Loader2, User, ExternalLink } from "lucide-react";
import { withAuth, useAuth } from "@/hooks/use-auth";
import { handleProfileUpdate } from "@/lib/auth";
import { handleCheckout } from "@/lib/stripe";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address.").optional(),
});

type Subscription = {
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    plan: string;
    // Add other fields from your subscription document if needed
};


function ProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  
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
      
      const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
      const q = query(subscriptionsRef, where("status", "in", ["trialing", "active"]));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const subData = snapshot.docs[0].data() as Subscription;
            setSubscription(subData);
        } else {
            setSubscription(null);
        }
        setIsSubscriptionLoading(false);
      }, (error) => {
        console.error("Error fetching subscription:", error);
        setIsSubscriptionLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    setLoading(true);
    const { error } = await handleProfileUpdate({ displayName: values.name });

    if (error) {
        toast({
            variant: "destructive",
            title: "Error updating profile",
            description: error,
        });
    } else {
        toast({
            title: "Profile Updated",
            description: "Your personal information has been saved.",
        });
    }
    setLoading(false);
  };
  
  const onUpgrade = async () => {
    if (!user) return;
    setIsCheckoutLoading(true);
    try {
        await handleCheckout();
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Checkout Error",
            description: "Could not proceed to checkout. Please try again.",
        });
    } finally {
        setIsCheckoutLoading(false);
    }
  };

  if (!user) {
    return null; // Or a loading spinner
  }

  const currentPlan = subscription ? "Premium" : "Free";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                  <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your name and view your email.</CardDescription>
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
                <CardHeader>
                    <CardTitle>Subscription</CardTitle>
                    <CardDescription>Manage your plan and billing details.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isSubscriptionLoading ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Current Plan</p>
                                <p className="text-muted-foreground">{currentPlan}</p>
                            </div>
                            {currentPlan === "Free" && (
                                <Button onClick={onUpgrade} disabled={isCheckoutLoading}>
                                    {isCheckoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Upgrade to Premium"}
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
                 {currentPlan !== "Free" && !isSubscriptionLoading && (
                    <CardFooter className="border-t px-6 py-4">
                        <Button variant="outline" asChild>
                            <a href={process.env.NEXT_PUBLIC_STRIPE_PORTAL_LINK} target="_blank">
                                Manage Billing
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </CardFooter>
                 )}
            </Card>
        </div>
        <div className="space-y-6">
              <Card className="text-center">
                <CardHeader>
                  <Avatar className="mx-auto h-24 w-24 mb-4">
                    <AvatarFallback className="bg-muted">
                        <User className="h-12 w-12 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle>{user.displayName ?? "User"}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
              </Card>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);
