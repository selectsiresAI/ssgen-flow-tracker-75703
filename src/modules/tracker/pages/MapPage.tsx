import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapLayer } from '../components/MapLayer';
import { useTrackerMapOrders, useTeamLocations } from '../hooks/useTrackerData';
import { supabase } from '@/integrations/supabase/client';

export default function MapPage() {
  const { data: orders = [], refetch: refetchOrders } = useTrackerMapOrders();
  const { data: team = [], refetch: refetchTeam } = useTeamLocations();
  const navigate = useNavigate();

  useEffect(() => {
    const ch1 = supabase
      .channel('map-orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'service_orders' 
      }, () => refetchOrders())
      .subscribe();

    const ch2 = supabase
      .channel('map-team')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'team_locations' 
      }, () => refetchTeam())
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [refetchOrders, refetchTeam]);

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      <div className="text-3xl font-bold text-black">Mapa Operacional</div>
      <MapLayer
        orders={orders}
        team={team}
        onOrderClick={(id) => navigate(`/ordem/${id}`)} 
      />
    </div>
  );
}
