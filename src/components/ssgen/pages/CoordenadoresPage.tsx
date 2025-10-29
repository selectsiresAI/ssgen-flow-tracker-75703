import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeaderBar } from '../shared/HeaderBar';
import { fetchCoordenadores, createCoordenador, updateCoordenador, deleteCoordenador, Coordenador } from '@/lib/coordenadoresApi';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const CoordenadoresPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoord, setEditingCoord] = useState<Coordenador | null>(null);
  const [formData, setFormData] = useState({ nome: '', email: '' });

  const queryClient = useQueryClient();

  const { data: coordenadores = [] } = useQuery({
    queryKey: ['coordenadores'],
    queryFn: fetchCoordenadores,
  });

  const createMutation = useMutation({
    mutationFn: createCoordenador,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordenadores'] });
      toast.success('Coordenador criado com sucesso!');
      setIsDialogOpen(false);
      setFormData({ nome: '', email: '' });
    },
    onError: () => toast.error('Erro ao criar coordenador'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coordenador> }) =>
      updateCoordenador(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordenadores'] });
      toast.success('Coordenador atualizado com sucesso!');
      setIsDialogOpen(false);
      setEditingCoord(null);
      setFormData({ nome: '', email: '' });
    },
    onError: () => toast.error('Erro ao atualizar coordenador'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoordenador,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordenadores'] });
      toast.success('Coordenador removido com sucesso!');
    },
    onError: () => toast.error('Erro ao remover coordenador'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoord) {
      updateMutation.mutate({ id: editingCoord.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, ativo: true });
    }
  };

  const handleEdit = (coord: Coordenador) => {
    setEditingCoord(coord);
    setFormData({ nome: coord.nome, email: coord.email || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este coordenador?')) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = coordenadores.filter((c) =>
    c.nome.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <HeaderBar title="Coordenadores" query={query} setQuery={setQuery} />
      
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingCoord(null);
          setFormData({ nome: '', email: '' });
        }
      }}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Coordenador
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoord ? 'Editar' : 'Novo'} Coordenador</DialogTitle>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full">
              {editingCoord ? 'Atualizar' : 'Criar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Coordenadores ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.map((coord) => (
              <div
                key={coord.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{coord.nome}</div>
                  {coord.email && (
                    <div className="text-sm text-muted-foreground">{coord.email}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(coord)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(coord.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nenhum coordenador encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoordenadoresPage;
