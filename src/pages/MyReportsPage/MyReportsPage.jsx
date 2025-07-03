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
  Pagination,
} from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import { getReports, deleteReport } from "../../services/reportService";
import styles from "./MyReportsPage.module.css";
import ReportDetailModal from "../../components/ReportDetailModal";

const BANNER_SRC = "/my-reports.png";
const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PAGE_LIMIT = 5;

// Hook: filter and sort reports
function useFilteredSortedReports(reports, status, type, sortOrder) {
  return useMemo(() => {
    return reports
      .filter(r => status === "all" || r.status === status)
      .filter(r => type === "all" || r.issueType === type)
      .sort((a, b) => {
        const da = new Date(a.createdAt), db = new Date(b.createdAt);
        return sortOrder === "asc" ? da - db : db - da;
      });
  }, [reports, status, type, sortOrder]);
}

// Component: stats cards row
function StatsCards({ stats }) {
  const config = [
    { key: 'total', label: 'Total', value: stats.total, shadowClass: 'shadow-blue', textColor: '#0d6efd' },
    { key: 'fixed', label: 'Fixed', value: stats.fixed, shadowClass: 'shadow-green', textColor: '#198754' },
    { key: 'pending', label: 'Pending', value: stats.pending, shadowClass: 'shadow-yellow', textColor: '#ffc107' },
    { key: 'inProgress', label: 'In Progress', value: stats.inProgress, shadowClass: 'shadow-cyan', textColor: '#0dcaf0' },
    { key: 'rejected', label: 'Rejected', value: stats.rejected, shadowClass: 'shadow-red', textColor: '#dc3545' },
  ];
  
  
    return (
  <Row className="gx-3 gy-3 justify-content-center">
  
    {config.map(c => (
      <Col key={c.key} xs={6} sm={6} md={2} className="mb-3">
        <Card className={`text-center ${styles.statusCard} ${styles[c.shadowClass]} w-100`}>
          <Card.Body className="py-3">
            <Card.Title className="text-muted">{c.label}</Card.Title>
            <div className={styles.numberBadge} style={{ color: c.textColor }}>
              {c.value}
            </div>
          </Card.Body>
        </Card>
      </Col>
    ))}
  </Row>
  
    );
  }
  

// Get Bootstrap variant for status badge
function getStatusVariant(status) {
  return ({ Fixed: 'success', 'In Progress': 'warning', Rejected: 'danger' }[status] || 'secondary');
}

