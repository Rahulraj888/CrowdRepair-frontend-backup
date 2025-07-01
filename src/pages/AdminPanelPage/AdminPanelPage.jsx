import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Pagination, Image, Alert, Modal } from 'react-bootstrap';
import { getAdminDashboard, listReports, updateReportStatus } from '../../services/adminService';
import ReportDetailModal from '../../components/ReportDetailModal';
import styles from './AdminPanelPage.module.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminPanelPage() {
  // Dashboard stats
  const [stats, setStats] = useState({ total: 0, pending: 0, fixed: 0, avgResolution: 0, typeDistribution: [] });

  // Reports + pagination
  const [reportsData, setReportsData] = useState({ total: 0, page: 1, limit: 10, reports: [] });
  const [filters, setFilters] = useState({ status: 'all', type: 'all' });
  const [error, setError] = useState('');

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingReportId, setPendingReportId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Detail modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Fetch stats
  useEffect(() => {
    getAdminDashboard()
      .then(setStats)
      .catch(() => setError('Failed to load dashboard stats.'));
  }, []);

  // Refresh reports helper
  const refreshReports = useCallback(async () => {
    try {
      const data = await listReports({ ...filters, page: reportsData.page, limit: reportsData.limit });
      setReportsData(data);
    } catch {
      setError('Failed to load reports.');
    }
  }, [filters, reportsData.page, reportsData.limit]);

  // Fetch reports on filter/page change
  useEffect(() => { refreshReports(); }, [refreshReports]);

  // Update status
  const updateStatus = useCallback(async (id, status, reason) => {
    try {
      await updateReportStatus(id, status, reason);
      refreshReports();
    } catch {
      setError('Failed to update status.');
    }
  }, [refreshReports]);

  const handleStatusSelect = (id, newStatus) => {
    if (newStatus === 'Rejected') {
      setPendingReportId(id);
      setRejectReason('');
      setShowRejectModal(true);
    } else {
      updateStatus(id, newStatus, null);
    }
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) return;
    updateStatus(pendingReportId, 'Rejected', rejectReason.trim());
    setShowRejectModal(false);
  };

  const getStatusVariant = s => ({ Fixed: 'success', 'In Progress': 'warning', Rejected: 'danger' }[s] || 'secondary');
  const totalPages = Math.ceil(reportsData.total / reportsData.limit);

  return (
    <Container fluid className="py-4">
      <h2>Admin Panel</h2>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Total Reports', value: stats.total },
          { label: 'Reports Pending', value: stats.pending },
          { label: 'Reports Fixed', value: stats.fixed },
          { label: 'Avg. Resolution (d)', value: stats.avgResolution }
        ].map((c, i) => (
          <Col key={i} xs={6} md={3}>
            <Card className="p-3 text-center">
              <h4>{c.value}</h4>
              <div>{c.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters and header */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <Form.Select size="sm" className="me-2 d-inline-block w-auto" value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              {['all','Pending','In Progress','Fixed','Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
            </Form.Select>
            <Form.Select size="sm" className="d-inline-block w-auto" value={filters.type}
              onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
              {['all','Pothole','Streetlight','Graffiti','Other'].map(t => <option key={t} value={t}>{t}</option>)}
            </Form.Select>
          </div>
          <div>Recent Reports</div>
        </Card.Header>

        <Table bordered hover responsive className="mb-0">
          <thead>
            <tr>
              <th>ID</th><th>Images</th><th>Type</th>
              <th>Location</th><th>Reporter</th><th>Status</th>
              <th>Reason</th><th>Details</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reportsData.reports.map(r => (
              <tr key={r._id}>
                <td className={styles.wrapCell}>{r._id}</td>
                <td>
                  {r.imageUrls?.length > 0
                    ? r.imageUrls.map((url,idx) => (
                        <Image key={idx} src={`${BACKEND}${url}`} className={styles.thumbnail}
                          thumbnail style={{ width: 50, height:50, objectFit:'cover', marginRight:4 }} />
                      ))
                    : '—'
                  }
                </td>
                <td>{r.issueType}</td>
                {/* <td className={styles.wrapCell}>{r.description}</td> */}
                <td className={styles.wrapCell}>📍 {r.address}</td>
                <td>{r.user.name}</td>
                {/* <td>{new Date(r.createdAt).toLocaleDateString()}</td> */}
                <td><Badge bg={getStatusVariant(r.status)}>{r.status}</Badge></td>
                <td className={styles.wrapCell}>{r.status==='Rejected'?r.rejectReason:'—'}</td>
                <td>
                  <Button size="sm" variant="link" onClick={() => { setSelectedReport(r); setShowDetail(true); }}>
                    View
                  </Button>
                </td>
                <td>
                  <Form.Select size="sm" value={r.status}
                    onChange={e => handleStatusSelect(r._id, e.target.value)}>
                    {['Pending','In Progress','Fixed','Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                  </Form.Select>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Card.Footer className="d-flex justify-content-center">
          <Pagination size="sm">
            <Pagination.First disabled={reportsData.page===1} onClick={() => setReportsData(d => ({ ...d, page:1 }))} />
            <Pagination.Prev disabled={reportsData.page===1} onClick={() => setReportsData(d => ({ ...d, page:d.page-1 }))} />
            {Array.from({ length: totalPages }, (_,i) => (
              <Pagination.Item key={i+1} active={i+1===reportsData.page}
                onClick={() => setReportsData(d => ({ ...d, page:i+1 }))}>
                {i+1}
              </Pagination.Item>
            ))}
            <Pagination.Next disabled={reportsData.page===totalPages} onClick={() => setReportsData(d => ({ ...d, page:d.page+1 }))} />
            <Pagination.Last disabled={reportsData.page===totalPages} onClick={() => setReportsData(d => ({ ...d, page:totalPages }))} />
          </Pagination>
        </Card.Footer>

        {/* Rejection Modal */}
        <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Rejection Reason</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Why reject?</Form.Label>
              <Form.Control as="textarea" rows={3} value={rejectReason}
                onChange={e => setRejectReason(e.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button variant="danger" disabled={!rejectReason.trim()} onClick={confirmReject}>Reject</Button>
          </Modal.Footer>
        </Modal>

      </Card>

      {/* Charts Section */}
      <Row className="g-4">
        <Col md={6}>
          <Card className="p-3">
            <h6>Issue Categories</h6>
            <BarChart width={300} height={200} data={stats.typeDistribution}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="p-3">
            <h6>Resolution Time Trend</h6>
            <LineChart
              width={300}
              height={200}
              data={[
                { month: 'Jan', avg: 5.2 },
                { month: 'Feb', avg: 4.8 },
                { month: 'Mar', avg: 4.5 },
                { month: 'Apr', avg: 4.1 },
                { month: 'May', avg: 3.8 },
                { month: 'Jun', avg: 3.5 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avg" stroke="#82ca9d" />
            </LineChart>
          </Card>
        </Col>
      </Row>

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
    </Container>
  );
}
