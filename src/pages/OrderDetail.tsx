import { useParams, Link } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    CalendarDays,
    ArrowLeft,
    PackageOpen,
    ListOrdered,
    FileText,
    Info,
    RefreshCw,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { fetchOrderByOrderNumber, fetchOrderInvoice } from "@/services/orderService";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/button";
import { handleCheckout } from "@/services/paymentService";
import { useAppSelector } from "@/module/store/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { CurrencyType } from "@/services/cartService";

const STATUS_COLORS: Record<string, string> = {
    CREATED: "bg-yellow-100 text-yellow-800",
    SUCCESSFULL: "bg-green-100 text-green-800",
    DELIVERED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-orange-100 text-orange-800",
    CANCELLED: "bg-red-100 text-red-700",
    REFUND_INITIATED: "bg-orange-100 text-orange-800",
    CAPTURED: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-700",
    PAYMENT_PENDING: "bg-orange-100 text-orange-800",
    PAYMENT_TIMEOUT: "bg-red-100 text-red-700",
    PAYMENT_CANCELLED: "bg-red-100 text-red-700",
    DEFAULT: "bg-gray-100 text-gray-600",
};

const STATUS_MESSAGES: Record<string, { message: string; icon: JSX.Element }> = {
    CREATED: {
        message: "Order has been created and is awaiting payment",
        icon: <RefreshCw className="h-4 w-4" />
    },
    SUCCESSFULL: {
        message: "Payment successful! Your order is being processed",
        icon: <PackageOpen className="h-4 w-4" />
    },
    DELIVERED: {
        message: "Order has been delivered successfully",
        icon: <PackageOpen className="h-4 w-4" />
    },
    FAILED: {
        message: "Payment failed. Please try again",
        icon: <Info className="h-4 w-4" />
    },
    REFUNDED: {
        message: "Order has been refunded",
        icon: <RefreshCw className="h-4 w-4" />
    },
    CANCELLED: {
        message: "Order has been cancelled",
        icon: <Info className="h-4 w-4" />
    },
    REFUND_INITIATED: {
        message: "Refund is being processed",
        icon: <RefreshCw className="h-4 w-4" />
    },
    CAPTURED: {
        message: "Payment has been captured",
        icon: <PackageOpen className="h-4 w-4" />
    },
    PROCESSING: {
        message: "Order is being processed",
        icon: <RefreshCw className="h-4 w-4 animate-spin" />
    },
    PAYMENT_PENDING: {
        message: "Payment is pending. Please complete the payment",
        icon: <Info className="h-4 w-4" />
    },
    PAYMENT_TIMEOUT: {
        message: "Payment session timed out. Please try again",
        icon: <Info className="h-4 w-4" />
    },
    PAYMENT_CANCELLED: {
        message: "Payment was cancelled. Please try again",
        icon: <Info className="h-4 w-4" />
    }
};

