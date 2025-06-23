import { useState, useEffect } from 'react';
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
  Image
} from 'react-bootstrap';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import {
  getAdminDashboard,
  listReports,
  updateReportStatus
} from '../../services/adminService';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminPanelPage() {
  // Dashboard stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    fixed: 0,
    avgResolution: 0,
    typeDistribution: []
  });

  // Report list
  const [reportsData, setReportsData] = useState({
    total: 0,
    page: 1,
    limit: 10,
    reports: []
  });
  const [filters, setFilters] = useState({ status: 'all', type: 'all' });

  // Fetch stats once
  useEffect(() => {
    getAdminDashboard()
      .then(setStats)
      .catch(console.error);
  }, []);

  // Fetch reports when filters or page change
  useEffect(() => {
    listReports({ 
      status: filters.status, 
      type: filters.type, 
      page: reportsData.page, 
      limit: reportsData.limit 
    })
      .then(data => setReportsData(data))
      .catch(console.error);
  }, [filters, reportsData.page, reportsData.limit]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateReportStatus(id, newStatus);
      const data = await listReports({
        status: filters.status,
        type: filters.type,
        page: reportsData.page,
        limit: reportsData.limit
      });
      setReportsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(reportsData.total / reportsData.limit);

  return (
    <Container fluid className="py-4">
      <h2>Admin Panel</h2>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Total Reports',      value: stats.total },
          { label: 'Reports Pending',    value: stats.pending },
          { label: 'Reports Fixed',      value: stats.fixed },
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

      {/* Reports Table */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <Form.Select
              size="sm"
              className="me-2 d-inline-block w-auto"
              value={filters.status}
              onChange={e =>
                setFilters(f => ({ ...f, status: e.target.value }))
              }
            >
              {['all','Pending','In Progress','Fixed','Rejected'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Form.Select>
            <Form.Select
              size="sm"
              className="d-inline-block w-auto"
              value={filters.type}
              onChange={e =>
                setFilters(f => ({ ...f, type: e.target.value }))
              }
            >
              {['all','Pothole','Streetlight','Graffiti','Other'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Form.Select>
          </div>
          <div>Recent Reports</div>
        </Card.Header>

        <Table bordered hover responsive className="mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Type</th>
              <th>Description</th>
              <th>Location</th>
              <th>Reporter</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reportsData.reports.map((r, idx) => (
              <tr key={r._id}>
                <td>CR-{String(idx + 1).padStart(3, '0')}</td>
                <td>
                  {r.imageUrls?.[0] ? (
                    <Image
                      src={`${BACKEND}${r.imageUrls[0]}`}
                      thumbnail
                      style={{
                        width: 80,
                        height: 60,
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    '—'
                  )}
                </td>
                <td>{r.issueType}</td>
                <td style={{
                  maxWidth: 200,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {r.description}
                </td>
                <td>
                  {r.location?.coordinates
                    ? `${r.location.coordinates[1].toFixed(4)}, ${r.location.coordinates[0].toFixed(4)}`
                    : '—'}
                </td>
                <td>{r.user.name}</td>
                <td>
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <Badge bg={
                    r.status === 'Fixed'         ? 'success' :
                    r.status === 'In Progress'   ? 'warning' :
                    r.status === 'Rejected'     ? 'danger' :
                    'secondary'
                  }>
                    {r.status}
                  </Badge>
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={r.status}
                    onChange={e =>
                      handleStatusChange(r._id, e.target.value)
                    }
                  >
                    {['Pending','In Progress','Fixed','Rejected'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Form.Select>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Card.Footer className="d-flex justify-content-center">
          <Pagination size="sm">
            {Array.from({ length: totalPages }, (_, i) => (
              <Pagination.Item
                key={i + 1}
                active={i + 1 === reportsData.page}
                onClick={() =>
                  setReportsData(d => ({ ...d, page: i + 1 }))
                }
              >
                {i + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </Card.Footer>
      </Card>

      {/* Charts */}
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
    </Container>
  );
}
