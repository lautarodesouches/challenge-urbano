import { useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Loader2, Lock } from 'lucide-react';
import { API_BASE_URL } from '../config/constants';

export function LoginForm() {
  const [email, setEmail] = useState('admin@challenge.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const setToken = useAppStore((state) => state.setToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.isSuccess) {
        throw new Error(data.message || 'Credenciales inválidas o incompletas');
      }

      setToken(data.data.accessToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-indigo-500/30 font-sans">
      <Card className="w-full max-w-md bg-neutral-900/40 border-neutral-800 shadow-2xl glass-panel relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 mb-2">
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-semibold text-neutral-50 tracking-tight">Acceso Privado</CardTitle>
          <CardDescription className="text-neutral-400">Ingresa tus credenciales para administrar el backend</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none text-neutral-300">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 transition-all"
                placeholder="admin@challenge.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none text-neutral-300">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md animate-in fade-in zoom-in-95">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-500/20"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-neutral-800/50 pt-4 mt-2">
          <p className="text-xs text-neutral-500">Seeder Credenciales Autocompletadas</p>
        </CardFooter>
      </Card>
    </div>
  );
}
