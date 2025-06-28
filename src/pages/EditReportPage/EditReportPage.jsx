import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Image,
  Spinner,
} from 'react-bootstrap';
import { getReportById, updateReport } from '../../services/reportService';
import styles from './EditReportPage.module.css';

const ISSUE_TYPES = ['Pothole','Streetlight','Graffiti','Other'];
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const BACKEND      = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EditReportPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const mapRef       = useRef();

  const [issueType, setIssueType]       = useState('');
  const [description, setDescription]   = useState('');
  const [charCount, setCharCount]       = useState(0);
  const [marker, setMarker]             = useState(null);
  const [newImages, setNewImages]       = useState([]);
  const [previews, setPreviews]         = useState([]);
  const [viewState, setViewState]       = useState({
    latitude: 43.65,
    longitude: -79.38,
    zoom: 11
  });
  const [fullAddress, setFullAddress]   = useState('');

  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');

  // Reverse‐geocode helper
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await res.json();
      setFullAddress(data.features?.[0]?.place_name || 'Unknown address');
    } catch (e) {
      console.error('Geocode error', e);
      setFullAddress('Error retrieving address');
    }
  };

  // Attach Geocoder control once
  const handleMapLoad = () => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (map._controls.find(c => c instanceof MapboxGeocoder)) return;

    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      mapboxgl,
      marker: false
    });
    map.addControl(geocoder, 'top-left');
    geocoder.on('result', e => {
      const [lng, lat] = e.result.geometry.coordinates;
      setMarker({ lat, lng });
      setViewState(v => ({ ...v, latitude: lat, longitude: lng, zoom: 14 }));
      getAddressFromCoordinates(lat, lng);
    });
  };

  // Load the existing report
  useEffect(() => {
    (async () => {
      try {
        const rep = await getReportById(id);
        setIssueType(rep.issueType);
        setDescription(rep.description);
        setCharCount(rep.description.length);

        const [lng, lat] = rep.location.coordinates;
        setMarker({ lat, lng });
        setViewState({ latitude: lat, longitude: lng, zoom: 14 });
        setFullAddress(rep.address);

        // show both existing and newly added previews
        setPreviews(rep.imageUrls.map(u => `${BACKEND}${u}`));
      } catch (e) {
        console.error(e);
        setError('Could not load report.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Clean up object URLs
  useEffect(() => {
    return () => previews.forEach(URL.revokeObjectURL);
  }, [previews]);

  // Handle new image selection (up to 5)
  const handleImageChange = e => {
    const files = Array.from(e.target.files).slice(0, 5);
    const good = [], urls = [], errs = [];
    files.forEach(f => {
      if (!f.type.startsWith('image/')) errs.push(`${f.name}: invalid`);
      else if (f.size > 5 * 1024 * 1024) errs.push(`${f.name}: too big`);
      else {
        good.push(f);
        urls.push(URL.createObjectURL(f));
      }
    });
    setNewImages(good);
    setPreviews(urls);
    if (errs.length) setError(errs.join('\n'));
    else setError('');
  };

  // Submit updated report
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!issueType)    return setError('Select an issue type');
    if (!marker)       return setError('Pick a location on the map');
    if (!description.trim()) return setError('Enter a description');

    const formData = new FormData();
    formData.append('issueType', issueType);
    formData.append('latitude',   marker.lat);
    formData.append('longitude',  marker.lng);
    formData.append('description', description.trim());
    formData.append('address',    fullAddress);
    newImages.forEach(img => formData.append('images', img));

    try {
      setSubmitting(true);
      await updateReport(id, formData);
      navigate('/my-reports');
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.msg || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 d-flex justify-content-center bg-light">
      <Card className={styles.card} style={{ maxWidth: 650, width: '100%' }}>
        <h3 className="mb-4 text-center">✏️ Edit Report</h3>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Issue Type */}
          <Form.Group className="mb-4">
            <Form.Label>Issue Type *</Form.Label>
            <div className={styles.issueTypeGroup}>
              {ISSUE_TYPES.map(type => (
                <Button
                  key={type}
                  type="button"
                  variant={issueType === type ? 'primary' : 'outline-primary'}
                  className="rounded-pill"
                  onClick={() => {
                    setIssueType(type);
                    setError('');
                  }}
                >
                  {type}
                </Button>
              ))}
            </div>
          </Form.Group>

          {/* Map + Geocoder */}
          <Form.Group className="mb-4">
            <Form.Label>Select Location *</Form.Label>
            <div className={styles.mapContainer}>
              <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                onLoad={handleMapLoad}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                onClick={e => {
                  const { lat, lng } = e.lngLat;
                  setMarker({ lat, lng });
                  getAddressFromCoordinates(lat, lng);
                  setError('');
                }}
              >
                {marker && (
                  <Marker
                    latitude={marker.lat}
                    longitude={marker.lng}
                    color="red"
                  />
                )}
              </Map>
            </div>
            {marker && (
              <small className="text-muted d-block mt-1">
                Selected: ({marker.lat.toFixed(5)}, {marker.lng.toFixed(5)})
              </small>
            )}
            {fullAddress && (
              <small className="text-muted d-block mt-1">
                📍 {fullAddress}
              </small>
            )}
          </Form.Group>

          {/* Description */}
          <Form.Group className="mb-4">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              maxLength={500}
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                setCharCount(e.target.value.length);
                setError('');
              }}
              required
            />
            <small className="text-muted float-end">{charCount}/500</small>
          </Form.Group>

          {/* Replace Images */}
          <Form.Group className="mb-4">
            <Form.Label>Replace Images? (up to 5)</Form.Label>
            <Form.Control
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
            <div className="mt-3 d-flex flex-wrap gap-2">
              {previews.map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  thumbnail
                  style={{ width: 100, height: 100, objectFit: 'cover' }}
                />
              ))}
            </div>
          </Form.Group>

          <div className="d-grid">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
}
