import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/pisgah-logo.png";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    // Simulate sending reset email
    toast.success("Password reset instructions have been sent to your email");
    setTimeout(() => {
      navigate("/login");
    }, 2000);
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
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90"
              >
                Send Reset Instructions
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
