import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import styles from "./Dashboard.module.css";
import {
  Container,
  Row,
  Col,
  Card,
  Dropdown,
  Button,
  ListGroup,
  Image,
  Spinner,
  Alert,
  Pagination,
} from "react-bootstrap";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import ReportDetailModal from "../../components/ReportDetailModal";
import { AuthContext } from "../../context/AuthContext";
import { getReports, upvoteReport, addComment } from "../../services/reportService";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const PAGE_SIZE = 5;

// Status → color map
const STATUS_COLORS = {
  Pending: "#f39c12",
  "In Progress": "#3498db",
  Fixed: "#2ecc71",
};

// Haversine formula
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

// “2h ago” or date
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : new Date(dateStr).toLocaleDateString();
}

// Fetch & filter reports
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
      setReports(all.filter((r) => r.user._id !== user?._id && r.status !== "Rejected"));
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

// Stats panel
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

// Single report item + detail button
function ReportListItem({ report, onUpvote, onAddComment, userLocation }) {
  const [showDetail, setShowDetail] = useState(false);
  const [address, setAddress] = useState(null);

  // reverse-geocode
  useEffect(() => {
    const [lng, lat] = report.location.coordinates;
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.features?.[0]) setAddress(d.features[0].place_name);
      })
      .catch(() => {});
  }, [report.location.coordinates]);

  const distance = userLocation
    ? haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        report.location.coordinates[1],
        report.location.coordinates[0]
      ).toFixed(1)
    : null;

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
                {timeAgo(report.createdAt)}
                {distance && ` • ${distance}km away`}
              </div>
              <p className="mt-1 small">{report.description}</p>
              {address && <p className="mt-1 small">{address}</p>}
            </div>
          </div>
          <span
            style={{
              backgroundColor: STATUS_COLORS[report.status] || "#6c757d",
              color: "#fff",
            }}
            className={styles.statusBadge}
          >
            {report.status}
          </span>
        </div>
        <div className="mt-2 d-flex gap-3">
          <Button variant="link" size="sm" onClick={() => setShowDetail(true)}>
            View Details
          </Button>
          <Button variant="link" size="sm" onClick={() => onUpvote(report._id)}>
            👍 {report.upvoteCount || 0}
          </Button>
          <Button variant="link" size="sm" onClick={() => setShowDetail(true)}>
            💬 {report.commentCount || 0}
          </Button>
        </div>
      </ListGroup.Item>

      <ReportDetailModal
        report={report}
        show={showDetail}
        onHide={() => setShowDetail(false)}
        onUpvote={() => onUpvote(report._id)}
        onAddComment={(text) => onAddComment(report._id, text)}
        userLocation={userLocation}
        BACKEND={BACKEND}
        MAPBOX_TOKEN={MAPBOX_TOKEN}
      />
    </>
  );
}