export default function MyReportsPage() {
  const { user } = useContext(AuthContext);
  const userId = user?._id;
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Reset to first page when filters or sort change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, sortOrder]);

  // Fetch user's reports
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    getReports({ status: statusFilter, type: typeFilter })
      .then(all => setReports(all.filter(r => r.user._id === userId)))
      .catch(err => {
        console.error(err);
        setError("Failed to load reports.");
      })
      .finally(() => setLoading(false));
  }, [userId, statusFilter, typeFilter]);

  // Derive stats
  const stats = useMemo(() => {
    const total = reports.length;
    const fixed = reports.filter(r => r.status === 'Fixed').length;
    const pending = reports.filter(r => r.status === 'Pending').length;
    const inProgress = reports.filter(r => r.status === 'In Progress').length;
    const rejected = reports.filter(r => r.status === 'Rejected').length;
    return { total, fixed, pending, inProgress, rejected };
  }, [reports]);

  // Delete handler
  const handleDelete = useCallback(async id => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await deleteReport(id);
      setReports(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete.");
    }
  }, []);

  // Filter, sort, and paginate
  const filtered = useFilteredSortedReports(reports, statusFilter, typeFilter, sortOrder);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_LIMIT));
  const paginated = filtered.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Banner */}
      <div className="d-none d-md-flex justify-content-center mb-4">
        <Image src={BANNER_SRC} alt="Thank you for reporting" fluid className={styles.banner} />
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      <h2>My Reports</h2>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>
      )}

      {/* Filters & Sort */}
      <Row className="mb-3 gx-2">
      <Col xs={12} md={4}>
        <Dropdown as={ButtonGroup} className="w-100">
          <Dropdown.Toggle variant="light" className="w-100 text-start border">
            {statusFilter === 'all' ? 'All Statuses' : statusFilter}
          </Dropdown.Toggle>
          <Dropdown.Menu className="w-100">
            {['all','Pending','In Progress','Fixed','Rejected'].map(s => (
              <Dropdown.Item key={s} active={s===statusFilter} onClick={() => setStatusFilter(s)}>
                {s==='all'? 'All Statuses': s}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </Col>
      <Col xs={12} md={4}>
        <Dropdown as={ButtonGroup} className="w-100">
          <Dropdown.Toggle variant="light" className="w-100 text-start border">
            {typeFilter === 'all' ? 'All Types' : typeFilter}
          </Dropdown.Toggle>
          <Dropdown.Menu className="w-100">
            {['all','Pothole','Streetlight','Graffiti','Other'].map(t => (
              <Dropdown.Item key={t} active={t===typeFilter} onClick={() => setTypeFilter(t)}>
                {t==='all'? 'All Types': t}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </Col>
      <Col xs={12} md={4}>
        <Dropdown as={ButtonGroup} className="w-100">
          <Dropdown.Toggle variant="light" className="w-100 text-start border">
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Dropdown.Toggle>
          <Dropdown.Menu className="w-100">
            {[{label:'Newest First',value:'desc'},{label:'Oldest First',value:'asc'}].map(o => (
              <Dropdown.Item key={o.value} active={o.value===sortOrder} onClick={() => setSortOrder(o.value)}>
                {o.label}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </Col>
    </Row>

      {/* No results */}
      {filtered.length === 0 ? (
        <div className="text-center py-4 text-muted">No reports to show.</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="d-none d-md-block">
            <Table hover responsive>
              <thead>
                <tr>
                  <th>ID</th><th>Image</th><th>Type</th><th>Location</th>
                  <th>Date</th><th>Status</th><th>Details</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => (
                  <tr key={r._id}>
                    <td>{r._id}</td>
                    <td>{r.imageUrls?.[0]
                      ? <Image src={`${BACKEND}${r.imageUrls[0]}`} thumbnail style={{ width: 80, height: 60, objectFit: 'cover' }} />
                      : '—'}
                    </td>
                    <td><strong>{r.issueType}</strong></td>
                    <td className={styles.wrapCell}>📍 {r.address}</td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><Badge bg={getStatusVariant(r.status)}>{r.status}</Badge></td>
                    <td>
                      <Button variant="link" size="sm" onClick={() => { setSelectedReport(r); setShowDetail(true); }}>View</Button>
                    </td>
                    <td>
                      {r.status === 'Pending' && (
                        <>
                          <Button size="sm" variant="outline-primary" className="me-2" onClick={() => navigate(`/report/${r._id}/edit`)}>Edit</Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDelete(r._id)}>Delete</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination Control */}
            <div className="d-flex justify-content-center mt-3">
              <Pagination size="sm">
                <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
                <Pagination.Prev disabled={page === 1} onClick={() => setPage(p => p - 1)} />
                {Array.from({ length: totalPages }, (_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === page}
                    onClick={() => setPage(i + 1)}
                  >{i + 1}</Pagination.Item>
                ))}
                <Pagination.Next disabled={page === totalPages} onClick={() => setPage(p => p + 1)} />
                <Pagination.Last disabled={page === totalPages} onClick={() => setPage(totalPages)} />
              </Pagination>
            </div>
          </div>

          {/* Mobile List */}
          <div className="d-block d-md-none">
            <ListGroup variant="flush">
              {paginated.map(r => (
                <ListGroup.Item
                  key={r._id}
                  className="py-3"
                  onClick={() => { setSelectedReport(r); setShowDetail(true); }}
                  style={{ cursor: 'pointer' }}
                >
                  <Row>
                    <Col xs={4}>
                      {r.imageUrls?.[0] && (
                        <Image
                          src={`${BACKEND}${r.imageUrls[0]}`}
                          fluid
                          thumbnail
                          style={{ height: 100, objectFit: 'cover' }}
                        />
                      )}
                    </Col>
                    <Col xs={8}>
                      <div className="d-flex align-items-center">
                        <strong className="text-truncate" style={{ flex:'1 1 auto', minWidth:0 }}>{r._id}</strong>
                        <Badge bg={getStatusVariant(r.status)} className="ms-2">{r.status}</Badge>
                      </div>
                      <div className="mt-1"><strong>{r.issueType}</strong></div>
                      <div className={`small mt-1 ${styles.twoLineCell}`}>📍 {r.address}</div>
                      <div className="text-muted small mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
                      <div className="mt-2 d-flex gap-2">
                        <Button size="sm" variant="outline-primary" onClick={() => setSelectedReport(r)}>View Details</Button>
                      </div>
                      {r.status === 'Pending' && (
                        <div className="mt-2 d-flex gap-2">
                          <Button size="sm" variant="outline-primary" onClick={() => navigate(`/report/${r._id}/edit`)}>Edit</Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDelete(r._id)}>Delete</Button>
                        </div>
                      )}
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>

            {/* Mobile Pagination */}
            <div className="d-flex justify-content-center mt-2">
              <Pagination size="sm">
                <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
                <Pagination.Prev disabled={page === 1} onClick={() => setPage(p => p - 1)} />
                {Array.from({ length: totalPages }, (_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === page}
                    onClick={() => setPage(i + 1)}
                  >{i + 1}</Pagination.Item>
                ))}
                <Pagination.Next disabled={page === totalPages} onClick={() => setPage(p => p + 1)} />
                <Pagination.Last disabled={page === totalPages} onClick={() => setPage(totalPages)} />
              </Pagination>
            </div>
          </div>

          {/* Detail Modal */}
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
        </>
      )}
    </Container>
  );
}
