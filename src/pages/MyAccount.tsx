import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mountain, 
  Pickaxe, 
  Handshake, 
  HardHat, 
  Axe,
  Heart,
  Users,
  Calendar,
  DollarSign,
  Clock
} from "lucide-react";
import logo from "@/assets/pisgah-logo.png";

// Mock user data - in a real app this would come from auth/database
const mockUserData = {
  firstName: "John",
  lastName: "Doe",
  membershipStatus: "current" as "none" | "current" | "expired",
  membershipExpirationDate: "2025-12-31",
  donationsThisYear: 150,
  donationsLastYear: 100,
  volunteerHoursThisYear: 24,
  volunteerHoursLastYear: 18,
  badges: {
    member: true,
    trailBuildersClub: true,
    industryPartner: false,
    trailCrewLeader: true,
    sawyer: false,
  },
};

interface BadgeDisplayProps {
  name: string;
  icon: React.ReactNode;
  earned: boolean;
  description: string;
}

const BadgeDisplay = ({ name, icon, earned, description }: BadgeDisplayProps) => (
  <div 
    className={`flex flex-col items-center p-4 rounded-lg transition-all ${
      earned 
        ? "bg-primary text-primary-foreground" 
        : "bg-muted text-muted-foreground opacity-50"
    }`}
  >
    <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-2 ${
      earned ? "bg-accent text-accent-foreground" : "bg-border"
    }`}>
      {icon}
    </div>
    <span className="font-bold text-sm text-center">{name}</span>
    <span className={`text-xs text-center mt-1 ${earned ? "text-primary-foreground/80" : ""}`}>
      {description}
    </span>
    {earned && (
      <Badge variant="secondary" className="mt-2 bg-accent text-accent-foreground">
        Earned
      </Badge>
    )}
  </div>
);

const MyAccount = () => {
  const user = mockUserData;

  const getMembershipStatusDisplay = () => {
    switch (user.membershipStatus) {
      case "current":
        return { label: "Current Member", color: "bg-green-500" };
      case "expired":
        return { label: "Expired Member", color: "bg-destructive" };
      default:
        return { label: "Not a Member", color: "bg-muted-foreground" };
    }
  };

  const statusDisplay = getMembershipStatusDisplay();

  const badges = [
    {
      name: "Member",
      icon: <Mountain className="w-8 h-8" />,
      earned: user.badges.member,
      description: "Active PAS member",
    },
    {
      name: "Trail Builders Club",
      icon: <Pickaxe className="w-8 h-8" />,
      earned: user.badges.trailBuildersClub,
      description: "10+ volunteer hours",
    },
    {
      name: "Industry Partner",
      icon: <Handshake className="w-8 h-8" />,
      earned: user.badges.industryPartner,
      description: "Business supporter",
    },
    {
      name: "Trail Crew Leader",
      icon: <HardHat className="w-8 h-8" />,
      earned: user.badges.trailCrewLeader,
      description: "Certified TCL",
    },
    {
      name: "Sawyer",
      icon: <Axe className="w-8 h-8" />,
      earned: user.badges.sawyer,
      description: "Certified sawyer",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Logo Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Link to="/">
            <img src={logo} alt="Pisgah Area SORBA" className="h-20" />
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Welcome, {user.firstName}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your Pisgah Area SORBA account
            </p>
          </div>

          {/* Main Info Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Info Card */}
            <Card className="p-6 shadow-card">
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Personal Information
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Name</span>
                  <p className="text-lg font-semibold text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
              </div>
            </Card>

            {/* Membership Status Card */}
            <Card className="p-6 shadow-card">
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Membership Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusDisplay.color}`} />
                  <span className="text-lg font-semibold text-foreground">
                    {statusDisplay.label}
                  </span>
                </div>
                {user.membershipStatus === "current" && (
                  <div>
                    <span className="text-sm text-muted-foreground">Expires</span>
                    <p className="text-base font-medium text-foreground">
                      {new Date(user.membershipExpirationDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Donations Card */}
            <Card className="p-6 shadow-card">
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Donations
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <span className="text-sm text-muted-foreground block">This Year</span>
                  <p className="text-2xl font-bold text-primary">
                    ${user.donationsThisYear}
                  </p>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <span className="text-sm text-muted-foreground block">Last Year</span>
                  <p className="text-2xl font-bold text-foreground">
                    ${user.donationsLastYear}
                  </p>
                </div>
              </div>
            </Card>

            {/* Volunteer Hours Card */}
            <Card className="p-6 shadow-card">
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Volunteer Hours
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <span className="text-sm text-muted-foreground block">This Year</span>
                  <p className="text-2xl font-bold text-primary">
                    {user.volunteerHoursThisYear}
                  </p>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <span className="text-sm text-muted-foreground block">Last Year</span>
                  <p className="text-2xl font-bold text-foreground">
                    {user.volunteerHoursLastYear}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Badges Section */}
          <Card className="p-6 shadow-card">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Mountain className="w-5 h-5" />
              Your Badges
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {badges.map((badge) => (
                <BadgeDisplay
                  key={badge.name}
                  name={badge.name}
                  icon={badge.icon}
                  earned={badge.earned}
                  description={badge.description}
                />
              ))}
            </div>
          </Card>

          {/* Call to Action Buttons */}
          <Card className="p-6 shadow-card bg-gradient-to-r from-primary/5 to-accent/5">
            <h2 className="text-xl font-bold text-primary mb-6 text-center">
              Get Involved
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="accent"
                size="lg"
                className="gap-2"
                asChild
              >
                <Link to="/donate">
                  <Heart className="w-5 h-5" />
                  Donate Today
                </Link>
              </Button>

              <Button
                variant="default"
                size="lg"
                className="gap-2"
                asChild
              >
                <Link to="/volunteer">
                  <Users className="w-5 h-5" />
                  Volunteer
                </Link>
              </Button>

              {user.membershipStatus === "none" && (
                <Button
                  variant="hero"
                  size="lg"
                  className="gap-2"
                  asChild
                >
                  <Link to="/signup">
                    <Mountain className="w-5 h-5" />
                    Join PAS
                  </Link>
                </Button>
              )}

              {user.membershipStatus === "expired" && (
                <Button
                  variant="hero"
                  size="lg"
                  className="gap-2"
                  asChild
                >
                  <Link to="/signup">
                    <Calendar className="w-5 h-5" />
                    Renew Your PAS Membership
                  </Link>
                </Button>
              )}
            </div>
          </Card>

          {/* Account Actions */}
          <div className="flex justify-center gap-4 text-sm">
            <Link to="/login" className="text-primary hover:underline">
              Sign Out
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to="/reset-password" className="text-primary hover:underline">
              Change Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
