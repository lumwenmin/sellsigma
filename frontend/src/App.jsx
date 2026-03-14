import React from "react";
import { Container, Typography } from "@mui/material";

export default function App() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4">SellSigma</Typography>
      <Typography variant="body1" color="text.secondary">
        Reddit intent monitoring dashboard
      </Typography>
    </Container>
  );
}
