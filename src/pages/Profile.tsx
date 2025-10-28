import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { User } from 'lucide-react';

export function Profile() {
  const { profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    skills: '',
    professional_interests: '',
    hobbies: '',
    availability: '',
    preferred_mode: 'Ambos' as 'Afinidad' | 'Reto' | 'Ambos',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        skills: profile.skills?.join(', ') || '',
        professional_interests: profile.professional_interests?.join(', ') || '',
        hobbies: profile.hobbies?.join(', ') || '',
        availability: profile.availability || '',
        preferred_mode: profile.preferred_mode || 'Ambos',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        display_name: formData.display_name,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        professional_interests: formData.professional_interests.split(',').map(s => s.trim()).filter(Boolean),
        hobbies: formData.hobbies.split(',').map(s => s.trim()).filter(Boolean),
        availability: formData.availability,
        preferred_mode: formData.preferred_mode,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Mi Perfil</CardTitle>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nombre"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  required
                />

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Habilidades (separadas por comas)
                  </label>
                  <Input
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="React, TypeScript, Python"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Intereses Profesionales (separados por comas)
                  </label>
                  <Input
                    value={formData.professional_interests}
                    onChange={(e) => setFormData({ ...formData, professional_interests: e.target.value })}
                    placeholder="IA, UX Design, DevOps"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hobbies (separados por comas)
                  </label>
                  <Input
                    value={formData.hobbies}
                    onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
                    placeholder="Fotografía, Senderismo, Música"
                  />
                </div>

                <Input
                  label="Disponibilidad"
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  placeholder="Lun-Vie 9am-5pm"
                />

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Modo Preferido
                  </label>
                  <select
                    value={formData.preferred_mode}
                    onChange={(e) => setFormData({ ...formData, preferred_mode: e.target.value as 'Afinidad' | 'Reto' | 'Ambos' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Afinidad">Afinidad</option>
                    <option value="Reto">Reto</option>
                    <option value="Ambos">Ambos</option>
                  </select>
                </div>

                <Button type="submit" className="w-full" isLoading={loading}>
                  Guardar Cambios
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Nombre</h3>
                  <p className="mt-1">{profile.display_name}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Habilidades</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.skills && profile.skills.length > 0 ? (
                      profile.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No especificadas</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Intereses Profesionales</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.professional_interests && profile.professional_interests.length > 0 ? (
                      profile.professional_interests.map((interest, i) => (
                        <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No especificados</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Hobbies</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.hobbies && profile.hobbies.length > 0 ? (
                      profile.hobbies.map((hobby, i) => (
                        <span key={i} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">
                          {hobby}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No especificados</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Disponibilidad</h3>
                  <p className="mt-1">{profile.availability || 'No especificada'}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Modo Preferido</h3>
                  <p className="mt-1">{profile.preferred_mode || 'No especificado'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
