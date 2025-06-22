import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  InputGroup,
} from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  getReports,
  upvoteReport,
  getComments,
  addComment,
} from "../../services/reportService";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function DashboardPage() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatus] = useState("all");
  const [typeFilter, setType] = useState("all");
  const [commentsById, setCommentsById] = useState({});
  const [newComment, setNewComment] = useState({});

  // Fetch reports whenever filters change
  useEffect(() => {
    (async () => {
      try {
        const r = await getReports({ status: statusFilter, type: typeFilter });
        setReports(r);
      } catch (err) {
        console.error("Failed to load reports:", err);
      }
    })();
  }, [statusFilter, typeFilter]);

  // Auto-fetch comments for any report that has commentCount > 0
  useEffect(() => {
    reports.forEach((r) => {
      if (r.commentCount > 0 && !commentsById[r._id]) {
        fetchComments(r._id);
      }
    });
  }, [reports]);

  const fetchComments = async (id) => {
    try {
      const c = await getComments(id);
      setCommentsById((prev) => ({ ...prev, [id]: c }));
    } catch (err) {
      console.error(`Failed to load comments for ${id}:`, err);
    }
  };

  const handleUpvote = async (id, idx) => {
    try {
      const count = await upvoteReport(id);
      setReports((r) =>
        r.map((rep, i) => (i === idx ? { ...rep, upvoteCount: count } : rep))
      );
    } catch (err) {
      if (err.response?.status === 400) {
        console.warn("Already upvoted this report.");
      } else {
        console.error("Upvote failed:", err);
      }
    }
  };

  const handleAddComment = async (id) => {
    try {
      await addComment(id, newComment[id]);
      await fetchComments(id);
      setNewComment((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const total = reports.length;
  const resolved = reports.filter((r) => r.status === "Fixed").length;
  const avgRes = (() => {
    const done = reports.filter((r) => r.status === "Fixed" && r.updatedAt);
    if (!done.length) return 0;
    const days = done.reduce(
      (sum, r) =>
        sum +
        (new Date(r.updatedAt) - new Date(r.createdAt)) /
          (1000 * 60 * 60 * 24),
      0
    );
    return (days / done.length).toFixed(1);
  })();

  return (
    <Container fluid className="py-4">
      <h2>Dashboard</h2>

      <Row className="mb-3">
        <Col xs={6}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["all", "Pending", "In Progress", "Fixed"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6}>
          <Form.Select
            value={typeFilter}
            onChange={(e) => setType(e.target.value)}
          >
            {["all", "Pothole", "Streetlight", "Graffiti", "Other"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Row>
        <Col lg={8} className="mb-4">
          <Card>
            <MapContainer
              center={[43.65, -79.38]}
              zoom={12}
              style={{ height: "400px", borderRadius: "8px" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {reports.map((r) => (
                <Marker
                  key={r._id}
                  position={[
                    r.location.coordinates[1],
                    r.location.coordinates[0],
                  ]}
                >
                  <Popup>
                    <strong>{r.issueType}</strong>
                    <br />
                    {r.description}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <Card.Body className="d-flex justify-content-around text-center">
              <div>
                <h5>{total}</h5>
                <small>Total Issues</small>
              </div>
              <div>
                <h5>{resolved}</h5>
                <small>Resolved</small>
              </div>
              <div>
                <h5>{avgRes}d</h5>
                <small>Avg. Resolution</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <h5>Recent Reports</h5>
          {reports.slice(0, 6).map((r, idx) => (
            <Card key={r._id} className="mb-3">
              {r.imageUrls?.[0] && (
                <Card.Img
                  variant="top"
                  src={`${BACKEND}${r.imageUrls[0]}`}
                  style={{ height: "180px", objectFit: "cover" }}
                />
              )}
              <Card.Header className="d-flex justify-content-between">
                <span>{r.issueType}</span>
                <Badge
                  bg={
                    r.status === "Fixed"
                      ? "success"
                      : r.status === "In Progress"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {r.status}
                </Badge>
              </Card.Header>

              <Card.Body>
                <Card.Text style={{ height: "60px", overflow: "hidden" }}>
                  {r.description}
                </Card.Text>

                <div className="d-flex justify-content-between mb-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleUpvote(r._id, idx)}
                  >
                    👍 {r.upvoteCount || 0}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => fetchComments(r._id)}
                  >
                    💬 {r.commentCount}
                  </Button>
                </div>

                {(commentsById[r._id] || []).map((c) => (
                  <div key={c._id} className="mt-2 px-2 py-1 bg-light rounded">
                    <strong>{c.user.name}:</strong> {c.text}
                  </div>
                ))}

                <InputGroup className="mt-2">
                  <Form.Control
                    placeholder="Add comment..."
                    value={newComment[r._id] || ""}
                    onChange={(e) =>
                      setNewComment((prev) => ({
                        ...prev,
                        [r._id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    variant="primary"
                    onClick={() => handleAddComment(r._id)}
                  >
                    Post
                  </Button>
                </InputGroup>
              </Card.Body>
            </Card>
          ))}
        </Col>
      </Row>
    </Container>
  );
}
