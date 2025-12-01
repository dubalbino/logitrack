import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useDriverTracking } from '../../../useDriverTracking';
import { supabase } from '../../lib/supabase';
import 'leaflet/dist/leaflet.css';
import truckIconUrl from '../../assets/caminhao.png';

// Corrigir ícones padrão do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Entrega {
  id: number;
  origem: string;
  destino: string;
  tracking_ativo: boolean;
  situacao_pedido: string;
  descricao_compra: string;
  destino_lat: number | null;
  destino_lng: number | null;
  entregador_id: number;
}

interface Entregador {
  id: number;
  nome: string;
}

interface TrackingData {
  entrega_id: number;
  motorista_lat: number;
  motorista_lng: number;
  timestamp: string;
}

export default function RastreamentoMapa() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [selectedMotorista, setSelectedMotorista] = useState<number | null>(null);
  const [trackingData, setTrackingData] = useState<Record<number, TrackingData>>({});
  
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<number, { driver?: L.Marker; destination?: L.Marker }>>({});

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-23.5505, -46.6333], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Buscar entregas ativas e entregadores
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Buscar entregas ativas
    const { data: entregasData, error: entregasError } = await supabase
      .from('entregas')
      .select('*')
      .eq('tracking_ativo', true)
      .eq('situacao_pedido', 'enviado');

    if (!entregasError && entregasData) {
      setEntregas(entregasData);
      
      // Buscar última localização de cada entrega
      for (const entrega of entregasData) {
        fetchLastLocation(entrega.id);
      }
    }

    // Buscar todos os entregadores
    const { data: entregadoresData, error: entregadoresError } = await supabase
      .from('entregadores')
      .select('id, nome')
      .order('nome');

    if (!entregadoresError && entregadoresData) {
      setEntregadores(entregadoresData);
    }
  };

  const fetchLastLocation = async (entregaId: number) => {
    const { data, error } = await supabase
      .from('entregas_rastreamento')
      .select('*')
      .eq('entrega_id', entregaId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      setTrackingData(prev => ({ ...prev, [entregaId]: data }));
    }
  };

  // Subscrever atualizações em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('all-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'entregas_rastreamento',
        },
        (payload) => {
          const newData = payload.new as TrackingData;
          console.log('Nova localização recebida:', newData);
          setTrackingData(prev => ({ ...prev, [newData.entrega_id]: newData }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Assinar atualizações na tabela de entregas para re-buscar dados quando o status muda
  useEffect(() => {
    const deliveriesChannel = supabase
      .channel('entregas-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entregas',
        },
        (payload) => {
          console.log('Mudança detectada na tabela de entregas, buscando dados novamente.', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deliveriesChannel);
    };
  }, []);

  // Atualizar marcadores no mapa
  useEffect(() => {
    if (!mapRef.current) return;

    const entregasFiltradas = selectedMotorista
      ? entregas.filter(e => e.entregador_id === selectedMotorista)
      : entregas;

    // Limpar marcadores antigos que não estão mais no filtro
    Object.keys(markersRef.current).forEach(key => {
      const entregaId = parseInt(key);
      if (!entregasFiltradas.find(e => e.id === entregaId)) {
        if (markersRef.current[entregaId]?.driver) {
          markersRef.current[entregaId].driver!.remove();
        }
        if (markersRef.current[entregaId]?.destination) {
          markersRef.current[entregaId].destination!.remove();
        }
        delete markersRef.current[entregaId];
      }
    });

    const bounds: L.LatLngBounds[] = [];

    entregasFiltradas.forEach(entrega => {
      const location = trackingData[entrega.id];
      
      if (!markersRef.current[entrega.id]) {
        markersRef.current[entrega.id] = {};
      }

      // Marcador do motorista
      if (location) {
        const pos: [number, number] = [location.motorista_lat, location.motorista_lng];
        bounds.push(L.latLngBounds([pos, pos]));
        
        if (markersRef.current[entrega.id].driver) {
          markersRef.current[entrega.id].driver!.setLatLng(pos);
        } else {
          const truckIcon = L.icon({
            iconUrl: truckIconUrl,
            iconSize: [40, 40], // Tamanho do ícone [largura, altura]
            iconAnchor: [20, 40], // Ponto do ícone que corresponde à localização no mapa
            popupAnchor: [0, -40] // Ponto a partir do qual o popup se abre, relativo ao iconAnchor
          });
          
          const entregadorNome = entregadores.find(e => e.id === entrega.entregador_id)?.nome || 'Motorista';
          
          markersRef.current[entrega.id].driver = L.marker(pos, { icon: truckIcon })
            .addTo(mapRef.current!)
            .bindPopup(`
              <strong>🚚 ${entregadorNome}</strong><br/>
              <strong>Entrega #${entrega.id}</strong><br/>
              Destino: ${entrega.destino}<br/>
              Atualizado: ${new Date(location.timestamp).toLocaleTimeString('pt-BR')}
            `);
        }
      }

      // Marcador do destino
      if (entrega.destino_lat && entrega.destino_lng) {
        const pos: [number, number] = [entrega.destino_lat, entrega.destino_lng];
        bounds.push(L.latLngBounds([pos, pos]));
        
        if (!markersRef.current[entrega.id].destination) {
          const icon = L.divIcon({
            html: '<div style="background:#FF5733;width:35px;height:35px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)">🏁</div>',
            className: '',
            iconSize: [35, 35],
            iconAnchor: [17, 35]
          });
          
          markersRef.current[entrega.id].destination = L.marker(pos, { icon })
            .addTo(mapRef.current!)
            .bindPopup(`
              <strong>🏁 Destino</strong><br/>
              <strong>Entrega #${entrega.id}</strong><br/>
              ${entrega.destino}
            `);
        }
      }
    });

    // Ajustar zoom para mostrar todos os marcadores
    if (bounds.length > 0) {
      const group = L.featureGroup(
        Object.values(markersRef.current).flatMap(m => [m.driver, m.destination].filter(Boolean) as L.Marker[])
      );
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [entregas, trackingData, selectedMotorista, entregadores]);

  const entregasFiltradas = selectedMotorista
    ? entregas.filter(e => e.entregador_id === selectedMotorista)
    : entregas;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        padding: '20px', 
        background: '#6a0dad', 
        color: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>🚚 Rastreamento de Entregas</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Acompanhe suas entregas em tempo real</p>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ 
          width: '350px', 
          background: '#f5f5f5', 
          padding: '20px',
          overflowY: 'auto',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0 }}>Entregas Ativas</h2>
          
          {/* Filtro de Motorista */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              fontSize: '14px' 
            }}>
              Filtrar por Motorista:
            </label>
            <select
              value={selectedMotorista || ''}
              onChange={(e) => setSelectedMotorista(e.target.value ? parseInt(e.target.value) : null)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">Todos os Motoristas ({entregas.length})</option>
              {entregadores.map(entregador => {
                const count = entregas.filter(e => e.entregador_id === entregador.id).length;
                return count > 0 ? (
                  <option key={entregador.id} value={entregador.id}>
                    {entregador.nome} ({count})
                  </option>
                ) : null;
              })}
            </select>
          </div>

          {entregasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              <div style={{ fontSize: '48px' }}>📦</div>
              <p>Nenhuma entrega ativa</p>
            </div>
          ) : (
            entregasFiltradas.map((ent) => {
              const entregador = entregadores.find(e => e.id === ent.entregador_id);
              const location = trackingData[ent.id];
              
              return (
                <div
                  key={ent.id}
                  style={{
                    background: 'white',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '15px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <strong style={{ fontSize: '16px' }}>#{ent.id}</strong>
                    <span style={{
                      background: '#4CAF50',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      🔴 AO VIVO
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '600', color: '#333' }}>
                      🚚 {entregador?.nome || 'Motorista'}
                    </div>
                    <div>📍 Origem: {ent.origem}</div>
                    <div>🎯 Destino: {ent.destino}</div>
                    <div>📦 {ent.descricao_compra}</div>
                    {location && (
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '12px', 
                        color: '#999',
                        fontStyle: 'italic' 
                      }}>
                        Última atualização: {new Date(location.timestamp).toLocaleTimeString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mapa */}
        <div ref={mapContainerRef} style={{ flex: 1, height: '100%' }} />
      </div>
    </div>
  );
}