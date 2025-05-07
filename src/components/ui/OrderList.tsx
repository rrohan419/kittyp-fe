// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { CalendarDays } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";
// import { LoadingState } from "@/components/ui/LoadingState";
// import { fetchFilteredOrders, OrderFilterRequest } from "@/services/orderService";
// import { useQuery } from "@tanstack/react-query";
// import { Button } from "@/components/ui/button"; // Assuming you're using shadcn/ui for Button

// interface OrderListProps {
//     page: number;
//     filters: OrderFilterRequest;
//     setPage: (page: number) => void;
// }

// export const OrderList: React.FC<OrderListProps> = ({ page, filters, setPage }) => {
//     const { data: ordersData, isLoading, isError, } = useQuery({
//         queryKey: ['orders', page, filters],
//         queryFn: () => fetchFilteredOrders(page, 10, filters),
//         placeholderData: (previousData) => previousData,
//     });

//     const STATUS_COLORS: Record<string, string> = {
//         CREATED: "bg-yellow-100 text-yellow-800",
//         PROCESSING: "bg-blue-100 text-blue-700",
//         DELIVERED: "bg-green-100 text-green-800",
//         CANCELLED: "bg-red-100 text-red-700",
//         DEFAULT: "bg-gray-100 text-gray-600",
//     };

//     if (isLoading) {
//         return <LoadingState message="Loading your orders..." />;
//     }

//     if (isError) {
//         return (
//             <div className="text-red-500 text-center my-4">Error loading orders.</div>
//         );
//     }

//     if (!ordersData?.data.models.length) {
//         return (
//             <Card className="glass text-center animate-fade-in">
//                 <CardContent>
//                     <p className="text-gray-600 py-8">
//                         You don't have any orders yet.
//                     </p>
//                 </CardContent>
//             </Card>
//         );
//     }

//     const hasNextPage = !ordersData.data.isLast;
//     const hasPreviousPage = !ordersData.data.isFirst;


//     return (
//         <div className="space-y-6">
//             {ordersData.data.models.map((order) => (
//                 <Card
//                     key={order.orderNumber}
//                     className="glass-effect bg-gradient-to-br from-white/80 via-kitty-100/60 to-kitty-50/80 card-hover shadow-[0_8px_36px_0_rgba(155,85,255,.08)] border-0"
//                 >
//                     <CardHeader className="flex flex-row justify-between items-center pb-2">
//                         <div>
//                             <CardTitle className="text-lg font-bold">
//                                 <span className="text-kitty-800">Order #{order.orderNumber}</span>
//                             </CardTitle>
//                             <CardDescription className="flex items-center gap-2 mt-1">
//                                 <Badge
//                                     className={
//                                         "rounded px-2 py-1 font-bold " +
//                                         (STATUS_COLORS[order.status] || STATUS_COLORS.DEFAULT)
//                                     }
//                                 >
//                                     {order.status}
//                                 </Badge>{" "}
//                                 <span className="text-xs text-gray-500">
//                                     <CalendarDays className="inline-block h-4 w-4 mr-0.5 mb-0.5" />
//                                     {order.createdAt ? (
//                                         <>
//                                             Placed{" "}
//                                             {formatDistanceToNow(new Date(order.createdAt), {
//                                                 addSuffix: true,
//                                             })}
//                                         </>
//                                     ) : (
//                                         "Date not available"
//                                     )}
//                                 </span>
//                             </CardDescription>
//                         </div>
//                         <div className="flex flex-col items-end min-w-[112px]">
//                             <span className="font-semibold text-kitty-700 text-xl">
//                                 ₹{order.totalAmount}
//                             </span>
//                             <span className="text-xs text-gray-500">
//                                 {order.orderItems.length} item
//                                 {order.orderItems.length > 1 ? "s" : ""}
//                             </span>
//                         </div>
//                     </CardHeader>
//                     <CardContent className="pt-1">
//                         <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8">
//                             <div className="flex -space-x-3">
//                                 {order.orderItems.slice(0, 3).map((item) => (
//                                     <img
//                                         key={item.product.uuid}
//                                         className="w-12 h-12 rounded-lg border-2 border-white shadow-md object-cover bg-muted ring-2 ring-kitty-100"
//                                         src={
//                                             item.product.productImageUrls?.[0] ||
//                                             "https://placehold.co/100x100?text=Product"
//                                         }
//                                         alt={item.product.name}
//                                         loading="lazy"
//                                     />
//                                 ))}
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             ))}

