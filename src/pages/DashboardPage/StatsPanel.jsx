import React from "react";
import { Card } from "react-bootstrap";

export default function StatsPanel({ total, resolved, avgRes }) {
  return (
    <Card.Body className="d-flex justify-content-around text-center">
      <div>
        <h5>{total}</h5>
        <small>Total Issues</small>
      </div>
      <div>
        <h5>{resolved}</h5>
        <small>Resolved</small>
      </div>
      <div>
        <h5>{avgRes}d</h5>
        <small>Avg. Resolution</small>
      </div>
    </Card.Body>
  );
}
