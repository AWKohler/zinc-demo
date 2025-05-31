"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const { id } = await params;
      const response = await fetch(`/api/orders/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-8 text-center">
            <p className="text-red-600 mb-4">Order not found</p>
            <Button onClick={() => window.location.href = "/orders"}>
              Back to Orders
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Order Details</h1>
          <Button onClick={() => window.location.href = "/orders"} variant="outline">
            Back to Orders
          </Button>
        </div>

        <Card className="p-6 space-y-6 rounded-2xl shadow-md">
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={order.mode === "credentials" ? "default" : "secondary"}>
                {order.mode === "credentials" ? "Prime" : "Addax"}
              </Badge>
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Order Information</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Order ID:</strong> {order.id}</p>
                  <p><strong>Zinc Request ID:</strong> {order.zincId}</p>
                  <p><strong>Idempotency Key:</strong> {order.idempotency}</p>
                  <p><strong>Mode:</strong> {order.mode}</p>
                  <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                  <p><strong>Last Updated:</strong> {new Date(order.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Product</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> Pentel R.S.V.P. Ballpoint Pen</p>
                  <p><strong>SKU:</strong> B002YM4WME</p>
                  <p><strong>Quantity:</strong> 1 (2-Pack)</p>
                  {(() => {
                    const response = order.response as { price_components?: { subtotal: number; shipping: number; tax: number; total: number } };
                    return response?.price_components && (
                      <div className="mt-2">
                        <p><strong>Subtotal:</strong> ${(response.price_components.subtotal / 100).toFixed(2)}</p>
                        <p><strong>Shipping:</strong> ${(response.price_components.shipping / 100).toFixed(2)}</p>
                        <p><strong>Tax:</strong> ${(response.price_components.tax / 100).toFixed(2)}</p>
                        <p><strong>Total:</strong> ${(response.price_components.total / 100).toFixed(2)}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {(() => {
            const response = order.response as { tracking?: Array<{ carrier: string; tracking_number: string; tracking_url: string }> };
            return response?.tracking && response.tracking.length > 0 && (
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Tracking Information</h3>
                {response.tracking.map((track, index: number) => (
                  <div key={index} className="space-y-1 text-sm">
                    <p><strong>Carrier:</strong> {track.carrier}</p>
                    <p><strong>Tracking Number:</strong> {track.tracking_number}</p>
                    <a
                      href={track.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Track Package →
                    </a>
                  </div>
                ))}
              </div>
            );
          })()}

          {(() => {
            const response = order.response as { delivery_date?: string };
            return response?.delivery_date && (
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Delivery Information</h3>
                <p className="text-sm">
                  <strong>Expected Delivery:</strong> {new Date(response.delivery_date).toLocaleDateString()}
                </p>
              </div>
            );
          })()}

          <div>
            <h3 className="font-semibold mb-2">Raw Zinc Response</h3>
            <div className="bg-gray-100 p-4 rounded-lg overflow-auto">
              <pre className="text-xs">
                {JSON.stringify(order.response, null, 2)}
              </pre>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => window.location.href = "/orders"}
              variant="outline"
            >
              Back to Orders
            </Button>
            <Button
              onClick={fetchOrder}
              variant="outline"
            >
              Refresh
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}