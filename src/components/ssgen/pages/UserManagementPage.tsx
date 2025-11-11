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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HeaderBar } from '../shared/HeaderBar';
import { UserPlus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchUsersWithRoles, assignUserRole, removeUserRole, type AppRole } from '@/lib/userRolesApi';
import { fetchCoordenadores } from '@/lib/coordenadoresApi';
import { fetchRepresentantes } from '@/lib/representantesApi';

export default function UserManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [filterCoord, setFilterCoord] = useState<string>('all');
  const [filterRep, setFilterRep] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
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

    // Validação client-side
    if (selectedRole === 'GERENTE' && (!selectedCoord || selectedCoord.trim() === '')) {
      toast({
        title: 'Validação',
        description: 'GERENTE deve ter um coordenador atribuído',
        variant: 'destructive',
      });
      return;
    }

    if (selectedRole === 'REPRESENTANTE' && (!selectedRep || selectedRep.trim() === '')) {
      toast({
        title: 'Validação',
        description: 'REPRESENTANTE deve ter um representante atribuído',
        variant: 'destructive',
      });
      return;
    }

    assignMutation.mutate({
      userId: selectedUser,
      role: selectedRole,
      coord: selectedRole === 'GERENTE' ? selectedCoord || undefined : undefined,
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

  const filtered = users.filter(user => {
    const matchesQuery = user.email.toLowerCase().includes(query.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesCoord = filterCoord === 'all' || user.coord === filterCoord;
    const matchesRep = filterRep === 'all' || user.rep === filterRep;
    
    return matchesQuery && matchesRole && matchesCoord && matchesRep;
  });

  const hasIncompleteAssignments = users.some(
    user => 
      (user.role === 'GERENTE' && !user.coord) ||
      (user.role === 'REPRESENTANTE' && !user.rep)
  );

  return (
    <div className="space-y-4">
      <HeaderBar title="Gerenciamento de Usuários" query={query} setQuery={setQuery} />

      {hasIncompleteAssignments && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Há usuários com GERENTE ou REPRESENTANTE sem coordenador/representante atribuído. 
            Isso impede o acesso correto aos dados. Clique no ícone de edição para corrigir.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Usuários e Papéis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Filtrar por Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ADM">ADM</SelectItem>
                  <SelectItem value="GERENTE">GERENTE</SelectItem>
                  <SelectItem value="REPRESENTANTE">REPRESENTANTE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filtrar por Coordenador</Label>
              <Select value={filterCoord} onValueChange={setFilterCoord}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {coordenadores.map(coord => (
                    <SelectItem key={coord.id} value={coord.nome}>
                      {coord.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filtrar por Representante</Label>
              <Select value={filterRep} onValueChange={setFilterRep}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {representantes.map(rep => (
                    <SelectItem key={rep.id} value={rep.nome}>
                      {rep.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {user.role ? (
                      <>
                        <Badge variant="outline">{user.role}</Badge>
                        {user.coord && <Badge variant="secondary">Coord: {user.coord}</Badge>}
                        {user.rep && <Badge variant="secondary">Rep: {user.rep}</Badge>}
                        {user.role === 'GERENTE' && !user.coord && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Coordenador não atribuído
                          </Badge>
                        )}
                        {user.role === 'REPRESENTANTE' && !user.rep && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Representante não atribuído
                          </Badge>
                        )}
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
                  <SelectItem value="GERENTE">GERENTE</SelectItem>
                  <SelectItem value="REPRESENTANTE">REPRESENTANTE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === 'GERENTE' && (
              <div className="space-y-2">
                <Label htmlFor="coord" className="text-destructive">
                  Coordenador <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedCoord ?? undefined} onValueChange={(value) => setSelectedCoord(value || undefined)}>
                  <SelectTrigger id="coord" className={!selectedCoord ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione o coordenador (obrigatório)" />
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
                <Label htmlFor="rep" className="text-destructive">
                  Representante <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedRep ?? undefined} onValueChange={(value) => setSelectedRep(value || undefined)}>
                  <SelectTrigger id="rep" className={!selectedRep ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione o representante (obrigatório)" />
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
