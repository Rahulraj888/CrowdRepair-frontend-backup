import React, { useContext, useState, useEffect, useCallback, useMemo } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import styles from "./Dashboard.module.css";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  ListGroup,
  Image,
  Spinner,
  Alert,
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

// Haversine distance for sorting by proximity
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format "2h ago" / "3d ago"
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : new Date(dateStr).toLocaleDateString();
}

// Custom hook for fetching reports
function useReports(statusFilter, typeFilter) {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await getReports({ status: statusFilter, type: typeFilter });
      setReports(all.filter((r) => r.user !== user?._id));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, user?._id]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, error, refetch: fetchReports };
}

// Custom hook for fetching comments per report
function useComments(reportId, commentCount) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!commentCount) return;
    setLoading(true);
    setError(null);
    try {
      const c = await getComments(reportId);
      setComments(c);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [reportId, commentCount]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { comments, loading, error, refetch: fetch };
}

// Summary panel component
function StatsPanel({ total, resolved, avgRes }) {
  return (
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
  );
}

// Marker component
function ReportMarker({ report, onClick }) {
  const statusColorMap = {
    Pending: "#f39c12",
    "In Progress": "#3498db",
    Fixed: "#2ecc71",
    Rejected: "#e74c3c",
  };

  return (
    <Marker
      longitude={report.location.coordinates[0]}
      latitude={report.location.coordinates[1]}
      onClick={onClick}
      anchor="bottom"
    >
      <FaMapMarkerAlt
        size={34}
        color={statusColorMap[report.status] || "gray"}
        style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.3))" }}
        aria-label={`Report: ${report.issueType}, status: ${report.status}`}
      />
    </Marker>
  );
}

