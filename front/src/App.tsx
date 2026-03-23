import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from './store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Badge } from './components/ui/badge';
import { ScrollArea } from './components/ui/scroll-area';
import { Activity, Database, Loader2, Package, Radio, Zap } from 'lucide-react';

// Conexión WebSockets al Gateway de NestJS (Expuesto en root por Docker)
const socket = io('http://localhost:3000');

function App() {
  const { logs, addLog } = useAppStore();
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
      addLog({
        type: 'GLOBAL_ALERT',
        message: `Producto ${data.productId} ha sido ACTIVADO para comercialización en vivo.`,
        payload: data,
        timestamp: data.time || new Date().toISOString(),
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('inventory:synced');
      socket.off('notification:push_sent');
    };
  }, [addLog]);

  // React Query: Consumo robusto y cacheado de la API NestJS
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const res = await fetch('http://localhost:3000/api/product');
        if (!res.ok) throw new Error('API Error');
        const json = await res.json();
        return Array.isArray(json) ? json : (json.data || []);
      } catch (err) {
        return [];
      }
    },
  });

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
                          <TableCell className="font-medium">{p.name || 'N/A'}</TableCell>
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
                <div className="space-y-4">
                  {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-neutral-500 space-y-3">
                      <Database className="w-8 h-8 opacity-20" />
                      <p className="text-sm text-center">Esperando transmisiones <br/>del EventGateway...</p>
                    </div>
                  ) : (
                     logs.map((log) => (
                      <div key={log.id} className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-indigo-500/30 shadow-lg animate-in slide-in-from-right-4 fade-in duration-300 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-[10px] font-mono bg-neutral-950 border-neutral-700 text-indigo-300">
                            {log.type}
                          </Badge>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-300 leading-relaxed font-mono">
                          {log.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