export default function DashboardPage() {
  const { reports, loading, error, refetch } = useReports(/* statusFilter, typeFilter can be added */);
  const [statusFilter, setStatus] = useState("all");
  const [typeFilter, setType] = useState("all");
  const [userLocation, setUserLocation] = useState(null);
  const [viewState, setViewState] = useState({
    latitude: 43.65,
    longitude: -79.38,
    zoom: 13.5,
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));

  // reset page when filters change
  useEffect(() => setPage(1), [statusFilter, typeFilter]);

  // geolocation
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setViewState((v) => ({
        ...v,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));
      setUserLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    });
  }, []);

  const sorted = useMemo(() => {
    if (!userLocation) return reports;
    return [...reports].sort((a, b) => {
      const da = haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        a.location.coordinates[1],
        a.location.coordinates[0]
      );
      const db = haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        b.location.coordinates[1],
        b.location.coordinates[0]
      );
      return da - db;
    });
  }, [reports, userLocation]);

  const paginated = sorted.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const total = reports.length;
  const resolved = reports.filter((r) => r.status === "Fixed").length;
  const avgRes = useMemo(() => {
    const done = reports.filter((r) => r.status === "Fixed" && r.updatedAt);
    if (!done.length) return 0;
    const days =
      done.reduce(
        (sum, r) =>
          sum +
          (new Date(r.updatedAt) - new Date(r.createdAt)) /
            (1000 * 60 * 60 * 24),
        0
      ) / done.length;
    return days.toFixed(1);
  }, [reports]);

  const handleUpvote = useCallback(
    async (id) => {
      await upvoteReport(id);
      refetch();
    },
    [refetch]
  );

  const handleAddComment = useCallback(
    async (id, text) => {
      console.log("posting comment", { id, text });
      await addComment(id, text);
      refetch();
    },
    [refetch]
  );

  return (
    <Container fluid className="py-4">
      <h2>Dashboard</h2>
      {(loading || error) && (
        <Alert variant={error ? "danger" : "info"}>
          {error ? "Failed to load" : "Loading reports..."}
        </Alert>
      )}

      <Row className={`mb-3 ${styles.filterRow}`}>
        <Col xs={12} sm={6} className="d-flex">
          <Dropdown
            onSelect={(s) => setStatus(s)}
            className="w-100"
          >
            <Dropdown.Toggle variant="light" className="w-100 text-start border">
              {statusFilter ==="all"?"Filter By Status":statusFilter}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {[
                "all",
                "Pending",
                "In Progress",
                "Fixed",
              ].map((s) => (
                <Dropdown.Item eventKey={s} key={s}>
                  {s}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
        <Col xs={12} sm={6} className="d-flex">
          <Dropdown
            onSelect={(t) => setType(t)}
            className="w-100"
          >
            <Dropdown.Toggle  variant="light" className="w-100 text-start border">
              {typeFilter==="all"?"Filter By Type":typeFilter}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {[
                "all",
                "Pothole",
                "Streetlight",
                "Graffiti",
                "Other",
              ].map((t) => (
                <Dropdown.Item eventKey={t} key={t}>
                  {t}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      <Row>
        <Col lg={8} className="mb-4">
          {!MAPBOX_TOKEN ? (
            <Alert variant="warning">Map token missing.</Alert>
          ) : (
            <Map
              {...viewState}
              style={{ width: "100%", height: 400, borderRadius: 8 }}
              mapStyle="mapbox://styles/mapbox/streets-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
              onMove={(e) => setViewState(e.viewState)}
            >
              {userLocation && (
                <Marker
                  longitude={userLocation.longitude}
                  latitude={userLocation.latitude}
                  anchor="bottom"
                >
                  <svg
                    height="20"
                    viewBox="0 0 24 24"
                    style={{
                      fill: "#007bff",
                      stroke: "#fff",
                      strokeWidth: 2,
                      transform: "translate(-12px,-24px)",
                    }}
                  />
                </Marker>
              )}
              {paginated.map((r) => (
                <Marker
                  key={r._id}
                  longitude={r.location.coordinates[0]}
                  latitude={r.location.coordinates[1]}
                  anchor="bottom"
                >
                  <div
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReport(r);
                      setShowDetail(true);
                    }}
                  >
                    <FaMapMarkerAlt
                      size={34}
                      color={STATUS_COLORS[r.status] || "gray"}
                    />
                  </div>
                </Marker>
              ))}
            </Map>
          )}
          <Card className={`mt-3 ${styles.roundedBox}`}>
            <StatsPanel total={total} resolved={resolved} avgRes={avgRes} />
            <Card.Footer className={styles.legendBox}>
              {Object.entries(STATUS_COLORS).map(([st, c]) => (
                <span key={st} className="d-flex align-items-center gap-1">
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: c,
                    }}
                  />
                  <small>{st}</small>
                </span>
              ))}
            </Card.Footer>
          </Card>
        </Col>

        <Col lg={4}>
          <h5>Recent Reports</h5>
          <ListGroup variant="flush">
            {paginated.map((r) => (
              <ReportListItem
                key={r._id}
                report={r}
                onUpvote={handleUpvote}
                onAddComment={handleAddComment}
                userLocation={userLocation}
              />
            ))}
          </ListGroup>

          <div className="d-flex justify-content-center mt-2">
            <Pagination size="sm">
              <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
              <Pagination.Prev
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              />
              {Array.from({ length: totalPages }, (_, idx) => (
                <Pagination.Item
                  key={idx + 1}
                  active={idx + 1 === page}
                  onClick={() => setPage(idx + 1)}
                >
                  {idx + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              />
              <Pagination.Last
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
              />
            </Pagination>
          </div>
        </Col>
      </Row>

      <ReportDetailModal
        report={selectedReport}
        show={showDetail}
        onHide={() => setShowDetail(false)}
        onUpvote={() => handleUpvote(selectedReport._id)}
        onAddComment={(text) => handleAddComment(selectedReport._id, text)}
        userLocation={userLocation}
        BACKEND={BACKEND}
        MAPBOX_TOKEN={MAPBOX_TOKEN}
      />
    </Container>
  );
}
