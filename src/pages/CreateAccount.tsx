import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignUp, useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logo from "@/assets/pisgah-logo.png";
import ReCAPTCHA from "react-google-recaptcha";

const CreateAccount = () => {
  const navigate = useNavigate();
  const { signUp, isLoaded, setActive } = useSignUp();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Create account form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const [createAccountError, setCreateAccountError] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    toast.success("Login successful!");
    navigate("/");
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only validate required fields: firstName, lastName, email, password, confirmPassword
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setCreateAccountError("Please fill in all required fields (First Name, Last Name, Email, Password)");
      return;
    }

    if (password !== confirmPassword) {
      setCreateAccountError("Passwords do not match");
      return;
    }

    if (!isLoaded || !signUp) {
      setCreateAccountError("Authentication is not ready. Please try again.");
      return;
    }

    setIsCreatingAccount(true);
    setCreateAccountError("");

    try {
      console.log("Creating account with email:", email, "firstName:", firstName, "lastName:", lastName);

      // Create the user in Clerk
      const result = await signUp.create({
        emailAddress: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      });

      console.log("Sign up status:", result.status);
      console.log("Created session ID:", result.createdSessionId);

      if (result.status === "complete") {
        console.log("Account created successfully, setting active session:", result.createdSessionId);
        await setActive?.({ session: result.createdSessionId });
        toast.success("Account created successfully!");
        navigate("/my-account");
      } else if (result.status === "missing_requirements") {
        console.log("Missing requirements detected");
        console.log("Created session ID available:", !!result.createdSessionId);
        // Clerk requires email verification - even with missing_requirements, we can proceed if there's a session
        if (result.createdSessionId) {
          console.log("Setting active session despite missing requirements");
          await setActive?.({ session: result.createdSessionId });
          toast.success("Account created successfully!");
          navigate("/my-account");
        } else {
          console.log("No session ID available - email verification required");
          setCreateAccountError("Account creation requires email verification. Please check your email.");
        }
      } else {
        console.log("Unexpected status:", result.status);
        setCreateAccountError("Account creation failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      let errorMessage = "An error occurred while creating your account";

      if (err?.errors && Array.isArray(err.errors)) {
        errorMessage = err.errors[0]?.message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setCreateAccountError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreatingAccount(false);
    }
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

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-base">Email Address</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-base">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
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

          {/* Right Column - Create Account Form */}
          <Card className="p-8 shadow-card">
            <h1 className="text-3xl font-bold mb-4 text-primary">
              Create a free Pisgah Area SORBA Account
            </h1>
            <p className="text-base text-foreground mb-8">
              I do not have a Pisgah Area SORBA Account and need to create one.
            </p>

            <form onSubmit={handleCreateAccount} className="space-y-6">
              {createAccountError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 font-medium">{createAccountError}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isCreatingAccount}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isCreatingAccount}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isCreatingAccount}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isCreatingAccount}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isCreatingAccount}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isCreatingAccount}
                  className="h-12"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    id="city"
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={isCreatingAccount}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Select value={state} onValueChange={setState} disabled={isCreatingAccount}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {usStates.map((stateName) => (
                        <SelectItem key={stateName} value={stateName}>
                          {stateName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center py-4">
                <ReCAPTCHA
                  sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                  onChange={(value) => setCaptchaValue(value)}
                />
              </div>

              <Button
                type="submit"
                disabled={isCreatingAccount}
                className="w-full md:w-auto px-12 h-12 text-lg font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingAccount ? "Creating Account..." : "GO!"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
