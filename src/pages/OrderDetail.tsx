
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
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { fetchOrderByOrderNumber } from "@/services/orderService";
import { LoadingState } from "@/components/ui/LoadingState";

const STATUS_COLORS: Record<string, string> = {
    CREATED: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-700",
    // fallback
    DEFAULT: "bg-gray-100 text-gray-600",
};


export default function OrderDetail() {
    const { orderId } = useParams<{ orderId: string }>();
    console.group("order id ", orderId);

    const {
        data: order,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => fetchOrderByOrderNumber(orderId!),
        enabled: !!orderId, // only run if orderNumber exists
    });

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
                    <Link to="/orders" className="inline-flex items-center text-kitty-600 hover:bg-kitty-100 px-3 py-2 rounded-lg transition hover-lift font-bold group">
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition" />
                        Orders
                    </Link>
                    <span className="text-2xl font-extrabold text-kitty-600">/</span>
                    <span className="text-xl font-bold text-gray-800">
                        Order <span className="text-kitty-600">#{order.data.orderNumber}</span>
                    </span>
                </div>
                <Card className="glass-effect mb-8 bg-gradient-to-br from-white/90 via-kitty-100/60 to-kitty-50/90 border-0 shadow-[0_12px_40px_0_rgba(155,85,255,.08)] animate-fade-in">
                    <CardHeader className="flex sm:flex-row flex-col sm:justify-between items-center pb-4 sm:space-y-0 space-y-3">
                        <div className="flex flex-col gap-2">
                            <CardTitle className="text-xl font-bold flex items-center gap-2 text-kitty-800">
                                <PackageOpen className="h-6 w-6 text-primary/90 mr-2" />
                                Order Details
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <Badge
                                    className={
                                        "rounded px-2 py-1 font-bold " +
                                        (STATUS_COLORS[order.status] || STATUS_COLORS.DEFAULT)
                                    }
                                >
                                    {order.status}
                                </Badge>
                                <span className="text-gray-500 text-xs flex items-center">
                                    <CalendarDays className="inline-block h-4 w-4 mr-1" />
                                    {/* Placeholder for order date */}
                                    {order.data.createdAt ? (
                                        <>
                                            Placed on{" "}
                                            {format(new Date(order.data.createdAt), "do MMMM yyyy")}
                                            {/* For example: 21st March 2024 */}
                                        </>
                                    ) : (
                                        "Date not available"
                                    )}
                                </span>
                            </CardDescription>
                        </div>
                        <div className="sm:text-right text-left">
                            <span className="block text-2xl font-extrabold text-kitty-700">
                                ₹{order.data.totalAmount}
                            </span>
                            <span className="text-xs text-gray-500">
                                {order.data.orderItems.length} item{order.data.orderItems.length > 1 ? "s" : ""}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Items Table */}
                        <div className="mb-4 mt-2">
                            <span className="flex items-center gap-2 text-base font-semibold mb-2 text-primary">
                                <ListOrdered className="h-4 w-4" />
                                Ordered Items
                            </span>
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
                                        <TableRow key={i} className="hover:bg-kitty-50/40 transition">
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
                        {/* Shipping & Billing */}
                        <div className="flex flex-col md:flex-row gap-8 mt-8">
                            {/* Shipping Address */}
                            <div className="flex-1 bg-white/70 rounded-2xl shadow px-4 py-3 border">
                                <span className="flex items-center gap-1 font-semibold text-kitty-800">
                                    <FileText className="h-4 w-4 mr-1" /> Shipping Address
                                </span>
                                <div className="text-gray-700 text-sm mt-1 space-y-0.5">
                                    {/* <div>
                                        {order.data.shippingAddress.street}
                                    </div>
                                    <div>
                                        {order.data.shippingAddress.city},{" "}
                                        {order.data.shippingAddress.state} {order.data.shippingAddress.postalCode}
                                    </div>
                                    <div>
                                        {order.data.shippingAddress.country}
                                    </div> */}
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
                                    {/* <div>
                                        {order.data.billingAddress.street}
                                    </div>
                                    <div>
                                        {order.data.billingAddress.city},{" "}
                                        {order.data.billingAddress.state} {order.data.billingAddress.postalCode}
                                    </div>
                                    <div>
                                        {order.data.billingAddress.country}
                                    </div> */}
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
                        {/* Total */}
                        <div className="mt-8 flex justify-end">
                            <div className="rounded-full px-6 py-3 bg-gradient-to-r from-kitty-200 to-kitty-100 text-kitty-800 font-extrabold text-lg shadow">
                                Total Paid: ₹{order.data.totalAmount}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </>
    );
}
