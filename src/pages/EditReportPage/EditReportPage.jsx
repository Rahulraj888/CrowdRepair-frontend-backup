import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Image,
  Spinner,
} from 'react-bootstrap';
import {
  getReportById,
  updateReport,
} from '../../services/reportService';
import styles from './EditReportPage.module.css';

const ISSUE_TYPES = ['Pothole','Streetlight','Graffiti','Other'];
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EditReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issueType, setIssueType]     = useState('');
  const [description, setDescription] = useState('');
  const [charCount, setCharCount]     = useState(0);
  const [marker, setMarker]           = useState(null);
  const [newImages, setNewImages]     = useState([]);
  const [previews, setPreviews]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  // Load the report to edit
  useEffect(() => {
    (async () => {
      try {
        const rep = await getReportById(id);
        setIssueType(rep.issueType);
        setDescription(rep.description);
        setCharCount(rep.description.length);
        const [lng, lat] = rep.location.coordinates;
        setMarker({ lat, lng });
        // show existing images as previews
        setPreviews(
          rep.imageUrls.map(url => `${BACKEND}${url}`)
        );
      } catch (err) {
        console.error(err);
        setError('Could not load report.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function handleImageChange(e) {
    const files = Array.from(e.target.files).slice(0,5);
    const good = [];
    const urls = [];
    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files allowed');
      } else if (file.size > 5*1024*1024) {
        setError('Each image must be <5MB');
      } else {
        good.push(file);
        urls.push(URL.createObjectURL(file));
      }
    }
    setNewImages(good);
    setPreviews(urls);
    if (good.length) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!issueType) return setError('Select an issue type');
    if (!marker)    return setError('Pick a location');
    if (!description.trim()) return setError('Enter a description');

    const formData = new FormData();
    formData.append('issueType', issueType);
    formData.append('latitude',  marker.lat);
    formData.append('longitude', marker.lng);
    formData.append('description', description.trim());
    newImages.forEach(img => formData.append('images', img));

    try {
      setSubmitting(true);
      await updateReport(id, formData);
      navigate('/my-reports');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.msg ||
        err.message ||
        'Failed to update report'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container
      fluid
      className="py-4 d-flex justify-content-center bg-light"
    >
      <Card className={styles.card} style={{ maxWidth: '650px', width: '100%' }}>
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
                  variant={issueType === type ? 'primary' : 'outline-primary'}
                  className="rounded-pill"
                  type="button"
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

          {/* Mapbox Location Picker */}
          <Form.Group className="mb-4">
            <Form.Label>Select Location *</Form.Label>
            <div className={styles.mapContainer}>
              <Map
                initialViewState={{
                  latitude: 43.65,
                  longitude: -79.38,
                  zoom: 12,
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                onClick={e => {
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
              onChange={e => {
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
            <Form.Label>Replace Images? (up to 5, max 5MB each)</Form.Label>
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
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? (
                <Spinner animation="border" size="sm" />
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
}
