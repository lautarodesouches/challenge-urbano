import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/axios';
import { useAppStore } from '../../../store';
import type { Inventory } from '../../../types';

export const useInventory = () => {
  const token = useAppStore((state) => state.token);

  const inventoryQuery = useQuery<Inventory[]>({
    queryKey: ['inventory'],
    enabled: !!token,
    queryFn: async () => {
      const { data } = await apiClient.get('/api/inventory');
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });

  return { inventoryQuery };
};
