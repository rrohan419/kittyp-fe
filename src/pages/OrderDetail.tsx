
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

const STATUS_COLORS: Record<string, string> = {
    CREATED: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-700",
    // fallback
    DEFAULT: "bg-gray-100 text-gray-600",
};

// Replace this with a real fetch in future, e.g. useQuery with orderId
const orders = [
    {
        orderNumber: "IND-KP000001",
        totalAmount: 1200,
        createdAt: "2025-04-22T17:31:34.719304",
        status: "PROCESSING",
        shippingAddress: {
            street: "test street 1",
            city: "test city",
            state: "test state",
            postalCode: "1234",
            country: "India",
        },
        billingAddress: {
            street: "test street 2",
            city: "test city 2",
            state: "test state 2",
            postalCode: "1234",
            country: "India 2",
        },
        orderItems: [
            {
                product: {
                    uuid: "36e3fce8-4279-4d5d-8de9-8f3aec75ca8d",
                    name: "Test product",
                    description: "Test product description",
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

export default function OrderDetail() {
    const { orderId } = useParams<{ orderId: string }>();
    const order = orders.find((o) => o.orderNumber === orderId);

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
                        Order <span className="text-kitty-600">#{order.orderNumber}</span>
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
                                    {order.createdAt ? (
                                        <>
                                            Placed on{" "}
                                            {format(new Date(order.createdAt), "do MMMM yyyy")}
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
                                ₹{order.totalAmount}
                            </span>
                            <span className="text-xs text-gray-500">
                                {order.orderItems.length} item{order.orderItems.length > 1 ? "s" : ""}
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
                                    {order.orderItems.map((item, i) => (
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
                                    <div>
                                        {order.shippingAddress.street}
                                    </div>
                                    <div>
                                        {order.shippingAddress.city},{" "}
                                        {order.shippingAddress.state} {order.shippingAddress.postalCode}
                                    </div>
                                    <div>
                                        {order.shippingAddress.country}
                                    </div>
                                </div>
                            </div>
                            {/* Billing Address */}
                            <div className="flex-1 bg-white/70 rounded-2xl shadow px-4 py-3 border">
                                <span className="flex items-center gap-1 font-semibold text-kitty-800">
                                    <FileText className="h-4 w-4 mr-1" /> Billing Address
                                </span>
                                <div className="text-gray-700 text-sm mt-1 space-y-0.5">
                                    <div>
                                        {order.billingAddress.street}
                                    </div>
                                    <div>
                                        {order.billingAddress.city},{" "}
                                        {order.billingAddress.state} {order.billingAddress.postalCode}
                                    </div>
                                    <div>
                                        {order.billingAddress.country}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Total */}
                        <div className="mt-8 flex justify-end">
                            <div className="rounded-full px-6 py-3 bg-gradient-to-r from-kitty-200 to-kitty-100 text-kitty-800 font-extrabold text-lg shadow">
                                Total Paid: ₹{order.totalAmount}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </>
    );
}
