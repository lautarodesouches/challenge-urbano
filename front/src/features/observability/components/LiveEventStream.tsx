import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Activity, AlertTriangle, Zap } from 'lucide-react';

interface LiveEventStreamProps {
  logs: any[];
}

export const LiveEventStream = ({ logs }: LiveEventStreamProps) => {
  return (
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
  );
};
