import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { supabase } from '../../lib/supabase';
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

interface RouteInfo {
  distance: string;
  time: string;
}

// Função para normalizar endereço antes de geocodificar
function normalizeAddress(address: string): string {
  let normalized = address;
  
  // Expandir abreviações comuns
  const abbreviations: Record<string, string> = {
    'R.': 'Rua',
    'Av.': 'Avenida',
    'Ver.': 'Vereador',
    'Pres.': 'Presidente',
    'Sen.': 'Senador',
    'Dep.': 'Deputado',
    'Dr.': 'Doutor',
    'Profa.': 'Professora',
    'Prof.': 'Professor',
    'Rod.': 'Rodovia',
    'Trav.': 'Travessa',
    'Pç.': 'Praça',
    'Al.': 'Alameda',
    'Estr.': 'Estrada',
    'Vl.': 'Vila',
    'Jd.': 'Jardim',
    'Res.': 'Residencial'
  };
  
  // Substituir abreviações
  Object.entries(abbreviations).forEach(([abbr, full]) => {
    const regex = new RegExp(`\\b${abbr.replace('.', '\\.')}`, 'gi');
    normalized = normalized.replace(regex, full);
  });
  
  // Remover múltiplos espaços
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// Função para geocodificar endereço usando Nominatim
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Normalizar endereço
    const normalizedAddress = normalizeAddress(address);
    
    // Se o endereço já contém "SP" ou "Brasil", não adicionar novamente
    const addressToGeocode = normalizedAddress.includes('SP') || normalizedAddress.includes('Brasil') 
      ? normalizedAddress 
      : `${normalizedAddress}, Brasil`;
    
    console.log(`Tentando geocodificar: "${address}" -> "${addressToGeocode}"`);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressToGeocode)}&limit=1&countrycodes=br`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      console.log(`✅ Geocodificado com sucesso: ${address} -> Lat: ${data[0].lat}, Lng: ${data[0].lon}`);
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    } else {
      console.warn(`❌ Não foi possível geocodificar: ${address}`);
      console.warn(`Endereço normalizado tentado: ${addressToGeocode}`);
      
      // Tentar busca mais ampla (apenas cidade e estado)
      const parts = address.split(',');
      if (parts.length > 1) {
        const cityState = parts[parts.length - 1].trim();
        console.log(`Tentando busca ampla com: ${cityState}`);
        
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityState)}&limit=1&countrycodes=br`
        );
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData && fallbackData.length > 0) {
          console.log(`⚠️ Usando localização aproximada (centro da cidade): ${cityState}`);
          return {
            lat: parseFloat(fallbackData[0].lat),
            lng: parseFloat(fallbackData[0].lon)
          };
        }
      }
    }
  } catch (error) {
    console.error('Erro ao geocodificar:', error);
  }
  return null;
}

