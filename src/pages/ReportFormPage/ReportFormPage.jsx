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
  const [fullAddress, setFullAddress] = useState(''); //to get the full address
  const [viewState, setViewState] = useState({
    latitude: 43.65,
    longitude: -79.38,
    zoom: 11
  });
  const mapRef = useRef();
  const navigate = useNavigate();

//function for reverse geo-coding and return the full address based on geo coordinates 
const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
    );
    const data = await response.json();
    if (data?.features?.length > 0) {
      setFullAddress(data.features[0].place_name);
    } else {
      setFullAddress('Unable to retrieve address');
    }
  } catch (error) {
    console.error('Error fetching address:', error);
    setFullAddress('Error retrieving address');
  }
};


  // Get current location on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMarker({ lat: latitude, lng: longitude });
        setViewState((v) => ({ ...v, latitude, longitude, zoom: 14 }));
        getAddressFromCoordinates(latitude, longitude); //fetch the whole address
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
      getAddressFromCoordinates(coords[1], coords[0]); // fetch the whole address and store it as a state 

    });
  };

  // Cleanup previews
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const handleImageChange = (e) => {
  const files = Array.from(e.target.files);
  const MAX_FILES = 5;
  // Check if selection exceeds limit
  if (files.length > MAX_FILES) {
    setError(`You can upload a maximum of ${MAX_FILES} images at a time.`);
    setImages([]);       // optional: clear any existing images
    setPreviews([]);     // optional: clear previews
    return;
  }
  const valid = [];
  const urls = [];
  let errorMessages = [];

  files.forEach((file) => {
    
    if (!file.type.startsWith('image/')) {
      errorMessages.push(
        `"${file.name}" is not a valid image file.`
      );
      return;
    }

    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 5) {
      errorMessages.push(
        `"${file.name}" is too large (${sizeInMB.toFixed(2)} MB). Max allowed is 5 MB.`
      );
      return;
    }

    valid.push(file);
    urls.push(URL.createObjectURL(file));
  });

  setImages(valid);
  setPreviews(urls);

  if (errorMessages.length > 0) {
    setError(`Some files were not accepted:\n${errorMessages.join('\n')}`);
  } else {
    setError('');
  }
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
    formData.append('address', fullAddress);

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
      <Row className={`gx-2 gy-4 ${styles.equalHeightRow}`}>
        {/* Left Column (Image) */}
        <Col xs={12} md={6} className={styles.equalHeightCol}>
          <Image
            src={illustration}
            alt="Report illustration"
            fluid
            className={styles.sideImageFull}
          />
        </Col>

        {/* Right Column (Form Card) */}
        <Col xs={12} md={6} className={styles.equalHeightCol}>
          <Card className={`${styles.card} h-100`}>
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
                       getAddressFromCoordinates(lat, lng); //fetching the address based on the coordinations
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
