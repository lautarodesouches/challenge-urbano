import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Loader2, ShoppingCart } from 'lucide-react';
import type { Product } from '../../../types';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  onActivate: (id: number) => void;
  onDeactivate: (id: number) => void;
  onUpdatePrice: (id: number, currentPrice: number) => void;
  onBuy: (id: number) => void;
  isMutating: boolean;
}

export const ProductList = ({ 
  products, 
  isLoading, 
  onActivate, 
  onDeactivate, 
  onUpdatePrice, 
  onBuy,
  isMutating
}: ProductListProps) => {
  return (
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
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-neutral-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando catálogo...</TableCell></TableRow>
              ) : (
                products?.map((p: Product) => (
                  <TableRow key={p.id} className="border-neutral-800">
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-emerald-400">${p.price}</TableCell>
                    <TableCell className="text-right flex gap-2 justify-end">
                      {p.isActive ? (
                        <button 
                          onClick={() => onDeactivate(p.id)}
                          disabled={isMutating}
                          className="bg-neutral-800 hover:bg-neutral-700 text-red-400 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-neutral-700 disabled:opacity-50"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button 
                          onClick={() => onActivate(p.id)}
                          disabled={isMutating}
                          className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-neutral-700 disabled:opacity-50"
                        >
                          Activar
                        </button>
                      )}
                      <button 
                        onClick={() => onUpdatePrice(p.id, p.price)}
                        disabled={isMutating}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-neutral-700 disabled:opacity-50"
                      >
                        +$10
                      </button>
                      <button 
                        onClick={() => onBuy(p.id)}
                        disabled={isMutating}
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
  );
};
