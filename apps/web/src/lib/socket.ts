import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@gvhax/shared';

let socket: Socket | null = null;

/** One shared connection for the whole app. */
export function getSocket(): Socket {
  socket ??= io({ path: '/socket.io', transports: ['websocket', 'polling'] });
  return socket;
}

export type SocketStatus = 'connected' | 'offline';

export function useSocketStatus(): SocketStatus {
  const [status, setStatus] = useState<SocketStatus>(() =>
    getSocket().connected ? 'connected' : 'offline',
  );

  useEffect(() => {
    const s = getSocket();
    const on = () => setStatus('connected');
    const off = () => setStatus('offline');
    s.on('connect', on);
    s.on('disconnect', off);
    s.on('connect_error', off);
    return () => {
      s.off('connect', on);
      s.off('disconnect', off);
      s.off('connect_error', off);
    };
  }, []);

  return status;
}

/**
 * Subscribe to a room and receive its events.
 *
 * Rooms are named after the resource ("items") or the stream ("metrics").
 * Pass a stable `handler` via useCallback, or accept that a re-render
 * re-subscribes — harmless, but noisy under a fast tick.
 */
export function useRoom<T>(room: string, event: string, handler: (payload: T) => void): void {
  useEffect(() => {
    const s = getSocket();
    s.emit(SOCKET_EVENTS.SUBSCRIBE, room);
    s.on(event, handler);
    return () => {
      s.emit(SOCKET_EVENTS.UNSUBSCRIBE, room);
      s.off(event, handler);
    };
  }, [room, event, handler]);
}

/** Rolling window of the server's synthetic metric tick — for live charts. */
export function useMetricStream(limit = 40) {
  const [points, setPoints] = useState<{ at: string; value: number }[]>([]);

  useEffect(() => {
    const s = getSocket();
    const onTick = (p: { at: string; value: number }) =>
      setPoints((prev) => [...prev, p].slice(-limit));
    s.emit(SOCKET_EVENTS.SUBSCRIBE, 'metrics');
    s.on(SOCKET_EVENTS.METRIC_TICK, onTick);
    return () => {
      s.emit(SOCKET_EVENTS.UNSUBSCRIBE, 'metrics');
      s.off(SOCKET_EVENTS.METRIC_TICK, onTick);
    };
  }, [limit]);

  return points;
}
