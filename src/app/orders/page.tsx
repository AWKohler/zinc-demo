"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Order {
  id: string;
  zincId: string;
  mode: "credentials" | "addax";
  idempotency: string;
  status: string;
  response: unknown;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnLoading, setReturnLoading] = useState<string | null>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (orderId: string) => {
    setReturnLoading(orderId);
    try {
      const response = await fetch("/api/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          quantity: returnQuantity,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Return request failed");
      }

      toast.success("Return request submitted successfully!");
      fetchOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Return request failed");
    } finally {
      setReturnLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "order_response":
        return "bg-green-100 text-green-800";
      case "initiated":
      case "request_processing":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTrackingInfo = (response: unknown) => {
    if (response && typeof response === 'object' && 'tracking' in response) {
      const trackingData = (response as { tracking?: unknown }).tracking;
      if (Array.isArray(trackingData) && trackingData.length > 0) {
        return trackingData[0];
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Orders Dashboard</h1>
          <Button onClick={() => window.location.href = "/"} variant="outline">
            New Order
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">No orders found</p>
            <Button onClick={() => window.location.href = "/"}>
              Place Your First Order
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const tracking = getTrackingInfo(order.response);
              const hasReturned = false; // TODO: Check returns table
              
              return (
                <Card key={order.id} className="p-6 space-y-4 rounded-2xl shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={order.mode === "credentials" ? "default" : "secondary"}>
                          {order.mode === "credentials" ? "Prime" : "Addax"}
                        </Badge>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Order ID: {order.id}
                      </p>
                      <p className="text-sm text-gray-600">
                        Zinc ID: {order.zincId}
                      </p>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-lg font-semibold">Pentel R.S.V.P. Pen</div>
                      <div className="text-sm text-gray-600">2-Pack</div>
                      {(() => {
                        const response = order.response as { price_components?: { total: number } };
                        return response?.price_components && (
                          <div className="text-lg font-bold">
                            ${(response.price_components.total / 100).toFixed(2)}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {tracking && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Tracking Information</h4>
                      <div className="text-sm space-y-1">
                        <p>Carrier: {tracking.carrier}</p>
                        <p>Tracking Number: {tracking.tracking_number}</p>
                        <a
                          href={tracking.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Track Package →
                        </a>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const response = order.response as { delivery_date?: string };
                    return response?.delivery_date && (
                      <div className="text-sm text-gray-600">
                        Expected Delivery: {new Date(response.delivery_date).toLocaleDateString()}
                      </div>
                    );
                  })()}

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/orders/${order.id}`}
                    >
                      View Details
                    </Button>

                    {order.status === "order_response" && !hasReturned && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Return Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Return Request</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="quantity">Quantity to Return</Label>
                              <Input
                                id="quantity"
                                type="number"
                                min="1"
                                max="2"
                                value={returnQuantity}
                                onChange={(e) => setReturnQuantity(parseInt(e.target.value))}
                              />
                            </div>
                            <Button
                              onClick={() => handleReturn(order.id)}
                              disabled={returnLoading === order.id}
                              className="w-full"
                            >
                              {returnLoading === order.id ? "Submitting..." : "Submit Return Request"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {hasReturned && (
                      <Badge variant="outline">Return Requested</Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}