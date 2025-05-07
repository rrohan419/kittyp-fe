
// import React, { useCallback, useEffect, useRef, useState } from 'react';
// import { Button } from "@/components/ui/button";
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow
// } from "@/components/ui/table";
// import { PackageMinus, ArrowRight } from "lucide-react";
// import { fetchFilteredOrders, Order, OrderFilterRequest } from '@/services/orderService';
// import { useNavigate } from 'react-router-dom';
// import { format } from 'date-fns';


// const OrderHistory: React.FC<{ userUuid: string }> = ({ userUuid }) => {
//     // Mock order data
//     // const orders: Order[] = [
//     //     {
//     //         orderNumber: "ORD-39582",
//     //         createdAt: "May 2, 2023",
//     //         status: "delivered",
//     //         totalAmount: 245.99,
//     //         subTotal: 0,
//     //         aggregatorOrderNumber: null,
//     //         billingAddress: null,
//     //         currency: 'INR',
//     //         orderItems: [
//     //             {
//     //                 price: 222,
//     //                 product: {
//     //                     price: 222,
//     //                     uuid: '111',
//     //                     attributes: null,
//     //                     category: "test",
//     //                     currency: 'INR',
//     //                     description: 'test description',
//     //                     name: 'test product',
//     //                     productImageUrls: [],
//     //                     status: 'available'
//     //                 },
//     //                 itemDetails: {
//     //                     color: 'pink',
//     //                     size: '22cm'
//     //                 },
//     //                 quantity: 2
//     //             }
//     //         ],
//     //         shippingAddress: null,
//     //         taxes: null
//     //         //   items: 3
//     //     },
//     //     {
//     //         orderNumber: "ORD-38217",
//     //         createdAt: "April 14, 2023",
//     //         status: "shipped",
//     //         totalAmount: 124.50,
//     //         subTotal: 0,
//     //         aggregatorOrderNumber: null,
//     //         billingAddress: null,
//     //         currency: 'INR',
//     //         orderItems: [
//     //             {
//     //                 price: 222,
//     //                 product: {
//     //                     price: 222,
//     //                     uuid: '111',
//     //                     attributes: null,
//     //                     category: "test",
//     //                     currency: 'INR',
//     //                     description: 'test description',
//     //                     name: 'test product',
//     //                     productImageUrls: [],
//     //                     status: 'available'
//     //                 },
//     //                 itemDetails: {
//     //                     color: 'pink',
//     //                     size: '22cm'
//     //                 },
//     //                 quantity: 2
//     //             }
//     //         ],
//     //         shippingAddress: null,
//     //         taxes: null
//     //     },
//     //     {
//     //         orderNumber: "ORD-37190",
//     //         createdAt: "March 27, 2023",
//     //         status: "processing",
//     //         totalAmount: 89.99,
//     //         subTotal: 0,
//     //         aggregatorOrderNumber: null,
//     //         billingAddress: null,
//     //         currency: 'INR',
//     //         orderItems: null,
//     //         shippingAddress: null,
//     //         taxes: null
//     //     },
//     //     {
//     //         orderNumber: "ORD-36023",
//     //         createdAt: "February 18, 2023",
//     //         status: "delivered",
//     //         totalAmount: 312.75,
//     //         subTotal: 0,
//     //         aggregatorOrderNumber: null,
//     //         billingAddress: null,
//     //         currency: 'INR',
//     //         orderItems: [
//     //             {
//     //                 price: 222,
//     //                 product: {
//     //                     price: 222,
//     //                     uuid: '111',
//     //                     attributes: null,
//     //                     category: "test",
//     //                     currency: 'INR',
//     //                     description: 'test description',
//     //                     name: 'test product',
//     //                     productImageUrls: [],
//     //                     status: 'available'
//     //                 },
//     //                 itemDetails: {
//     //                     color: 'pink',
//     //                     size: '22cm'
//     //                 },
//     //                 quantity: 2
//     //             }
//     //         ],
//     //         shippingAddress: null,
//     //         taxes: null
//     //     },
//     // ];

//     const getStatusBadgeClass = (status: string) => {
//         switch (status) {
//             case 'PROCESSING':
//                 return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500';
//             case 'SUCCESSFULL':
//                 return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500';
//             case 'DELIVERED':
//                 return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500';
//             case 'PROCESSING':
//                 return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500';
//             case 'REFUNDED':
//                 return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500'
//             default:
//                 return 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400';
//         }
//     };

//     const navigate = useNavigate();
//     const [orders, setOrders] = useState<Order[]>([]);
//     const [page, setPage] = useState(1);
//     const [isLoading, setIsLoading] = useState(false);
//     const [isLastPage, setIsLastPage] = useState(false);
//     const PAGE_SIZE = 10;
//     const observerRef = useRef<HTMLDivElement | null>(null);

