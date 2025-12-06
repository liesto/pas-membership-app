import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mountain,
  Heart,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Loader2
} from "lucide-react";
import logo from "@/assets/pisgah-logo.png";
import memberBadge from "@/assets/badges/member.png";
import trailBuildersBadge from "@/assets/badges/trail-builders-club.png";
import industryPartnerBadge from "@/assets/badges/industry-partner.png";
import trailCrewLeaderBadge from "@/assets/badges/trail-crew-leader.png";
import sawyerBadge from "@/assets/badges/sawyer.png";
import { getUserAccountData, type UserAccountData } from "@/services/salesforceApi";
import { toast } from "sonner";

interface BadgeDisplayProps {
  name: string;
  imageSrc: string;
  earned: boolean;
  description: string;
}

const BadgeDisplay = ({ name, imageSrc, earned, description }: BadgeDisplayProps) => (
  <div
    className={`flex flex-col items-center p-4 rounded-lg transition-all ${
      earned
        ? "opacity-100"
        : "opacity-30 grayscale"
    }`}
  >
    <div className="w-full aspect-square mb-2 flex items-center justify-center">
      <img
        src={imageSrc}
        alt={name}
        className="w-full h-full object-contain"
      />
    </div>
    <span className={`font-bold text-sm text-center ${earned ? "text-foreground" : "text-muted-foreground"}`}>
      {name}
    </span>
    <span className={`text-xs text-center mt-1 ${earned ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
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
      console.log('[MyAccount] User data received:', data);
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
                    <p className="text-base text-foreground">
                      {(() => {
                        const cleaned = userData.Phone.replace(/\D/g, '');
                        if (cleaned.length === 10) {
                          return `(${cleaned.substring(0, 3)})${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
                        }
                        return userData.Phone;
                      })()}
                    </p>
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
                    ${userData.npo02__OppAmountThisYear__c || 0}
                  </p>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <span className="text-sm text-muted-foreground block">Last Year</span>
                  <p className="text-2xl font-bold text-foreground">
                    ${userData.npo02__OppAmountLastYear__c || 0}
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
                    {userData.Trailwork_Hours_This_Year__c || 0}
                  </p>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <span className="text-sm text-muted-foreground block">Last Year</span>
                  <p className="text-2xl font-bold text-foreground">
                    {userData.Trailwork_Hours_Last_Year__c || 0}
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
              <BadgeDisplay
                name="Member"
                imageSrc={memberBadge}
                earned={userData.Membership_Status__c === "Current"}
                description="Active PAS member"
              />
              <BadgeDisplay
                name="Trail Builders Club"
                imageSrc={trailBuildersBadge}
                earned={userData.Trail_Builders_Club__c === true}
                description="10+ volunteer hours"
              />
              <BadgeDisplay
                name="Industry Partner"
                imageSrc={industryPartnerBadge}
                earned={userData.Contact_is_Industry_Partner__c === true}
                description="Business supporter"
              />
              <BadgeDisplay
                name="Trail Crew Leader"
                imageSrc={trailCrewLeaderBadge}
                earned={userData.Trail_Crew_Leader__c === true}
                description="Certified TCL"
              />
              <BadgeDisplay
                name="Sawyer"
                imageSrc={sawyerBadge}
                earned={userData.Sawyer__c === true}
                description="Certified sawyer"
              />
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
