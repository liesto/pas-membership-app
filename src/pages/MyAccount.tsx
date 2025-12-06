import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
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
  Clock,
  Loader2
} from "lucide-react";
import logo from "@/assets/pisgah-logo.png";
import { getUserAccountData, type UserAccountData } from "@/services/salesforceApi";
import { toast } from "sonner";

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
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserAccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (isUserLoaded && !clerkUser) {
      navigate('/login');
      return;
    }

    // Fetch user data from Salesforce once Clerk user is loaded
    if (isUserLoaded && clerkUser) {
      fetchUserData();
    }
  }, [isUserLoaded, clerkUser, navigate]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token || !clerkUser?.id) {
        throw new Error('Authentication token or user ID not available');
      }

      const data = await getUserAccountData(clerkUser.id, token);
      setUserData(data);
    } catch (error: any) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load your account information');
    } finally {
      setIsLoading(false);
    }
  };

  const getMembershipStatusDisplay = () => {
    const status = userData?.Membership_Status__c;

    if (status === "Current") {
      return { label: "Current Member", color: "bg-green-500" };
    } else if (status === "Expired" || status === "Grace Period") {
      return { label: "Expired Member", color: "bg-destructive" };
    } else {
      return { label: "Not a Member", color: "bg-muted-foreground" };
    }
  };

  // Show loading state
  if (!isUserLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  // If no user data, show error
  if (!userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Unable to load account information</p>
          <Button onClick={() => navigate('/')} className="mt-4">Return Home</Button>
        </div>
      </div>
    );
  }

  const statusDisplay = getMembershipStatusDisplay();

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
              Welcome, {userData.FirstName}!
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
                    {userData.FirstName} {userData.LastName}
                  </p>
                </div>
                {userData.MailingStreet && (
                  <div>
                    <span className="text-sm text-muted-foreground">Address</span>
                    <p className="text-base text-foreground">
                      {userData.MailingStreet}
                      {userData.MailingCity && (
                        <>
                          <br />
                          {userData.MailingCity}, {userData.MailingState} {userData.MailingPostalCode}
                        </>
                      )}
                    </p>
                  </div>
                )}
                {userData.Phone && (
                  <div>
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <p className="text-base text-foreground">{userData.Phone}</p>
                  </div>
                )}
                {userData.Email && (
                  <div>
                    <span className="text-sm text-muted-foreground">Email</span>
                    <p className="text-base text-foreground">{userData.Email}</p>
                  </div>
                )}
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
                {userData.Membership_Status__c === "Current" && userData.npo02__MembershipEndDate__c && (
                  <div>
                    <span className="text-sm text-muted-foreground">Expires</span>
                    <p className="text-base font-medium text-foreground">
                      {new Date(userData.npo02__MembershipEndDate__c).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {(userData.Membership_Status__c === "Expired" || userData.Membership_Status__c === "Grace Period") && (
                  <Button variant="accent" size="lg" className="w-full mt-4" asChild>
                    <Link to="/signup">Renew Now</Link>
                  </Button>
                )}
                {!userData.Membership_Status__c && (
                  <Button variant="hero" size="lg" className="w-full mt-4" asChild>
                    <Link to="/signup">Join Today</Link>
                  </Button>
                )}
              </div>
            </Card>

            {/* TODO: Add Donations Card with real data */}
            {/* TODO: Add Volunteer Hours Card with real data */}
          </div>

          {/* TODO: Add Badges Section with real data */}

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

              {!userData.Membership_Status__c && (
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

              {(userData.Membership_Status__c === "Expired" || userData.Membership_Status__c === "Grace Period") && (
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
