import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAppStore } from '../../../store';
import { API_BASE_URL } from '../../../config/constants';

const socket = io(API_BASE_URL);

export const useWebSockets = () => {
  const queryClient = useQueryClient();
  const { addLog } = useAppStore();
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('inventory:synced', (data: any) => {
      addLog({
        type: 'success',
        payload: data,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
      });
      // Invalidar query asincrónicamente para sincronizar el inventario global
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    });

    socket.on('notification:push_sent', (data: any) => {
      addLog({
        timestamp: new Date().toLocaleTimeString(),
        message: data.message,
        payload: data,
        type: data.action === 'SYNC_COMPLETE' ? 'success' : 'info' as const
      });
    });

    socket.on('inventory:low_stock', (data: any) => {
      addLog({
        timestamp: new Date(data.time).toLocaleTimeString(),
        message: `¡STOCK CRÍTICO! ${data.productTitle} ha caído a ${data.remainingQuantity} unidades.`,
        payload: data,
        type: 'error' as const
      });
    });

    socket.on('product:price_changed', (data: any) => {
      addLog({
        timestamp: new Date(data.time).toLocaleTimeString(),
        message: `Actualización de Precio: ${data.productTitle} pasó de $${data.oldPrice} a $${data.newPrice}.`,
        payload: data,
        type: 'info' as const
      });
    });

    socket.on('product:deactivated', (data: any) => {
      addLog({
        timestamp: new Date(data.time).toLocaleTimeString(),
        message: `Producto Desactivado: El producto con ID ${data.productId} fue pausado (Status: ${data.isActive}).`,
        payload: data,
        type: 'error' as const
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('inventory:synced');
      socket.off('notification:push_sent');
      socket.off('inventory:low_stock');
      socket.off('product:price_changed');
      socket.off('product:activated');
      socket.off('product:deactivated');
    };
  }, [addLog, queryClient]);

  return { isConnected };
};
