import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";
import { AttendeeEntranceData } from "../../types/attendeeTypes";
import Header from "../layout/Header";
import { setAttendeeSessionToken } from "../../utils/sessionUtils";
import apiService from "../../services/api";

interface SurveyEntranceProps {
  onEntranceComplete: (token: string) => void;
}

export default function SurveyEntrance({
  onEntranceComplete,
}: SurveyEntranceProps) {
  const [formData, setFormData] = useState<AttendeeEntranceData>({
    first_name: "",
    last_name: "",
    email: "",
    event_id: 1, // Default event ID - can be made configurable via props if needed
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create attendee session - backend will generate session token
      const response = await apiService.createAttendeeSession({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        event_id: formData.event_id,
      });

      if (
        response.success &&
        response.data?.success &&
        response.data.session_token
      ) {
        // Store session token received from backend in cookie
        setAttendeeSessionToken(response.data.session_token, 24);

        // Notify parent component
        onEntranceComplete(response.data.session_token);
      } else {
        setError(
          response.data?.message ||
            response.error ||
            "Failed to create session. Please try again.",
        );
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="abwe-page">
      {/* ABWE Header */}
      <Header publicMode />

      {/* Entrance Form */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: 600,
          mx: "auto",
          px: 4,
          py: 6,
        }}
      >
        <div
          className="abwe-card"
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <Typography variant="h4" className="abwe-heading">
            Welcome to the Survey
          </Typography>
          <Typography variant="body1" className="abwe-text">
            Please provide your information to get started. This will allow us
            to save your progress.
          </Typography>

          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              className="abwe-alert"
            >
              {error}
            </Alert>
          )}

          <TextField
            label="First Name"
            variant="outlined"
            fullWidth
            required
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            disabled={loading}
            className="abwe-text-field"
          />

          <TextField
            label="Last Name"
            variant="outlined"
            fullWidth
            required
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            disabled={loading}
            className="abwe-text-field"
          />

          <TextField
            label="Email Address"
            variant="outlined"
            type="email"
            fullWidth
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            disabled={loading}
            className="abwe-text-field"
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            className="abwe-btn-primary"
            sx={{ mt: 2, py: 1.5, fontSize: "1.1rem" }}
          >
            {loading ? "Getting Started..." : "Get Started"}
          </Button>
        </div>
      </Box>
    </div>
  );
}
