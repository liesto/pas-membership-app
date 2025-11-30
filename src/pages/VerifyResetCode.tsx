import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/pisgah-logo.png";

const VerifyResetCode = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code) {
      setError("Please enter the code from your email");
      return;
    }

    if (code.length < 6) {
      setError("Code must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Verifying reset code:", code);

      // Redirect to reset password page with code in URL
      navigate(`/reset-password?code=${encodeURIComponent(code)}`);
      toast.success("Code verified! Please enter your new password.");
    } catch (err: any) {
      console.error("Code verification error:", err);
      setError("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
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
              Enter Reset Code
            </h1>
            <p className="text-base text-muted-foreground mb-8">
              Enter the 6-digit code we sent to your email address.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="code" className="text-base">
                  Reset Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  className="h-12 text-center text-2xl tracking-widest"
                  maxLength={20}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-primary hover:underline font-medium text-sm"
                >
                  Didn't receive a code? Try again
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetCode;
