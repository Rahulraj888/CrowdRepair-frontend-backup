// src/pages/ReportFormPage.jsx
import { useEffect, useRef, useState } from 'react';
import Map, { Marker } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './ReportFormPage.module.css';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Form,
  Image,
  Spinner,
  Card,
  Container,
  Row,
  Col
} from 'react-bootstrap';
import { submitReport } from '../../services/reportService';
import illustration from '/report-illustration.png';

const ISSUE_TYPES = ['Pothole', 'Streetlight', 'Graffiti', 'Other'];
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function ReportFormPage() {
  const [selectedIssue, setSelectedIssue] = useState('');
  const [description, setDescription] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [marker, setMarker] = useState(null);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewState, setViewState] = useState({
    latitude: 43.65,
    longitude: -79.38,
    zoom: 11
  });
  const mapRef = useRef();
  const navigate = useNavigate();

  // Get current location on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMarker({ lat: latitude, lng: longitude });
        setViewState((v) => ({ ...v, latitude, longitude, zoom: 14 }));
      },
      (err) => {
        console.warn('Geolocation error:', err);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // Attach Geocoder after map loads
  const handleMapLoad = () => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    // Avoid duplicate control
    if (map._controls.find((ctrl) => ctrl instanceof MapboxGeocoder)) return;

    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      mapboxgl,
      marker: false
    });

    map.addControl(geocoder, 'top-left');

    geocoder.on('result', (e) => {
      const coords = e.result.geometry.coordinates;
      setMarker({ lat: coords[1], lng: coords[0] });
      setViewState((v) => ({
        ...v,
        latitude: coords[1],
        longitude: coords[0],
        zoom: 14
      }));
    });
  };

  // Cleanup previews
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    const valid = [];
    const urls = [];
    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files allowed');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be <5MB');
        continue;
      }
      valid.push(file);
      urls.push(URL.createObjectURL(file));
    }
    setImages(valid);
    setPreviews(urls);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    if (!selectedIssue) return setError('Select an issue type');
    if (!marker) return setError('Pick a location');
    if (!description.trim()) return setError('Enter a description');
    if (images.length === 0) return setError('Please upload at least one image');

    const formData = new FormData();
    formData.append('issueType', selectedIssue);
    formData.append('latitude', marker.lat);
    formData.append('longitude', marker.lng);
    formData.append('description', description);
    images.forEach((img) => formData.append('images', img));

    try {
      setLoading(true);
      await submitReport(formData);
      alert('Thank you for reporting! A confirmation email has been sent.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Container>
        <Row className="align-items-start gx-2 gy-4">
          {/* Illustration */}
          <Col xs={12} md={6}>
            <Image
              src={illustration}
              alt="Report illustration"
              fluid
              className={styles.sideImage}
            />
          </Col>

          {/* Form Card */}
          <Col xs={12} md={6}>
            <Card className={styles.card}>
              <h3 className="mb-4 text-center">📣 Report an Issue</h3>
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit} encType="multipart/form-data">
                {/* Issue Type */}
                <Form.Group className="mb-4">
                  <Form.Label>Issue Type *</Form.Label>
                  <div className={styles.issueTypeGroup}>
                    {ISSUE_TYPES.map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={
                          selectedIssue === type
                            ? 'primary'
                            : 'outline-primary'
                        }
                        className="rounded-pill"
                        onClick={() => {
                          setSelectedIssue(type);
                          setError('');
                        }}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </Form.Group>

                {/* Map Picker */}
                <Form.Group className="mb-4">
                  <Form.Label>Select Location *</Form.Label>
                  <div className={styles.mapContainer}>
                    <Map
                      ref={mapRef}
                      {...viewState}
                      onMove={(evt) => setViewState(evt.viewState)}
                      onLoad={handleMapLoad}
                      style={{ width: '100%', height: '100%' }}
                      mapStyle="mapbox://styles/mapbox/streets-v11"
                      mapboxAccessToken={MAPBOX_TOKEN}
                      onClick={(e) => {
                        const { lat, lng } = e.lngLat;
                        setMarker({ lat, lng });
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
                </Form.Group>

                {/* Description */}
                <Form.Group className="mb-4">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    maxLength={500}
                    value={description}
                    placeholder="Describe the issue in detail..."
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setCharCount(e.target.value.length);
                      setError('');
                    }}
                    required
                  />
                  <small className="text-muted float-end">
                    {charCount}/500
                  </small>
                </Form.Group>

                {/* Images */}
                <Form.Group className="mb-4">
                  <Form.Label>Upload Images (up to 5, max 5MB each)</Form.Label>
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
                        className={styles.previewImage}
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: 'cover'
                        }}
                      />
                    ))}
                  </div>
                </Form.Group>

                {/* Submit */}
                <div className="d-grid">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      'Submit Report'
                    )}
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
