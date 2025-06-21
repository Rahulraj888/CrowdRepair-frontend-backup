import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getReports } from '../../services/reportService';

export default function DashboardPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const all = await getReports();    // default status='all'
        setReports(all);
      } catch (err) {
        console.error('Error loading reports:', err);
      }
    })();
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <MapContainer
        center={[43.65, -79.38]}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {reports.map((r) => (
          <Marker
            key={r._id}
            position={[
              r.location.coordinates[1],  // latitude
              r.location.coordinates[0]   // longitude
            ]}
          >
            <Popup>
              <strong>{r.issueType}</strong><br/>
              {r.description}<br/>
              <em>Status:</em> {r.status}<br/>
              <em>Submitted:</em> {new Date(r.createdAt).toLocaleString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
