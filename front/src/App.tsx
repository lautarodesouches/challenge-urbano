import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from './store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Badge } from './components/ui/badge';
import { ScrollArea } from './components/ui/scroll-area';
import { Activity, Database, Loader2, Package, Radio, Zap, LogOut, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { LoginForm } from './components/LoginForm';
import { API_BASE_URL } from './config/constants';

// Conexión WebSockets al Gateway de NestJS (Expuesto en root por Docker)
const socket = io(API_BASE_URL);

function App() {
  const { logs, addLog, token, logout } = useAppStore();
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Escuchar Eventos Asincrónicos de Inventario
    socket.on('inventory:synced', (data) => {
      addLog({
        type: 'INVENTORY_SYNC',
        message: data.message,
        payload: data,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    });

    // Escuchar Notificaciones PUSH Globales
    socket.on('notification:push_sent', (data) => {
      const logEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        message: data.message,
        type: data.action === 'SYNC_COMPLETE' ? 'success' : 'info' as const
      };
      addLog(logEntry);
    });

    socket.on('inventory:low_stock', (data: any) => {
      const logEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(data.time).toLocaleTimeString(),
        message: `¡STOCK CRÍTICO! ${data.productTitle} ha caído a ${data.remainingQuantity} unidades.`,
        type: 'error' as const
      };
      addLog(logEntry);
    });

    socket.on('product:price_changed', (data: any) => {
      const isPriceUp = data.newPrice > data.oldPrice;
      const logEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(data.time).toLocaleTimeString(),
        message: `Actualización de Precio en ${data.productTitle}: de $${data.oldPrice} a $${data.newPrice}`,
        type: isPriceUp ? 'price_up' : 'price_down'
      };
      addLog(logEntry as any);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('inventory:synced');
      socket.off('notification:push_sent');
      socket.off('inventory:low_stock');
      socket.off('product:price_changed');
    };
  }, [addLog]);

  // React Query: Consumo robusto y cacheado de la API NestJS protejido con JWT
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', token],
    queryFn: async () => {
      if (!token) return [];
      try {
        const res = await fetch(`${API_BASE_URL}/api/product`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          logout(); // El token expiró o es inválido, cerramos sesión local
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('API Error');
        const json = await res.json();
        return Array.isArray(json) ? json : (json.data || []);
      } catch (err) {
        return [];
      }
    },
    enabled: !!token, // Solo se ejecuta la query si existe un JWT
  });

  // Guard de autenticación frontal
  if (!token) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 selection:bg-indigo-500/30 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Premium Glassmorphism */}
        <header className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Urbano Live Ops</h1>
              <p className="text-sm text-neutral-400">Event-Driven Logistics Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? 'default' : 'destructive'} className={isConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : ""}>
              {isConnected ? <><Radio className="w-3 h-3 mr-1 animate-pulse inline" /> WebSocket Live</> : <><Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> Disconnected</>}
            </Badge>
            <button onClick={() => logout()} className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors" title="Cerrar sesión">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Col 1: Panel de Catálogo (TanStack Query) */}
          <Card className="lg:col-span-2 bg-neutral-900/40 border-neutral-800 shadow-xl overflow-hidden glass-panel">
            <CardHeader className="border-b border-neutral-800/50 bg-neutral-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-400" />
                    Catálogo de Productos
                  </CardTitle>
                  <CardDescription>Datos reales cacheados vía TanStack Query</CardDescription>
                </div>
                <Badge variant="outline" className="border-neutral-700">{products?.length || 0} items</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader className="bg-neutral-900/50">
                    <TableRow className="border-neutral-800 hover:bg-transparent">
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Detalle</TableHead>
                      <TableHead className="text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-neutral-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Cargando inventario...
                        </TableCell>
                      </TableRow>
                    ) : products?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-neutral-500">
                          Sin productos detectados. El backend puede no tener endpoints GET activos para public/productos en este path, o la DB está vacía.
                        </TableCell>
                      </TableRow>
                    ) : (
                      products?.map((p: any) => (
                        <TableRow key={p.id} className="border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                          <TableCell className="font-mono text-neutral-400">#{p.id}</TableCell>
                          <TableCell className="font-medium">{p.title || 'N/A'}</TableCell>
                          <TableCell className="text-neutral-500">{p.description?.substring(0,30) || '...'}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={p.isActive ? "default" : "secondary"} className={p.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-neutral-800 text-neutral-400 border-neutral-700"}>
                              {p.isActive ? 'Active' : 'Draft'}
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

          {/* Col 2: Live Stream de Eventos (Zustand + WebSockets) */}
          <Card className="bg-neutral-900/40 border-neutral-800 shadow-xl overflow-hidden glass-panel flex flex-col">
            <CardHeader className="border-b border-neutral-800/50 bg-neutral-900/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent animate-pulse"></div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Live Event Stream
              </CardTitle>
              <CardDescription>Consumidor Zustand Desacoplado</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[500px] p-4">
                {logs.length === 0 ? (
                  <p className="text-zinc-500 italic text-sm text-center py-4">
                    Comienza a operar la DB para escuchar el pulso de los eventos...
                  </p>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log: any) => (
                      <div key={log.id} className={`flex items-start rounded-lg p-3 text-sm transition-all animate-in slide-in-from-left-2 ${
                        log.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-200' :
                        log.type === 'success' ? 'bg-emerald-500/5 text-zinc-300 border border-emerald-500/10' :
                        log.type === 'price_up' || log.type === 'price_down' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-200' :
                        'bg-zinc-800/50 text-zinc-400'
                      }`}>
                        <div className="flex-shrink-0 mt-0.5 w-6">
                          {log.type === 'error' ? <AlertTriangle className="h-4 w-4 text-red-400" /> :
                           log.type === 'success' ? <Zap className="h-4 w-4 text-emerald-400" /> :
                           log.type === 'price_up' ? <TrendingUp className="h-4 w-4 text-blue-400" /> :
                           log.type === 'price_down' ? <TrendingDown className="h-4 w-4 text-blue-400" /> :
                           <Activity className="h-4 w-4 text-zinc-500" />}
                        </div>
                        <div className="flex-1 ml-2 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-xs opacity-70">
                              [{log.timestamp}]
                            </span>
                            {log.type === 'error' && (
                              <Badge variant="destructive" className="h-5 text-[10px] px-1.5 bg-red-500 hover:bg-red-600">CRITICAL</Badge>
                            )}
                            {(log.type === 'price_up' || log.type === 'price_down') && (
                              <Badge variant="outline" className="h-5 text-[10px] px-1.5 bg-blue-950 border-blue-800 text-blue-300">
                                PRICING
                              </Badge>
                            )}
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
  );
}

export default App;
