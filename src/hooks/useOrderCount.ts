import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/module/store/store';
import { fetchTotalOrderCount, clearOrderCount } from '@/module/slice/OrderSlice';

export const useOrderCount = (userUuid?: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const { totalOrderCount, isLoading, error } = useSelector((state: RootState) => state.orderReducer);

  useEffect(() => {
    if (userUuid) {
      dispatch(fetchTotalOrderCount());
    }

    // Cleanup when component unmounts
    return () => {
      dispatch(clearOrderCount());
    };
  }, [dispatch, userUuid]);

  const refreshOrderCount = () => {
    if (userUuid) {
      dispatch(fetchTotalOrderCount());
    }
  };

  return {
    totalOrderCount,
    isLoading,
    error,
    refreshOrderCount
  };
}; 