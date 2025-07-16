import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Form,
  Pagination,
  Image,
  Alert,
  Modal,
} from "react-bootstrap";
import {
  getAdminDashboard,
  listReports,
  updateReportStatus,
} from "../../services/adminService";
import ReportDetailModal from "../../components/ReportDetailModal";
import styles from "./AdminPanelPage.module.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminPanelPage() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    fixed: 0,
    avgResolution: 0,
    typeDistribution: [],
  });
  const [reportsData, setReportsData] = useState({
    total: 0,
    page: 1,
    limit: 10,
    reports: [],
  });
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [error, setError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingReportId, setPendingReportId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    getAdminDashboard()
      .then(setStats)
      .catch(() => setError("Failed to load dashboard stats."));
  }, []);

  useEffect(() => {
    setReportsData((d) => ({ ...d, page: 1 }));
  }, [filters]);

  const refreshReports = useCallback(async () => {
    try {
      const data = await listReports({
        ...filters,
        page: reportsData.page,
        limit: reportsData.limit,
      });
      setReportsData(data);
    } catch {
      setError("Failed to load reports.");
    }
  }, [filters, reportsData.page, reportsData.limit]);

  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  const updateStatus = useCallback(
    async (id, status, reason) => {
      try {
        await updateReportStatus(id, status, reason);
        refreshReports();
      } catch {
        setError("Failed to update status.");
      }
    },
    [refreshReports]
  );

  const handleStatusSelect = (id, newStatus) => {
    if (newStatus === "Rejected") {
      setPendingReportId(id);
      setRejectReason("");
      setShowRejectModal(true);
    } else {
      updateStatus(id, newStatus, null);
    }
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) return;
    updateStatus(pendingReportId, "Rejected", rejectReason.trim());
    setShowRejectModal(false);
  };

  const getStatusVariant = (s) =>
    ({ Fixed: "success", "In Progress": "warning", Rejected: "danger" }[s] ||
    "secondary");
  const totalPages = Math.max(
    1,
    Math.ceil(reportsData.total / reportsData.limit)
  );

  const renderPageItems = () => {
    const items = [];
    const start = Math.max(1, reportsData.page - 2);
    const end = Math.min(totalPages, reportsData.page + 2);
    if (start > 1) items.push(<Pagination.Ellipsis key="start-ellipsis" />);
    for (let p = start; p <= end; p++) {
      items.push(
        <Pagination.Item
          key={p}
          active={p === reportsData.page}
          onClick={() => setReportsData((d) => ({ ...d, page: p }))}
        >
          {p}
        </Pagination.Item>
      );
    }
    if (end < totalPages)
      items.push(<Pagination.Ellipsis key="end-ellipsis" />);
    return items;
  };

  return (
    <Container fluid className="py-4">
      <h2>Admin Panel</h2>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Row className="g-3 mb-4">
        {[
          { label: "Total Reports", value: stats.total },
          { label: "Reports Pending", value: stats.pending },
          { label: "Reports Fixed", value: stats.fixed },
          { label: "Avg. Resolution (d)", value: stats.avgResolution },
        ].map((c, i) => (
          <Col key={i} xs={6} md={3}>
            <Card className="p-3 text-center">
              <h4>{c.value}</h4>
              <div>{c.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex align-items-center flex-wrap">
            <div className="me-3 mb-2 d-flex align-items-center">
              <Form.Label className="me-1 mb-0">Status:</Form.Label>
              <Form.Select
                size="sm"
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="all">Filter by Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Fixed">Fixed</option>
                <option value="Rejected">Rejected</option>
              </Form.Select>
            </div>
            <div className="me-3 mb-2 d-flex align-items-center">
              <Form.Label className="me-1 mb-0">Type:</Form.Label>
              <Form.Select
                size="sm"
                value={filters.type}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, type: e.target.value }))
                }
              >
                <option value="all">Filter by Type</option>
                <option value="Pothole">Pothole</option>
                <option value="Streetlight">Streetlight</option>
                <option value="Graffiti">Graffiti</option>
                <option value="Other">Other</option>
              </Form.Select>
            </div>
            <div className="me-3 mb-2 d-flex align-items-center">
              <Form.Label className="me-1 mb-0">Sort:</Form.Label>
              <Form.Select
                size="sm"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, sortBy: e.target.value }))
                }
              >
                <option value="createdAt">Created At</option>
                <option value="upvotes">Upvotes</option>
              </Form.Select>
            </div>
            <div className="me-3 mb-2 d-flex align-items-center">
              <Form.Label className="me-1 mb-0">Order:</Form.Label>
              <Form.Select
                size="sm"
                className="ms-2"
                value={filters.sortOrder}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, sortOrder: e.target.value }))
                }
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Form.Select>
            </div>
          </div>
        </Card.Header>
        <Table bordered hover responsive className="mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Images</th>
              <th>Type</th>
              <th>Location</th>
              <th>Reporter</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Created</th>
              <th>Upvotes</th>
              <th>Details</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reportsData.reports.map((r) => (
              <tr key={r._id}>
                <td className={styles.wrapCell}>{r._id}</td>
                <td>
                  {r.imageUrls?.length
                    ? r.imageUrls.map((url, idx) => (
                        <Image
                          key={idx}
                          src={`${BACKEND}${url}`}
                          thumbnail
                          style={{
                            width: 50,
                            height: 50,
                            objectFit: "cover",
                            marginRight: 4,
                          }}
                          className={styles.thumbnail}
                        />
                      ))
                    : "—"}
                </td>
                <td>{r.issueType}</td>
                <td className={styles.wrapCell}>📍 {r.address}</td>
                <td>{r.user?.name || "—"}</td>
                <td>
                  <Badge bg={getStatusVariant(r.status)}>{r.status}</Badge>
                </td>
                <td className={styles.wrapCell}>
                  {r.status === "Rejected" ? r.rejectReason : "—"}
                </td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>{r.upvoteCount ?? 0}</td>
                <td>
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => {
                      setSelectedReport(r);
                      setShowDetail(true);
                    }}
                  >
                    View
                  </Button>
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={r.status}
                    disabled={["Fixed", "Rejected"].includes(r.status)}
                    onChange={(e) => handleStatusSelect(r._id, e.target.value)}
                  >
                    {["Pending", "In Progress", "Fixed", "Rejected"].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                    )}
                  </Form.Select>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Card.Footer className="d-flex justify-content-center">
          <Pagination size="sm">
            <Pagination.First
              disabled={reportsData.page === 1}
              onClick={() => setReportsData((d) => ({ ...d, page: 1 }))}
            />
            <Pagination.Prev
              disabled={reportsData.page === 1}
              onClick={() =>
                setReportsData((d) => ({ ...d, page: d.page - 1 }))
              }
            />
            {renderPageItems()}
            <Pagination.Next
              disabled={reportsData.page >= totalPages}
              onClick={() =>
                setReportsData((d) => ({ ...d, page: d.page + 1 }))
              }
            />
            <Pagination.Last
              disabled={reportsData.page >= totalPages}
              onClick={() =>
                setReportsData((d) => ({ ...d, page: totalPages }))
              }
            />
          </Pagination>
        </Card.Footer>

        <Modal
          show={showRejectModal}
          onHide={() => setShowRejectModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Rejection Reason</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Why reject?</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowRejectModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!rejectReason.trim()}
              onClick={confirmReject}
            >
              Reject
            </Button>
          </Modal.Footer>
        </Modal>
      </Card>

      <Row className="g-4">
        <Col md={6}>
          <Card className="p-3">
            <h6>Issue Categories</h6>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.typeDistribution}>
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="p-3">
            <h6>Resolution Time Trend</h6>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={[
                  { month: "Jan", avg: 5.2 },
                  { month: "Feb", avg: 4.8 },
                  { month: "Mar", avg: 4.5 },
                  { month: "Apr", avg: 4.1 },
                  { month: "May", avg: 3.8 },
                  { month: "Jun", avg: 3.5 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <ReportDetailModal
        report={selectedReport}
        show={showDetail}
        onHide={() => setShowDetail(false)}
        onUpvote={() => {}}
        onAddComment={() => {}}
        userLocation={null}
        BACKEND={BACKEND}
        MAPBOX_TOKEN={null}
        disableComments={true}
      />
    </Container>
  );
}
