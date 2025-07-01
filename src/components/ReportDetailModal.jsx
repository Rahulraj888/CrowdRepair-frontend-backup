import React, { useState, useEffect } from "react";
import {
  Modal,
  Carousel,
  Spinner,
  InputGroup,
  Form,
  Button,
} from "react-bootstrap";
import { getComments } from "../services/reportService";

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return (
    R *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr);
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7
    ? `${days}d ago`
    : new Date(dateStr).toLocaleDateString();
};

export default function ReportDetailModal({
  report,
  show,
  onHide,
  onUpvote,
  onAddComment,
  userLocation,
  BACKEND,
  MAPBOX_TOKEN,
}) {
  if (!report) return null;

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newText, setNewText] = useState("");
  const [posting, setPosting] = useState(false);
  const [address, setAddress] = useState("");

  // fetch comments
  useEffect(() => {
    setLoadingComments(true);
    getComments(report._id)
      .then((c) => setComments(c))
      .finally(() => setLoadingComments(false));
  }, [report]);

  // reverse-geocode
  useEffect(() => {
    const [lng, lat] = report.location.coordinates;
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
    )
      .then((r) => r.json())
      .then((d) =>
        setAddress(d.features?.[0]?.place_name || "")
      )
      .catch(() => {});
  }, [report, MAPBOX_TOKEN]);

  const distance = userLocation
    ? haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        report.location.coordinates[1],
        report.location.coordinates[0]
      ).toFixed(1)
    : null;

  const handlePost = async () => {
    if (!newText.trim()) return;
    setPosting(true);
    await onAddComment(report._id, newText);
    setNewText("");
    const fresh = await getComments(report._id);
    setComments(fresh);
    setPosting(false);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{report.issueType}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {report.imageUrls?.length > 0 && (
          <Carousel className="mb-3">
            {report.imageUrls.map((url, i) => (
              <Carousel.Item key={i}>
                <img
                  src={`${BACKEND}${url}`}
                  alt={`Image ${i + 1}`}
                  className="d-block w-100"
                />
              </Carousel.Item>
            ))}
          </Carousel>
        )}
        <p>
          <strong>Description:</strong> {report.description}
        </p>
        {address && (
          <p>
            <strong>Location:</strong> {address}
          </p>
        )}
        {distance && (
          <p>
            <strong>Distance:</strong> {distance} km
          </p>
        )}
        <p>
          <strong>Reporter:</strong> {report.user.name}
        </p>
        <p>
          <strong>Reported on:</strong>{" "}
          {new Date(report.createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Status:</strong> {report.status}
        </p>
        <p>
          <strong>Upvotes:</strong> {report.upvoteCount || 0}
        </p>
        <p>
          <strong>Comments:</strong> {comments.length}
        </p>
        <hr />
        <h6>Comments</h6>
        {loadingComments ? (
          <Spinner
            size="sm"
            animation="border"
            className="my-2"
          />
        ) : (
          comments.map((c) => (
            <div
              key={c._id}
              className="px-2 py-1 bg-light rounded mb-2"
            >
              <strong>{c.user.name}:</strong> {c.text}
            </div>
          ))
        )}
        <InputGroup className="mt-3">
          <Form.Control
            placeholder="Write a comment…"
            size="sm"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
          <Button
            variant="primary"
            size="sm"
            disabled={posting}
            onClick={handlePost}
          >
            {posting ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "Post"
            )}
          </Button>
        </InputGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