// List item component
function ReportListItem({ report, idx, onUpvote, onAddComment }) {
  const { comments, loading: commentsLoading } = useComments(
    report._id,
    report.commentCount
  );

  const statusStyles = {
    Fixed: { bg: "#28a745", color: "#fff" },
    "In Progress": { bg: "#ffc107", color: "#212529" },
    Rejected: { bg: "#dc3545", color: "#fff" },
    Pending: { bg: "#6c757d", color: "#fff" },
  };

  const { bg, color } = statusStyles[report.status] || statusStyles.Pending;

  const [posting, setPosting] = useState(false);
  const [newText, setNewText] = useState("");

  const handlePost = async () => {
    if (!newText.trim()) return;
    setPosting(true);
    await onAddComment(report._id, newText);
    setNewText("");
    setPosting(false);
  };

  return (
    <ListGroup.Item className={`py-3 ${styles.reportCard}`}> 
      <div className="d-flex">
        {report.imageUrls?.[0] && (
          <Image
            src={`${BACKEND}${report.imageUrls[0]}`}
            thumbnail
            style={{ width: 80, height: 60, objectFit: "cover" }}
            className="me-3"
            alt="Report thumbnail"
          />
        )}
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <strong>{report.issueType}</strong>
              <div className="text-muted small">{timeAgo(report.createdAt)}</div>
            </div>
            <span style={{ backgroundColor: bg, color }} className={styles.statusBadge}>
              {report.status}
            </span>
          </div>
          <p className="mt-1 mb-2 small">{report.description}</p>
          <div className="d-flex gap-3 small">
            <Button
              variant="link"
              size="sm"
              disabled={posting}
              onClick={() => onUpvote(report._id, idx)}
              aria-label={"Upvote report"}
            >
              👍 Upvote ({report.upvoteCount || 0})
            </Button>
            <Button
              variant="link"
              size="sm"
              onClick={() => onUpvote(/* reuse for refresh */)}
              aria-label={"Refresh comments"}
            >
              💬 Comment ({report.commentCount})
            </Button>
          </div>
          {commentsLoading ? (
            <Spinner animation="border" size="sm" className="mt-2" />
          ) : (
            comments.map((c) => (
              <div
                key={c._id}
                className="mt-2 px-2 py-1 bg-light rounded small"
              >
                <strong>{c.user.name}:</strong> {c.text}
              </div>
            ))
          )}
          <InputGroup className="mt-2">
            <Form.Control
              placeholder="Add comment…"
              size="sm"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              aria-label="Add comment"
            />
            <Button
              className={styles.btnPost}
              variant="primary"
              size="sm"
              onClick={handlePost}
              disabled={posting}
            >
              {posting ? <Spinner size="sm" animation="border" /> : "Post"}
            </Button>
          </InputGroup>
        </div>
      </div>
    </ListGroup.Item>
  );
}

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const [statusFilter, setStatus] = useState("all");
  const [typeFilter, setType] = useState("all");
  const { reports, loading, error, refetch } = useReports(statusFilter, typeFilter);
  const [userLocation, setUserLocation] = useState(null);
  const [viewState, setViewState] = useState({ latitude: 43.65, longitude: -79.38, zoom: 13.5 });
  const [popupInfo, setPopupInfo] = useState(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setViewState((v) => ({ ...v, latitude, longitude }));
          setUserLocation({ latitude, longitude });
        },
        (err) => console.warn("Geolocation failed", err)
      );
    }
  }, []);

  // Sort reports by distance
  const sortedReports = useMemo(() => {
    if (!userLocation) return reports;
    return [...reports].sort((a, b) => {
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
  }, [reports, userLocation]);

  // Summary stats
  const total = reports.length;
  const resolved = reports.filter((r) => r.status === "Fixed").length;
  const avgRes = useMemo(() => {
    const done = reports.filter((r) => r.status === "Fixed" && r.updatedAt);
    if (!done.length) return 0;
    const days = done.reduce(
      (sum, r) =>
        sum + (new Date(r.updatedAt) - new Date(r.createdAt)) / (1000 * 60 * 60 * 24),
      0
    );
    return (days / done.length).toFixed(1);
  }, [reports]);

  const handleUpvote = async (id, idx) => {
    try {
      await upvoteReport(id);
      refetch();
    } catch (err) {
      console.error("Upvote failed", err);
    }
  };

  const handleAddComment = async (id, text) => {
    try {
      await addComment(id, text);
      refetch();
    } catch (err) {
      console.error("Comment failed", err);
    }
  };

  return (
    <Container fluid className="py-4">
      <h2>Dashboard</h2>

      {(loading || error) && (
        <Alert variant={error ? "danger" : "info"}>
          {error ? "Failed to load reports." : "Loading reports..."}
        </Alert>
      )}

      {/* Filters */}
      <Row className="mb-3">
        <Col xs={6}>
          <Form.Select
            aria-label="Filter by status"
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
            aria-label="Filter by type"
            className={styles.roundedBox}
            value={typeFilter}
            onChange={(e) => setType(e.target.value)}
          >
            {["all", "Pothole", "Streetlight", "Graffiti", "Other"].map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "Filter by type" : t}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Row>
        {/* Map */}
        <Col lg={8} className="mb-4">
          {!MAPBOX_TOKEN ? (
            <Alert variant="warning">Map token missing.</Alert>
          ) : (
            <Map
              {...viewState}
              style={{ width: "100%", height: 400, borderRadius: 8 }}
              mapStyle="mapbox://styles/mapbox/streets-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
              onMove={(evt) => setViewState(evt.viewState)}
            >
              {userLocation && (
                <Marker
                  longitude={userLocation.longitude}
                  latitude={userLocation.latitude}
                  anchor="bottom"
                >
                  <svg height="20" viewBox="0 0 24 24" style={{ fill: "#007bff", stroke: "#fff", strokeWidth: 2, transform: "translate(-12px, -24px)" }} />
                </Marker>
              )}
              {sortedReports.map((r) => (
                <ReportMarker key={r._id} report={r} onClick={() => setPopupInfo(r)} />
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
          )}

          <Card className={`mt-3 ${styles.roundedBox}`}>
            <StatsPanel total={total} resolved={resolved} avgRes={avgRes} />
            <Card.Footer className={styles.legendBox}>
              {Object.entries({ Pending: "#f39c12", "In Progress": "#3498db", Fixed: "#2ecc71", Rejected: "#e74c3c" }).map(
                ([status, color]) => (
                  <span key={status} className="d-flex align-items-center gap-1">
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />
                    <small>{status}</small>
                  </span>
                )
              )}
            </Card.Footer>
          </Card>
        </Col>

        {/* Report List */}
        <Col lg={4}>
          <h5>Recent Reports</h5>
          <ListGroup variant="flush">
            {sortedReports.slice(0, 6).map((r, idx) => (
              <ReportListItem
                key={r._id}
                report={r}
                idx={idx}
                onUpvote={handleUpvote}
                onAddComment={handleAddComment}
              />
            ))}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}
