import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/pisgah-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Simulate login
    toast.success("Login successful!");
    navigate("/my-account");
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
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left Column - Login Form */}
          <Card className="p-8 shadow-card">
            <h1 className="text-3xl font-bold mb-8 text-primary">
              Log in to My Account
            </h1>

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

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label
                  htmlFor="remember"
                  className="text-base font-semibold cursor-pointer"
                >
                  Remember Me
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full md:w-auto px-12 h-12 text-lg font-semibold bg-primary hover:bg-primary/90"
              >
                GO!
              </Button>

              <div className="space-y-2 pt-4">
                <Link
                  to="/forgot-password"
                  className="block text-primary hover:underline font-medium"
                >
                  Forgot/Reset Password
                </Link>
                <Link
                  to="/signup"
                  className="block text-primary hover:underline font-medium"
                >
                  Join Pisgah Area SORBA Today
                </Link>
              </div>
            </form>
          </Card>

          {/* Right Column - Benefits */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-primary">
                Join Pisgah Area SORBA
              </h2>
              <p className="text-lg text-foreground mb-8">
                Become a USMS member and enjoy all of the benefits of membership, including:
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  • Subaru VIP Signature Program
                </h3>
                <p className="text-base text-muted-foreground ml-4">
                  Purchase or lease a new Subaru vehicle at retailer cost
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  • ExpertVoice Access
                </h3>
                <p className="text-base text-muted-foreground ml-4">
                  Exclusive deals on top outdoor brands
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  • BikeInsure
                </h3>
                <p className="text-base text-muted-foreground ml-4">
                  Discounted bike insurance to protect your bike from riding, transit, and theft risks
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  • Welcome kit
                </h3>
                <p className="text-base text-muted-foreground ml-4">
                  Mailed to members at the $50/year ($5/month) or higher levels
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  • 30% off on Trailforks Pro
                </h3>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  • Free beer at The Hub
                </h3>
                <p className="text-base text-muted-foreground ml-4">
                  Well, one free beer. On Us.
                </p>
              </div>
            </div>

            <Button
              onClick={() => navigate("/signup")}
              size="lg"
              className="w-full md:w-auto px-12 h-14 text-lg font-semibold bg-primary hover:bg-primary/90 mt-8"
            >
              Join Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
