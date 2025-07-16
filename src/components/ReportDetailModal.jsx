import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  Carousel,
  Spinner,
  InputGroup,
  Form,
  Button,
  ButtonGroup,
} from "react-bootstrap";
import { getComments, updateComment, deleteComment } from "../services/reportService";
import { AuthContext } from "../context/AuthContext";

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1),
        dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr);
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : new Date(dateStr).toLocaleDateString();
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
  disableComments = false,
}) {
  const { user } = useContext(AuthContext);
  if (!report) return null;

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newText, setNewText] = useState("");
  const [posting, setPosting] = useState(false);
  const [address, setAddress] = useState("");

  // track which comment is being edited
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // fetch comments on open / report change
  useEffect(() => {
    setLoadingComments(true);
    getComments(report._id)
      .then((c) => setComments(c))
      .finally(() => setLoadingComments(false));
  }, [report._id]);

  // reverse-geocode
  useEffect(() => {
    const [lng, lat] = report.location.coordinates;
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
    )
      .then((r) => r.json())
      .then((d) => setAddress(d.features?.[0]?.place_name || ""))
      .catch(() => {});
  }, [report.location.coordinates, MAPBOX_TOKEN]);

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
    await onAddComment(newText);
    setNewText("");
    const fresh = await getComments(report._id);
    setComments(fresh);
    setPosting(false);
  };

  const startEdit = (c) => {
    setEditingId(c._id);
    setEditText(c.text);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };
  const saveEdit = async (commentId) => {
    if (!editText.trim()) return;
    await updateComment(commentId, editText.trim());
    const fresh = await getComments(report._id);
    setComments(fresh);
    setEditingId(null);
  };
  const remove = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    await deleteComment(commentId);
    setComments((cs) => cs.filter((c) => c._id !== commentId));
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
        <p><strong>Description:</strong> {report.description}</p>
        {address && <p><strong>Location:</strong> {address}</p>}
        {distance && <p><strong>Distance:</strong> {distance} km</p>}
        <p><strong>Reporter:</strong> {report.user.name}</p>
        <p>
          <strong>Reported on:</strong>{" "}
          {new Date(report.createdAt).toLocaleString()}
        </p>
        <p><strong>Status:</strong> {report.status}</p>
        <p><strong>Upvotes:</strong> {report.upvoteCount || 0}</p>
        <p><strong>Comments:</strong> {comments.length}</p>
        <hr />
        <h6>Comments</h6>
        {loadingComments ? (
          <Spinner size="sm" animation="border" className="my-2" />
        ) : (
          comments.map((c) => (
            <div key={c._id} className="mb-2">
              {editingId === c._id ? (
                <InputGroup size="sm" className="mb-1">
                  <Form.Control
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <ButtonGroup>
                    <Button variant="outline-success" onClick={() => saveEdit(c._id)}>
                      Save
                    </Button>
                    <Button variant="outline-secondary" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </ButtonGroup>
                </InputGroup>
              ) : (
                <div className="px-2 py-1 bg-light rounded d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{c.user.name}:</strong> {c.text}
                    <div className="text-muted small">{timeAgo(c.createdAt)}</div>
                  </div>
                  {c.user._id === user?._id && !disableComments && (
                    <ButtonGroup size="sm">
                      <Button variant="outline-primary" onClick={() => startEdit(c)}>
                        Edit
                      </Button>
                      <Button variant="outline-danger" onClick={() => remove(c._id)}>
                        Delete
                      </Button>
                    </ButtonGroup>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {!disableComments && (
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
              {posting ? <Spinner size="sm" animation="border" /> : "Post"}
            </Button>
          </InputGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>)
}