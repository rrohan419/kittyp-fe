import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Package, Search } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { OrderList } from "@/components/ui/OrderList";
import { useState } from "react";
import { OrderFilterRequest } from "@/services/orderService";
import { useAppSelector } from "@/module/store/hooks";


const ORDER_STATUSES = [
    "CAPTURED",
    "PROCESSING",
    "SUCCESSFULL",
    "REFUNDED",
    "CANCELLED"
];

export default function MyOrders() {
    const [page, setPage] = useState(1);
    const userUuid = useAppSelector((state) => state.authReducer.user?.uuid);
    const [filters, setFilters] = useState<OrderFilterRequest>({
        userUuid: userUuid,
        orderNumber: null,
        orderStatus: null,
    });

    const handleOrderNumberChange = (value: string) => {
        setFilters(prev => ({ ...prev, orderNumber: value || null }));
        setPage(1);
    };

    const handleStatusChange = (value: string) => {
        setFilters(prev => ({ ...prev, orderStatus: value === "All" ? null : value }));
        setPage(1);
    };
    

    return (
        <>
            <div className="container mx-auto px-2 pt-24 pb-8 py-8 max-w-3xl min-h-[80vh]">
                <h1 className="text-3xl font-extrabold text-kitty-600 mb-6 text-center bg-gradient-to-r from-kitty-400/80 to-kitty-600/80 bg-clip-text text-transparent animate-fade-in">
                    <Package className="inline-block mr-2 mb-1 text-kitty-500" /> My Orders
                </h1>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search order number..."
                                        className="pl-8"
                                        onChange={(e) => handleOrderNumberChange(e.target.value)}
                                        value={filters.orderNumber || ""}
                                    />
                                </div>
                            </div>
                            <div className="w-full sm:w-48">
                                <Select onValueChange={handleStatusChange} value={filters.orderStatus || ""}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="All">All Statuses</SelectItem>
                                            {ORDER_STATUSES.map((status) => (
                                                <SelectItem key={`status-name-${status}`} value={status}>
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <OrderList filters={filters} page={page} setPage={setPage}/>
            </div>
            <Footer />
        </>
    );
}