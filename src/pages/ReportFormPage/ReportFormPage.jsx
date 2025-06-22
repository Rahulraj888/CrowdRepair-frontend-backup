import { useState } from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './ReportFormPage.module.css';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Image, Spinner, Card } from 'react-bootstrap';
import { submitReport } from '../../services/reportService';

const ISSUE_TYPES = [
  'Pothole',
  'Streetlight',
  'Graffiti',
  'Other'
];

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
  
  const navigate = useNavigate();

  function handleImageChange(e) {
    const files = Array.from(e.target.files).slice(0,5);
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
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!selectedIssue) {
      setError('Select an issue type');
      return;
    }
    if (!marker) {
      setError('Pick a location');
      return;
    }
    if (description.trim().length === 0) {
      setError('Enter a description');
      return;
    }

    const formData = new FormData();
    formData.append('issueType', selectedIssue);
    formData.append('latitude', marker.lat);
    formData.append('longitude', marker.lng);
    formData.append('description', description);
    images.forEach(img => formData.append('images', img));

    try {
      setLoading(true);
      await submitReport(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <h3 className="mb-4 text-center">📣 Report an Issue</h3>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Issue Type Picker */}
          <Form.Group className="mb-4">
            <Form.Label>Issue Type *</Form.Label>
            <div className={styles.issueTypeGroup}>
              {ISSUE_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={selectedIssue === type ? 'primary' : 'outline-primary'}
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

          {/* Mapbox Location Picker */}
          <Form.Group className="mb-4">
            <Form.Label>Select Location *</Form.Label>
            <div className={styles.mapContainer}>
              <Map
                initialViewState={{
                  latitude: 43.65,
                  longitude: -79.38,
                  zoom: 11
                }}
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
                  <Marker latitude={marker.lat} longitude={marker.lng} color="red" />
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

          {/* Image Upload */}
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
                  style={{ width: 100, height: 100, objectFit: 'cover' }}
                />
              ))}
            </div>
          </Form.Group>

          {/* Submit */}
          <div className="d-grid">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Submit Report'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
