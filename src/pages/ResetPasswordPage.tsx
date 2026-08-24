import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type Status = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let cancelled = false;

    const establishSession = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ''));

      const access_token = hash.get('access_token');
      const refresh_token = hash.get('refresh_token');
      const code = url.searchParams.get('code');
      const token_hash = url.searchParams.get('token_hash') || hash.get('token_hash');
      const type = url.searchParams.get('type') || hash.get('type');
      const errorDescription =
        url.searchParams.get('error_description') || hash.get('error_description');

      try {
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (token_hash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: (type as 'recovery') || 'recovery',
          });
          if (error) throw error;
        } else if (errorDescription) {
          throw new Error(errorDescription);
        }
      } catch (e) {
        // fall through — we still check for an existing session below
        console.error('[reset-password]', e);
      }

      // clean the URL so tokens are not reused / visible
      window.history.replaceState({}, '', '/reset-password');

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setStatus(data.session ? 'ready' : 'invalid');
    };

    establishSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Senha muito curta', description: 'Mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Senhas diferentes', description: 'Confirme a mesma senha.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      if (/session|jwt|expired/i.test(error.message)) setStatus('invalid');
    } else {
      toast({ title: 'Senha atualizada!', description: 'Redirecionando...' });
      setTimeout(() => navigate('/'), 1200);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">Nova Senha</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'checking' && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {status === 'invalid' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Este link de recuperação é inválido ou já expirou. Solicite um novo link.
              </p>
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Voltar ao login
              </Button>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                type="password"
                placeholder="Nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                autoFocus
              />
              <Input
                type="password"
                placeholder="Confirme a nova senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar nova senha'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
