import { useState, useEffect, useContext } from "react";
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
  Form,
  Button,
} from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import {
  getReports,
  deleteReport,
} from "../../services/reportService";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MyReportsPage() {
  const { user } = useContext(AuthContext);
  const userId = user?._id;
  const navigate = useNavigate();

  const [myReports, setMyReports]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter]     = useState("all");
  const [sortOrder, setSortOrder]       = useState("desc"); // 'desc' = newest first

  // Load all of the user's reports once
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const all = await getReports({ status: "all", type: "all" });
        setMyReports(all.filter((r) => r.user === userId));
      } catch (err) {
        console.error("Error loading your reports:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Delete handler (only for pending)
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await deleteReport(id);
      setMyReports((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete.");
    }
  };

  // Apply filters + sort
  const displayed = myReports
    .filter((r) =>
      statusFilter === "all" ? true : r.status === statusFilter
    )
    .filter((r) =>
      typeFilter === "all" ? true : r.issueType === typeFilter
    )
    .sort((a, b) => {
      const da = new Date(a.createdAt),
            db = new Date(b.createdAt);
      return sortOrder === "asc" ? da - db : db - da;
    });

  const formatIssueId = (i) => `CR-${String(i + 1).padStart(3, "0")}`;

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

      {/* Filters + Sort */}
      <Row className="mb-3 gx-2">
        <Col xs={12} md={4}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {["all", "Pending", "In Progress", "Fixed", "Rejected"].map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Statuses" : s}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={12} md={4}>
          <Form.Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {["all", "Pothole", "Streetlight", "Graffiti", "Other"].map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All Types" : t}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={12} md={4}>
          <Form.Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </Form.Select>
        </Col>
      </Row>

      {displayed.length === 0 && <p>No reports to show.</p>}

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
            {displayed.map((r, i) => (
              <tr key={r._id}>
                <td>{formatIssueId(i)}</td>
                <td>
                  {r.imageUrls?.[0] ? (
                    <Image
                      src={`${BACKEND}${r.imageUrls[0]}`}
                      thumbnail
                      style={{ width: 80, height: 60, objectFit: "cover" }}
                    />
                  ) : "–"}
                </td>
                <td>{r.issueType}</td>
                <td style={{
                    maxWidth: 200,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                  {r.description}
                </td>
                <td>
                  {r.location.coordinates
                    ? `${r.location.coordinates[1].toFixed(4)}, ${r.location.coordinates[0].toFixed(4)}`
                    : "–"}
                </td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>
                  <Badge bg={
                    r.status === "Fixed" ? "success" :
                    r.status === "In Progress" ? "warning" :
                    r.status === "Rejected" ? "danger" :
                    "secondary"
                  }>
                    {r.status}
                  </Badge>
                </td>
                <td>
                  {r.status === "Pending" && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-2"
                      onClick={() => navigate(`/report/${r._id}/edit`)}
                    >
                      Edit
                    </Button>
                  )}
                  {r.status === "Pending" && (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(r._id)}
                    >
                      Delete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <div className="d-block d-md-none">
        <ListGroup variant="flush">
          {displayed.map((r, i) => (
            <ListGroup.Item key={r._id} className="py-3">
              <Row>
                <Col xs={4}>
                  {r.imageUrls?.[0] && (
                    <Image
                      src={`${BACKEND}${r.imageUrls[0]}`}
                      thumbnail
                      style={{ width: "100%", height: 100, objectFit: "cover" }}
                    />
                  )}
                </Col>
                <Col xs={8}>
                  <div className="d-flex justify-content-between">
                    <strong>{formatIssueId(i)}</strong>
                    <Badge bg={
                      r.status === "Fixed" ? "success" :
                      r.status === "In Progress" ? "warning" :
                      r.status === "Rejected" ? "danger" :
                      "secondary"
                    }>
                      {r.status}
                    </Badge>
                  </div>
                  <div className="mt-1"><strong>{r.issueType}</strong></div>
                  <div className="small text-truncate">{r.description}</div>
                  <div className="text-muted small mt-1">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                  <div className="mt-2 d-flex gap-2">
                    {r.status === "Pending" && (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => navigate(`/report/${r._id}/edit`)}
                      >
                        Edit
                      </Button>
                    )}
                    {r.status === "Pending" && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(r._id)}
                      >
                        Delete
                      </Button>
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
