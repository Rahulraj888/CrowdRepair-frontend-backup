// src/pages/MyReportsPage/MyReportsPage.jsx

import { useState, useEffect, useContext, useMemo } from "react";
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
  Alert,
} from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import { getReports, deleteReport } from "../../services/reportService";

// Banner asset
import bannerImg from "/my-reports.png";

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
  const [deletingIds, setDeletingIds] = useState(new Set());

  useEffect(() => {
    if (!userId) return setLoading(false);
    (async () => {
      try {
        const all = await getReports({ status: "all", type: "all" });
        setMyReports(all.filter((r) => r.user === userId));
      } catch (err) {
        console.error(err);
        setError("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    setError("");
    setDeletingIds((s) => new Set(s).add(id));
    try {
      await deleteReport(id);
      setMyReports((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error(err);
      setError("Delete failed.");
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  const getStatusVariant = (status) =>
    ({ Fixed: "success", "In Progress": "warning", Rejected: "danger" }[status] ||
      "secondary");

  const displayed = useMemo(() => {
    return myReports
      .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))
      .filter((r) => (typeFilter === "all" ? true : r.issueType === typeFilter))
      .sort((a, b) => {
        const da = new Date(a.createdAt),
          db = new Date(b.createdAt);
        return sortOrder === "asc" ? da - db : db - da;
      });
  }, [myReports, statusFilter, typeFilter, sortOrder]);

  const formatIssueId = (idx) => `CR-${String(idx + 1).padStart(3, "0")}`;

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

      {/* —— Constrained Banner —— */}
      <div
        className="mb-4 rounded"
        style={{
          width: "100%",
          // maxHeight: "450px",
          height:"100%",
          overflow: "hidden",
          backgroundColor: "#f5f5f5",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          src={bannerImg}
          alt="Thank you for reporting"
          style={{
            width: "auto",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

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

      {displayed.length === 0 ? (
        <div className="text-center my-5">
          <p className="lead">You haven’t submitted any reports yet.</p>
          <Button onClick={() => navigate("/report/new")}>
            Submit Your First Report
          </Button>
        </div>
      ) : (
        <>
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
                {displayed.map((r, idx) => (
                  <tr key={r._id}>
                    <td>{formatIssueId(idx)}</td>
                    <td>
                      {r.imageUrls?.[0] ? (
                        <Image
                          src={`${BACKEND}${r.imageUrls[0]}`}
                          alt={`Photo of ${r.issueType} — ${formatIssueId(idx)}`}
                          thumbnail
                          style={{
                            width: 80,
                            height: 60,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        "–"
                      )}
                    </td>
                    <td>{r.issueType}</td>
                    <td
                      style={{
                        maxWidth: 200,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.description}
                    </td>
                    <td>
                      {r.location.coordinates
                        ? `${r.location.coordinates[1].toFixed(4)}, ${
                            r.location.coordinates[0].toFixed(4)
                          }`
                        : "–"}
                    </td>
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
                            disabled={deletingIds.has(r._id)}
                            onClick={() => handleDelete(r._id)}
                          >
                            {deletingIds.has(r._id) ? (
                              <Spinner as="span" size="sm" />
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="d-block d-md-none">
            <ListGroup variant="flush">
              {displayed.map((r, idx) => (
                <ListGroup.Item key={r._id} className="py-3">
                  <Row>
                    <Col xs={4}>
                      {r.imageUrls?.[0] && (
                        <Image
                          src={`${BACKEND}${r.imageUrls[0]}`}
                          alt={`Photo of ${r.issueType} — ${formatIssueId(
                            idx
                          )}`}
                          thumbnail
                          style={{
                            width: "100%",
                            height: 100,
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </Col>
                    <Col xs={8}>
                      <div className="d-flex justify-content-between">
                        <strong>{formatIssueId(idx)}</strong>
                        <Badge bg={getStatusVariant(r.status)}>
                          {r.status}
                        </Badge>
                      </div>
                      <div className="mt-1">
                        <strong>{r.issueType}</strong>
                      </div>
                      <div className="small text-truncate">
                        {r.description}
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
                              onClick={() =>
                                navigate(`/report/${r._id}/edit`)
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              disabled={deletingIds.has(r._id)}
                              onClick={() => handleDelete(r._id)}
                            >
                              {deletingIds.has(r._id) ? (
                                <Spinner as="span" size="sm" />
                              ) : (
                                "Delete"
                              )}
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
        </>
      )}
    </Container>
  );
}
