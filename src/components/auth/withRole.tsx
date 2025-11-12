import type { ComponentType } from 'react';
import React from 'react';
import { useAuthProfile } from '@/hooks/useAuthProfile';
import type { Role } from '@/types/ssgen';

export function withRole<P>(allowed: Role[], Fallback?: ComponentType) {
  return (Component: ComponentType<P>) => {
    const Wrapped: React.FC<P> = (props) => {
      const { data: profile, isLoading } = useAuthProfile();

      if (isLoading) return null;

      if (!profile || !allowed.includes(profile.role)) {
        if (Fallback) return <Fallback />;
        return (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Você não tem permissão para acessar esta área.
          </div>
        );
      }

      return <Component {...props} />;
    };

    Wrapped.displayName = `withRole(${Component.displayName ?? Component.name ?? 'Component'})`;
    return Wrapped;
  };
}

