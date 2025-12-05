import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, X, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logo from "@/assets/pisgah-logo.png";
import { createMembership, type CreateMembershipRequest } from "@/services/salesforceApi";

const signupSchema = z.object({
  membershipLevel: z.enum(["bronze", "silver", "gold"]),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits").optional().or(z.literal('')),
  emailOptIn: z.boolean().default(true),
  paymentFrequency: z.enum(["monthly", "annual"]),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const membershipLevels = {
  bronze: { name: "Bronze", annualPrice: 50, monthlyPrice: 5 },
  silver: { name: "Silver", annualPrice: 100, monthlyPrice: 10 },
  gold: { name: "Gold", annualPrice: 250, monthlyPrice: 25 },
};

const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

type EmailStatus = "idle" | "checking" | "available" | "taken";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const initialLevel = (searchParams.get("level") || "silver") as keyof typeof membershipLevels;

  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<string>('');
  const navigate = useNavigate();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      membershipLevel: initialLevel,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      emailOptIn: true,
      paymentFrequency: "annual",
    },
  });

  const selectedLevel = form.watch("membershipLevel");
  const membership = membershipLevels[selectedLevel];
  const paymentFrequency = form.watch("paymentFrequency");
  const emailValue = form.watch("email");
  const price = paymentFrequency === "annual" ? membership.annualPrice : membership.monthlyPrice;

  // Email validation with debounce
  useEffect(() => {
    if (!emailValue || !z.string().email().safeParse(emailValue).success) {
      setEmailStatus("idle");
      return;
    }

    setEmailStatus("checking");
    const timer = setTimeout(async () => {
      // TODO: Replace with actual database check when Lovable Cloud is enabled
      // For now, simulating a check - always returns available
      setEmailStatus("available");
    }, 500);

    return () => clearTimeout(timer);
  }, [emailValue]);

  const onSubmit = async (data: SignupFormValues) => {
    if (emailStatus === "taken") {
      toast.error("This email is already registered. Please use a different email or log in.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionStage('Preparing signup...');

    try {
      // Log form submission
      console.log('[Signup] Form submitted:', {
        email: data.email,
        membershipLevel: data.membershipLevel,
        paymentFrequency: data.paymentFrequency,
        timestamp: new Date().toISOString()
      });

      // Update stage
      setSubmissionStage('Creating contact...');
      console.log('[Signup] Stage: Creating contact');

      // Prepare membership data
      const membershipData: CreateMembershipRequest = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || undefined,
        mailingStreet: data.address || undefined,
        mailingCity: data.city || undefined,
        mailingState: data.state || undefined,
        mailingPostalCode: data.zipCode || undefined,
        emailOptIn: data.emailOptIn,
        membershipLevel: data.membershipLevel,
        membershipTerm: data.paymentFrequency === 'annual' ? 'annual' : 'monthly',
      };

      // Call Salesforce API
      const result = await createMembership(membershipData);

      console.log('[Signup] Contact created:', result.contact.id);
      setSubmissionStage('Creating membership...');
      console.log('[Signup] Stage: Creating membership opportunity');

      // Log success
      console.log('[Signup] Membership created successfully:', {
        contactId: result.contact.id,
        opportunityId: result.opportunity.id,
        amount: result.opportunity.amount,
        timestamp: new Date().toISOString()
      });

      // Show success toast
      toast.success('Membership Created!', {
        description: `Welcome to Pisgah Area SORBA, ${data.firstName}!`,
      });

      // Redirect to confirmation page with membership data
      console.log('[Signup] Redirecting to confirmation page');
      navigate('/confirmation', {
        state: {
          contact: result.contact,
          opportunity: result.opportunity,
          formData: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            membershipLevel: data.membershipLevel,
            paymentFrequency: data.paymentFrequency,
          }
        }
      });

    } catch (error) {
      console.error('[Signup] Submission failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stage: submissionStage,
        timestamp: new Date().toISOString()
      });

      // Show detailed error message
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error('Signup Failed', {
        description: errorMessage,
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
      setSubmissionStage('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to membership options
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="Pisgah Area SORBA" className="h-16" />
          </div>

          <Card className="border-primary/20 shadow-elegant">
            <CardHeader className="space-y-1 text-center pb-8">
              <CardTitle className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Become a Member
              </CardTitle>
              <CardDescription className="text-base">
                Complete your membership registration
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Membership Level & Payment Frequency */}
                  <div className="space-y-6 p-6 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
                    <FormField
                      control={form.control}
                      name="membershipLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">Membership Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a membership level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="bronze">
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">Bronze</span>
                                  <span className="text-muted-foreground ml-4">$50/year or $5/month</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="silver">
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">Silver</span>
                                  <span className="text-muted-foreground ml-4">$100/year or $10/month</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="gold">
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">Gold</span>
                                  <span className="text-muted-foreground ml-4">$250/year or $25/month</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentFrequency"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-lg font-semibold">Payment Frequency</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-2 gap-4"
                            >
                              <Label
                                htmlFor="annual"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                              >
                                <RadioGroupItem value="annual" id="annual" className="sr-only" />
                                <span className="text-sm font-medium">Annual</span>
                                <span className="text-2xl font-bold">${membership.annualPrice}</span>
                                <span className="text-xs text-muted-foreground">per year</span>
                              </Label>
                              <Label
                                htmlFor="monthly"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                              >
                                <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
                                <span className="text-sm font-medium">Monthly</span>
                                <span className="text-2xl font-bold">${membership.monthlyPrice}</span>
                                <span className="text-xs text-muted-foreground">per month</span>
                              </Label>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} className="pr-10" />
                            </FormControl>
                            {emailStatus !== "idle" && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {emailStatus === "checking" && (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                                {emailStatus === "available" && (
                                  <Check className="h-4 w-4 text-green-500" />
                                )}
                                {emailStatus === "taken" && (
                                  <X className="h-4 w-4 text-destructive" />
                                )}
                              </div>
                            )}
                          </div>
                          {emailStatus === "available" && (
                            <p className="text-sm text-green-500">This email is available</p>
                          )}
                          {emailStatus === "taken" && (
                            <p className="text-sm text-destructive">This email is already registered. Please log in or use a different email.</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Asheville" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select State" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {usStates.map((stateName) => (
                                  <SelectItem key={stateName} value={stateName}>
                                    {stateName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input placeholder="28801" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Email Opt-in */}
                  <FormField
                    control={form.control}
                    name="emailOptIn"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/40 p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            Send me email updates about trails, events, and membership benefits
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="flex flex-col items-center gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Total: <span className="text-2xl font-bold text-foreground">${price}</span>
                        <span className="text-muted-foreground"> / {paymentFrequency === "annual" ? "year" : "month"}</span>
                      </p>
                    </div>
                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className="w-full md:w-auto min-w-[200px]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {submissionStage}
                        </>
                      ) : (
                        'Join Now'
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center max-w-md">
                      By joining, you agree to support trail maintenance and advocacy in the Pisgah area.
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;