export default function RastreamentoMapa() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [selectedMotorista, setSelectedMotorista] = useState<number | null>(null);
  const [trackingData, setTrackingData] = useState<Record<number, TrackingData>>({});
  const [routeInfo, setRouteInfo] = useState<Record<number, RouteInfo>>({});
  const [geocodedAddresses, setGeocodedAddresses] = useState<Record<string, { lat: number; lng: number }>>({});
  
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<number, { driver?: L.Marker; destination?: L.Marker; origin?: L.Marker }>>({});
  const routesRef = useRef<Record<number, L.Routing.Control>>({});

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
        
        // Geocodificar endereços se necessário
        if (!geocodedAddresses[entrega.origem]) {
          const coords = await geocodeAddress(entrega.origem);
          if (coords) {
            setGeocodedAddresses(prev => ({ ...prev, [entrega.origem]: coords }));
          }
          // Respeitar limite de 1 req/segundo do Nominatim
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (!geocodedAddresses[entrega.destino] && !entrega.destino_lat) {
          const coords = await geocodeAddress(entrega.destino);
          if (coords) {
            setGeocodedAddresses(prev => ({ ...prev, [entrega.destino]: coords }));
          }
          // Respeitar limite de 1 req/segundo do Nominatim
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
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

  // Assinar atualizações na tabela de entregas
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

  // Atualizar marcadores e rotas no mapa
  useEffect(() => {
    if (!mapRef.current) return;

    const entregasFiltradas = selectedMotorista
      ? entregas.filter(e => e.entregador_id === selectedMotorista)
      : entregas;

    // Limpar marcadores e rotas antigas
    Object.keys(markersRef.current).forEach(key => {
      const entregaId = parseInt(key);
      if (!entregasFiltradas.find(e => e.id === entregaId)) {
        if (markersRef.current[entregaId]?.driver) {
          markersRef.current[entregaId].driver!.remove();
        }
        if (markersRef.current[entregaId]?.destination) {
          markersRef.current[entregaId].destination!.remove();
        }
        if (markersRef.current[entregaId]?.origin) {
          markersRef.current[entregaId].origin!.remove();
        }
        delete markersRef.current[entregaId];
      }
    });

    Object.keys(routesRef.current).forEach(key => {
      const entregaId = parseInt(key);
      if (!entregasFiltradas.find(e => e.id === entregaId)) {
        mapRef.current!.removeControl(routesRef.current[entregaId]);
        delete routesRef.current[entregaId];
      }
    });

    // Processar cada entrega
    entregasFiltradas.forEach(entrega => {
      const location = trackingData[entrega.id];
      
      if (!markersRef.current[entrega.id]) {
        markersRef.current[entrega.id] = {};
      }

      // Obter coordenadas de origem e destino
      const origemCoords = location 
        ? { lat: location.motorista_lat, lng: location.motorista_lng }
        : geocodedAddresses[entrega.origem];
      
      const destinoCoords = entrega.destino_lat && entrega.destino_lng
        ? { lat: entrega.destino_lat, lng: entrega.destino_lng }
        : geocodedAddresses[entrega.destino];

      // Marcador de origem
      if (origemCoords && !location) {
        const pos: [number, number] = [origemCoords.lat, origemCoords.lng];
        
        if (!markersRef.current[entrega.id].origin) {
          const icon = L.divIcon({
            html: '<div style="background:#2196F3;width:35px;height:35px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)">📍</div>',
            className: '',
            iconSize: [35, 35],
            iconAnchor: [17, 35]
          });
          
          markersRef.current[entrega.id].origin = L.marker(pos, { icon })
            .addTo(mapRef.current!)
            .bindPopup(`
              <strong>📍 Origem</strong><br/>
              <strong>Entrega #${entrega.id}</strong><br/>
              ${entrega.origem}
            `);
        }
      }

      // Marcador do motorista (posição atual)
      if (location) {
        const pos: [number, number] = [location.motorista_lat, location.motorista_lng];
        
        if (markersRef.current[entrega.id].driver) {
          markersRef.current[entrega.id].driver!.setLatLng(pos);
        } else {
          const truckIcon = L.icon({
            iconUrl: truckIconUrl,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
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
      if (destinoCoords) {
        const pos: [number, number] = [destinoCoords.lat, destinoCoords.lng];
        
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

      // Criar rota automaticamente
      if (origemCoords && destinoCoords && !routesRef.current[entrega.id]) {
        const startPoint = L.latLng(origemCoords.lat, origemCoords.lng);
        const endPoint = L.latLng(destinoCoords.lat, destinoCoords.lng);

        const routingControl = (L.Routing as any).control({
          waypoints: [startPoint, endPoint],
          routeWhileDragging: false,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: false,
          show: false,
          lineOptions: {
            styles: [{ 
              color: '#6a0dad', 
              opacity: 0.7, 
              weight: 5 
            }],
            extendToWaypoints: true,
            missingRouteTolerance: 0
          },
          createMarker: function() { return null; } // Não criar marcadores automáticos
        }).addTo(mapRef.current);

        // Capturar informações da rota
        routingControl.on('routesfound', function(e: any) {
          const routes = e.routes;
          const summary = routes[0].summary;
          
          const distanceKm = (summary.totalDistance / 1000).toFixed(1);
          const timeMin = Math.round(summary.totalTime / 60);
          const timeHours = Math.floor(timeMin / 60);
          const timeMinutes = timeMin % 60;
          
          const timeStr = timeHours > 0 
            ? `${timeHours}h ${timeMinutes}min`
            : `${timeMinutes}min`;

          setRouteInfo(prev => ({
            ...prev,
            [entrega.id]: {
              distance: `${distanceKm} km`,
              time: timeStr
            }
          }));
        });

        routesRef.current[entrega.id] = routingControl;
      }
    });

    // Ajustar zoom para mostrar todos os marcadores
    const markers = Object.values(markersRef.current).flatMap(m => 
      [m.driver, m.destination, m.origin].filter(Boolean) as L.Marker[]
    );
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [entregas, trackingData, selectedMotorista, entregadores, geocodedAddresses]);

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
              const route = routeInfo[ent.id];
              
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
                    
                    {/* Informações da Rota */}
                    {route && (
                      <div style={{ 
                        marginTop: '10px',
                        padding: '10px',
                        background: '#f0e6ff',
                        borderRadius: '8px',
                        border: '1px solid #6a0dad'
                      }}>
                        <div style={{ fontWeight: '600', color: '#6a0dad', marginBottom: '5px' }}>
                          🗺️ Informações da Rota
                        </div>
                        <div style={{ fontSize: '13px', color: '#333' }}>
                          <div>⏱️ Tempo estimado: <strong>{route.time}</strong></div>
                          <div>📏 Distância: <strong>{route.distance}</strong></div>
                        </div>
                      </div>
                    )}
                    
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