export default function OrderDetail() {
    const { orderId } = useParams<{ orderId: string }>();
    const user = useAppSelector((state) => state.cartReducer.user);
    const [processingPayment, setProcessingPayment] = useState(false);

    const {
        data: order,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => fetchOrderByOrderNumber(orderId!),
        enabled: !!orderId,
    });

    const canReinitiatePayment = (status: string) => {
        return ["PAYMENT_PENDING", "PAYMENT_TIMEOUT", "FAILED", "PAYMENT_CANCELLED"].includes(status);
    };

    const canViewInvoice = (status: string) => {
        return ["SUCCESSFULL", "DELIVERED"].includes(status);
    };

    const handleReinitiatePayment = async () => {
        if (!user || !order) {
            toast.error("Please login to reinitiate payment");
            return;
        }
        
        try {
            setProcessingPayment(true);
            // Convert the currency string to CurrencyType
            const currency = order.data.currency === 'INR' ? CurrencyType.INR : CurrencyType.USD;
            
            await handleCheckout(
                order.data.taxes,
                order.data.totalAmount,
                currency,
                order.data.orderNumber,
                user
            );
            toast.success("Payment initiated successfully");
        } catch (error) {
            console.error("Payment reinitiation failed:", error);
            toast.error("Failed to reinitiate payment. Please try again.");
        } finally {
            setProcessingPayment(false);
        }
    };

    const isPaymentSuccessful = (status: string) => {
        return ["SUCCESSFULL", "DELIVERED", "CAPTURED"].includes(status);
    };

    const renderStatusActions = (status: string) => {
        const statusInfo = STATUS_MESSAGES[status] || {
            message: "Order status unknown",
            icon: <Info className="h-4 w-4" />
        };

        return (
            <div className="flex flex-col gap-3 py-4 px-4 bg-white/50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge
                            className={
                                "rounded-full px-3 py-1 font-medium " +
                                (STATUS_COLORS[status] || STATUS_COLORS.DEFAULT)
                            }
                        >
                            {status}
                        </Badge>
                        <span className="text-gray-500 text-sm flex items-center">
                            <CalendarDays className="inline-block h-4 w-4 mr-1" />
                            {order.data.createdAt ? (
                                <>
                                    Placed on{" "}
                                    {format(new Date(order.data.createdAt), "do MMMM yyyy")}
                                </>
                            ) : (
                                "Date not available"
                            )}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-extrabold text-kitty-700">
                            ₹{order.data.totalAmount}
                        </span>
                        <span className="text-xs text-gray-500">
                            {order.data.orderItems.length} item{order.data.orderItems.length > 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        {statusInfo.icon}
                        {statusInfo.message}
                    </div>
                    <div className="flex items-center gap-2">
                        {canReinitiatePayment(status) && (
                            <Button
                                variant="default"
                                size="sm"
                                className="h-8 gap-1.5 text-xs bg-kitty-600 hover:bg-kitty-700"
                                onClick={handleReinitiatePayment}
                                disabled={processingPayment}
                            >
                                {processingPayment ? (
                                    <span className="flex items-center">
                                        <span className="animate-spin mr-1.5 h-3 w-3 border-2 border-white/40 border-t-white rounded-full"></span>
                                        Processing...
                                    </span>
                                ) : (
                                    <>
                                        <RefreshCw className="h-3.5 w-3.5" /> 
                                        Reinitiate Payment
                                    </>
                                )}
                            </Button>
                        )}
                        {canViewInvoice(status) && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                onClick={async () => {
                                    if (!user?.uuid) {
                                        toast.error("Please login to view invoice");
                                        return;
                                    }
                                    try {
                                        const invoiceUrl = await fetchOrderInvoice(order.data.orderNumber, user.uuid);
                                        window.open(invoiceUrl, '_blank');
                                    } catch (error) {
                                        toast.error("Failed to get invoice. Please try again later.");
                                        console.error("Error fetching invoice:", error);
                                    }
                                }}
                            >
                                <FileText className="h-3.5 w-3.5" /> 
                                View Invoice
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return <LoadingState message="Loading order details..." />;
    }

    if (isError || !order) {
        return <div className="text-red-500 text-center my-4">Error loading order details.</div>;
    }

    if (!order) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto px-4 pt-24 pb-8 py-12 max-w-2xl min-h-[80vh] flex flex-col items-center justify-center">
                    <Info className="h-8 w-8 text-red-500 mb-3" />
                    <p className="text-red-500 font-medium mb-4 text-center">Order not found.</p>
                    <Link to="/orders" className="text-kitty-600 underline text-base font-semibold hover:text-kitty-900 transition">
                        Back to Orders
                    </Link>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-2 pt-24 pb-8 py-10 max-w-3xl min-h-[80vh] fade-in">
                <div className="mb-8 flex items-center gap-2">
                    <Link to="/profile" className="inline-flex items-center text-kitty-600 hover:bg-kitty-100 px-3 py-2 rounded-lg transition hover-lift font-bold group">
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition" />
                        <span className="hidden sm:inline">Orders</span>
                    </Link>
                    <span className="text-2xl font-extrabold text-kitty-600">/</span>
                    <span className="text-base sm:text-xl font-bold text-gray-800">
                        #<span className="text-kitty-600">{order.data.orderNumber}</span>
                    </span>
                </div>
                <Card className="glass-effect mb-8 bg-gradient-to-br from-white/90 via-kitty-100/60 to-kitty-50/90 border-0 shadow-[0_12px_40px_0_rgba(155,85,255,.08)] animate-fade-in">
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-kitty-800 mb-4">
                            <PackageOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary/90 mr-2" />
                            Order Details
                        </CardTitle>
                        {renderStatusActions(order.data.status)}
                    </CardHeader>
                    <CardContent>
                        {/* Items Table */}
                        <div className="mb-4 mt-2">
                            <span className="flex items-center gap-2 text-base font-semibold mb-2 text-primary">
                                <ListOrdered className="h-4 w-4" />
                                Ordered Items
                            </span>
                            
                            {/* Mobile View for Items */}
                            <div className="sm:hidden space-y-4">
                                {order.data.orderItems.map((item, i) => (
                                    <div key={`order-item-mobile-${i}`} className="flex items-start gap-3 border-b pb-4">
                                        <img
                                            src={item.product.productImageUrls?.[0] || "https://placehold.co/80x80"}
                                            alt={item.product.name}
                                            className="w-16 h-16 object-cover rounded-md border"
                                        />
                                        <div className="flex-1">
                                            <Link
                                                to={`/product/${item.product.uuid}`}
                                                className="text-sm font-semibold text-kitty-600 hover:underline hover:text-kitty-800"
                                            >
                                                {item.product.name}
                                            </Link>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Qty: {item.quantity} × ₹{item.price}
                                            </div>
                                            <div className="text-sm font-semibold text-gray-700 mt-1">
                                                Total: ₹{item.quantity * item.price}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View for Items */}
                            <Table className="hidden sm:table">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Specs</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.data.orderItems.map((item, i) => (
                                        <TableRow key={`order-item-id-${i}`} className="hover:bg-kitty-50/40 transition">
                                            <TableCell className="flex items-center gap-3 py-4">
                                                <img
                                                    src={item.product.productImageUrls?.[0] || "https://placehold.co/80x80"}
                                                    alt={item.product.name}
                                                    className="w-12 h-12 object-cover rounded-md border"
                                                />
                                                <span className="text-sm font-semibold text-gray-800">
                                                    <Link
                                                        to={`/product/${item.product.uuid}`}
                                                        className="text-kitty-600 hover:underline hover:text-kitty-800"
                                                    >
                                                        {item.product.name}
                                                    </Link>
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs text-gray-700">
                                                    <div>Color: {item.itemDetails?.color || "-"}</div>
                                                    <div>Size: {item.itemDetails?.size || "-"}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-bold">{item.quantity}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold">₹{item.price}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Shipping & Billing - Only show on desktop */}
                        <div className="hidden sm:flex flex-col md:flex-row gap-8 mt-8">
                            {/* Shipping Address */}
                            <div className="flex-1 bg-white/70 rounded-2xl shadow px-4 py-3 border">
                                <span className="flex items-center gap-1 font-semibold text-kitty-800">
                                    <FileText className="h-4 w-4 mr-1" /> Shipping Address
                                </span>
                                <div className="text-gray-700 text-sm mt-1 space-y-0.5">
                                    {order.data.shippingAddress ? (
                                        <div className="text-gray-700 text-sm mt-1 space-y-0.5">
                                            <div>{order.data.shippingAddress.street}</div>
                                            <div>{order.data.shippingAddress.city}</div>
                                            <div>{order.data.shippingAddress.state}</div>
                                            <div>{order.data.shippingAddress.postalCode}</div>
                                            <div>{order.data.shippingAddress.country}</div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-red-500 mt-1">Shipping address not available</div>
                                    )}
                                </div>
                            </div>
                            {/* Billing Address */}
                            <div className="flex-1 bg-white/70 rounded-2xl shadow px-4 py-3 border">
                                <span className="flex items-center gap-1 font-semibold text-kitty-800">
                                    <FileText className="h-4 w-4 mr-1" /> Billing Address
                                </span>
                                <div className="text-gray-700 text-sm mt-1 space-y-0.5">
                                    {order.data.billingAddress ? (
                                        <div className="text-gray-700 text-sm mt-1 space-y-0.5">
                                            <div>{order.data.billingAddress.street}</div>
                                            <div>{order.data.billingAddress.city}</div>
                                            <div>{order.data.billingAddress.state}</div>
                                            <div>{order.data.billingAddress.postalCode}</div>
                                            <div>{order.data.billingAddress.country}</div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-red-500 mt-1">Billing address not available</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Total Breakdown - Simplified for mobile */}
                        <div className="mt-8 bg-white/70 rounded-2xl shadow px-4 py-3 border">
                            <span className="flex items-center gap-1 font-semibold text-kitty-800 mb-3">
                                <FileText className="h-4 w-4 mr-1" /> Order Summary
                            </span>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>₹{order.data?.subTotal ?? 0}</span>
                                </div>
                                {(order.data?.taxes?.otherTax ?? 0) + (order.data?.taxes?.serviceCharge ?? 0) > 0 && (
                                    <div className="flex justify-between">
                                        <span>Tax</span>
                                        <span>₹{((order.data?.taxes?.otherTax ?? 0) + (order.data?.taxes?.serviceCharge ?? 0)).toFixed(2)}</span>
                                    </div>
                                )}
                                {order.data.taxes.shippingCharges > 0 && (
                                    <div className="flex justify-between">
                                        <span>Delivery</span>
                                        <span>₹{order.data?.taxes?.shippingCharges ?? 0}</span>
                                    </div>
                                )}
                                <div className="border-t pt-2 flex justify-between font-bold text-kitty-800">
                                    <span>{isPaymentSuccessful(order.data.status) ? 'Total Paid' : 'To be Paid'}</span>
                                    <span>₹{order.data.totalAmount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Total - Show only on desktop */}
                        <div className="mt-8 hidden sm:flex justify-end">
                            <div className="rounded-full px-6 py-3 bg-gradient-to-r from-kitty-200 to-kitty-100 text-kitty-800 font-extrabold text-lg shadow">
                                {isPaymentSuccessful(order.data.status) ? 'Total Paid: ' : 'To be Paid: '}
                                ₹{order.data.totalAmount}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </>
    );
}
