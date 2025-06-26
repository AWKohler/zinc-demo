"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Home() {
  const [mode, setMode] = useState<"credentials" | "addax">("addax");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    email: "",
    password: "",
    totpKey: "",
    cardName: "",
    cardNumber: "",
    cardCvv: "",
    cardMonth: "",
    cardYear: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        mode,
        address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_line1: formData.address1,
          address_line2: formData.address2 || undefined,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          country: "US",
        },
        ...(mode === "credentials" && {
          credentials: {
            email: formData.email,
            password: formData.password,
            totp_2fa_key: formData.totpKey || undefined,
          },
          payment: {
            name_on_card: formData.cardName,
            number: formData.cardNumber,
            security_code: formData.cardCvv,
            expiration_month: parseInt(formData.cardMonth),
            expiration_year: parseInt(formData.cardYear),
          },
        }),
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Checkout failed");
      }

      toast.success("Order placed successfully!");
      window.location.href = "/orders";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="p-6 space-y-6 rounded-2xl shadow-md">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Pentel R.S.V.P. Ballpoint Pen</h1>
            <div className="bg-gray-100 rounded-lg p-8">
              <div className="w-32 h-32 bg-blue-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🖊️</span>
              </div>
              <p className="text-gray-600">2-Pack Medium Point Black Ink</p>
              <p className="text-2xl font-bold mt-2">$0.99</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4">
              {/* <Button
                type="button"
                variant={mode === "credentials" ? "default" : "outline"}
                onClick={() => setMode("credentials")}
                className="flex-1"
              >
                <Badge variant="default" className="mr-2">Prime</Badge>
                Use my Amazon account
              </Button> */}
              <Button
                type="button"
                variant={mode === "addax" ? "default" : "outline"}
                onClick={() => setMode("addax")}
                className="flex-1"
              >
                <Badge variant="secondary" className="mr-2">Addax</Badge>
                Anonymous checkout
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address1">Address Line 1</Label>
              <Input
                id="address1"
                value={formData.address1}
                onChange={(e) => setFormData(prev => ({ ...prev, address1: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="address2">Address Line 2 (Optional)</Label>
              <Input
                id="address2"
                value={formData.address2}
                onChange={(e) => setFormData(prev => ({ ...prev, address2: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="CA"
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  required
                />
              </div>
            </div>

            {mode === "credentials" && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Amazon Account</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Amazon Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Amazon Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="totpKey">2FA Key (Optional)</Label>
                      <Input
                        id="totpKey"
                        value={formData.totpKey}
                        onChange={(e) => setFormData(prev => ({ ...prev, totpKey: e.target.value }))}
                        placeholder="TOTP secret key"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input
                        id="cardName"
                        value={formData.cardName}
                        onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: e.target.value }))}
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="cardCvv">CVV</Label>
                        <Input
                          id="cardCvv"
                          value={formData.cardCvv}
                          onChange={(e) => setFormData(prev => ({ ...prev, cardCvv: e.target.value }))}
                          maxLength={4}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardMonth">Month</Label>
                        <Input
                          id="cardMonth"
                          value={formData.cardMonth}
                          onChange={(e) => setFormData(prev => ({ ...prev, cardMonth: e.target.value }))}
                          placeholder="12"
                          maxLength={2}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardYear">Year</Label>
                        <Input
                          id="cardYear"
                          value={formData.cardYear}
                          onChange={(e) => setFormData(prev => ({ ...prev, cardYear: e.target.value }))}
                          placeholder="2025"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Processing..." : "Place Order"}
              </Button>
              <Button type="button" variant="outline" onClick={() => window.location.href = "/orders"}>
                View Orders
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}