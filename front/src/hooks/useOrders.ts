import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/axios';
import { toast } from 'sonner';

export const useOrders = () => {
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      // Retornar error artificial para validar interfaces o el body de la petición
      const { data } = await apiClient.post(`/api/inventory/${productId}/decrement`, { 
        quantity,
        customerEmail: 'test@example.com' // Un stub para saltear validación del usuario por ahora
      });
      return data;
    },
    onMutate: () => {
      toast.loading('Iniciando proceso de compra...', { id: 'create-order' });
    },
    onSuccess: () => {
      toast.success('Compra enviada al broker. Actualizando inventario...', { id: 'create-order' });
      
      // Invalidación con retardo intencional de 500ms para simular tiempo de Worker en BullMQ
      setTimeout(() => {
        // En un caso real el front lo pide otra vez pero como tenemos web sockets esto 
        // sería doble. Igual la consigna pide específicamente la invalidación diferida.
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      }, 500);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || 'Error de conexión';
      toast.error(`Error al procesar compra: ${Array.isArray(errorMsg) ? errorMsg[0] : errorMsg}`, { id: 'create-order' });
    },
  });

  return { createOrderMutation };
};
