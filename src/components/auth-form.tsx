
"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CustomGoogleIcon } from "@/components/icons";
import { Loader2, Info, Eye, EyeOff, CheckCircle, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleSignIn, handleSignUp, handleGoogleSignIn, handlePasswordReset } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getCheckoutUrl } from "@/lib/stripe";
import type { User } from "firebase/auth";
import { app } from "@/lib/firebase";

const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(20, { message: "Password must be no more than 20 characters long." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." }),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const passwordResetSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
});

export function AuthForm() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectToCheckout = searchParams.get('redirect_to') === 'checkout';

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
  });
  
  const passwordResetForm = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: "" },
  });

  const password = signUpForm.watch("password");

  const passwordRequirements = useMemo(() => {
    const p = password || '';
    return [
      { id: 'length', text: 'At least 8 characters long', met: p.length >= 8 },
      { id: 'number-symbol', text: 'A number (0-9) and a symbol', met: /[0-9]/.test(p) && /[^a-zA-Z0-9]/.test(p) },
      { id: 'case', text: 'Lowercase (a-z) & uppercase (A-Z)', met: /[a-z]/.test(p) && /[A-Z]/.test(p) },
    ];
  }, [password]);

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    const { error, user } = await handleSignIn(values.email, values.password);
    if (error) {
      toast({
        title: "Login Failed",
        description: error,
        variant: "destructive",
      });
      setLoading(false);
    } else if (user) {
       router.push('/dashboard');
    }
  };

  const onSignUpSubmit = async (values: z.infer<typeof signUpSchema>) => {
    setLoading(true);
    const { error, user } = await handleSignUp(values.email, values.password);
    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error,
        variant: "destructive",
      });
      setLoading(false);
    } else if (user) {
        router.push('/dashboard');
    }
  };

  const onPasswordResetSubmit = async (values: z.infer<typeof passwordResetSchema>) => {
    setLoading(true);
    const { error } = await handlePasswordReset(values.email);
    if (error) {
        toast({
            title: "Error",
            description: error,
            variant: "destructive",
        });
    } else {
        toast({
            title: "Password Reset Email Sent",
            description: "Please check your inbox for instructions.",
        });
        setIsResetDialogOpen(false);
        passwordResetForm.reset();
    }
    setLoading(false);
  };


  const onGoogleSignIn = async () => {
    setLoading(true);
    const { error, user } = await handleGoogleSignIn();
    if (error) {
        toast({
            title: "Google Sign-In Failed",
            description: error,
            variant: "destructive",
        });
        setLoading(false);
    } else if (user) {
       router.push('/dashboard');
    }
  };

  return (
    <>
    <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            {redirectToCheckout && (
                <div className="mb-4 text-center text-sm p-3 bg-muted rounded-md text-muted-foreground">
                    <p>Sign in or create an account to complete your premium purchase.</p>
                </div>
            )}
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="m@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <AlertDialogTrigger asChild>
                           <Button variant="link" type="button" className="text-xs h-auto p-0 text-muted-foreground">Forgot Password?</Button>
                        </AlertDialogTrigger>
                      </div>
                       <FormControl>
                        <div className="relative">
                          <Input type={showLoginPassword ? "text" : "password"} {...field} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                            onClick={() => setShowLoginPassword((prev) => !prev)}
                          >
                            {showLoginPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
              </form>
            </Form>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={onGoogleSignIn} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CustomGoogleIcon className="mr-2 h-5 w-5" />}
              Google
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="signup">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              {redirectToCheckout && (
                  <div className="mb-4 text-center text-sm p-3 bg-muted rounded-md text-muted-foreground">
                      <p>Create an account to complete your premium purchase.</p>
                  </div>
              )}
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="m@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showSignUpPassword ? "text" : "password"} {...field} />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                              onClick={() => setShowSignUpPassword((prev) => !prev)}
                            >
                              {showSignUpPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </Button>
                          </div>
                        </FormControl>
                         <div className="text-xs text-muted-foreground space-y-1 pt-1">
                          {passwordRequirements.map((req) => (
                            <div key={req.id} className={cn("flex items-center gap-2", req.met && "text-green-500")}>
                               <CheckCircle className={cn("h-4 w-4", req.met ? "opacity-100" : "opacity-50")} />
                               <span>{req.text}</span>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                  </Button>
                </form>
              </Form>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={onGoogleSignIn} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CustomGoogleIcon className="mr-2 h-5 w-5" />}
                Google
              </Button>
            </div>
        </TabsContent>
      </Tabs>
      <AlertDialogContent>
        <Form {...passwordResetForm}>
          <form onSubmit={passwordResetForm.handleSubmit(onPasswordResetSubmit)}>
            <AlertDialogHeader className="items-center text-center">
               <Link href="/" className="flex flex-col items-center gap-2 text-center">
                    
                    <h1 className="text-xl font-bold">Immigrateiq</h1>
              </Link>
              <AlertDialogTitle>Forgot Password?</AlertDialogTitle>
              <AlertDialogDescription>
                Enter your email address below, and we&apos;ll send you a link to reset your password.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
              <FormField
                control={passwordResetForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                  <p className="font-bold">Your new password must contain:</p>
                  <div>- At least 8 characters long</div>
                  <div>- A number (0-9) and a symbol</div>
                  <div>- Lowercase (a-z) & uppercase (A-Z)</div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type="button" onClick={() => passwordResetForm.reset()}>Cancel</AlertDialogCancel>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
