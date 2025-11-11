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
import { HeaderBar } from '../shared/HeaderBar';
import {
  fetchRepresentantes,
  createRepresentante,
  updateRepresentante,
  deleteRepresentante,
  Representante,
} from '@/lib/representantesApi';
import { fetchCoordenadores, createCoordenador } from '@/lib/coordenadoresApi';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type RepresentanteFormData = {
  nome: string;
  email: string;
  coordenador_id: string | null;
};

const RepresentantesPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Representante | null>(null);
  const [formData, setFormData] = useState<RepresentanteFormData>({
    nome: '',
    email: '',
    coordenador_id: null,
  });
  const [formErrors, setFormErrors] = useState<{ coordenador_id?: string }>({});
  const [isCoordenadorDialogOpen, setIsCoordenadorDialogOpen] = useState(false);
  const [newCoordenadorData, setNewCoordenadorData] = useState({ nome: '', email: '' });

  const queryClient = useQueryClient();

  const { data: representantes = [], isLoading } = useQuery({
    queryKey: ['representantes'],
    queryFn: fetchRepresentantes,
  });

  const { data: coordenadores = [], isLoading: isLoadingCoordenadores } = useQuery({
    queryKey: ['coordenadores'],
    queryFn: fetchCoordenadores,
  });

  const createCoordenadorMutation = useMutation({
    mutationFn: createCoordenador,
    onSuccess: (novoCoordenador) => {
      queryClient.invalidateQueries({ queryKey: ['coordenadores'] });
      toast.success('Coordenador criado com sucesso!');
      setIsCoordenadorDialogOpen(false);
      setNewCoordenadorData({ nome: '', email: '' });
      setFormData((prev) => ({ ...prev, coordenador_id: novoCoordenador.id }));
      setFormErrors((prev) => ({ ...prev, coordenador_id: undefined }));
    },
    onError: () => toast.error('Erro ao criar coordenador'),
  });

  const createMutation = useMutation({
    mutationFn: createRepresentante,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representantes'] });
      toast.success('Representante criado com sucesso!');
      setIsDialogOpen(false);
      setFormData({ nome: '', email: '', coordenador_id: null });
      setFormErrors({});
    },
    onError: () => toast.error('Erro ao criar representante'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Representante, 'id' | 'coordenador'>> }) =>
      updateRepresentante(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representantes'] });
      toast.success('Representante atualizado com sucesso!');
      setIsDialogOpen(false);
      setEditingRep(null);
      setFormData({ nome: '', email: '', coordenador_id: null });
      setFormErrors({});
    },
    onError: () => toast.error('Erro ao atualizar representante'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRepresentante,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representantes'] });
      toast.success('Representante removido com sucesso!');
    },
    onError: () => toast.error('Erro ao remover representante'),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.coordenador_id) {
      setFormErrors({ coordenador_id: 'Por favor selecione um coordenador' });
      return;
    }

    const coordenadorValido = coordenadores.some(
      (coord) => coord.id === formData.coordenador_id,
    );

    if (!coordenadorValido) {
      setFormErrors({ coordenador_id: 'Coordenador inválido' });
      return;
    }

    setFormErrors({});

    const payload = {
      nome: formData.nome.trim(),
      email: formData.email.trim() ? formData.email.trim() : null,
      coordenador_id: formData.coordenador_id,
    };

    if (editingRep) {
      updateMutation.mutate({ id: editingRep.id, data: payload });
    } else {
      createMutation.mutate({ ...payload, ativo: true });
    }
  };

  const handleEdit = (rep: Representante) => {
    setEditingRep(rep);
    setFormData({
      nome: rep.nome,
      email: rep.email ?? '',
      coordenador_id: rep.coordenador_id,
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleCreateCoordenador = (e: React.FormEvent) => {
    e.preventDefault();

    const nome = newCoordenadorData.nome.trim();
    const email = newCoordenadorData.email.trim();

    if (!nome) {
      toast.error('Informe o nome do coordenador');
      return;
    }

    createCoordenadorMutation.mutate({
      nome,
      email: email ? email : null,
      ativo: true,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este representante?')) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = representantes.filter((r) =>
    r.nome.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <HeaderBar title="Representantes" query={query} setQuery={setQuery} />
      
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingRep(null);
          setFormData({ nome: '', email: '', coordenador_id: null });
          setFormErrors({});
        }
      }}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Representante
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRep ? 'Editar' : 'Novo'} Representante</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="coordenador">
                Coordenador <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.coordenador_id ?? undefined}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, coordenador_id: value }));
                  setFormErrors((prev) => ({ ...prev, coordenador_id: undefined }));
                }}
                disabled={isLoadingCoordenadores}
              >
                <SelectTrigger
                  id="coordenador"
                  className={formErrors.coordenador_id ? 'border-destructive focus:ring-destructive' : undefined}
                >
                  <SelectValue placeholder="Selecione um coordenador..." />
                </SelectTrigger>
                <SelectContent>
                  {coordenadores.length > 0 ? (
                    coordenadores.map((coord) => (
                      <SelectItem key={coord.id} value={coord.id}>
                        {coord.email ? `${coord.nome} — ${coord.email}` : coord.nome}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="sem-coordenadores" disabled>
                      Nenhum coordenador disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {formErrors.coordenador_id ? (
                <p className="text-sm text-destructive mt-1">{formErrors.coordenador_id}</p>
              ) : isLoadingCoordenadores ? (
                <p className="text-sm text-muted-foreground mt-1">Carregando coordenadores...</p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Atribua um coordenador responsável por este representante.
                </p>
              )}
              {coordenadores.length === 0 && !isLoadingCoordenadores && (
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm font-normal"
                  onClick={() => setIsCoordenadorDialogOpen(true)}
                >
                  Criar novo coordenador
                </Button>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {editingRep
                ? isSaving
                  ? 'Atualizando...'
                  : 'Atualizar'
                : isSaving
                  ? 'Criando...'
                  : 'Criar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        modal={false}
        open={isCoordenadorDialogOpen}
        onOpenChange={(open) => {
          setIsCoordenadorDialogOpen(open);
          if (!open) {
            setNewCoordenadorData({ nome: '', email: '' });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Coordenador</DialogTitle>
            <DialogDescription>
              Cadastre um coordenador para vinculá-lo ao representante.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCoordenador} className="space-y-4">
            <div>
              <Label htmlFor="novo-coordenador-nome">Nome *</Label>
              <Input
                id="novo-coordenador-nome"
                value={newCoordenadorData.nome}
                onChange={(e) =>
                  setNewCoordenadorData((prev) => ({ ...prev, nome: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="novo-coordenador-email">Email</Label>
              <Input
                id="novo-coordenador-email"
                type="email"
                value={newCoordenadorData.email}
                onChange={(e) =>
                  setNewCoordenadorData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createCoordenadorMutation.isPending}
            >
              {createCoordenadorMutation.isPending ? 'Criando...' : 'Criar Coordenador'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Representantes ({filtered.length})
            {isLoading && <span className="text-sm font-normal ml-2">Carregando...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando representantes...
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((rep) => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-base">{rep.nome}</div>
                    {rep.email && (
                      <div className="text-sm text-muted-foreground mt-1">{rep.email}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(rep)}
                      title="Editar representante"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rep.id)}
                      title="Remover representante"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                  <p className="text-lg mb-2">Nenhum representante encontrado</p>
                  {query && (
                    <p className="text-sm">Tente ajustar sua busca ou adicionar um novo representante</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RepresentantesPage;
