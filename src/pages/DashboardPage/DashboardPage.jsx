import React, { useState, useEffect, useMemo, useCallback, useContext } from "react";
import { Container, Row, Col, Alert, Card, Pagination, ListGroup } from "react-bootstrap";
import Map, { Marker } from "react-map-gl";
import { FaMapMarkerAlt } from "react-icons/fa";
import styles from "./Dashboard.module.css";
import { AuthContext } from "../../context/AuthContext";

import useReports from "./useReports";
import { haversineDistance } from "../../utils/haversine";
import StatsPanel from "./StatsPanel";
import ReportListItem from "./ReportListItem";
import ReportDetailModal from "../../components/ReportDetailModal";
import { upvoteReport, addComment } from "../../services/reportService";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const PAGE_SIZE = 5;

const STATUS_COLORS = {
  Pending: "#f39c12",
  "In Progress": "#3498db",
  Fixed: "#2ecc71",
};

export default function DashboardPage() {
  const [statusFilter, setStatus] = useState("all");
  const [typeFilter, setType] = useState("all");
  const { reports, loading, error, refetch } = useReports(statusFilter, typeFilter);

  const [userLocation, setUserLocation] = useState(null);
  const [viewState, setViewState] = useState({ latitude: 43.65, longitude: -79.38, zoom: 13.5 });
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const { user } = useContext(AuthContext);
  const isUser = user?.role !== 'admin';  // adjust if your user object uses a different flag

  useEffect(() => setPage(1), [statusFilter, typeFilter]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
      setViewState((v) => ({ ...v, latitude: coords.latitude, longitude: coords.longitude }));
    });
  }, []);

  const sorted = useMemo(() => {
    if (!userLocation) return reports;
    return [...reports].sort((a, b) =>
      haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        a.location.coordinates[1],
        a.location.coordinates[0]
      ) -
      haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        b.location.coordinates[1],
        b.location.coordinates[0]
      )
    );
  }, [reports, userLocation]);

  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = reports.length;
  const resolved = reports.filter((r) => r.status === "Fixed").length;

  const avgRes = useMemo(() => {
    const done = reports.filter((r) => r.status === "Fixed" && r.updatedAt);
    if (!done.length) return 0;
    const days =
      done.reduce(
        (sum, r) =>
          sum + (new Date(r.updatedAt) - new Date(r.createdAt)) / (1000 * 60 * 60 * 24),
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
      await addComment(id, text);
      refetch();
    },
    [refetch]
  );

  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));

  return (
    <Container fluid className="py-4">
      <h2>Dashboard</h2>
      {(loading || error) && (
        <Alert variant={error ? "danger" : "info"}>
          {error ? "Failed to load reports." : "Loading reports..."}
        </Alert>
      )}

      {/* Filters */}
      <Row className={`mb-3 ${styles.filterRow}`}>
        <Col sm={6}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Filter by Status</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Fixed</option>
          </select>
        </Col>
        <Col sm={6}>
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">Filter by Type</option>
            <option>Pothole</option>
            <option>Streetlight</option>
            <option>Graffiti</option>
            <option>Other</option>
          </select>
        </Col>
      </Row>

      <Row>
        <Col lg={8} className="mb-4">
          {MAPBOX_TOKEN && (
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
                  <div
                    className="bg-primary rounded-circle"
                    style={{ width: 12, height: 12 }}
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
          </Card>
        </Col>

        <Col lg={4}>
          <h5>Recent Reports</h5>

          {total === 0 && !loading && !error ? (
            <Alert variant="info">No reports to show.</Alert>
          ) : (
            <>
              <ListGroup variant="flush">
                {paginated.map((r) => (
                  <ReportListItem
                    key={r._id}
                    report={r}
                    userLocation={userLocation}
                    onUpvote={handleUpvote}
                    onAddComment={handleAddComment}
                  />
                ))}
              </ListGroup>

              {total > PAGE_SIZE && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination size="sm">
                    <Pagination.First
                      disabled={page === 1}
                      onClick={() => setPage(1)}
                    />
                    <Pagination.Prev
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    />
                    {Array.from({ length: totalPages }, (_, idx) => (
                      <Pagination.Item
                        key={idx}
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
              )}
            </>
          )}
        </Col>
      </Row>
      
      <ReportDetailModal
        report={selectedReport}
        show={showDetail}
        onHide={() => setShowDetail(false)}
        onUpvote={() => handleUpvote(selectedReport?._id)}
        onAddComment={(text) =>
          selectedReport && handleAddComment(selectedReport._id, text)
        }
        userLocation={userLocation}
        BACKEND={import.meta.env.VITE_API_URL || "http://localhost:5000"}
        MAPBOX_TOKEN={MAPBOX_TOKEN}
        disableComments = {!isUser}
      />
    </Container>
  );
}
