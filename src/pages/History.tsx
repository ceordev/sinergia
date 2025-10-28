import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { History as HistoryIcon, Sparkles } from 'lucide-react';

interface ChatHistory {
  id: string;
  mode: string;
  topic: string | null;
  summary: string;
  key_points: string[];
  started_at: string;
  ended_at: string;
  other_user_name: string;
}

export function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      const { data: historyData } = await supabase
        .from('chat_history')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('ended_at', { ascending: false });

      if (historyData) {
        // Get other user names
        const enrichedHistory = await Promise.all(
          historyData.map(async (item) => {
            const otherUserId = item.user1_id === user.id ? item.user2_id : item.user1_id;
            const { data: otherUser } = await supabase
              .from('users')
              .select('display_name')
              .eq('id', otherUserId)
              .single();

            return {
              ...item,
              other_user_name: otherUser?.display_name || 'Usuario',
            };
          })
        );

        setHistory(enrichedHistory);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Cargando historial...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="h-6 w-6" />
              Historial de Conversaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No tienes conversaciones guardadas aún.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <Card key={item.id} className="border">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            Chat con {item.other_user_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Modo: {item.mode} • {new Date(item.ended_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>

                      {item.topic && (
                        <div className="bg-primary/5 p-3 rounded-lg">
                          <p className="text-sm font-medium">Tema:</p>
                          <p className="text-sm text-muted-foreground">{item.topic}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium mb-1">Resumen:</p>
                        <p className="text-sm text-muted-foreground">{item.summary}</p>
                      </div>

                      {item.key_points.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Puntos Clave:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {item.key_points.map((point, index) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
