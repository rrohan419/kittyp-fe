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

