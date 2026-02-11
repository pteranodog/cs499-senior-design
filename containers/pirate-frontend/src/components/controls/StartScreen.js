import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";

export default function StartScreen({ onStart }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card bg="dark" text="light" className="p-4 rounded shadow">
        <Card.Body className="text-center">
          <Card.Title>Simulation Start</Card.Title>
          <Card.Text>Press Start to begin the simulation</Card.Text>
          <Button size="lg" variant="success" onClick={onStart}>
            Start Simulation
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}
