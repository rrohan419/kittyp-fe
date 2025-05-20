import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchFilteredOrders, OrderFilterRequest, fetchOrderInvoice } from "@/services/orderService";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CalendarDays, FileText, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/module/store/hooks";


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
    const useruuid = useAppSelector((state) => state.userReducer?.uuid);

    const STATUS_COLORS: Record<string, string> = {
        CAPTURED: "bg-yellow-100 text-yellow-800",
        PROCESSING: "bg-blue-100 text-blue-700",
        SUCCESSFULL: "bg-green-100 text-green-800",
        REFUNDED: "bg-orange-100 text-orange-800",
        CANCELLED: "bg-red-100 text-red-700",
        DEFAULT: "bg-gray-100 text-gray-600",
    };
    const [loadingInvoiceForOrder, setLoadingInvoiceForOrder] = useState<string | null>(null);


    const handleViewInvoice = async (orderNumber: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setLoadingInvoiceForOrder(orderNumber);
            const invoiceUrl = await fetchOrderInvoice(orderNumber, useruuid);
            window.open(invoiceUrl, '_blank');
        } catch (error) {
            toast.error("Failed to get invoice. Please try again later.");
            console.error("Error fetching invoice:", error);
        } finally {
            setLoadingInvoiceForOrder(null);
        }
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
                <CardContent className="py-8">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-gray-600">
                        You don't have any orders yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const hasNextPage = !ordersData.data.isLast;
    const hasPreviousPage = !ordersData.data.isFirst;

    return (
        <div className="space-y-4">
            {ordersData.data.models.map((order) => (
                <Card
                    key={`order-list-ordert-uuid-${order.orderNumber}`}
                    className="overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer bg-card/80 backdrop-blur-sm border border-border/50"
                    onClick={() => navigate(`/orders/${order.orderNumber}`)}
                >
                    <div className="flex flex-col sm:flex-row w-full">
                        <div className="flex-grow p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row justify-between gap-3">
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                        <h3 className="text-base font-medium text-primary">
                                            Order #{order.orderNumber}
                                        </h3>
                                        <Badge
                                            className={`text-xs px-2 py-0.5 border ${
                                                STATUS_COLORS[order.status] || STATUS_COLORS.DEFAULT
                                            } inline-flex items-center self-start sm:self-auto`}
                                        >
                                            {order.status}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        <span>
                                            Placed {order.createdAt ? 
                                                formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : 
                                                "Date not available"
                                            }
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                                    <span className="font-medium text-lg">₹{order.totalAmount}</span>
                                    <span className="text-xs text-muted-foreground sm:mt-1">
                                        {order.orderItems.length} {order.orderItems.length === 1 ? "item" : "items"}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mt-3 flex gap-2 flex-wrap">
                                {order.orderItems.slice(0, 4).map((item) => (
                                    <div 
                                        key={item.product.uuid} 
                                        className="relative h-14 w-14 rounded-md overflow-hidden border border-border/50 bg-muted"
                                    >
                                        <img
                                            src={item.product.productImageUrls?.[0] || "/placeholder.svg"}
                                            alt={item.product.name}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                ))}
                                {order.orderItems.length > 4 && (
                                    <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                                        +{order.orderItems.length - 4}
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs"
                                    onClick={(e) => handleViewInvoice(order.orderNumber, e)}
                                    disabled={loadingInvoiceForOrder === order.orderNumber}
                                >
                                    {loadingInvoiceForOrder === order.orderNumber ? (
                                        <span className="flex items-center">
                                            <span className="animate-spin mr-1.5 h-3 w-3 border-2 border-muted-foreground/40 border-t-primary rounded-full"></span>
                                            Loading...
                                        </span>
                                    ) : (
                                        <>
                                            <FileText className="h-3.5 w-3.5" /> 
                                            View Invoice
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}

            {/* Pagination Controls */}
            {(hasNextPage || hasPreviousPage) && (
                <div className="flex justify-center gap-3 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        disabled={!hasPreviousPage}
                        onClick={() => {
                            setPage(page - 1);
                            window.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                            });
                        }}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        disabled={!hasNextPage}
                        onClick={() => {
                            setPage(page + 1);
                            window.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                            });
                        }}
                    >
                        Next
                    </Button>
                </div>
            )}

        </div>
    );
};


