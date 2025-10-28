import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Send, LogOut, Sparkles } from 'lucide-react';
import type { ChatMessage, User } from '../lib/supabase';

export function Chat() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [generatedTopic, setGeneratedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<{summary: string; keyPoints: string[]} | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !user) return;

    loadChatData();
    loadMessages();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`chat:${chatId}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [chatId, user]);

  // Separate effect for match status subscription
  useEffect(() => {
    if (!matchId) return;

    console.log('Subscribing to match status for:', matchId);
    
    const matchChannel = supabase
      .channel(`match:${matchId}:status`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          console.log('Match status changed:', payload);
          // If match status changed to 'ended', the other user ended the chat
          if (payload.new.status === 'ended') {
            // Show a message and navigate back
            alert('El otro usuario ha terminado el chat. Volviendo al Playground...');
            navigate('/');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
    };
  }, [matchId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatData = async () => {
    if (!chatId || !user) return;

    try {
      // Get match information
      const { data: match } = await supabase
        .from('matches')
        .select('*, user1:users!matches_user1_id_fkey(*), user2:users!matches_user2_id_fkey(*)')
        .eq('chat_id', chatId)
        .single();

      if (match) {
        setMatchId(match.id);
        // Determine the other user
        const other = match.user1.id === user?.id ? match.user2 : match.user1;
        setOtherUser(other);
        setGeneratedTopic(match.generated_topic);
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!chatId) return;

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user) return;

    try {
      const { error } = await supabase.from('chat_messages').insert({
        chat_id: chatId,
        sender_id: user.id,
        text: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    }
  };

  const handleEndChat = async () => {
    if (!chatId || !user || !matchId) return;

    if (!confirm('¿Estás seguro de que quieres terminar el chat?')) return;

    setLoading(true);
    
    try {
      // Call Edge Function to generate summary
      const { data, error } = await supabase.functions.invoke('summarize-chat', {
        body: {
          matchId,
          chatId,
        },
      });

      if (error) {
        console.error('Error generating summary:', error);
        // Continue anyway to end the chat
      } else if (data) {
        setSummary({
          summary: data.summary,
          keyPoints: data.keyPoints || [],
        });
        setShowSummary(true);
      }
      
      // Don't navigate immediately, show summary first
    } catch (error) {
      console.error('Error ending chat:', error);
      alert('Error al terminar el chat');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSummary = () => {
    setShowSummary(false);
    navigate('/');
  };

  if (loading) {
    return <div className="p-4">Cargando chat...</div>;
  }

  // Show summary modal if available
  if (showSummary && summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Resumen de la Conversación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Resumen:</h3>
              <p className="text-muted-foreground">{summary.summary}</p>
            </div>
            
            {summary.keyPoints.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Puntos Clave:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {summary.keyPoints.map((point, index) => (
                    <li key={index} className="text-muted-foreground">{point}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={handleCloseSummary}>
                Volver al Playground
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Card className="flex-1 flex flex-col m-4 max-w-4xl mx-auto w-full">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Chat con {otherUser?.display_name || 'Usuario'}
            </CardTitle>
            <Button variant="destructive" size="sm" onClick={handleEndChat}>
              <LogOut className="h-4 w-4 mr-2" />
              Terminar Chat
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 space-y-4 max-h-[calc(100vh-250px)]">
          {generatedTopic && (
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Tema sugerido:</h4>
                  <p className="text-sm">{generatedTopic}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No hay mensajes aún. ¡Inicia la conversación!
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
