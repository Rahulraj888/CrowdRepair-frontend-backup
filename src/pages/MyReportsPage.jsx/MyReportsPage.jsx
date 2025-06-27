import { useState, useEffect, useContext, useMemo, useCallback } from "react";
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
} from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import { getReports, deleteReport } from "../../services/reportService";
import styles from "./MyReportsPage.module.css";

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

  // Fetch whenever filters change
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    getReports({ status: statusFilter, type: typeFilter })
      .then(all => {
        setMyReports(all.filter(r => r.user === userId));
      })
      .catch(err => {
        console.error("Error loading reports:", err);
        setError("Failed to load reports.");
      })
      .finally(() => setLoading(false));
  }, [userId, statusFilter, typeFilter]);

  // Delete handler
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
    []
  );

  const getStatusVariant = status =>
    ({ Fixed: "success", "In Progress": "warning", Rejected: "danger" }[status] ||
      "secondary");

  // Memoized, sorted + filtered list
  const displayed = useMemo(() => {
    return myReports
      .filter(r => (statusFilter === "all" ? true : r.status === statusFilter))
      .filter(r => (typeFilter   === "all" ? true : r.issueType === typeFilter))
      .sort((a, b) => {
        const da = new Date(a.createdAt),
              db = new Date(b.createdAt);
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
      <h2>My Reports</h2>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Filters + Sort */}
      <Row className="mb-3 gx-2">
        {/* Status Dropdown */}
        <Col xs={12} md={4}>
          <Dropdown as={ButtonGroup} className="w-100">
            <Dropdown.Toggle
              variant="outline-secondary"
              className="w-100 text-start"
              id="status-dropdown"
            >
              {statusFilter === "all" ? "All Statuses" : statusFilter}
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
              {["all", "Pending", "In Progress", "Fixed", "Rejected"].map(s => (
                <Dropdown.Item
                  key={s}
                  active={s === statusFilter}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "all" ? "All Statuses" : s}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>

        {/* Type Dropdown */}
        <Col xs={12} md={4}>
          <Dropdown as={ButtonGroup} className="w-100">
            <Dropdown.Toggle
              variant="outline-secondary"
              className="w-100 text-start"
              id="type-dropdown"
            >
              {typeFilter === "all" ? "All Types" : typeFilter}
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
              {["all", "Pothole", "Streetlight", "Graffiti", "Other"].map(t => (
                <Dropdown.Item
                  key={t}
                  active={t === typeFilter}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === "all" ? "All Types" : t}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>

        {/* Sort Dropdown */}
        <Col xs={12} md={4}>
          <Dropdown as={ButtonGroup} className="w-100">
            <Dropdown.Toggle
              variant="outline-secondary"
              className="w-100 text-start"
              id="sort-dropdown"
            >
              {sortOrder === "desc" ? "Newest First" : "Oldest First"}
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
              <Dropdown.Item
                active={sortOrder === "desc"}
                onClick={() => setSortOrder("desc")}
              >
                Newest First
              </Dropdown.Item>
              <Dropdown.Item
                active={sortOrder === "asc"}
                onClick={() => setSortOrder("asc")}
              >
                Oldest First
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {displayed.length === 0 && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "100px" }}
        >
          <p className="h5 text-muted mb-0">No reports to show.</p>
        </div>
      )}

      {/* Desktop Table */}
      <div className="d-none d-md-block">
        <Table hover responsive>
          <thead>
            <tr>
              <th>Issue ID</th>
              <th>Image</th>
              <th>Type</th>
              <th>Description</th>
              <th>Location</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(r => (
              <tr key={r._id}>
                <td>{r._id}</td>
                <td>
                  {r.imageUrls?.[0] ? (
                    <Image
                      src={`${BACKEND}${r.imageUrls[0]}`}
                      alt={r.issueType}
                      thumbnail
                      style={{ width: 80, height: 60, objectFit: "cover" }}
                    />
                  ) : (
                    "–"
                  )}
                </td>
                <td>{r.issueType}</td>
                <td className={styles.wrapCell}>{r.description}</td>
                <td className={styles.wrapCell}>📍{r.address}</td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>
                  <Badge bg={getStatusVariant(r.status)}>
                    {r.status}
                  </Badge>
                </td>
                <td>
                  {r.status === "Pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                        onClick={() => navigate(`/report/${r._id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(r._id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <div className="d-block d-md-none pt-1">
        <ListGroup variant="flush">
          {displayed.map(r => (
            <ListGroup.Item key={r._id} className="py-3">
              <Row>
                <Col xs={4}>
                  {r.imageUrls?.[0] && (
                    <Image
                      src={`${BACKEND}${r.imageUrls[0]}`}
                      alt={r.issueType}
                      thumbnail
                      style={{ width: "100%", height: 100, objectFit: "cover" }}
                    />
                  )}
                </Col>
                <Col xs={8}>
                  <div className="d-flex align-items-center">
                    <strong
                      className="text-truncate"
                      style={{ flex: "1 1 auto", minWidth: 0 }}
                    >
                      {r._id}
                    </strong>
                    <Badge
                      bg={getStatusVariant(r.status)}
                      className="ms-2 flex-shrink-0"
                    >
                      {r.status}
                    </Badge>
                  </div>

                  <div className="mt-1">
                    <strong>{r.issueType}</strong>
                  </div>
                  <div className={`small ${styles.clamp2}`}>
                    {r.description}
                  </div>
                  <div className={`small mt-1 ${styles.twoLineCell}`}>
                    📍 {r.address}
                  </div>
                  <div className="text-muted small mt-1">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                  <div className="mt-2 d-flex gap-2">
                    {r.status === "Pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => navigate(`/report/${r._id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(r._id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </Col>
              </Row>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
    </Container>
  );
}
