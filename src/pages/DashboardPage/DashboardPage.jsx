import { useContext, useState, useEffect } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import styles from "./Dashboard.module.css";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  InputGroup,
  ListGroup,
  Image,
} from "react-bootstrap";
import Map, { Marker, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { AuthContext } from "../../context/AuthContext";
import {
  getReports,
  upvoteReport,
  getComments,
  addComment,
} from "../../services/reportService";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatus] = useState("all");
  const [typeFilter, setType] = useState("all");
  const [commentsById, setCommentsById] = useState({});
  const [newComment, setNewComment] = useState({});
  const [userLocation, setUserLocation] = useState(null); //user current location based on coordinates

  const [viewState, setViewState] = useState({
    latitude: 43.65,
    longitude: -79.38,
    zoom: 13.5,
  });

  useEffect(() => {
    //get the currrent location of the user using predefined web browser api function
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setViewState((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
          setUserLocation({ latitude, longitude });
        },
        (error) => {
          console.warn("⚠️ Geolocation failed:", error);
        }
      );
    } else {
      console.warn("⚠️ Geolocation is not available in this browser.");
    }
  }, []);
  const [popupInfo, setPopupInfo] = useState(null);

  const statusColorMap = {
    Pending: "#f39c12", // orange
    "In Progress": "#3498db", // blue
    Fixed: "#2ecc71", // green
    Rejected: "#e74c3c", // red
  };

  //helper function calculate distance of the report issue location with repsect to user location
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // helper to format “2h ago” / “3d ago”
  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr);
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days < 7 ? `${days}d ago` : new Date(dateStr).toLocaleDateString();
  }

  // Fetch reports whenever filters change
  useEffect(() => {
    (async () => {
      try {
        const all = await getReports({
          status: statusFilter,
          type: typeFilter,
        });
        setReports(all.filter((r) => r.user !== user?._id));
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
    const text = newComment[id]?.trim();
    if (!text) return;
    try {
      await addComment(id, text);
      await fetchComments(id);
      setNewComment((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  // Summary stats
  const total = reports.length;
  const resolved = reports.filter((r) => r.status === "Fixed").length;
  const avgRes = (() => {
    const done = reports.filter((r) => r.status === "Fixed" && r.updatedAt);
    if (!done.length) return 0;
    const days = done.reduce(
      (sum, r) =>
        sum +
        (new Date(r.updatedAt) - new Date(r.createdAt)) / (1000 * 60 * 60 * 24),
      0
    );
    return (days / done.length).toFixed(1);
  })();

  const statusColors = {
    Fixed: { bg: "#28a745", color: "#fff" }, // green
    "In Progress": { bg: "#ffc107", color: "#212529" }, // yellow
    Rejected: { bg: "#dc3545", color: "#fff" }, // red
    Pending: { bg: "#6c757d", color: "#fff" }, // gray
  };

  const sortedReports = [...reports]
    .filter((r) => r.user !== user.id) // still hide your own
    .sort((a, b) => {
      if (!userLocation) return 0;
      const distA = haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        a.location.coordinates[1],
        a.location.coordinates[0]
      );
      const distB = haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        b.location.coordinates[1],
        b.location.coordinates[0]
      );
      return distA - distB;
    });
  return (
    <Container fluid className="py-4">
      <h2>Dashboard</h2>

      {/* Filters */}
      <Row className="mb-3">
        <Col xs={6}>
          <Form.Select
            className={styles.roundedBox}
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["all", "Pending", "In Progress", "Fixed", "Rejected"].map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Filter by status" : s}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6}>
          <Form.Select
            className={styles.roundedBox}
            value={typeFilter}
            onChange={(e) => setType(e.target.value)}
          >
            {["all", "Pothole", "Streetlight", "Graffiti", "Other"].map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "Filter by Type" : t}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Row>
        {/* Mapbox Map */}
        <Col lg={8} className="mb-4">
          <Card className={styles.roundedBox}>
            <Map
              {...viewState}
              style={{ width: "100%", height: 400, borderRadius: 8 }}
              mapStyle="mapbox://styles/mapbox/streets-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
              onMove={(evt) => setViewState(evt.viewState)}
            >
              {userLocation && (
                <Marker //based on the user coordinates its show the user location marker that reperesnt current location of the user
                  longitude={userLocation.longitude}
                  latitude={userLocation.latitude}
                  anchor="bottom"
                >
                  <svg
                    height="20"
                    viewBox="0 0 24 24"
                    style={{
                      fill: "#007bff", // bright blue
                      stroke: "#fff",
                      strokeWidth: 2,
                      transform: "translate(-12px, -24px)",
                      filter: "drop-shadow(0 0 4px rgba(0,0,0,0.3))",
                    }}
                  >
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                </Marker>
              )}
              {sortedReports.map((r) => (
                <Marker
                  key={r._id}
                  latitude={r.location.coordinates[1]}
                  longitude={r.location.coordinates[0]}
                  onClick={() => setPopupInfo(r)}
                >
                  <FaMapMarkerAlt
                    size={34}
                    color={statusColorMap[r.status] || "gray"}
                    style={{
                      filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.3))",
                      stroke: "#fff",
                      strokeWidth: "2px",
                    }}
                  />
                </Marker>
              ))}
              {popupInfo && (
                <Popup
                  anchor="top"
                  longitude={popupInfo.location.coordinates[0]}
                  latitude={popupInfo.location.coordinates[1]}
                  onClose={() => setPopupInfo(null)}
                >
                  <strong>{popupInfo.issueType}</strong>
                  <br />
                  {popupInfo.description}
                </Popup>
              )}
            </Map>
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
            <Card.Footer className={styles.legendBox}>
              {Object.entries(statusColorMap).map(([status, color]) => (
                <span key={status} className="d-flex align-items-center gap-1">
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: color,
                    }}
                  />
                  <small>{status}</small>
                </span>
              ))}
            </Card.Footer>
          </Card>
        </Col>

        {/* Recent Reports List */}
        <Col lg={4}>
          <h5>Recent Reports</h5>
          <ListGroup variant="flush">
            {sortedReports.slice(0, 6).map((r, idx) => (
              <ListGroup.Item
                key={r._id}
                className={`py-3 ${styles.reportCard}`}
              >
                <div className="d-flex">
                  {r.imageUrls?.[0] && (
                    <Image
                      src={`${BACKEND}${r.imageUrls[0]}`}
                      thumbnail
                      style={{ width: 80, height: 60, objectFit: "cover" }}
                      className="me-3"
                    />
                  )}
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <strong>{r.issueType}</strong>
                        <div className="text-muted small">
                          {timeAgo(r.createdAt)}
                        </div>
                      </div>
                      {(() => {
                        const { bg, color } = statusColors[r.status] || {
                          bg: "#6c757d",
                          color: "#fff",
                        };
                        return (
                          <span
                            className={styles.statusBadge}
                            style={{ backgroundColor: bg, color }}
                          >
                            {r.status}
                          </span>
                        );
                      })()}
                    </div>

                    <p className="mt-1 mb-2 small">{r.description}</p>

                    <div className="d-flex gap-3 small">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleUpvote(r._id, idx)}
                      >
                        👍 Upvote ({r.upvoteCount || 0})
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => fetchComments(r._id)}
                      >
                        💬 Comment ({r.commentCount})
                      </Button>
                    </div>

                    {(commentsById[r._id] || []).map((c) => (
                      <div
                        key={c._id}
                        className="mt-2 px-2 py-1 bg-light rounded small"
                      >
                        <strong>{c.user.name}:</strong> {c.text}
                      </div>
                    ))}

                    <InputGroup className="mt-2">
                      <Form.Control
                        placeholder="Add comment…"
                        size="sm"
                        value={newComment[r._id] || ""}
                        onChange={(e) =>
                          setNewComment((prev) => ({
                            ...prev,
                            [r._id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        className={styles.btnPost}
                        variant="primary"
                        size="sm"
                        onClick={() => handleAddComment(r._id)}
                      >
                        Post
                      </Button>
                    </InputGroup>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}
