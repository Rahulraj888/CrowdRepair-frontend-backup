import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Table,
  Badge,
  Image,
  Spinner,
  ListGroup,
  Button,
  Alert,
  Dropdown,
  ButtonGroup,
  Card,
} from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import { getReports, deleteReport } from "../../services/reportService";
import styles from "./MyReportsPage.module.css";

const BANNER_SRC = "/my-reports.png";
const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MyReportsPage() {
  const { user } = useContext(AuthContext);
  const userId = user?._id;
  const navigate = useNavigate();

  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [error, setError] = useState("");

  // Fetch reports when filters or userId change
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    getReports({ status: statusFilter, type: typeFilter })
      .then(all => setMyReports(all.filter(r => r.user === userId)))
      .catch(err => {
        console.error("Error loading reports:", err);
        setError("Failed to load reports.");
      })
      .finally(() => setLoading(false));
  }, [userId, statusFilter, typeFilter]);

  // Compute summary stats
  const stats = useMemo(() => {
    const total = myReports.length;
    const fixed = myReports.filter(r => r.status === "Fixed").length;
    const pending = myReports.filter(r => r.status === "Pending").length;
    const inProgress = myReports.filter(r => r.status === "In Progress").length;
    const rejected = myReports.filter(r => r.status === "Rejected").length;
    return { total, fixed, pending, inProgress, rejected };
  }, [myReports]);

  const handleDelete = useCallback(
    async id => {
      if (!window.confirm("Delete this report?")) return;
      try {
        await deleteReport(id);
        setMyReports(prev => prev.filter(r => r._id !== id));
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete.");
      }
    },
    [deleteReport]
  );

  const getStatusVariant = s =>
    ({ Fixed: "success", "In Progress": "warning", Rejected: "danger" }[s] || "secondary");

  const displayed = useMemo(() => {
    return myReports
      .filter(r => (statusFilter === "all" ? true : r.status === statusFilter))
      .filter(r => (typeFilter === "all" ? true : r.issueType === typeFilter))
      .sort((a, b) => {
        const da = new Date(a.createdAt), db = new Date(b.createdAt);
        return sortOrder === "asc" ? da - db : db - da;
      });
  }, [myReports, statusFilter, typeFilter, sortOrder]);

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* —— STAT CARDS —— */}
      <Row className="mb-4 gx-3">
        <Col xs={6} md={2}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total</Card.Title>
              <Card.Text as="h3">{stats.total}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={2}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Fixed</Card.Title>
              <Card.Text as="h3">{stats.fixed}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={2}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Pending</Card.Title>
              <Card.Text as="h3">{stats.pending}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={2}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>In Progress</Card.Title>
              <Card.Text as="h3">{stats.inProgress}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={2}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Rejected</Card.Title>
              <Card.Text as="h3">{stats.rejected}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* —— RESPONSIVE THANK-YOU BANNER —— */}
      <div className="d-flex justify-content-center mb-4">
        <Image src={BANNER_SRC} alt="Thank you for reporting" fluid className={styles.banner} />
      </div>
      <h2>My Reports</h2>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("") }>
          {error}
        </Alert>
      )}

      {/* Filters + Sort */}
      <Row className="mb-3 gx-2">
        <Col xs={12} md={4}>
          <Dropdown as={ButtonGroup} className="w-100">
            <Dropdown.Toggle
              variant="light"
              className="w-100 text-start border"
              id="status-dropdown"
            >
              {statusFilter === "all" ? "All Statuses" : statusFilter}
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100" menuVariant="light">
              {["all", "Pending", "In Progress", "Fixed", "Rejected"].map(s => {
                const isActive = s === statusFilter;
                return (
                  <Dropdown.Item
                    key={s}
                    active={isActive}
                    onClick={() => setStatusFilter(s)}
                    style={{ backgroundColor: isActive ? "#e9ecef" : undefined, color: isActive ? "#000" : undefined }}
                  >
                    {s === "all" ? "All Statuses" : s}
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
        <Col xs={12} md={4}>
          <Dropdown as={ButtonGroup} className="w-100">
            <Dropdown.Toggle
              variant="light"
              className="w-100 text-start border"
              id="type-dropdown"
            >
              {typeFilter === "all" ? "All Types" : typeFilter}
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100" menuVariant="light">
              {["all", "Pothole", "Streetlight", "Graffiti", "Other"].map(t => {
                const isActive = t === typeFilter;
                return (
                  <Dropdown.Item
                    key={t}
                    active={isActive}
                    onClick={() => setTypeFilter(t)}
                    style={{ backgroundColor: isActive ? "#e9ecef" : undefined, color: isActive ? "#000" : undefined }}
                  >
                    {t === "all" ? "All Types" : t}
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
        <Col xs={12} md={4}>
          <Dropdown as={ButtonGroup} className="w-100">
            <Dropdown.Toggle
              variant="light"
              className="w-100 text-start border"
              id="sort-dropdown"
            >
              {sortOrder === "desc" ? "Newest First" : "Oldest First"}
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100" menuVariant="light">
              {[{ label: "Newest First", value: "desc" }, { label: "Oldest First", value: "asc" }].map(({ label, value }) => {
                const isActive = sortOrder === value;
                return (
                  <Dropdown.Item
                    key={value}
                    active={isActive}
                    onClick={() => setSortOrder(value)}
                    style={{ backgroundColor: isActive ? "#e9ecef" : undefined, color: isActive ? "#000" : undefined }}
                  >
                    {label}
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {displayed.length === 0 ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: 100 }}>
          <p className="h5 text-muted mb-0">No reports to show.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="d-none d-md-block">
            <Table hover responsive>
              {/* ... table head and body as before ... */}
            </Table>
          </div>
          {/* Mobile Card List */}
          <div className="d-block d-md-none pt-1">
            <ListGroup variant="flush">
              {/* ... list items as before ... */}
            </ListGroup>
          </div>
        </>
      )}
    </Container>
  );
}
