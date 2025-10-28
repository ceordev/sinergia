import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export function Auth() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!displayName.trim()) {
          throw new Error('Por favor ingresa tu nombre');
        }
        await signUp(email, password, displayName);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ha ocurrido un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Bienvenido a Sinergia
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Nombre"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
                required={!isLogin}
              />
            )}
            
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
            
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={loading}>
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-sm text-primary hover:underline"
              >
                {isLogin
                  ? '¿No tienes cuenta? Regístrate'
                  : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
