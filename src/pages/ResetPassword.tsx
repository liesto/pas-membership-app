import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/pisgah-logo.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { signIn, isLoaded } = useSignIn();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!code) {
      setError("Invalid or expired reset link");
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!code) {
      setError("Invalid or expired reset link");
      return;
    }

    if (!isLoaded || !signIn) {
      setError("Authentication service is not ready. Please try again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting password reset with code:", code);

      // Use Clerk's reset password flow with the code from URL
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code,
        password: newPassword,
      });

      console.log("Reset password result:", result);
      console.log("Reset password result status:", result.status);

      if (result.status === "complete") {
        console.log("Password reset successfully");
        toast.success("Password has been reset successfully!");
        setTimeout(() => {
          navigate("/my-account");
        }, 2000);
      } else {
        setError("Password reset failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      let errorMessage = "An error occurred while resetting your password";

      if (err?.errors && Array.isArray(err.errors)) {
        console.log("Error details:", err.errors);
        errorMessage = err.errors[0]?.message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }

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
              Reset Password
            </h1>
            <p className="text-base text-muted-foreground mb-8">
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-base">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-base">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
