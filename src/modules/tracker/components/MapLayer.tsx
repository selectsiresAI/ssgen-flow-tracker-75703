import { useEffect, useRef } from 'react';
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

const DEFAULT_CENTER: [number, number] = [-15.7942, -47.8822];

export function MapLayer({
  orders = [],
  team = [],
  onOrderClick
}: {
  orders: MapOrder[];
  team: TeamLocation[];
  onOrderClick: (id: string) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const orderLayerRef = useRef<L.LayerGroup | null>(null);
  const teamLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: orders[0] ? [orders[0].lat, orders[0].lon] : DEFAULT_CENTER,
      zoom: 7,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    orderLayerRef.current = L.layerGroup().addTo(map);
    teamLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // ensure map tiles render correctly on first paint
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      orderLayerRef.current = null;
      teamLayerRef.current = null;
    };
  }, [orders]);

  useEffect(() => {
    if (!mapRef.current || !orderLayerRef.current) {
      return;
    }

    const layer = orderLayerRef.current;
    layer.clearLayers();

    orders.forEach((order) => {
      const marker = L.marker([order.lat, order.lon]);
      marker.on('click', () => onOrderClick(order.id));
      marker.bindPopup(
        `<div class="text-xs">`
        + `<div class="font-bold">OS ${order.ordem_servico_ssgen}</div>`
        + `<div>${order.cliente}</div>`
        + `<div>Prioridade: ${order.prioridade ?? '-'}</div>`
        + `<div>Rep: ${order.representante}</div>`
        + `</div>`
      );
      marker.addTo(layer);
    });

    if (orders.length) {
      const first = orders[0];
      mapRef.current.setView([first.lat, first.lon], mapRef.current.getZoom());
    } else {
      mapRef.current.setView(DEFAULT_CENTER, mapRef.current.getZoom());
    }
  }, [orders, onOrderClick]);

  useEffect(() => {
    if (!teamLayerRef.current) {
      return;
    }

    const layer = teamLayerRef.current;
    layer.clearLayers();

    team.forEach((member) => {
      const marker = L.marker([member.lat, member.lon]);
      marker.bindPopup(
        `<div class="text-xs">`
        + `<div class="font-bold">Equipe: ${member.nome}</div>`
        + `<div>Status: ${member.status}</div>`
        + `</div>`
      );
      marker.addTo(layer);
    });
  }, [team]);

  return (
    <div className="bg-zenith-card rounded-2xl p-4 border border-zenith-navy/30">
      <div className="text-zenith-gold mb-3 font-semibold">Mapa Operacional</div>
      <div
        ref={mapContainerRef}
        style={{ height: 500, width: '100%', borderRadius: '12px' }}
        className="overflow-hidden"
      />
    </div>
  );
}
