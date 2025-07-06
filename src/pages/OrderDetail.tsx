import { useParams, Link, useNavigate } from "react-router-dom";
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
import { Footer } from "@/components/layout/Footer";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { fetchOrderByOrderNumber, fetchOrderInvoice } from "@/services/orderService";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/module/store/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { CurrencyType } from "@/services/cartService";
import { cn } from "@/lib/utils";
import { PaymentLoader } from "@/components/ui/PaymentLoader";
import { reinitiatePayment } from "@/utils/paymentUtils";

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
    DEFAULT: "bg-muted text-muted-foreground",
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
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.cartReducer.user);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [isPaymentVerifying, setIsPaymentVerifying] = useState(false);

    const {
        data: order,
        isLoading,
        isError,
        refetch
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
            
            await reinitiatePayment({
                order: order.data,
                user,
                onVerifying: () => setIsPaymentVerifying(true),
                onSuccess: () => refetch(),
                onComplete: () => {
                    setProcessingPayment(false);
                    setIsPaymentVerifying(false);
                }
            });
        } catch (error) {
            await refetch();
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
            <div className="flex flex-col gap-3 py-4 px-4 bg-card/50 rounded-lg border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Badge
                            className={cn(
                                "rounded-full px-3 py-1 font-medium w-fit",
                                STATUS_COLORS[status] || STATUS_COLORS.DEFAULT
                            )}
                        >
                            {status}
                        </Badge>
                        <span className="text-muted-foreground text-sm flex items-center">
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
                    <div className="hidden sm:block text-right">
                        <span className="block text-2xl font-extrabold text-primary">
                            ₹{order.data.totalAmount}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {order.data.orderItems.length} item{order.data.orderItems.length > 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {statusInfo.icon}
                        {statusInfo.message}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {canReinitiatePayment(status) && (
                            <Button
                                variant="default"
                                size="sm"
                                className="h-8 gap-1.5 text-xs w-full sm:w-auto"
                                onClick={handleReinitiatePayment}
                                disabled={processingPayment}
                            >
                                {processingPayment ? (
                                    <span className="flex items-center justify-center w-full">
                                        <span className="animate-spin mr-1.5 h-3 w-3 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full"></span>
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
                                className="h-8 gap-1.5 text-xs w-full sm:w-auto"
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

    if (isLoading || isPaymentVerifying) {
        return (
            <>
                <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center bg-white dark:bg-gray-950">
                    {isPaymentVerifying ? (
                        <PaymentLoader
                            message="Processing Your Order"
                            subMessage="Please wait while we verify your payment and process your order. Do not close or refresh this page."
                        />
                    ) : (
                        <LoadingState message="Loading order details..." />
                    )}
                </div>
                <Footer />
            </>
        );
    }

    if (isError || !order) {
        return <div className="text-destructive text-center my-4">Error loading order details.</div>;
    }

    if (!order) {
        return (
            <>
                <div className="container mx-auto px-4 pt-24 pb-8 py-12 max-w-2xl min-h-[80vh] flex flex-col items-center justify-center">
                    <Info className="h-8 w-8 text-destructive mb-3" />
                    <p className="text-destructive font-medium mb-4 text-center">Order not found.</p>
                    <Link to="/orders" className="text-primary hover:text-primary/90 underline text-base font-semibold transition">
                        Back to Orders
                    </Link>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <div className="container mx-auto px-4 pt-24 pb-8 max-w-3xl min-h-[80vh] fade-in">
                <div className="mb-6 flex items-center gap-2">
                    <Link to="/profile" className="inline-flex items-center text-primary hover:bg-accent px-3 py-2 rounded-lg transition hover-lift font-bold group">
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition" />
                        <span className="hidden sm:inline">Orders</span>
                    </Link>
                    <span className="text-2xl font-extrabold text-primary">/</span>
                    <span className="text-sm sm:text-xl font-bold text-foreground">
                        #<span className="text-primary">{order.data.orderNumber}</span>
                    </span>
                </div>

                <Card className="bg-gradient-to-br from-background via-accent/60 to-accent/20 border-border shadow-lg animate-fade-in">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground mb-4">
                            <PackageOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary mr-2" />
                            Order Details
                        </CardTitle>
                        {renderStatusActions(order.data.status)}
                    </CardHeader>

                    <CardContent className="p-4 sm:p-6">
                        {/* Items Section */}
                        <div className="mb-6">
                            <span className="flex items-center gap-2 text-base font-semibold mb-3 text-primary">
                                <ListOrdered className="h-4 w-4" />
                                Ordered Items
                            </span>
                            
                            {/* Mobile View for Items */}
                            <div className="sm:hidden space-y-4">
                                {order.data.orderItems.map((item, i) => (
                                    <div key={`order-item-mobile-${i}`} className="flex items-start gap-3 border-b border-border pb-4">
                                        <img
                                            src={item.product.productImageUrls?.[0] || "https://placehold.co/80x80"}
                                            alt={item.product.name}
                                            className="w-20 h-20 object-cover rounded-lg border border-border"
                                        />
                                        <div className="flex-1">
                                            <Link
                                                to={`/product/${item.product.uuid}`}
                                                className="text-sm font-semibold text-primary hover:underline hover:text-primary/90"
                                            >
                                                {item.product.name}
                                            </Link>
                                            <div className="text-xs text-muted-foreground mt-2">
                                                <div>Color: {item.itemDetails?.color || "-"}</div>
                                                <div>Size: {item.itemDetails?.size || "-"}</div>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-2">
                                                Qty: {item.quantity} × ₹{item.price}
                                            </div>
                                            <div className="text-sm font-semibold text-foreground mt-1">
                                                Total: ₹{item.quantity * item.price}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View for Items - Keep existing table code */}
                            <div className="hidden sm:block overflow-x-auto">
                                <Table>
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
                                            <TableRow key={`order-item-id-${i}`} className="hover:bg-accent/40 transition">
                                                <TableCell className="flex items-center gap-3 py-4">
                                                    <img
                                                        src={item.product.productImageUrls?.[0] || "https://placehold.co/80x80"}
                                                        alt={item.product.name}
                                                        className="w-12 h-12 object-cover rounded-md border border-border"
                                                    />
                                                    <span className="text-sm font-semibold text-foreground">
                                                        <Link
                                                            to={`/product/${item.product.uuid}`}
                                                            className="text-primary hover:underline hover:text-primary/90"
                                                        >
                                                            {item.product.name}
                                                        </Link>
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-muted-foreground">
                                                        <div>Color: {item.itemDetails?.color || "-"}</div>
                                                        <div>Size: {item.itemDetails?.size || "-"}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-foreground">{item.quantity}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-foreground">₹{item.price}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Shipping & Billing Addresses */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            {/* Shipping Address */}
                            <div className="bg-card/70 rounded-xl shadow px-4 py-3 border border-border">
                                <span className="flex items-center gap-1 font-semibold text-primary mb-2">
                                    <FileText className="h-4 w-4 mr-1" /> Shipping Address
                                </span>
                                {order.data.shippingAddress ? (
                                    <div className="text-muted-foreground text-sm space-y-0.5">
                                        <div>{order.data.shippingAddress.name}</div>
                                        <div>{order.data.shippingAddress.street}</div>
                                        <div>{order.data.shippingAddress.city}</div>
                                        <div>{order.data.shippingAddress.state}</div>
                                        <div>{order.data.shippingAddress.postalCode}</div>
                                        <div>{order.data.shippingAddress.country}</div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-destructive">Shipping address not available</div>
                                )}
                            </div>

                            {/* Billing Address */}
                            <div className="bg-card/70 rounded-xl shadow px-4 py-3 border border-border">
                                <span className="flex items-center gap-1 font-semibold text-primary mb-2">
                                    <FileText className="h-4 w-4 mr-1" /> Billing Address
                                </span>
                                {order.data.billingAddress ? (
                                    <div className="text-muted-foreground text-sm space-y-0.5">
                                        <div>{order.data.billingAddress.name}</div>
                                        <div>{order.data.billingAddress.street}</div>
                                        <div>{order.data.billingAddress.city}</div>
                                        <div>{order.data.billingAddress.state}</div>
                                        <div>{order.data.billingAddress.postalCode}</div>
                                        <div>{order.data.billingAddress.country}</div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-destructive">Billing address not available</div>
                                )}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="mt-6 bg-card/70 rounded-xl shadow px-4 py-3 border border-border">
                            <span className="flex items-center gap-1 font-semibold text-primary mb-3">
                                <FileText className="h-4 w-4 mr-1" /> Order Summary
                            </span>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-foreground">
                                    <span>Subtotal</span>
                                    <span>₹{order.data?.subTotal ?? 0}</span>
                                </div>
                                {(order.data?.taxes?.otherTax ?? 0) + (order.data?.taxes?.serviceCharge ?? 0) > 0 && (
                                    <div className="flex justify-between text-foreground">
                                        <span>Tax</span>
                                        <span>₹{((order.data?.taxes?.otherTax ?? 0) + (order.data?.taxes?.serviceCharge ?? 0)).toFixed(2)}</span>
                                    </div>
                                )}
                                {order.data.taxes.shippingCharges > 0 && (
                                    <div className="flex justify-between text-foreground">
                                        <span>Delivery</span>
                                        <span>₹{order.data?.taxes?.shippingCharges ?? 0}</span>
                                    </div>
                                )}
                                <div className="border-t border-border pt-2 flex justify-between font-bold text-primary">
                                    <span>{isPaymentSuccessful(order.data.status) ? 'Total Paid' : 'To be Paid'}</span>
                                    <span>₹{order.data.totalAmount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Total - Show on all screens */}
                        <div className="mt-6 flex justify-center sm:justify-end">
                            <div className="rounded-full px-6 py-3 bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-extrabold text-lg shadow w-full sm:w-auto text-center">
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
