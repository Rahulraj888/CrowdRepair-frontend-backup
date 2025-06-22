import  { useState } from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './ReportFormPage.module.css';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Image, Spinner } from 'react-bootstrap';
import reportService from '../../services/authService.js';

const ISSUE_TYPES = ['Pothole', 'Streetlight', 'Garbage', 'WaterLeak', 'Graffiti', 'Other'];
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function ReportFormPage() {
  const [selectedIssue, setSelectedIssue] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  // const isFormValid =
  //   // selectedIssue &&
  //   // description.trim().length >= 20 && description.trim().length<=200 &&
  //   // /^[a-zA-Z0-9 .,'\-!?()]+$/.test(description.trim()) &&
  //   // marker && image;

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file){
      setError("Image is Required !")
      return;
    }
      

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB.');
      return;
    }

    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const desc = description.trim();
    const issue = selectedIssue.trim().toLowerCase();


  if (!issue) {
    setError('Please select an issue type.');
    return;
  }

  if (!marker) {
    setError('Please select a location from the map.');
    return;
  }

  if (desc.length < 20 || desc.length > 200) {
    setError('Description should be between 20 and 200 characters.');
    return;
  }

  if (!/^[a-zA-Z0-9 .,'\-!?()]+$/.test(desc)) {
    setError('Description contains invalid characters.');
    return;
  }

     if (!image) {
  setError('Please upload an image.');
  return;
}



    const formData = new FormData();
    formData.append('issueType', issue);
    formData.append('description', desc.toLowerCase());
    if (image) formData.append('image', image);
    formData.append('latitude', marker.lat);
    formData.append('longitude', marker.lng);

    try {
      setLoading(true);
      await reportService.submitReport(formData);
      setSuccess('Report submitted successfully!');
      setSelectedIssue('');
      setDescription('');
      setCharCount(0);
      setMarker(null);
      setImage(null);
      setPreviewUrl(null);
      navigate('/dashboard');
    } catch (err) {
      const resp = err.response?.data;
      const msg = resp?.errors?.[0]?.msg || resp?.msg || err.message || 'Failed to submit report';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h3 className="mb-4 text-center">📣 Report an Issue</h3>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit} encType="multipart/form-data">
          <Form.Group className="mb-3">
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

          <Form.Group className="mb-3">
            <Form.Label>Select Location *</Form.Label>
            <div className={styles.mapContainer}>
              <Map
                initialViewState={{
                  latitude: 43.651070,
                  longitude: -79.347015,
                  zoom: 11,
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                onClick={(e) =>
                  setMarker({
                    lat: e.lngLat.lat,
                    lng: e.lngLat.lng,
                  })
                }
              >
                {marker && (
                  <Marker longitude={marker.lng} latitude={marker.lat} color="red" />
                )}
              </Map>
            </div>
            {marker && (
              <small className="text-muted d-block mt-1">
                Selected: ({marker.lat.toFixed(5)}, {marker.lng.toFixed(5)})
              </small>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
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
            <small className="text-muted float-end">{charCount}/200</small>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Upload Image (Max 2MB)</Form.Label>
            <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
            {previewUrl && (
              <div className="mt-2">
                <Image src={previewUrl} alt="Preview" thumbnail width={150} />
              </div>
            )}
          </Form.Group>

          <div className="d-grid mt-4">
            <Button type="submit" variant="primary" >
              {loading ? <Spinner size="sm" animation="border" /> : 'Submit Report'}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
