'use client';

import { useState } from 'react';
import { useRoomContext, RoomAudioRenderer } from '@livekit/components-react';
import { Room } from 'livekit-client';

export function AudioControls() {
  const [enabled, setEnabled] = useState(false);
  const room = useRoomContext();

  const handleEnableAudio = async () => {
    try {
      await room.startAudio();
      setEnabled(true);
    } catch (error) {
      console.error('Error enabling audio:', error);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {!enabled && (
        <button
          onClick={handleEnableAudio}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-4 py-2 shadow-lg transition-colors"
        >
          Enable Audio
        </button>
      )}
      <RoomAudioRenderer />
    </div>
  );
}
