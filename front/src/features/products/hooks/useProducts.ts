import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/axios';
import { useAppStore } from '../../../store';
import type { Product } from '../../../types';
import { toast } from 'sonner';

export const useProducts = () => {
  const queryClient = useQueryClient();
  const token = useAppStore((state) => state.token);

  const productsQuery = useQuery<Product[]>({
    queryKey: ['products'],
    enabled: !!token,
    queryFn: async () => {
      const { data } = await apiClient.get('/api/product');
      // Extraemos limpiamente el listado del objeto contenedor o sanitizamos
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (newProduct: Partial<Product>) => {
      // 1. Create base product with category 1 (Computers)
      const { data: createdProduct } = await apiClient.post('/api/product/create', { categoryId: 1 });
      const productId = createdProduct?.data?.id || createdProduct?.id;

      let finalProduct = createdProduct;

      try {
        // 2. Add details
        await apiClient.post(`/api/product/${productId}/details`, {
          title: newProduct.title || 'Nuevo Producto',
          code: newProduct.code || `PROD-${Math.random().toString(36).substring(7).toUpperCase()}`,
          variationType: 'NONE',
          details: { category: 'Computers', capacity: 1, capacityUnit: 'TB', capacityType: 'SSD', brand: 'Generic', series: 'Series' },
          about: newProduct.about?.length ? newProduct.about : ['Nuevo producto creado rápido'],
          description: newProduct.description || 'Sin descripción',
        });

        // 3. Update price
        await apiClient.post(`/api/product/${productId}/price`, {
          newPrice: newProduct.price ? Number(newProduct.price) : 0,
        });

        // 4. Activate
        const { data: activatedProduct } = await apiClient.post(`/api/product/${productId}/activate`);
        finalProduct = activatedProduct;
      } catch (err) {
        console.error('Error in multi-step product creation:', err);
        throw err;
      }

      return finalProduct;
    },
    onMutate: () => {
      toast.loading('Creando producto...', { id: 'create-product' });
    },
    onSuccess: () => {
      toast.success('Producto creado exitosamente', { id: 'create-product' });
      // Invalidar para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      const errorsArr = error.response?.data?.errors;
      const errorMsg = (errorsArr && errorsArr.length > 0) ? errorsArr[0] : (error.response?.data?.message || 'Error desconocido');
      toast.error(`Error al crear producto: ${errorMsg}`, { id: 'create-product' });
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ productId, newPrice }: { productId: number, newPrice: number }) => {
      const { data } = await apiClient.post(`/api/product/${productId}/price`, { newPrice });
      return data;
    },
    onSuccess: () => {
      toast.success('Precio actualizado');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || 'Error desconocido';
      toast.error(`Error al actualizar precio: ${typeof errorMsg === 'string' ? errorMsg : 'Revisa consola'}`);
    }
  });

  const activateProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const { data } = await apiClient.post(`/api/product/${productId}/activate`);
      return data;
    },
    onSuccess: () => {
      toast.success('Producto activado');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || 'Error desconocido';
      toast.error(`Error al activar producto: ${Array.isArray(errorMsg) ? errorMsg[0] : errorMsg}`);
    }
  });

  const deactivateProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const { data } = await apiClient.post(`/api/product/${productId}/deactivate`);
      return data;
    },
    onSuccess: () => {
      toast.success('Producto desactivado');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || 'Error desconocido';
      toast.error(`Error al desactivar producto: ${Array.isArray(errorMsg) ? errorMsg[0] : errorMsg}`);
    }
  });

  return { productsQuery, createProductMutation, updatePriceMutation, activateProductMutation, deactivateProductMutation };
};