//             {/* Pagination Controls */}
//             <div className="flex justify-center gap-4 mt-4">
//                 <Button
//                     variant="outline"
//                     disabled={!hasPreviousPage}
//                     // onClick={() => setPage(page - 1)}
//                     onClick={() => {
//                         setPage(page -1);
//                         window.scrollTo({
//                             top: 0,
//                             behavior: 'smooth', // Smooth scrolling to the top
//                         });
//                     }}
//                 >
//                     Previous
//                 </Button>
//                 <Button
//                     variant="outline"
//                     disabled={!hasNextPage}
//                     // onClick={() => setPage(page + 1)}
//                     onClick={() => {
//                         setPage(page + 1);
//                         window.scrollTo({
//                             top: 0,
//                             behavior: 'smooth', // Smooth scrolling to the top
//                         });
//                     }}
//                 >
//                     Next
//                 </Button>
//             </div>
//         </div>
//     );
// };




import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchFilteredOrders, OrderFilterRequest } from "@/services/orderService";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface OrderListProps {
    page: number;
    filters: OrderFilterRequest;
    setPage: (page: number) => void;
}

export const OrderList: React.FC<OrderListProps> = ({ page, filters, setPage }) => {
    const navigate = useNavigate();
    const { data: ordersData, isLoading, isError } = useQuery({
        queryKey: ['orders', page, filters],
        queryFn: () => fetchFilteredOrders(page, 10, filters),
        placeholderData: (previousData) => previousData,
    });

    const STATUS_COLORS: Record<string, string> = {
        CAPTURED: "bg-yellow-100 text-yellow-800",
        PROCESSING: "bg-blue-100 text-blue-700",
        SUCCESSFULL: "bg-green-100 text-green-800",
        REFUNDED: "bg-orange-100 text-orange-800",
        CANCELLED: "bg-red-100 text-red-700",
        DEFAULT: "bg-gray-100 text-gray-600",
    };

    if (isLoading) {
        return <LoadingState message="Loading your orders..." />;
    }

    if (isError) {
        return (
            <div className="text-red-500 text-center my-4">Error loading orders.</div>
        );
    }

    if (!ordersData?.data.models.length) {
        return (
            <Card className="glass text-center animate-fade-in">
                <CardContent>
                    <p className="text-gray-600 py-8">
                        You don't have any orders yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const hasNextPage = !ordersData.data.isLast;
    const hasPreviousPage = !ordersData.data.isFirst;

    return (
        <div className="space-y-6">
            {ordersData.data.models.map((order) => (
                <Card
                    key={`order-list-ordert-uuid-${order.orderNumber}`}
                    className="glass-effect bg-gradient-to-br from-white/80 via-kitty-100/60 to-kitty-50/80 card-hover shadow-[0_8px_36px_0_rgba(155,85,255,.08)] border-0 cursor-pointer w-full"
                    onClick={() => navigate(`/orders/${order.orderNumber}`)}
                >
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 gap-2">
                        <div>
                            <CardTitle className="text-lg font-bold">
                                <span className="text-kitty-800">Order #{order.orderNumber}</span>
                            </CardTitle>
                            <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
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
                        {/* <div className="flex flex-col items-end min-w-[112px]"> */}
                        <div className="flex flex-col items-end min-w-[112px] mt-2 sm:mt-0">

                            <span className="font-semibold text-kitty-700 text-xl">
                                ₹{order.totalAmount}
                            </span>
                            <span className="text-xs text-gray-500">
                                {order.orderItems.length} item
                                {order.orderItems.length > 1 ? "s" : ""}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-1 overflow-x-auto">
                        <div className="flex gap-4">
                            <div className="flex -space-x-3 flex-nowrap overflow-visible">
                                {order.orderItems.slice(0, 3).map((item) => (
                                    <img
                                        key={`order-list-product-uuid-${item.product.uuid}-${order.orderNumber}`}
                                        className="w-12 h-12 rounded-lg border-2 border-white shadow-md object-cover bg-muted ring-2 ring-kitty-100"
                                        src={item.product.productImageUrls?.[0] || "https://placehold.co/100x100?text=Product"}
                                        alt={item.product.name}
                                        loading="lazy"
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>

                </Card>
            ))}

            {/* Pagination Controls */}
            <div className="flex justify-center gap-4 mt-4">
                <Button
                    variant="outline"
                    disabled={!hasPreviousPage}
                    onClick={() => {
                        setPage(page - 1);
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth',
                        });
                    }}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    disabled={!hasNextPage}
                    onClick={() => {
                        setPage(page + 1);
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth',
                        });
                    }}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};


