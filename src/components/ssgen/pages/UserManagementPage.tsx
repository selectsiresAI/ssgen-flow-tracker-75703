import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { HeaderBar } from '../shared/HeaderBar';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchUsersWithRoles, assignUserRole, removeUserRole, type AppRole } from '@/lib/userRolesApi';
import { fetchCoordenadores } from '@/lib/coordenadoresApi';
import { fetchRepresentantes } from '@/lib/representantesApi';

export default function UserManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('REPRESENTANTE');
  const [selectedCoord, setSelectedCoord] = useState<string | undefined>(undefined);
  const [selectedRep, setSelectedRep] = useState<string | undefined>(undefined);

  // Buscar usuários com papéis
  const { data: users = [] } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: fetchUsersWithRoles,
  });

  // Buscar coordenadores
  const { data: coordenadores = [] } = useQuery({
    queryKey: ['coordenadores'],
    queryFn: fetchCoordenadores,
  });

  // Buscar representantes
  const { data: representantes = [] } = useQuery({
    queryKey: ['representantes'],
    queryFn: fetchRepresentantes,
  });

  // Mutation para atribuir papel
  const assignMutation = useMutation({
    mutationFn: ({ userId, role, coord, rep }: { userId: string; role: AppRole; coord?: string; rep?: string }) =>
      assignUserRole(userId, role, coord, rep),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: 'Papel atribuído',
        description: 'O papel foi atribuído com sucesso',
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atribuir papel',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para remover papel
  const removeMutation = useMutation({
    mutationFn: removeUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: 'Papel removido',
        description: 'O papel foi removido com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover papel',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (userId: string, role?: AppRole, coord?: string, rep?: string) => {
    setSelectedUser(userId);
    setSelectedRole(role || 'REPRESENTANTE');
    setSelectedCoord(coord ?? undefined);
    setSelectedRep(rep ?? undefined);
    setDialogOpen(true);
  };

  const handleRemove = (userId: string) => {
    if (confirm('Tem certeza que deseja remover o papel deste usuário?')) {
      removeMutation.mutate(userId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    assignMutation.mutate({
      userId: selectedUser,
      role: selectedRole,
      coord: selectedRole === 'COORDENADOR' ? selectedCoord || undefined : undefined,
      rep: selectedRole === 'REPRESENTANTE' ? selectedRep || undefined : undefined,
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setSelectedRole('REPRESENTANTE');
    setSelectedCoord(undefined);
    setSelectedRep(undefined);
  };

  const filtered = users.filter(user =>
    user.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <HeaderBar title="Gerenciamento de Usuários" query={query} setQuery={setQuery} />

      <Card>
        <CardHeader>
          <CardTitle>Usuários e Papéis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum usuário encontrado
              </p>
            )}
            {filtered.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.role ? (
                      <>
                        <Badge variant="outline">{user.role}</Badge>
                        {user.coord && <Badge variant="secondary">Coord: {user.coord}</Badge>}
                        {user.rep && <Badge variant="secondary">Rep: {user.rep}</Badge>}
                      </>
                    ) : (
                      <Badge variant="destructive">Sem papel</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(user.id, user.role, user.coord, user.rep)}
                  >
                    {user.role ? <Pencil className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  </Button>
                  {user.role && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(user.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Papel</DialogTitle>
            <DialogDescription>
              Selecione o papel e as vinculações para o usuário
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Papel</Label>
              <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as AppRole)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADM">ADM</SelectItem>
                  <SelectItem value="COORDENADOR">COORDENADOR</SelectItem>
                  <SelectItem value="REPRESENTANTE">REPRESENTANTE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === 'COORDENADOR' && (
              <div className="space-y-2">
                <Label htmlFor="coord">Coordenador</Label>
                <Select value={selectedCoord ?? undefined} onValueChange={(value) => setSelectedCoord(value || undefined)}>
                  <SelectTrigger id="coord">
                    <SelectValue placeholder="Selecione o coordenador" />
                  </SelectTrigger>
                  <SelectContent>
                    {coordenadores
                      .filter((coord) => coord.nome && coord.nome.trim() !== '')
                      .map(coord => (
                        <SelectItem key={coord.id ?? coord.nome} value={String(coord.nome)}>
                          {coord.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedRole === 'REPRESENTANTE' && (
              <div className="space-y-2">
                <Label htmlFor="rep">Representante</Label>
                <Select value={selectedRep ?? undefined} onValueChange={(value) => setSelectedRep(value || undefined)}>
                  <SelectTrigger id="rep">
                    <SelectValue placeholder="Selecione o representante" />
                  </SelectTrigger>
                  <SelectContent>
                    {representantes
                      .filter((rep) => rep.nome && rep.nome.trim() !== '')
                      .map(rep => (
                        <SelectItem key={rep.id ?? rep.nome} value={String(rep.nome)}>
                          {rep.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
