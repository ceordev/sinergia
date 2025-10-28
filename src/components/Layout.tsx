import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Home, User as UserIcon, LogOut, History } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">S</span>
                </div>
                <span className="font-semibold text-xl">Sinergia</span>
              </Link>

              <div className="flex gap-4">
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Playground
                </Link>

                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/profile'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                  Perfil
                </Link>

                <Link
                  to="/history"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/history'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <History className="h-4 w-4" />
                  Historial
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
