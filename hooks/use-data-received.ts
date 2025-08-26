import { RoomEvent, Room } from 'livekit-client';
import { useEffect, useState } from 'react';

export function useDataReceived(room: Room | undefined) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant: any) => {
      const decoder = new TextDecoder('utf-8');
      const message = decoder.decode(payload);
      const parsedData = JSON.parse(message);
      setData(parsedData);
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  return data;
}