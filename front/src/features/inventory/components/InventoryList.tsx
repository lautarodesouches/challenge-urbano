import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import { Database, Loader2 } from 'lucide-react';

interface InventoryListProps {
  inventory: any[];
  isLoading: boolean;
}

export const InventoryList = ({ inventory, isLoading }: InventoryListProps) => {
  return (
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
              {isLoading ? (
                <TableRow><TableCell colSpan={2} className="text-center py-8 text-neutral-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Leyendo inventario...</TableCell></TableRow>
              ) : (
                inventory?.map((inv: any) => (
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
  );
};
