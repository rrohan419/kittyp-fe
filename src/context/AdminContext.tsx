


import { fetchFilteredOrders } from '@/services/orderService';
import { fetchProductCount } from '@/services/productService';
import { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from 'react';
import { useOrder } from './OrderContext';

interface AdminContextType {
    productCount: number;
    isDashboardLoading: boolean;
}

export const AdminContext = createContext<AdminContextType>({
    productCount: 0,
    isDashboardLoading: true,
});

export const AdminProvider = ({children}: {children: ReactNode}) => {

    const [productCount, setProductCount] = useState(0);
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);
    const {setTotalOrderCount} = useOrder();
    const initializeAdminDashboard = async () =>  {

        setIsDashboardLoading(true)
        try {
            // Fetch admin dashboard data
            const dashboardData = await fetchProductCount(true);
            
            setProductCount(dashboardData.data);
            const orderTotalNumber = await fetchFilteredOrders(1, 5, {orderNumber : null, orderStatus : null, userUuid: null});
            console.log("count" , orderTotalNumber.data.totalElements)
            setTotalOrderCount(orderTotalNumber.data.totalElements);
        } catch (error) {
            console.error('Failed to initialize admin dashboard:', error);
        } finally {
            setIsDashboardLoading(false);
        }

    };

     useEffect(() => {
        initializeAdminDashboard();
      }, []);

    return (
        <AdminContext.Provider
          value={{ isDashboardLoading, productCount }}
        >
          {children}
        </AdminContext.Provider>
      );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};