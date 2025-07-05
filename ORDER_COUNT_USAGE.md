# Order Management with Redux

This application now uses Redux for centralized order management, eliminating duplicate API calls and providing a consistent data layer across components.

## Problem Solved

Previously, there were multiple API calls happening:
- `Profile.tsx` was calling `fetchFilteredOrders` for order count
- `OrderList.tsx` was using React Query to fetch the same orders
- Duplicate API calls for the same data

## Solution Implemented

### 1. Extended Redux OrderSlice
- **Order Count**: `totalOrderCount` for quick access
- **Order List**: `orders` array with full order data
- **Pagination**: `currentPage`, `totalPages`, `isFirst`, `isLast`
- **Loading States**: Separate states for count and list loading
- **Error Handling**: Centralized error management

### 2. Custom Hooks
- `useOrderCount`: For order count only (optimized to avoid duplicate calls)
- `useOrders`: For full order list with pagination

### 3. Eliminated React Query
- Replaced React Query with Redux in `OrderList`
- Single source of truth for order data
- Better performance and consistency

## How to Use

### For Order Count Only (Profile, Dashboard, etc.)

```tsx
import { useOrderCount } from '@/hooks/useOrderCount';

const MyComponent = () => {
  const { totalOrderCount, isLoading, error } = useOrderCount(user?.uuid);

  return (
    <div>
      {isLoading ? (
        <span>Loading...</span>
      ) : (
        <span>Total Orders: {totalOrderCount}</span>
      )}
    </div>
  );
};
```

### For Full Order List (Order History, My Orders, etc.)

```tsx
import { useOrders } from '@/hooks/useOrders';

const OrderHistory = () => {
  const filters = { userUuid: user.uuid, orderNumber: null, orderStatus: null };
  const { orders, isLoading, error, refreshOrders } = useOrders(page, filters);

  return (
    <div>
      {orders.map(order => (
        <OrderCard key={order.orderNumber} order={order} />
      ))}
    </div>
  );
};
```

## Redux State Structure

```typescript
interface OrderState {
  totalOrderCount: number;
  orders: Order[];
  currentPage: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  isLoading: boolean;        // For count operations
  isLoadingOrders: boolean;  // For list operations
  error: string | null;
}
```

## Available Actions

### Async Thunks
- `fetchTotalOrderCount(userUuid)`: Get order count only
- `fetchOrders({ page, size, filters })`: Get full order list

### Regular Actions
- `clearOrderCount()`: Clear count data
- `clearOrders()`: Clear list data
- `setCurrentPage(page)`: Update current page
- `updateOrderStatus({ orderNumber, status })`: Update order status

## Performance Optimizations

### 1. Smart Count Fetching
```typescript
// Only fetches count if orders aren't already loaded
if (userUuid && orders.length === 0) {
  dispatch(fetchTotalOrderCount(userUuid));
}
```

### 2. Shared Data
- Order count is automatically updated when orders are fetched
- No duplicate API calls for the same data
- Redux cache prevents unnecessary requests

### 3. Efficient Cleanup
```typescript
// Only clears count if orders aren't being used
if (orders.length === 0) {
  dispatch(clearOrderCount());
}
```

## Migration Guide

### From React Query to Redux

**Before (React Query):**
```tsx
const { data: ordersData, isLoading, refetch } = useQuery({
  queryKey: ['orders', page, filters],
  queryFn: () => fetchFilteredOrders(page, 10, filters),
});
```

**After (Redux):**
```tsx
const { orders, isLoading, refreshOrders } = useOrders(page, filters);
```

### Benefits of Migration

✅ **No Duplicate API Calls**: Single source of truth
✅ **Better Performance**: Redux caching and optimization
✅ **Consistent State**: Same data across all components
✅ **Easier Testing**: Predictable state management
✅ **Better Error Handling**: Centralized error states
✅ **Type Safety**: Full TypeScript support

## Usage Examples

### Profile Header
```tsx
const { totalOrderCount, isLoading } = useOrderCount(user?.uuid);
<ProfileHeader ordersCount={isLoading ? null : totalOrderCount} />
```

### Order List with Pagination
```tsx
const { orders, isLoading, isFirst, isLast } = useOrders(page, filters);
<OrderList orders={orders} hasNext={!isLast} hasPrev={!isFirst} />
```

### Admin Dashboard
```tsx
const { totalOrderCount } = useOrderCount(null); // Admin sees all orders
<DashboardCard title="Total Orders" value={totalOrderCount} />
```

## Error Handling

The Redux system handles errors gracefully:
- Sets appropriate default values on error
- Provides detailed error messages
- Continues to work even if some operations fail
- Automatic retry mechanisms available

## Best Practices

1. **Use `useOrderCount`** for count-only needs (Profile, Dashboard)
2. **Use `useOrders`** for full order lists (Order History, Admin)
3. **Avoid manual API calls** - use the hooks instead
4. **Leverage Redux cache** - data persists across component unmounts
5. **Handle loading states** - provide good UX during data fetching 