import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";

const PlansPayment = () => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  // Mock data - would come from database
  const [membership, setMembership] = useState({
    tier: "Silver",
    frequency: "Annual",
    expirationDate: "December 31, 2025",
    isAutoRenew: true,
    paymentMethod: {
      lastFour: "5821",
      expiry: "03/29",
    },
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const handleAutoRenew = () => {
    console.log("Auto-renew enabled with payment info:", paymentInfo);
    setMembership({ ...membership, isAutoRenew: true });
    setShowPaymentForm(false);
  };

  const handleUpdatePayment = () => {
    console.log("Payment method updated:", paymentInfo);
    setShowPaymentForm(false);
  };

  const handleCancelAutoRenew = () => {
    console.log("Auto-renew cancelled");
    setMembership({ ...membership, isAutoRenew: false });
    setShowCancelConfirmation(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Plans and Payment</h1>

        {/* Current Membership Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>My Current Membership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Membership</span>
              <span className="font-medium text-foreground">
                {membership.tier} {membership.frequency} Membership
                {membership.isAutoRenew && " (Auto-Renew)"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">
                {membership.isAutoRenew ? "Renews On" : "Expiration Date"}
              </span>
              <span className="font-medium text-foreground">{membership.expirationDate}</span>
            </div>
          </CardContent>
        </Card>

        {/* Auto-Renew Section */}
        <Card>
          <CardHeader>
            <CardTitle>Auto-Renew</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Not on auto-renew, show enable button */}
            {!membership.isAutoRenew && !showPaymentForm && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Your membership is not set to auto-renew.
                </p>
                <Button onClick={() => setShowPaymentForm(true)}>
                  Auto-renew your membership
                </Button>
              </div>
            )}

            {/* On auto-renew, show current payment method */}
            {membership.isAutoRenew && !showPaymentForm && !showCancelConfirmation && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Current Payment Method</h3>
                  <p className="text-muted-foreground">
                    ************{membership.paymentMethod.lastFour} exp {membership.paymentMethod.expiry}
                  </p>
                </div>

                <Button onClick={() => setShowPaymentForm(true)}>
                  Update Debit or Credit Card
                </Button>

                <div className="pt-4 border-t border-border">
                  <button
                    onClick={() => setShowCancelConfirmation(true)}
                    className="text-primary hover:underline text-sm"
                  >
                    Cancel Auto-Renew
                  </button>
                </div>
              </div>
            )}

            {/* Cancel confirmation */}
            {showCancelConfirmation && (
              <div className="space-y-6">
                <p className="text-foreground">
                  I want to cancel my plan's auto-renewal. By cancelling, I will no longer receive benefits after {membership.expirationDate}.
                </p>

                <div className="flex gap-4">
                  <Button onClick={handleCancelAutoRenew}>
                    Yes, Cancel Auto Renew
                  </Button>
                  <Button variant="outline" onClick={() => setShowCancelConfirmation(false)}>
                    Keep Auto Renew
                  </Button>
                </div>
              </div>
            )}

            {/* Payment form for enabling or updating */}
            {showPaymentForm && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-foreground mb-4">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Payment Information</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardholderName">Cardholder Name</Label>
                    <Input
                      id="cardholderName"
                      placeholder="Name on card"
                      value={paymentInfo.cardholderName}
                      onChange={(e) =>
                        setPaymentInfo({ ...paymentInfo, cardholderName: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentInfo.cardNumber}
                      onChange={(e) =>
                        setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={paymentInfo.expiry}
                        onChange={(e) =>
                          setPaymentInfo({ ...paymentInfo, expiry: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={paymentInfo.cvv}
                        onChange={(e) =>
                          setPaymentInfo({ ...paymentInfo, cvv: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setShowPaymentForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={membership.isAutoRenew ? handleUpdatePayment : handleAutoRenew}>
                    {membership.isAutoRenew ? "Update Payment Method" : "Auto Renew"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlansPayment;
