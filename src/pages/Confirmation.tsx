import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import pisigahLogo from "@/assets/pisgah-logo.png";

const membershipLevels = {
  bronze: { name: "Bronze", annualPrice: 50, monthlyPrice: 5, color: "text-amber-700" },
  silver: { name: "Silver", annualPrice: 100, monthlyPrice: 10, color: "text-gray-600" },
  gold: { name: "Gold", annualPrice: 250, monthlyPrice: 25, color: "text-amber-500" },
};

const benefits = [
  "Subaru VIP Signature Program – Purchase or lease a new Subaru vehicle at retailer cost",
  "ExpertVoice Access – Exclusive deals on top outdoor brands",
  "Welcome kit mailed to members at the $50/year ($5/month) or higher levels",
  "BikeInsure – Discounted bike insurance to protect your bike from riding, transit, and theft risks",
  "30% off on Trailforks Pro",
  "10% off at Mulberry Gap",
  "10% off at The Crash Pad Chattanooga",
  "Your chapter trail news delivered to your inbox",
  "SORBA Fat Tire Times newsletter",
];

const Confirmation = () => {
  const [searchParams] = useSearchParams();
  const level = (searchParams.get("level") || "bronze") as keyof typeof membershipLevels;
  const frequency = searchParams.get("frequency") || "annual";
  
  const membership = membershipLevels[level];
  const price = frequency === "annual" ? membership.annualPrice : membership.monthlyPrice;
  
  const today = new Date();
  const expirationDate = new Date(today);
  if (frequency === "annual") {
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  } else {
    expirationDate.setMonth(expirationDate.getMonth() + 1);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <img src={pisigahLogo} alt="Pisgah Area SORBA" className="h-20 mx-auto mb-6" />
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome to the Community!</h1>
          <p className="text-muted-foreground text-lg">Your membership is now active</p>
        </div>

        {/* Receipt Card */}
        <Card className="mb-6 shadow-elegant animate-scale-in">
          <CardHeader className="border-b bg-muted/5">
            <CardTitle className="text-2xl">Membership Receipt</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-muted-foreground">Transaction Date</span>
              <span className="font-semibold">{today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-muted-foreground">Membership Level</span>
              <Badge variant="outline" className={`text-base px-4 py-1 ${membership.color} border-current`}>
                {membership.name}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-muted-foreground">Payment Frequency</span>
              <span className="font-semibold capitalize">{frequency}</span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-semibold text-primary text-xl">${price}{frequency === "monthly" ? "/mo" : "/yr"}</span>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-muted-foreground">
                {frequency === "annual" ? "Membership Expires" : "Next Payment Due"}
              </span>
              <span className="font-semibold">{expirationDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Card */}
        <Card className="shadow-elegant animate-scale-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="border-b bg-muted/5">
            <CardTitle className="text-2xl">Your Membership Benefits</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Link to="/">
            <Button variant="hero" size="lg" className="text-lg px-8">
              Return to Home
            </Button>
          </Link>
          <p className="text-muted-foreground mt-4">
            A confirmation email has been sent to your inbox
          </p>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
