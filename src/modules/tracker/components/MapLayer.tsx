import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { MapOrder, TeamLocation } from '@/types/ssgen';

// Fix default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export function MapLayer({ 
  orders = [], 
  team = [], 
  onOrderClick 
}: {
  orders: MapOrder[];
  team: TeamLocation[];
  onOrderClick: (id: string) => void;
}) {
  const center: [number, number] = orders[0] ? [orders[0].lat, orders[0].lon] : [-15.7942, -47.8822];

  return (
    <div className="bg-zenith-card rounded-2xl p-4 border border-zenith-navy/30">
      <div className="text-zenith-gold mb-3 font-semibold">Mapa Operacional</div>
      <MapContainer 
        center={center} 
        zoom={7} 
        style={{ height: 500, width: '100%', borderRadius: '12px' }}
      >
        <>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {orders.map((o) => (
            <Marker 
              key={`os-${o.id}`} 
              position={[o.lat, o.lon]}
              eventHandlers={{ 
                click: () => onOrderClick(o.id) 
              }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold">OS {o.ordem_servico_ssgen}</div>
                  <div>{o.cliente}</div>
                  <div>Prioridade: {o.prioridade ?? '-'}</div>
                  <div>Rep: {o.representante}</div>
                </div>
              </Popup>
            </Marker>
          ))}
          {team.map((t) => (
            <Marker key={`team-${t.id}`} position={[t.lat, t.lon]}>
              <Popup>
                <div className="text-xs">
                  <div className="font-bold">Equipe: {t.nome}</div>
                  <div>Status: {t.status}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </>
      </MapContainer>
    </div>
  );
}
