import { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Download, Calendar, DollarSign, Package, User, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchFilteredOrders, type Order, type OrderFilterRequest } from '@/services/orderService';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useDebounce } from '@/hooks/useDebounce';



interface AdminOrder {
  orderNumber: string;
  userEmail: string;
  totalAmount: number;
  subTotal: number;
  currency: string;
  status: string;
  createdAt: string;
  itemCount: number;
  shippingAddress?: {
    city: string;
    state: string;
    country: string;
    street?: string;
    postalCode?: string;
  };
  billingAddress?: {
    city: string;
    state: string;
    country: string;
    street?: string;
    postalCode?: string;
  };
  orderItems?: Array<{
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}


const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLTableCellElement | null>(null);
  const navigate = useNavigate();
  const loadingRef = useRef(false);
  const lastLoadedPageRef = useRef(0);

  // Debounce the search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  

  // Add status display mapping with more descriptive text
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'SUCCESSFULL': return 'Order Placed';
      case 'IN_TRANSIT': return 'Shipped';
      case 'PAYMENT_PENDING': return 'Awaiting Payment';
      case 'PAYMENT_CANCELLED': return 'Payment Cancelled';
      case 'PROCESSING': return 'Processing Order';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Order Cancelled';
      default: return status;
    }
  };

  // Update status color function with improved color scheme
  const getStatusColor = (status: string) => {
    switch (status) {
      // Success states - Green shades
      case 'DELIVERED': 
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      
      // Active states - Blue shades
      case 'PROCESSING': 
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'IN_TRANSIT': 
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      
      // Pending states - Yellow/Orange shades
      case 'SUCCESSFULL': 
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'PAYMENT_PENDING': 
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
      
      // Cancelled states - Red shades
      case 'CANCELLED': 
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      case 'PAYMENT_CANCELLED': 
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      
      default: 
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20';
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleUpdateOrder = (order: Order) => {
    setSelectedOrder(order);
    setUpdateStatus(order.status);
    setUpdateDialogOpen(true);
  };

  const handleUpdateSubmit = () => {
    if (selectedOrder && updateStatus) {
      // Here you would typically make an API call to update the order
      console.log(`Updating order ${selectedOrder.orderNumber} to status: ${updateStatus}`);
      setUpdateDialogOpen(false);
      setSelectedOrder(null);
      // You could also update the local state or refetch data
    }
  };

  const loadOrders = useCallback(async (pageToLoad: number) => {
    // Prevent duplicate calls for the same page
    if (loadingRef.current || pageToLoad <= lastLoadedPageRef.current) {
      console.log('Skipping load - already loading or page already loaded:', { 
        currentPage: pageToLoad, 
        lastLoaded: lastLoadedPageRef.current 
      });
      return;
    }

    try {
      console.log('Loading orders for page:', pageToLoad);
      loadingRef.current = true;
      setIsLoading(true);
      
      if (pageToLoad === 1) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetchFilteredOrders(pageToLoad, 10, {
        userUuid: null,
        orderNumber: null,
        orderStatus: null
      });
      
      console.log('Orders response for page:', pageToLoad, response);
      
      if (response.data.models.length > 0) {
        setTotalElements(response.data.totalElements);
        setOrders(prev => {
          // Use functional update to ensure we're working with latest state
          const newOrders = pageToLoad === 1 ? response.data.models : [...prev, ...response.data.models];
          return newOrders;
        });
        setHasMore(!response.data.isLast);
        lastLoadedPageRef.current = pageToLoad; // Update last loaded page
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setHasMore(false);
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Initial load only
  useEffect(() => {
    console.log('Initial load effect triggered');
    loadOrders(1);
  }, [loadOrders]);

  // Handle page changes
  useEffect(() => {
    if (page > 1 && !isLoading && page > lastLoadedPageRef.current) {
      console.log('Page changed to:', page);
      loadOrders(page);
    }
  }, [page, loadOrders, isLoading]);

  // Reset when filters change
  useEffect(() => {
    console.log('Filters changed, resetting...');
    setOrders([]);
    setPage(1);
    setHasMore(true);
    setTotalElements(0);
    setIsInitialLoading(true);
    lastLoadedPageRef.current = 0; // Reset last loaded page
    loadOrders(1);
  }, [searchTerm, filterStatus, loadOrders]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      // Only load more if we're 75% scrolled and not already loading
      if (entry.isIntersecting && hasMore && !isLoading && !isInitialLoading) {
        const nextPage = lastLoadedPageRef.current + 1;
        console.log('Triggering next page load...', { 
          nextPage,
          currentPage: lastLoadedPageRef.current,
          hasMore,
          isLoading
        });
        setPage(nextPage);
      }
    };

    observerRef.current = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px',
      threshold: 0.75
    });

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observerRef.current.observe(currentLoader);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [hasMore, isLoading, isInitialLoading]);

  const totalRevenue = 0; // Set to constant 0 as requested

  // const handleViewOrder = (orderNumber: string) => {
  //   navigate(`/admin/orders/${orderNumber}`);
  // };

  const handleExport = async () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 md:px-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Order Management</h1>
              <p className="text-muted-foreground">
                Track and manage customer orders efficiently
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right bg-muted/50 p-4 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-bold text-foreground">$0.00</div>
              </div>
              <Button 
                onClick={handleExport}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Main Card */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="space-y-4">
              <CardTitle className="text-xl font-semibold text-foreground">Orders</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search orders by number or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background border-border/50 focus:border-primary"
                  />
                </div>
                <Tabs 
                  value={filterStatus} 
                  onValueChange={setFilterStatus}
                  className="w-full sm:w-auto"
                >
                  <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger 
                      value="all"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger 
                      value="SUCCESSFULL"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      Order Placed
                    </TabsTrigger>
                    <TabsTrigger 
                      value="PAYMENT_PENDING"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      Awaiting Payment
                    </TabsTrigger>
                    <TabsTrigger 
                      value="PROCESSING"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      Processing
                    </TabsTrigger>
                    <TabsTrigger 
                      value="IN_TRANSIT"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      Shipped
                    </TabsTrigger>
                    <TabsTrigger 
                      value="DELIVERED"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      Delivered
                    </TabsTrigger>
                    <TabsTrigger 
                      value="CANCELLED"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      Cancelled
                    </TabsTrigger>
                    <TabsTrigger 
                      value="PAYMENT_CANCELLED"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      Payment Cancelled
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-medium text-foreground">Order</TableHead>
                      <TableHead className="font-medium text-foreground">Customer</TableHead>
                      <TableHead className="font-medium text-foreground">Amount</TableHead>
                      <TableHead className="font-medium text-foreground">Items</TableHead>
                      <TableHead className="font-medium text-foreground">Status</TableHead>
                      <TableHead className="font-medium text-foreground">Date</TableHead>
                      <TableHead className="font-medium text-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isInitialLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                            <span className="text-muted-foreground">Loading orders...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Package className="h-8 w-8 mb-2 opacity-50" />
                            <p>No orders found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {orders.map((order, index) => (
                          <TableRow 
                            key={`${order.orderNumber}-${index}`}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell>
                              <div className="font-medium text-foreground">{order.orderNumber}</div>
                              {order.shippingAddress && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {order.shippingAddress.city}, {order.shippingAddress.state}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-foreground">
                                {order.user?.firstName} {order.user?.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {order.user?.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-foreground">
                                <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Subtotal: ${order.subTotal.toFixed(2)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-muted text-foreground">
                                {order.orderItems.length} items
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(order.status)} px-2 py-1 rounded-md font-medium`}>
                                {getStatusDisplay(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm flex items-center text-muted-foreground">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 hover:bg-muted"
                                  onClick={() => handleViewOrder(order)}
                                  title="View Order Details"
                                >
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                  <span className="sr-only">View Order</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 hover:bg-muted"
                                  onClick={() => handleUpdateOrder(order)}
                                  title="Update Order Status"
                                >
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <span className="sr-only">Update Status</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Loading indicator */}
                        {isLoadingMore && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-16">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                                <span className="text-sm text-muted-foreground">Loading more orders...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        {/* Load more trigger */}
                        {hasMore && !isLoading && !isInitialLoading && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-16" ref={loaderRef}>
                              <div className="text-sm text-muted-foreground text-center">
                                {orders.length > 0 ? 'Scroll to load more' : 'No more orders to load'}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        {/* End of list message */}
                        {!hasMore && orders.length > 0 && !isLoading && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-16">
                              <div className="text-sm text-muted-foreground text-center">
                                Showing {orders.length} of {totalElements} orders
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Order Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Order Details - {selectedOrder?.orderNumber}
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-muted/50 border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span className="text-sm font-medium">Order Status</span>
                      </div>
                      <Badge className={`mt-2 ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusDisplay(selectedOrder.status)}
                      </Badge>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/50 border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-medium">Total Amount</span>
                      </div>
                      <div className="mt-2 text-lg font-bold text-foreground">
                        ${selectedOrder.totalAmount.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/50 border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Order Date</span>
                      </div>
                      <div className="mt-2 text-sm text-foreground">
                        {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Customer Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedOrder.user && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Name</div>
                          <div className="font-medium">
                            {selectedOrder.user.firstName} {selectedOrder.user.lastName}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Email</div>
                          <div className="font-medium">{selectedOrder.user.email}</div>
                        </div>
                        {selectedOrder.user.phoneNumber && (
                          <div>
                            <div className="text-sm text-muted-foreground">Phone</div>
                            <div className="font-medium">{selectedOrder.user.phoneNumber}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedOrder.shippingAddress && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>Shipping Address</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          {selectedOrder.shippingAddress.street && (
                            <div>{selectedOrder.shippingAddress.street}</div>
                          )}
                          <div>
                            {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}
                          </div>
                          <div>
                            {selectedOrder.shippingAddress.country} {selectedOrder.shippingAddress.postalCode}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedOrder.billingAddress && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>Billing Address</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          {selectedOrder.billingAddress.street && (
                            <div>{selectedOrder.billingAddress.street}</div>
                          )}
                          <div>
                            {selectedOrder.billingAddress.city}, {selectedOrder.billingAddress.state}
                          </div>
                          <div>
                            {selectedOrder.billingAddress.country} {selectedOrder.billingAddress.postalCode}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Order Items */}
                {selectedOrder.orderItems && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedOrder.orderItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Quantity: {item.quantity} × ${item.price.toFixed(2)}
                              </div>
                            </div>
                            <div className="font-medium">${item.price.toFixed(2)}</div>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between items-center font-bold">
                          <span>Subtotal:</span>
                          <span>${selectedOrder.subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>Total:</span>
                          <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Order Status Dialog */}
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Update Order Status - {selectedOrder?.orderNumber}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Current Status</label>
                <div className="mt-1">
                  <Badge className={selectedOrder ? getStatusColor(selectedOrder.status) : ''}>
                    {selectedOrder ? getStatusDisplay(selectedOrder.status) : ''}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground">New Status</label>
                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                  <SelectTrigger className="mt-1 bg-background border-border/50">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUCCESSFULL">Order Placed</SelectItem>
                    <SelectItem value="PAYMENT_PENDING">Awaiting Payment</SelectItem>
                    <SelectItem value="PROCESSING">Processing Order</SelectItem>
                    <SelectItem value="IN_TRANSIT">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Order Cancelled</SelectItem>
                    <SelectItem value="PAYMENT_CANCELLED">Payment Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setUpdateDialogOpen(false)}
                  className="h-9 border-border/50 hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateSubmit}
                  className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Update Status
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
};

export default AdminOrders;