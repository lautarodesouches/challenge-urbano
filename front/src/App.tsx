import { useEffect, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAppStore } from './store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Badge } from './components/ui/badge';
import { ScrollArea } from './components/ui/scroll-area';
import { Activity, Database, Loader2, Radio, Zap, LogOut, AlertTriangle, ShoppingCart, PlusCircle } from 'lucide-react';
import { LoginForm } from './components/LoginForm';
import { API_BASE_URL } from './config/constants';
import { useProducts } from './hooks/useProducts';
import { useOrders } from './hooks/useOrders';
import { useInventory } from './hooks/useInventory';
import type { Product } from './types';

// WebSockets (Para el panel de Observabilidad - Logs asincrónicos)
const socket = io(API_BASE_URL);

function App() {
  const queryClient = useQueryClient();
  const { logs, addLog, token, logout } = useAppStore();
  const [isConnected, setIsConnected] = useState(socket.connected);
  
  // React Query Hooks (Estado local y mutaciones con invalidación)
  const { productsQuery, createProductMutation, updatePriceMutation, activateProductMutation, deactivateProductMutation } = useProducts();
  const { inventoryQuery } = useInventory();
  const { createOrderMutation } = useOrders();

  // Estados locales para el Formulario Simple de Crear Producto
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Configuración persistente de WebSockets solo para los Logs
  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('inventory:synced', (data) => {
      addLog({
        type: 'success',
        payload: data,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
      });
      // Invalidar query asincrónicamente para que aprarezca mágicamente el inventario global
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    });

    socket.on('notification:push_sent', (data) => {
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
  }, [addLog]);

  // Manejadores de Formularios e Interacciones
  const handleBuy = (productId: number) => {
    createOrderMutation.mutate({ productId, quantity: 1 });
  };

  const handleUpdatePrice = (productId: number, currentPrice: number) => {
    updatePriceMutation.mutate({ productId, newPrice: (currentPrice || 0) + 10 });
  };

  const handleActivate = (productId: number) => {
    activateProductMutation.mutate(productId);
  };

  const handleDeactivate = (productId: number) => {
    deactivateProductMutation.mutate(productId);
  };

  const handleCreateProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) return;
    
    createProductMutation.mutate({
      title: newTitle,
      price: Number(newPrice),
      description: 'Producto creado desde consola rápida',
      isActive: true,
      currency: 'USD',
      code: `PROD-${Math.random().toString(36).substring(7).toUpperCase()}`,
      about: []
    }, {
      onSuccess: () => {
        setNewTitle('');
        setNewPrice('');
      }
    });
  };

  // Guard de autenticación
  if (!token) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header Glassmorphism */}
        <header className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Consola de Validación de Eventos</h1>
              <p className="text-sm text-neutral-400">Prueba E2E de Arquitectura Asíncrona (BullMQ + React Query)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? 'default' : 'destructive'} className={isConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : ""}>
              {isConnected ? <><Radio className="w-3 h-3 mr-1 animate-pulse inline" /> Socket Activo</> : <><Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> Socket Caído</>}
            </Badge>
            <button onClick={() => logout()} className="p-2 text-neutral-400 hover:text-red-400 transition-colors" title="Cerrar sesión">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* LADO A: ACCIONES (Formulario y Compras) */}
          <div className="space-y-6 flex flex-col">
            
            {/* Formulario Crear Producto */}
            <Card className="bg-neutral-900/40 border-neutral-800 shadow-xl glass-panel">
              <CardHeader className="border-b border-neutral-800/50 bg-neutral-900/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  Creación Rápida de Producto
                </CardTitle>
                <CardDescription>Inserta un item para gatillar el evento de sincronización de stock</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleCreateProduct} className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Título</label>
                    <input 
                      type="text" 
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Ej: Teclado Mecánico"
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <label className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Precio</label>
                    <input 
                      type="number" 
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="$ 0.00"
                    />
                  </div>
                  <button 
                    disabled={createProductMutation.isPending}
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors h-[38px] flex items-center gap-2"
                  >
                    {createProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear'}
                  </button>
                </form>
              </CardContent>
            </Card>

            {/* Listado de Productos para Comprar */}
            <Card className="flex-1 bg-neutral-900/40 border-neutral-800 shadow-xl overflow-hidden glass-panel flex flex-col">
              <CardHeader className="border-b border-neutral-800/50 bg-neutral-900/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="w-5 h-5 text-indigo-400" />
                  Terminal de Órdenes
                </CardTitle>
                <CardDescription>Simula compras para decrementar el stock asincrónicamente</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[430px]">
                  <Table>
                    <TableHeader className="bg-neutral-900/50">
                      <TableRow className="border-neutral-800 hover:bg-transparent">
                        <TableHead>Producto</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsQuery.isLoading ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-8 text-neutral-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando catálogo...</TableCell></TableRow>
                      ) : (
                        productsQuery.data?.map((p: Product) => (
                          <TableRow key={p.id} className="border-neutral-800">
                            <TableCell className="font-medium">{p.title}</TableCell>
                            <TableCell className="text-emerald-400">${p.price}</TableCell>
                            <TableCell className="text-right flex gap-2 justify-end">
                              {p.isActive ? (
                                <button 
                                  onClick={() => handleDeactivate(p.id)}
                                  disabled={deactivateProductMutation.isPending}
                                  className="bg-neutral-800 hover:bg-neutral-700 text-red-400 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-neutral-700 disabled:opacity-50"
                                >
                                  Desactivar
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleActivate(p.id)}
                                  disabled={activateProductMutation.isPending}
                                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-neutral-700 disabled:opacity-50"
                                >
                                  Activar
                                </button>
                              )}
                              <button 
                                onClick={() => handleUpdatePrice(p.id, p.price)}
                                disabled={updatePriceMutation.isPending}
                                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-neutral-700 disabled:opacity-50"
                              >
                                +$10
                              </button>
                              <button 
                                onClick={() => handleBuy(p.id)}
                                disabled={createOrderMutation.isPending}
                                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-neutral-700 disabled:opacity-50"
                              >
                                Comprar
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

          </div>

          {/* LADO B: OBSERVABILIDAD (Live Stream + Stock) */}
          <div className="space-y-6 flex flex-col">
            
            {/* Tabla de Inventario Global (React Query) */}
            <Card className="flex-1 bg-neutral-900/40 border-neutral-800 shadow-xl overflow-hidden glass-panel flex flex-col">
              <CardHeader className="border-b border-neutral-800/50 bg-neutral-900/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="w-5 h-5 text-emerald-400" />
                  Stock Global Sincronizado
                </CardTitle>
                <CardDescription>Estado de la base de datos tras las mutaciones asíncronas de BullMQ</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[250px]">
                  <Table>
                    <TableHeader className="bg-neutral-900/50">
                      <TableRow className="border-neutral-800 hover:bg-transparent">
                        <TableHead>SKU / Producto</TableHead>
                        <TableHead className="text-right">Disponibles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryQuery.isLoading ? (
                        <TableRow><TableCell colSpan={2} className="text-center py-8 text-neutral-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Leyendo inventario...</TableCell></TableRow>
                      ) : (
                        inventoryQuery.data?.map((inv: any) => (
                          <TableRow key={inv.id} className="border-neutral-800">
                            <TableCell className="font-medium flex items-center gap-2">
                              <span className="text-xs text-neutral-500 font-mono">#{inv.productVariation?.product?.id}</span>
                              {inv.productVariation?.product?.title || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className={`font-mono ${inv.quantity > 5 ? 'text-neutral-300 border-neutral-700' : 'text-red-400 border-red-900 bg-red-500/10'}`}>
                                {inv.quantity}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Live Stream de Eventos (Zustand + WebSockets) */}
            <Card className="flex-1 bg-neutral-900/40 border-neutral-800 shadow-xl overflow-hidden glass-panel flex flex-col">
              <CardHeader className="border-b border-neutral-800/50 bg-neutral-900/20 relative overflow-hidden pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  Live Event Stream
                </CardTitle>
                <CardDescription>Notificaciones PUSH emitidas por los Workers tras completar jobs</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[250px] p-4">
                  {logs.length === 0 ? (
                    <p className="text-neutral-500 italic text-sm text-center py-4">
                      A la espera de eventos del Message Broker...
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {logs.map((log: any) => (
                        <div key={log.id} className={`flex items-start rounded-lg p-3 text-sm transition-all animate-in slide-in-from-left-2 ${
                          log.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-200' :
                          log.type === 'success' ? 'bg-emerald-500/5 text-neutral-300 border border-emerald-500/10' :
                          log.type === 'info' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' :
                          'bg-neutral-800/50 text-neutral-400 border border-neutral-800'
                        }`}>
                          <div className="flex-shrink-0 mt-0.5 w-6">
                            {log.type === 'error' ? <AlertTriangle className="h-4 w-4 text-red-400" /> :
                             log.type === 'success' ? <Zap className="h-4 w-4 text-emerald-400" /> :
                             log.type === 'info' ? <Activity className="h-4 w-4 text-indigo-400" /> :
                             <Activity className="h-4 w-4 text-neutral-500" />}
                          </div>
                          <div className="flex-1 ml-2 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-xs opacity-70">
                                [{log.timestamp}]
                              </span>
                            </div>
                            <p className="leading-snug">
                              {log.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
