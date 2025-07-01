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
  Modal,
  Carousel,
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

// Calculate distance between two lat/lng pairs
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Format timestamp as “2h ago” or date
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : new Date(dateStr).toLocaleDateString();
}

// Hook to fetch and filter reports
function useReports(statusFilter, typeFilter) {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (statusFilter !== "all") filters.status = statusFilter;
      if (typeFilter !== "all") filters.type = typeFilter;
      const all = await getReports(filters);
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

// Hook to fetch comments for a report
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

// Displays summary statistics
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

// Map marker with status color
function ReportMarker({ report, onClick }) {
  const colors = { Pending: "#f39c12", "In Progress": "#3498db", Fixed: "#2ecc71", Rejected: "#e74c3c" };
  return (
    <Marker
      longitude={report.location.coordinates[0]}
      latitude={report.location.coordinates[1]}
      anchor="bottom"
      onClick={onClick}
    >
      <FaMapMarkerAlt size={34} color={colors[report.status] || "gray"} />
    </Marker>
  );
}

// Single report item + detail modal
function ReportListItem({ report, idx, onUpvote, onAddComment, userLocation }) {
  const { comments, loading: comLoading } = useComments(report._id, report.commentCount);
  const [newText, setNewText] = useState("");
  const [posting, setPosting] = useState(false);
  const [show, setShow] = useState(false);
  const [address, setAddress] = useState(null);

  // Reverse geocode for full address
  useEffect(() => {
    const [lng, lat] = report.location.coordinates;
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
    )
      .then((r) => r.json())
      .then((d) => d.features?.[0] && setAddress(d.features[0].place_name))
      .catch(() => {});
  }, [report.location.coordinates]);

  // Distance in km
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
    setPosting(false);
  };

  const statusStyles = { Fixed: { bg: "#28a745", color: "#fff" }, "In Progress": { bg: "#ffc107", color: "#212529" }, Rejected: { bg: "#dc3545", color: "#fff" }, Pending: { bg: "#6c757d", color: "#fff" } };
  const { bg, color } = statusStyles[report.status] || statusStyles.Pending;

  return (
    <>
      <ListGroup.Item className={`py-3 ${styles.reportCard}`}>
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex">
            {report.imageUrls?.[0] && (
              <Image
                src={`${BACKEND}${report.imageUrls[0]}`}
                thumbnail
                style={{ width: 80, height: 60, objectFit: "cover" }}
                className="me-3"
              />
            )}
            <div>
              <strong>{report.issueType}</strong>
              <div className="text-muted small">
                {timeAgo(report.createdAt)}{distance && ` • ${distance}km away`}
              </div>
              <p className="mt-1 small">{report.description}</p>
            </div>
          </div>
          <span style={{ backgroundColor: bg, color }} className={styles.statusBadge}>
            {report.status}
          </span>
        </div>
        <div className="mt-2 d-flex gap-3 align-items-center">
          <Button variant="link" size="sm" onClick={() => setShow(true)}>
            View Details
          </Button>
          <Button variant="link" size="sm" onClick={() => onUpvote(report._id, idx)}>
            👍 {report.upvoteCount || 0}
          </Button>
          <Button variant="link" size="sm" onClick={() => setShow(true)}>
            💬 {report.commentCount || 0}
          </Button>
        </div>
      </ListGroup.Item>

      {/* Detail Modal */}
      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{report.issueType}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {report.imageUrls?.length > 0 && (
            <Carousel className="mb-3">
              {report.imageUrls.map((url,i) => (
                <Carousel.Item key={i}>
                  <img
                    src={`${BACKEND}${url}`}
                    alt={`Image ${i+1}`}
                    className="d-block w-100" />
                </Carousel.Item>
              ))}
            </Carousel>
          )}
          <p><strong>Description:</strong> {report.description}</p>
          {address && <p><strong>Location:</strong> {address}</p>}
          {distance && <p><strong>Distance:</strong> {distance} km</p>}
          <p><strong>Reporter:</strong> {report.user.name}</p>
          <p><strong>Reported on:</strong> {new Date(report.createdAt).toLocaleString()}</p>
          <p><strong>Status:</strong> {report.status}</p>
          <hr/>
          <h6>Comments</h6>
          {comLoading ? (
            <Spinner size="sm" animation="border" className="my-2" />
          ) : (
            comments.map(c => (
              <div key={c._id} className="px-2 py-1 bg-light rounded mb-2">
                <strong>{c.user.name}:</strong> {c.text}
              </div>
            ))
          )}
          <InputGroup className="mt-3">
            <Form.Control
              placeholder="Write a comment…"
              size="sm"
              value={newText}
              onChange={e => setNewText(e.target.value)}
            />
            <Button variant="primary" size="sm" disabled={posting} onClick={handlePost}>
              {posting ? <Spinner size="sm" animation="border" /> : "Post"}
            </Button>
          </InputGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
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

  // load user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setViewState(v => ({ ...v, latitude: coords.latitude, longitude: coords.longitude }));
          setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
        }
      );
    }
  }, []);

  const sorted = useMemo(() => {
    if (!userLocation) return reports;
    return [...reports].sort((a,b) => {
      const da = haversineDistance(userLocation.latitude, userLocation.longitude, a.location.coordinates[1], a.location.coordinates[0]);
      const db = haversineDistance(userLocation.latitude, userLocation.longitude, b.location.coordinates[1], b.location.coordinates[0]);
      return da - db;
    });
  }, [reports, userLocation]);

  const total = reports.length;
  const resolved = reports.filter(r => r.status === "Fixed").length;
  const avgRes = useMemo(() => {
    const done = reports.filter(r => r.status === "Fixed" && r.updatedAt);
    if (!done.length) return 0;
    const days = done.reduce((sum, r) => sum + (new Date(r.updatedAt) - new Date(r.createdAt))/(1000*60*60*24), 0);
    return (days/done.length).toFixed(1);
  }, [reports]);

  const handleUpvote = async (id, idx) => { try{ await upvoteReport(id); refetch(); }catch{} };
  const handleAddComment = async (id, text) => { try{ await addComment(id, text); refetch(); }catch{} };

  return (
    <Container fluid className="py-4">
      <h2>Dashboard</h2>
      {(loading || error) && <Alert variant={error?"danger":"info"}>{error?"Failed to load":"Loading reports..."}</Alert>}
      <Row className="mb-3">
        <Col xs={6}>
          <Form.Select value={statusFilter} onChange={e=>setStatus(e.target.value)} className={styles.roundedBox}>
            {["all","Pending","In Progress","Fixed","Rejected"].map(s=><option key={s} value={s}>{s}</option>)}
          </Form.Select>
        </Col>
        <Col xs={6}>
          <Form.Select value={typeFilter} onChange={e=>setType(e.target.value)} className={styles.roundedBox}>
            {["all","Pothole","Streetlight","Graffiti","Other"].map(t=><option key={t} value={t}>{t}</option>)}
          </Form.Select>
        </Col>
      </Row>
      <Row>
        <Col lg={8} className="mb-4">
          {!MAPBOX_TOKEN
            ? <Alert variant="warning">Map token missing.</Alert>
            : <Map {...viewState} style={{width:'100%',height:400,borderRadius:8}} mapStyle="mapbox://styles/mapbox/streets-v11" mapboxAccessToken={MAPBOX_TOKEN} onMove={e=>setViewState(e.viewState)}>
                {userLocation && <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="bottom">
                  <svg height="20" viewBox="0 0 24 24" style={{fill:'#007bff',stroke:'#fff',strokeWidth:2,transform:'translate(-12px,-24px)'}} />
                </Marker>}
                {sorted.map(r=><ReportMarker key={r._id} report={r} onClick={()=>setPopupInfo(r)} />)}
                {popupInfo && <Popup anchor="top" longitude={popupInfo.location.coordinates[0]} latitude={popupInfo.location.coordinates[1]} onClose={()=>setPopupInfo(null)}>
                  <strong>{popupInfo.issueType}</strong><br />{popupInfo.description}
                </Popup>}
              </Map>}
          <Card className={`mt-3 ${styles.roundedBox}`}><StatsPanel total={total} resolved={resolved} avgRes={avgRes} /><Card.Footer className={styles.legendBox}>{Object.entries({Pending:'#f39c12','In Progress':'#3498db',Fixed:'#2ecc71',Rejected:'#e74c3c'}).map(([st,c])=><span key={st} className="d-flex align-items-center gap-1"><div style={{width:12,height:12,borderRadius:'50%',background:c}}/><small>{st}</small></span>)}</Card.Footer></Card>
        </Col>
        <Col lg={4}>
          <h5>Recent Reports</h5>
          <ListGroup variant="flush">{sorted.slice(0,6).map((r,i)=><ReportListItem key={r._id} report={r} idx={i} onUpvote={handleUpvote} onAddComment={handleAddComment} userLocation={userLocation}/>)}</ListGroup>
        </Col>
      </Row>
    </Container>
  );
}