//     const loadOrders = useCallback(async () => {
//         if (isLoading || isLastPage) return;

//         setIsLoading(true);

//         try {
//             const filters: OrderFilterRequest = {
//                 userUuid,
//                 orderNumber: null,
//                 orderStatus: null,
//             };

//             const response = await fetchFilteredOrders(page, PAGE_SIZE, filters);
//             const newOrders = response.data.models;

//             setOrders((prev) => [...prev, ...newOrders]);
//             setIsLastPage(response.data.isLast);
//             setPage((prev) => prev + 1);
//         } catch (error) {
//             console.error("Failed to load orders:", error);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [userUuid, page, isLoading, isLastPage]);

//     useEffect(() => {
//         loadOrders();
//     }, []);

//     useEffect(() => {
//         const observer = new IntersectionObserver(
//             (entries) => {
//                 if (entries[0].isIntersecting) {
//                     loadOrders();
//                 }
//             },
//             { threshold: 1 }
//         );

//         if (observerRef.current) {
//             observer.observe(observerRef.current);
//         }

//         return () => {
//             if (observerRef.current) observer.unobserve(observerRef.current);
//         };
//     }, [loadOrders]);




//     return (
//         <div>
//             <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-2xl font-bold">Order History</h2>
//                 <Button variant="outline" size="sm" className="text-sm">
//                     View All Orders
//                 </Button>
//             </div>

//             {orders.length > 0 ? (
//                 <div className="rounded-lg border shadow-sm overflow-hidden">
//                     <Table>
//                         <TableHeader>
//                             <TableRow>
//                                 <TableHead>Order ID</TableHead>
//                                 <TableHead>Date</TableHead>
//                                 <TableHead>Status</TableHead>
//                                 <TableHead>Total</TableHead>
//                                 <TableHead>Items</TableHead>
//                                 <TableHead className="text-right">Action</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                             {orders.map((order) => (
//                                 <TableRow key={order.orderNumber}>
//                                     <TableCell className="font-medium">{order.orderNumber}</TableCell>
//                                     <TableCell>{format(new Date(order.createdAt), 'dd MMM yyyy')}</TableCell>
//                                     <TableCell>
//                                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
//                                             {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
//                                         </span>
//                                     </TableCell>
//                                     <TableCell>{order.totalAmount}</TableCell>
//                                     {/* <TableCell>{order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}</TableCell> */}
//                                     <TableCell>
//                                         {order.orderItems && order.orderItems.length > 0
//                                             ? `${order.orderItems.length} item${order.orderItems.length !== 1 ? 's' : ''}`
//                                             : '0 items'}
//                                     </TableCell>

//                                     <TableCell className="text-right">
//                                         <Button variant="ghost" size="sm" className="h-8 text-xs"
//                                                     onClick={() => navigate(`/orders/${order.orderNumber}`)}>
//                                             Details <ArrowRight className="ml-1 h-3 w-3" />
//                                         </Button>
//                                     </TableCell>
//                                 </TableRow>
//                             ))}
//                         </TableBody>
//                     </Table>
//                 </div>
//             ) : (
//                 <div className="text-center py-12 bg-gray-50 rounded-lg">
//                     <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-gray-100 mb-4">
//                         <PackageMinus className="h-6 w-6 text-muted-foreground" />
//                     </div>
//                     <div className="text-muted-foreground mb-4">You haven't placed any orders yet.</div>
//                     <Button className="bg-primary hover:bg-primary/80">Start Shopping</Button>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default OrderHistory;



import React, { useState } from 'react';
import { OrderList } from './OrderList';

import { Button } from './button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { OrderFilterRequest } from '@/services/orderService';

interface OrderHistoryProps {
  userUuid: string;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ userUuid }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filters: OrderFilterRequest = {
    userUuid,
    orderNumber: null,
    orderStatus: statusFilter
  };

  const handleStatusFilterChange = (status: string | null) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when changing filters
  };

  return (
    <div className="bg-card rounded-xl shadow-sm p-4 sm:p-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
 
        <h2 className="text-2xl font-bold">Order History</h2>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
              {statusFilter || 'All Orders'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-full sm:w-auto">
            <DropdownMenuItem onClick={() => handleStatusFilterChange(null)}>
              All Orders
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusFilterChange('CREATED')}>
              Created
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusFilterChange('PROCESSING')}>
              Processing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusFilterChange('DELIVERED')}>
              Delivered
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusFilterChange('CANCELLED')}>
              Cancelled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <OrderList 
        page={currentPage} 
        filters={filters} 
        setPage={setCurrentPage} 
      />
    </div>
  );
};

export default OrderHistory;

