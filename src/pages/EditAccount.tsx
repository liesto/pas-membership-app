import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import logo from "@/assets/pisgah-logo.png";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { getUserAccountData, updateContactData } from "@/services/salesforceApi";

const editAccountSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  emailOptIn: z.boolean().default(false),
});

type EditAccountFormValues = z.infer<typeof editAccountSchema>;

const EditAccount = () => {
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [contactId, setContactId] = useState<string | null>(null);

  const form = useForm<EditAccountFormValues>({
    resolver: zodResolver(editAccountSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      emailOptIn: false,
    },
  });

  // Load user data from Salesforce
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        toast.error("Please log in to edit your account");
        navigate("/login");
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          toast.error("Authentication required");
          navigate("/login");
          return;
        }

        const userData = await getUserAccountData(userId, token);
        setContactId(userData.Id);

        // Populate form with user data
        form.reset({
          firstName: userData.FirstName || "",
          lastName: userData.LastName || "",
          email: userData.Email || "",
          phone: userData.Phone || "",
          address: userData.MailingStreet || "",
          city: userData.MailingCity || "",
          state: userData.MailingState || "",
          zipCode: userData.MailingPostalCode || "",
          emailOptIn: false, // We'll need to check Email_Opt_In__c field if available
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load user data:", error);
        toast.error("Failed to load account data");
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [userId, getToken, navigate, form]);

  const onSubmit = async (data: EditAccountFormValues) => {
    if (!contactId) {
      toast.error("Contact ID not found");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        navigate("/login");
        return;
      }

      await updateContactData(
        contactId,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          mailingStreet: data.address,
          mailingCity: data.city,
          mailingState: data.state,
          mailingPostalCode: data.zipCode,
          emailOptIn: data.emailOptIn,
        },
        token
      );

      toast.success("Account updated successfully!");
      navigate("/my-account");
    } catch (error) {
      console.error("Failed to update account:", error);
      toast.error("Failed to update account. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading account data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link to="/my-account" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to My Account
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="Pisgah Area SORBA" className="h-16" />
          </div>

          <Card className="border-primary/20 shadow-elegant">
            <CardHeader className="space-y-1 text-center pb-8">
              <CardTitle className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Edit Your Account
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
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
                            <FormControl>
                              <Input placeholder="NC" {...field} />
                            </FormControl>
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
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            Send me updates about trails, events, and volunteer opportunities
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button type="submit" className="w-full" size="lg">
                    Update Account
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditAccount;
