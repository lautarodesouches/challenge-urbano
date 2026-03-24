import { LogOut, Radio, Zap, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface HeaderProps {
  isConnected: boolean;
  onLogout: () => void;
}

export const Header = ({ isConnected, onLogout }: HeaderProps) => {
  return (
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
        <button onClick={onLogout} className="p-2 text-neutral-400 hover:text-red-400 transition-colors" title="Cerrar sesión">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
