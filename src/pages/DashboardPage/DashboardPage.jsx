import React from 'react';
import styles from './Dashboard.module.css';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  // Sample data - replace with fetched API data later
  const reports = [
    { id: 1, issue: 'Pothole', status: 'Pending', date: '2025-06-10', location: 'Toronto, ON' },
    { id: 2, issue: 'Streetlight', status: 'In Progress', date: '2025-06-11', location: 'Mississauga, ON' },
    { id: 3, issue: 'Garbage Overflow', status: 'Resolved', date: '2025-06-12', location: 'Brampton, ON' },
  ];

  const statusCounts = {
    pending: reports.filter(r => r.status === 'Pending').length,
    progress: reports.filter(r => r.status === 'In Progress').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
  };

  return (
    <Container fluid className={styles.dashboardContainer}>
      <Row className="mb-4">
        <Col>
          <h2 className="text-center mt-4">Welcome to Your Dashboard</h2>
          <p className="text-center">Track your reported issues and their progress</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card bg="warning" text="white">
            <Card.Body>
              <Card.Title>Pending</Card.Title>
              <Card.Text>{statusCounts.pending}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="info" text="white">
            <Card.Body>
              <Card.Title>In Progress</Card.Title>
              <Card.Text>{statusCounts.progress}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="success" text="white">
            <Card.Body>
              <Card.Title>Resolved</Card.Title>
              <Card.Text>{statusCounts.resolved}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h4>My Reports</h4>
            <Link to="/submit">
              <Button variant="primary">+ Submit New Report</Button>
            </Link>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Issue</th>
                <th>Status</th>
                <th>Submitted On</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.issue}</td>
                  <td>{report.status}</td>
                  <td>{report.date}</td>
                  <td>{report.location}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}
