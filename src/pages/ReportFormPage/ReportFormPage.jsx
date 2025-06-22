import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import MapPicker from '../../components/MapPicker';
import { submitReport } from '../../services/reportService';

export default function ReportFormPage() {
  const [issueType, setIssueType] = useState('');
  const [coords, setCoords] = useState({ lat: '', lng: '' });
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = e => setImages(Array.from(e.target.files));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!issueType || !coords.lat) {
      return setError('Please select an issue type and location.');
    }
    setLoading(true);

    const formData = new FormData();
    formData.append('issueType', issueType);
    formData.append('latitude', coords.lat);
    formData.append('longitude', coords.lng);
    formData.append('description', description);
    images.forEach(img => formData.append('images', img));

    try {
      await submitReport(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showMap && (
        <MapPicker
          initialCoords={coords}
          onSelect={setCoords}
          onClose={() => setShowMap(false)}
        />
      )}
      <Card className="p-4">
        <h2>Report Issue</h2>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Label>Issue Type</Form.Label>
          <div className="mb-3">
            {['Pothole','Streetlight','Graffiti','Other'].map(type => (
              <Button
                key={type}
                variant={issueType === type ? 'primary' : 'outline-secondary'}
                className="me-2 mb-2"
                onClick={() => setIssueType(type)}
                type="button"
              >
                {type}
              </Button>
            ))}
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <div
              className="border p-4 mb-2 text-center"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowMap(true)}
            >
              {coords.lat
                ? `📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                : 'Tap to select location'}
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description (max 500 chars)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              maxLength={500}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="text-end">{description.length}/500</div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Add Photos (max 5)</Form.Label>
            <Form.Control
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
          </Form.Group>

          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Issue'}
          </Button>
        </Form>
      </Card>
    </>
  );
}
