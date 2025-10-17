
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Loader2, User, ExternalLink, ShieldCheck } from "lucide-react";
import { withAuth, useAuth } from "@/hooks/use-auth";
import { handleProfileUpdate } from "@/lib/auth";
import { getCheckoutUrl, getPortalUrl } from "@/lib/stripe";
import { db, app } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address.").optional(),
});

type Subscription = {
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    plan: string;
    current_period_end: Timestamp;
};

type Payment = {
    id: string;
    created: Timestamp | { seconds: number; nanoseconds: number } | number;
    amount: number;
    status: string;
};


function ProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
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

      const unsubscribeSub = onSnapshot(q, (snapshot) => {
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

      return () => {
        unsubscribeSub();
      };
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
    setIsCheckoutLoading(true);
    try {
        const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!;
        const url = await getCheckoutUrl(app, priceId);
        window.location.assign(url);
    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Checkout Error",
            description: error.message || "Could not proceed to checkout. Please try again.",
        });
    } finally {
        setIsCheckoutLoading(false);
    }
  };

  const onManageBilling = async () => {
    setIsPortalLoading(true);
    try {
        const url = await getPortalUrl(app);
        window.location.assign(url);
    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Billing Error",
            description: error.message || "Could not open billing portal. Please try again.",
        });
    } finally {
        setIsPortalLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const currentPlan = subscription ? "Premium" : "Free";
  const currentPlanText = subscription ? "Premium ($5)" : "Free";
  const nextBillingDate = subscription?.current_period_end 
    ? new Date(subscription.current_period_end.seconds * 1000).toLocaleDateString()
    : null;

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
                          <div className="flex items-center gap-2">
                            <FormLabel>Email</FormLabel>
                            {user.emailVerified && (
                                <div className="flex items-center gap-1 text-sm text-green-600">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>Verified</span>
                                </div>
                            )}
                          </div>
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
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">Current Plan</p>
                                    <p className="text-muted-foreground">{currentPlanText}</p>
                                </div>
                                {currentPlan === "Free" && (
                                    <Button onClick={onUpgrade} disabled={isCheckoutLoading}>
                                        {isCheckoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Upgrade to Premium"}
                                    </Button>
                                )}
                            </div>
                            {nextBillingDate && (
                                <div className="flex items-center justify-between pt-4 border-t">
                                     <div>
                                        <p className="font-semibold">Next Billing Date</p>
                                        <p className="text-muted-foreground">{nextBillingDate}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                 {currentPlan !== "Free" && !isSubscriptionLoading && (
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={onManageBilling} disabled={isPortalLoading} variant="outline">
                            {isPortalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                            Manage Billing in Stripe
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
