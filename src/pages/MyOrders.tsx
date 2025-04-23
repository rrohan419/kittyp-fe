
import { Link } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Package, ArrowRight } from "lucide-react";
import React from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { formatDistanceToNow } from "date-fns";


const STATUS_COLORS: Record<string, string> = {
    CREATED: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-700",
    // fallback
    DEFAULT: "bg-gray-100 text-gray-600",
};

// Mock paginated API sample (replace with useQuery when backend is ready)
const sampleOrders = [
    {
        orderNumber: "IND-KP000001",
        totalAmount: 1200,
        createdAt: "2025-04-22T17:31:34.719304",
        status: "CREATED",
        shippingAddress: {
            street: "test street 1",
            city: "test city",
            state: "test state",
            postalCode: "1234",
            country: "India",
        },
        orderItems: [
            {
                product: {
                    uuid: "36e3fce8-4279-4d5d-8de9-8f3aec75ca8d",
                    name: "Test product",
                    price: 199,
                    productImageUrls: [
                        "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y3V0ZSUyMGNhdHxlbnwwfHwwfHx8MA%3D%3D",
                    ],
                },
                quantity: 1,
                price: 122,
                itemDetails: { size: "11x12", color: "red" },
            },
        ],
    },
];

export default function MyOrders() {
    // In real implementation, fetch paginated orders with useQuery and loading states
    const orders = sampleOrders;

    

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-2 pt-24 pb-8 py-8 max-w-3xl min-h-[80vh]">
                <h1 className="text-3xl font-extrabold text-kitty-600 mb-6 text-center bg-gradient-to-r from-kitty-400/80 to-kitty-600/80 bg-clip-text text-transparent animate-fade-in">
                    <Package className="inline-block mr-2 mb-1 text-kitty-500" /> My Orders
                </h1>

                {orders.length === 0 ? (
                    <Card className="glass text-center animate-fade-in">
                        <CardContent>
                            <p className="text-gray-600 py-8">
                                You don&apos;t have any orders yet.{" "}
                                <Link to="/products" className="text-kitty-600 underline font-medium">
                                    Shop Now
                                </Link>
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <Card
                                key={order.orderNumber}
                                className="glass-effect bg-gradient-to-br from-white/80 via-kitty-100/60 to-kitty-50/80 card-hover shadow-[0_8px_36px_0_rgba(155,85,255,.08)] border-0"
                            >
                                <CardHeader className="flex flex-row justify-between items-center pb-2">
                                    <div>
                                        <CardTitle className="text-lg font-bold">
                                            <span className="text-kitty-800">Order #{order.orderNumber}</span>
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                            <Badge
                                                className={
                                                    "rounded px-2 py-1 font-bold " +
                                                    (STATUS_COLORS[order.status] || STATUS_COLORS.DEFAULT)
                                                }
                                            >
                                                {order.status}
                                            </Badge>{" "}
                                            <span className="text-xs text-gray-500">
                                                <CalendarDays className="inline-block h-4 w-4 mr-0.5 mb-0.5" />
                                                {/* Placeholder "Placed Today" -- use order date if present */}
                                                {/* Placed Today */}
                                                {/* Placed {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })} */}
                                                {order.createdAt ? (
                                                    <>
                                                        Placed{" "}
                                                        {formatDistanceToNow(new Date(order.createdAt), {
                                                            addSuffix: true,
                                                        })}
                                                    </>
                                                ) : (
                                                    "Date not available"
                                                )}
                                            </span>
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col items-end min-w-[112px]">
                                        <span className="font-semibold text-kitty-700 text-xl">
                                            ₹{order.totalAmount}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {order.orderItems.length} item
                                            {order.orderItems.length > 1 ? "s" : ""}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-1">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8">
                                        <div className="flex -space-x-3">
                                            {order.orderItems.slice(0, 3).map((item, idx) => (
                                                <img
                                                    key={idx}
                                                    className="w-12 h-12 rounded-lg border-2 border-white shadow-md object-cover bg-muted ring-2 ring-kitty-100"
                                                    src={
                                                        item.product.productImageUrls?.[0] ||
                                                        "https://placehold.co/100x100?text=Product"
                                                    }
                                                    alt={item.product.name}
                                                    loading="lazy"
                                                />
                                            ))}
                                            {order.orderItems.length > 3 && (
                                                <span className="ml-3 text-xs py-2 px-3 rounded-full bg-kitty-100 text-kitty-800 font-bold">
                                                    +{order.orderItems.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                                            <div>
                                                <span className="text-sm text-gray-700">
                                                    {order.orderItems.map((item) => item.product.name).join(", ")}
                                                </span>
                                            </div>
                                            <Link
                                                to={`/orders/${order.orderNumber}`}
                                                className="inline-flex items-center text-kitty-600 rounded-full px-3 py-2 font-bold bg-kitty-100 hover:bg-kitty-200 hover:text-kitty-800 shadow transition-all hover-lift"
                                            >
                                                View Details
                                                <ArrowRight className="ml-1 h-4 w-4 font-bold" />
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}
