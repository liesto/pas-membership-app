import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/pisgah-logo.png";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { signIn, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!isLoaded || !signIn) {
      setError("Authentication service is not ready. Please try again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Sending password reset email for:", email);

      // Use Clerk's password reset strategy to send reset email
      const result = await signIn.create({
        identifier: email,
        strategy: "reset_password_email_code",
      });

      console.log("Password reset initiated:", result);
      console.log("Reset status:", result.status);

      toast.success("Password reset instructions have been sent to your email");
      setTimeout(() => {
        navigate("/verify-reset-code");
      }, 2000);
    } catch (err: any) {
      console.error("Password reset error:", err);

      let errorMessage = "An error occurred. Please try again.";
      if (err?.errors && Array.isArray(err.errors)) {
        console.log("Error details:", err.errors);
        errorMessage = err.errors[0]?.message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      console.log("Final error message:", errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Logo Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <img src={logo} alt="Pisgah Area SORBA" className="h-20" />
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-md mx-auto">
          <Card className="p-8 shadow-card">
            <h1 className="text-3xl font-bold mb-4 text-primary">
              Forgot Password
            </h1>
            <p className="text-base text-muted-foreground mb-8">
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>

              <div className="pt-4 text-center">
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
