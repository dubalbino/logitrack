import { useEffect, useState } from 'react';
import { supabase } from './src/lib/supabase';

interface TrackingData {
  id: string;
  entrega_id: number;
  motorista_lat: number;
  motorista_lng: number;
  timestamp: string;
}

interface Entrega {
  id: number;
  origem: string;
  destino: string;
  destino_lat: number | null;
  destino_lng: number | null;
  situacao_pedido: string;
  tracking_ativo: boolean;
  descricao_compra: string;
}

export function useDriverTracking(entregaId: number | null) {
  const [currentLocation, setCurrentLocation] = useState<TrackingData | null>(null);
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entregaId) return;

    // Buscar dados da entrega
    const fetchEntrega = async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select('*')
        .eq('id', entregaId)
        .single();

      if (!error && data) {
        setEntrega(data);
      }
      setLoading(false);
    };

    // Buscar última localização
    const fetchLastLocation = async () => {
      const { data, error } = await supabase
        .from('entregas_rastreamento')
        .select('*')
        .eq('entrega_id', entregaId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setCurrentLocation(data);
      }
    };

    fetchEntrega();
    fetchLastLocation();

    // Subscrever para atualizações em tempo real
    const channel = supabase
      .channel(`tracking-${entregaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'entregas_rastreamento',
          filter: `entrega_id=eq.${entregaId}`,
        },
        (payload) => {
          console.log('Nova localização recebida:', payload.new);
          setCurrentLocation(payload.new as TrackingData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entregaId]);

  return { currentLocation, entrega, loading };
}