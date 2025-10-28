import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Search, MessageCircle, Loader2 } from 'lucide-react';
import type { User } from '../lib/supabase';

export function Playground() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [topicInput, setTopicInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<User[]>([]);
  const [currentMode, setCurrentMode] = useState<'Afinidad' | 'Reto' | null>(null);
  const [localStatus, setLocalStatus] = useState<string>('idle');
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !profile) return;

    // Poll for match status and pending invitations
    const interval = setInterval(async () => {
      // Check for pending invitations where I'm user2
      const { data: invitations } = await supabase
        .from('matches')
        .select('*')
        .eq('user2_id', user.id)
        .eq('status', 'pending');

      if (invitations && invitations.length > 0) {
        // Get requester details for each invitation
        const invitationsWithDetails = await Promise.all(
          invitations.map(async (inv) => {
            const { data: requester } = await supabase
              .from('users')
              .select('display_name')
              .eq('id', inv.user1_id)
              .single();
            return { ...inv, requester };
          })
        );
        setPendingInvitations(invitationsWithDetails);
      } else {
        setPendingInvitations([]);
      }

      // Check if match is active and navigate to chat
      const { data } = await supabase
        .from('users')
        .select('status, current_match_id')
        .eq('id', user.id)
        .single();

      if (data?.status === 'matched' && data.current_match_id) {
        const { data: matchData } = await supabase
          .from('matches')
          .select('*')
          .eq('id', data.current_match_id)
          .single();

        if (matchData && matchData.status === 'active' && matchData.chat_id) {
          navigate(`/chat/${matchData.chat_id}`);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, profile, navigate]);

  const handleSearchConnections = async (mode: 'Afinidad' | 'Reto') => {
    if (!user) return;

    setLoading(true);
    setCurrentMode(mode);
    setRecommendations([]);

    try {
      // Update user status to searching
      setLocalStatus('searching');
      await supabase
        .from('users')
        .update({ status: 'searching' })
        .eq('id', user.id);

      // Try to call Edge Function to find recommendations with AI
      const { data, error } = await supabase.functions.invoke('find-recommendations', {
        body: {
          userId: user.id,
          mode,
          topicInput: topicInput.trim() || null,
        },
      });

      console.log('Edge Function response:', { data, error });

      let recommendedIds = data?.recommendedUserIds || [];
      console.log('Recommended IDs:', recommendedIds);

      // If Edge Function failed or returned no results, use fallback (random users)
      if (error || recommendedIds.length === 0) {
        console.warn('Edge Function failed or no recommendations, using fallback:', error);
        
        // Fallback: Get random available users
        const { data: availableUsers } = await supabase
          .from('users')
          .select('*')
          .neq('id', user.id)
          .in('status', ['idle', 'searching'])
          .limit(3);

        if (availableUsers && availableUsers.length > 0) {
          recommendedIds = availableUsers.map(u => u.id);
        }
      }

      // Get user details for recommendations
      if (recommendedIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', recommendedIds);

        console.log('Users fetched:', { users, usersError });

        if (users) {
          // Sort users by recommended order
          const sortedUsers = recommendedIds
            .map((id: string) => users.find(u => u.id === id))
            .filter(Boolean);
          console.log('Sorted users to display:', sortedUsers);
          setRecommendations(sortedUsers as User[]);
        }
      } else {
        console.warn('No recommended IDs found');
        alert('No hay usuarios disponibles en este momento. Intenta más tarde.');
      }

      // Reset status back to idle
      setLocalStatus('idle');
      await supabase
        .from('users')
        .update({ status: 'idle' })
        .eq('id', user.id);

    } catch (error) {
      console.error('Error finding recommendations:', error);
      
      // Reset status back to idle on error
      setLocalStatus('idle');
      await supabase
        .from('users')
        .update({ status: 'idle' })
        .eq('id', user.id);
      
      alert('Error al buscar recomendaciones. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteToChat = async (selectedUserId: string) => {
    if (!user || !currentMode) return;

    setLoading(true);

    try {
      // Call Edge Function to initiate match
      const { error } = await supabase.functions.invoke('initiate-match', {
        body: {
          requesterUserId: user.id,
          selectedUserId,
          mode: currentMode,
          topicInput: topicInput.trim() || null,
        },
      });

      if (error) throw error;

      alert('¡Invitación enviada! Esperando respuesta...');
      setRecommendations([]);
      setCurrentMode(null);
    } catch (error) {
      console.error('Error initiating match:', error);
      alert('Error al enviar invitación. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (matchId: string, chatId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update match status to active
      await supabase
        .from('matches')
        .update({ status: 'active' })
        .eq('id', matchId);

      // Update both users status to in-chat
      const { data: match } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .single();

      if (match) {
        await supabase
          .from('users')
          .update({ status: 'in-chat', current_match_id: matchId })
          .in('id', [match.user1_id, match.user2_id]);
      }

      // Navigate to chat
      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Error al aceptar invitación');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectInvitation = async (matchId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update match status to rejected
      await supabase
        .from('matches')
        .update({ status: 'rejected' })
        .eq('id', matchId);

      // Reset both users status to idle
      const { data: match } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .single();

      if (match) {
        await supabase
          .from('users')
          .update({ status: 'idle', current_match_id: null })
          .in('id', [match.user1_id, match.user2_id]);
      }

      setPendingInvitations([]);
      alert('Invitación rechazada');
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      alert('Error al rechazar invitación');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <MessageCircle className="h-6 w-6" />
                Invitaciones Pendientes ({pendingInvitations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20"
                  >
                    <div>
                      <p className="font-semibold">
                        {invitation.requester?.display_name || 'Usuario'} quiere chatear contigo
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Modo: {invitation.mode}
                      </p>
                      {invitation.generated_topic && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Tema: {invitation.generated_topic}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAcceptInvitation(invitation.id, invitation.chat_id)}
                        disabled={loading}
                        size="sm"
                      >
                        Aceptar
                      </Button>
                      <Button
                        onClick={() => handleRejectInvitation(invitation.id)}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-6 w-6" />
              Buscar Conexiones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Estado: <span className="font-semibold text-foreground">{localStatus}</span>
              </p>
            </div>

            <Input
              label="¿Sobre qué te gustaría conversar o debatir? (Opcional)"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Ej: Convencer sobre Angular vs React"
            />

            <div className="flex gap-4">
              <Button
                onClick={() => handleSearchConnections('Afinidad')}
                disabled={loading}
                className="flex-1"
              >
                {loading && currentMode === 'Afinidad' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Buscar por Afinidad
              </Button>

              <Button
                onClick={() => handleSearchConnections('Reto')}
                disabled={loading}
                variant="secondary"
                className="flex-1"
              >
                {loading && currentMode === 'Reto' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Buscar por Reto
              </Button>
            </div>
          </CardContent>
        </Card>

        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Usuarios Recomendados</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{rec.display_name}</h3>
                      </div>

                      {rec.skills && rec.skills.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Habilidades:</p>
                          <div className="flex flex-wrap gap-2">
                            {rec.skills.slice(0, 3).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {rec.professional_interests && rec.professional_interests.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Intereses:</p>
                          <div className="flex flex-wrap gap-2">
                            {rec.professional_interests.slice(0, 3).map((interest, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => handleInviteToChat(rec.id)}
                        className="w-full"
                        disabled={loading}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Invitar a Chatear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
