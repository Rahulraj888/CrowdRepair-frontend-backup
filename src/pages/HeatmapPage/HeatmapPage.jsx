import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { getHeatmap } from '../../services/reportService';
import styles from './HeatmapPage.module.css';

// Vite env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function HeatmapPage() {
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: 'heatmap-container',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-79.38, 43.65], // initial center
      zoom: 12
    });

    map.on('load', async () => {
      try {
        const geojson = await getHeatmap();

        // add the GeoJSON source
        map.addSource('heatmapData', {
          type: 'geojson',
          data: geojson
        });

        // heatmap layer (visible up to zoom 15)
        map.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'heatmapData',
          maxzoom: 15,
          paint: {
            'heatmap-weight': ['get', 'count'],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 0]
          }
        });

        // circle layer for individual points at high zoom
        map.addLayer({
          id: 'point-layer',
          type: 'circle',
          source: 'heatmapData',
          minzoom: 14,
          paint: {
            'circle-radius': 6,
            'circle-color': 'rgba(255,0,0,0.8)',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
          }
        });

        // if there’s data, zoom to fit it
        if (geojson.features.length) {
          // collect all coordinates (both polygons and points)
          const coords = geojson.features.flatMap(f => {
            const g = f.geometry;
            if (g.type === 'Point') {
              return [g.coordinates];
            } else if (g.type === 'Polygon') {
              // polygons: one ring of coords
              return g.coordinates[0];
            }
            return [];
          });

          const bounds = coords.reduce(
            (b, coord) => b.extend(coord),
            new mapboxgl.LngLatBounds(coords[0], coords[0])
          );
          map.fitBounds(bounds, { padding: 20, maxZoom: 15 });
        }
      } catch (err) {
        console.error('Failed to load heatmap data', err);
      }
    });

    return () => map.remove();
  }, []);

  return (
    <div className={styles.container}>
      <div id="heatmap-container" className={styles.map} />
    </div>
  );
}
