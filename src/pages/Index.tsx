import { useState } from "react";
import { MembershipCard } from "@/components/MembershipCard";
import { Button } from "@/components/ui/button";
import logo from "@/assets/pisgah-logo.png";

const Index = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const membershipTiers = [
    {
      tier: "Bronze",
      annualPrice: 50,
      monthlyPrice: 5,
      benefits: [
        "Access to member-only trails",
        "Monthly newsletter",
        "10% discount on events",
        "SORBA membership card",
        "Community forum access",
      ],
    },
    {
      tier: "Silver",
      annualPrice: 100,
      monthlyPrice: 10,
      benefits: [
        "All Bronze benefits",
        "Exclusive trail work day invites",
        "20% discount on events",
        "Priority event registration",
        "Quarterly swag package",
        "Vote on trail projects",
      ],
      featured: true,
    },
    {
      tier: "Gold",
      annualPrice: 250,
      monthlyPrice: 25,
      benefits: [
        "All Silver benefits",
        "VIP event access",
        "30% discount on all events",
        "Premium SORBA jersey",
        "Recognition on website",
        "Annual appreciation dinner invite",
        "Trail naming opportunity",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center animate-fade-in">
            <img
              src={logo}
              alt="Pisgah Area SORBA"
              className="h-32 w-auto mb-8 animate-scale-in"
            />
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4">
              Join Pisgah Area SORBA
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-2xl">
              Support sustainable trails and become part of the mountain biking community
            </p>
            <Button
              size="lg"
              variant="accent"
              className="text-lg px-8 py-6 h-auto"
              onClick={() => {
                document.getElementById("membership")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Become a Member
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Pisgah Area SORBA is dedicated to building, maintaining, and advocating for sustainable
            trails in the Pisgah National Forest. Your membership directly supports trail work,
            community events, and ensures the future of mountain biking in Western North Carolina.
          </p>
        </div>
      </section>

      {/* Membership Section */}
      <section id="membership" className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Choose Your Membership</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Select the level that works best for you
            </p>

            {/* Payment Toggle */}
            <div className="inline-flex items-center gap-3 bg-muted rounded-full p-1">
              <Button
                variant={!isAnnual ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setIsAnnual(false)}
                className="rounded-full"
              >
                Monthly
              </Button>
              <Button
                variant={isAnnual ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setIsAnnual(true)}
                className="rounded-full"
              >
                Annual
                <span className="ml-2 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                  Save 15%
                </span>
              </Button>
            </div>
          </div>

          {/* Membership Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {membershipTiers.map((membership) => (
              <MembershipCard
                key={membership.tier}
                tier={membership.tier}
                price={isAnnual ? membership.annualPrice : membership.monthlyPrice}
                isAnnual={isAnnual}
                benefits={membership.benefits}
                featured={membership.featured}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <img
            src={logo}
            alt="Pisgah Area SORBA"
            className="h-20 w-auto mx-auto mb-4 opacity-90"
          />
          <p className="text-primary-foreground/80 mb-4">
            © 2024 Pisgah Area SORBA. All rights reserved.
          </p>
          <p className="text-sm text-primary-foreground/60">
            Building and maintaining sustainable trails in Western North Carolina
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
