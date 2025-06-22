import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

function ClickableMap({ initial, onSelect }) {
  const [pos, setPos] = useState(initial);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPos({ lat, lng });
      onSelect({ lat, lng });
    }
  });

  return pos.lat ? <Marker position={[pos.lat, pos.lng]} /> : null;
}

export default function MapPicker({ initialCoords, onSelect, onClose }) {
  const overlay = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        position: 'relative',
        width: '90%',
        height: '80%',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        zIndex: 1001
      }}>
        <MapContainer
          center={[initialCoords.lat || 43.65, initialCoords.lng || -79.38]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickableMap initial={initialCoords} onSelect={onSelect} />
        </MapContainer>
        <button
          className="btn btn-light"
          onClick={onClose}
          style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1002 }}
        >
          Done
        </button>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
