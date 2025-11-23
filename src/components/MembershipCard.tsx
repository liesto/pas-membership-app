import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

interface MembershipCardProps {
  tier: string;
  price: number;
  isAnnual: boolean;
  benefits: string[];
  featured?: boolean;
}

export const MembershipCard = ({ tier, price, isAnnual, benefits, featured }: MembershipCardProps) => {
  const monthlyPrice = isAnnual ? (price / 12).toFixed(2) : price.toFixed(2);
  const displayPrice = isAnnual ? price : price;
  const period = isAnnual ? "year" : "month";

  const getTierColor = () => {
    switch (tier.toLowerCase()) {
      case "bronze":
        return "bg-gradient-to-br from-amber-600 to-amber-800";
      case "silver":
        return "bg-gradient-to-br from-slate-400 to-slate-600";
      case "gold":
        return "bg-gradient-to-br from-yellow-400 to-yellow-600";
      default:
        return "bg-primary";
    }
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-hover animate-fade-in ${
        featured ? "border-2 border-accent shadow-hover scale-105" : "shadow-card hover:scale-105"
      }`}
    >
      {featured && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-l-none rounded-t-none bg-accent text-accent-foreground">
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader className="text-center">
        <div className={`mx-auto mb-4 h-16 w-16 rounded-full ${getTierColor()} flex items-center justify-center`}>
          <span className="text-2xl font-bold text-white">{tier[0]}</span>
        </div>
        <CardTitle className="text-2xl">{tier} Member</CardTitle>
        <CardDescription className="text-lg font-semibold text-foreground mt-2">
          <span className="text-4xl">${displayPrice}</span>
          <span className="text-muted-foreground">/{period}</span>
        </CardDescription>
        {isAnnual && (
          <p className="text-sm text-muted-foreground mt-1">
            Just ${monthlyPrice}/month
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <span className="text-sm">{benefit}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link to={`/signup?level=${tier.toLowerCase()}`} className="w-full">
          <Button
            variant={featured ? "accent" : "default"}
            size="lg"
            className="w-full"
          >
            Join Now
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
