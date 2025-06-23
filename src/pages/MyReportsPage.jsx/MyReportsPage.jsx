// src/pages/MyReportsPage.jsx
import { useState, useEffect, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Image,
  Spinner,
  ListGroup,
} from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import { getReports } from "../../services/reportService";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MyReportsPage() {
  const { user } = useContext(AuthContext);
  const userId = user?._id;
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // load your reports
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const all = await getReports({ status: "all", type: "all" });
        setMyReports(all.filter((r) => r.user === userId));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!myReports.length) {
    return (
      <Container className="py-4">
        <h2>My Reports</h2>
        <p>You haven’t submitted any reports yet.</p>
      </Container>
    );
  }

  const formatIssueId = (idx) => `CR-${String(idx + 1).padStart(3, "0")}`;

  return (
    <Container fluid className="py-4">
      <h2>My Reports</h2>

      {/* ----- DESKTOP TABLE (md and up) ----- */}
      <div className="d-none d-md-block">
        <Table responsive hover className="mt-3">
          <thead>
            <tr>
              <th>Issue ID</th>
              <th>Image</th>
              <th>Type</th>
              <th>Description</th>
              <th>Location</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myReports.map((r, idx) => (
              <tr key={r._id}>
                <td>{formatIssueId(idx)}</td>
                <td>
                  {r.imageUrls?.[0] ? (
                    <Image
                      src={`${BACKEND}${r.imageUrls[0]}`}
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
                    ? `${r.location.coordinates[1].toFixed(
                        4
                      )}, ${r.location.coordinates[0].toFixed(4)}`
                    : "–"}
                </td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>
                  <Badge
                    bg={
                      r.status === "Fixed"
                        ? "success"
                        : r.status === "In Progress"
                        ? "warning"
                        : r.status === "Rejected"
                        ? "danger"
                        : "secondary"
                    }
                  >
                    {r.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* ----- MOBILE CARD LIST (sm only) ----- */}
      <div className="d-block d-md-none">
        <ListGroup variant="flush" className="mt-3">
          {myReports.map((r, idx) => (
            <ListGroup.Item key={r._id} className="py-3">
              <Row>
                <Col xs={4}>
                  {r.imageUrls?.[0] && (
                    <Image
                      src={`${BACKEND}${r.imageUrls[0]}`}
                      thumbnail
                      style={{
                        width: "100%",
                        height: "100px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </Col>
                <Col xs={8}>
                  <div className="d-flex justify-content-between align-items-start">
                    <strong>{formatIssueId(idx)}</strong>
                    <Badge
                      bg={
                        r.status === "Fixed"
                          ? "success"
                          : r.status === "In Progress"
                          ? "warning"
                          : r.status === "Rejected"
                          ? "danger"
                          : "secondary"
                      }
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <div className="mt-1">
                    <strong>{r.issueType}</strong>
                  </div>
                  <div className="small text-truncate">{r.description}</div>
                  <div className="text-muted small mt-1">
                    {new Date(r.createdAt).toLocaleDateString()}
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
