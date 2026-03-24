import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Loader2, PlusCircle } from 'lucide-react';

interface CreateProductFormProps {
  onSubmit: (title: string, price: number) => void;
  isPending: boolean;
}

export const CreateProductForm = ({ onSubmit, isPending }: CreateProductFormProps) => {
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) return;
    onSubmit(newTitle, Number(newPrice));
    setNewTitle('');
    setNewPrice('');
  };

  return (
    <Card className="bg-neutral-900/40 border-neutral-800 shadow-xl glass-panel">
      <CardHeader className="border-b border-neutral-800/50 bg-neutral-900/20 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PlusCircle className="w-5 h-5 text-indigo-400" />
          Creación Rápida de Producto
        </CardTitle>
        <CardDescription>Inserta un item para gatillar el evento de sincronización de stock</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
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
            disabled={isPending}
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors h-[38px] flex items-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear'}
          </button>
        </form>
      </CardContent>
    </Card>
  );
};
