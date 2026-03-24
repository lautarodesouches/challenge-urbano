import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/axios';
import type { Inventory } from '../../../types';

export const useInventory = () => {
  const inventoryQuery = useQuery<Inventory[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      // Endpoint imaginario para obtener todo el inventario tabulado
      try {
        const { data } = await apiClient.get('/api/inventory');
        return Array.isArray(data) ? data : (data?.data || []);
      } catch (e) {
        return []; // Evitar logs rojos por endpoints imaginarios
      }
    },
  });

  return { inventoryQuery };
};
