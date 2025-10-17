
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gem, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCheckoutUrl } from "@/lib/stripe";
import { app } from "@/lib/firebase";

interface PremiumContentProps {
    children: React.ReactNode;
}

export function PremiumContent({ children }: PremiumContentProps) {
    const { subscription, loading } = useAuth();
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const { toast } = useToast();

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const isPremium = !!subscription;

    if (!isPremium) {
        return (
            <div className="flex items-center justify-center h-full">
                 <Card className="max-w-md w-full text-center shadow-lg">
                    <CardHeader>
                        <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
                            <Gem className="h-8 w-8" />
                        </div>
                        <CardTitle>Unlock Premium Access</CardTitle>
                        <CardDescription>
                            This feature is available exclusively for our Premium members.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Upgrade your plan to get instant access to the AI Assistant, historical draw data, and more powerful tools to streamline your immigration journey.</p>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={onUpgrade} disabled={isCheckoutLoading}>
                            {isCheckoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upgrade to Premium
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }


    return <>{children}</>;
}
