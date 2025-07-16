import React, { useState, useEffect, useContext } from "react";
import { Button, Image, ListGroup } from "react-bootstrap";
import ReportDetailModal from "../../components/ReportDetailModal";
import { haversineDistance } from "../../utils/haversine";
import { timeAgo } from "../../utils/timeAgo";
import { AuthContext } from "../../context/AuthContext";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const STATUS_COLORS = {
  Pending: "#f39c12",
  "In Progress": "#3498db",
  Fixed: "#2ecc71",
};

export default function ReportListItem({ report, onUpvote, onAddComment, userLocation }) {
  const [showDetail, setShowDetail] = useState(false);
  const [address, setAddress] = useState(null);
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';  // adjust if your user object uses a different flag

  useEffect(() => {
    const [lng, lat] = report.location.coordinates;
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.features?.[0]) setAddress(d.features[0].place_name);
      })
      .catch(() => {});
  }, [report.location.coordinates]);

  const distance = userLocation
    ? haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        report.location.coordinates[1],
        report.location.coordinates[0]
      ).toFixed(1)
    : null;

  return (
    <>
      <ListGroup.Item className="py-3">
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex">
            {report.imageUrls?.[0] && (
              <Image
                src={`${BACKEND}${report.imageUrls[0]}`}
                thumbnail
                style={{ width: 80, height: 60, objectFit: "cover" }}
                className="me-3"
              />
            )}
            <div>
              <strong>{report.issueType}</strong>
              <div className="text-muted small">
                {timeAgo(report.createdAt)}
                {distance && ` • ${distance}km away`}
              </div>
              <p className="mt-1 small">{report.description}</p>
              {address && <p className="mt-1 small">{address}</p>}
            </div>
          </div>

          <span
            style={{
              backgroundColor: STATUS_COLORS[report.status] || "#6c757d",
              color: "#fff",
              padding: "0.25em 0.5em",
              borderRadius: "0.25rem",
              fontSize: "0.8em",
            }}
          >
            {report.status}
          </span>
        </div>

        <div className="mt-2 d-flex gap-3">
          {/* Everyone can view details */}
          <Button variant="link" size="sm" onClick={() => setShowDetail(true)}>
            View Details
          </Button>

          {/* Only non-admins can upvote or comment */}
          {!isAdmin && (
            <>
              <Button
                variant="link"
                size="sm"
                onClick={() => onUpvote(report._id)}
              >
                {report.hasUpvoted ? "👍" : "👍🏻"} {report.upvoteCount || 0}
              </Button>

              <Button
                variant="link"
                size="sm"
                onClick={() => setShowDetail(true)}
              >
                💬 {report.commentCount || 0}
              </Button>
            </>
          )}
        </div>
      </ListGroup.Item>

      <ReportDetailModal
        report={report}
        show={showDetail}
        onHide={() => setShowDetail(false)}
        onUpvote={() => onUpvote(report._id)}
        onAddComment={(text) => onAddComment(report._id, text)}
        userLocation={userLocation}
        BACKEND={BACKEND}
        MAPBOX_TOKEN={MAPBOX_TOKEN}
      />
    </>
  );
}
