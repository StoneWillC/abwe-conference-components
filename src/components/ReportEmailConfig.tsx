import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import apiService from "../services/api";

interface ReportEmailConfigProps {
  templateId?: number;
  eventId?: number;
  disabled?: boolean;
}

export interface ReportEmailConfigHandle {
  save: (overrideTemplateId?: number) => Promise<boolean>;
  validate: () => boolean;
  getConfigData: () => { recipients: string[]; is_enabled: boolean };
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return email === "" || emailRegex.test(email);
}

const ReportEmailConfig = forwardRef<
  ReportEmailConfigHandle,
  ReportEmailConfigProps
>(({ templateId, eventId, disabled = false }, ref) => {
  const [recipients, setRecipients] = useState<string[]>(["", "", ""]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTemplateLevel, setIsTemplateLevel] = useState(false);
  const [touched, setTouched] = useState<boolean[]>([false, false, false]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const loadConfig = async () => {
    if (!templateId && !eventId) return;
    setLoading(true);
    try {
      const result = eventId
        ? await apiService.getEventReportEmailConfig(eventId)
        : await apiService.getTemplateReportEmailConfig(templateId!);

      const data = result.data?.data;
      if (data) {
        const r = data.recipients || [];
        setRecipients([r[0] || "", r[1] || "", r[2] || ""]);
        setIsEnabled(data.is_enabled);
        setSentAt(data.sent_at || null);
        setIsTemplateLevel(data.is_template_level || false);
      }
    } catch (err) {
      console.error("Failed to load report email config:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConfig();
  }, [templateId, eventId]);

  const hasValidationErrors = (): boolean => {
    return recipients.some((email) => email !== "" && !validateEmail(email));
  };

  const save = async (overrideTemplateId?: number): Promise<boolean> => {
    if (hasValidationErrors()) {
      setSnackbar({
        open: true,
        message: "Please fix invalid email addresses before saving",
        severity: "error",
      });
      return false;
    }
    const effectiveTemplateId = overrideTemplateId ?? templateId;
    if (!effectiveTemplateId && !eventId) return true;

    try {
      const payload = {
        recipients: recipients.filter((e) => e.trim() !== ""),
        is_enabled: isEnabled,
      };

      const result = eventId
        ? await apiService.saveEventReportEmailConfig(eventId, payload)
        : await apiService.saveTemplateReportEmailConfig(effectiveTemplateId!, payload);

      if (result.success || result.data?.success) {
        setSnackbar({
          open: true,
          message: "Email config saved",
          severity: "success",
        });
        return true;
      }
      setSnackbar({
        open: true,
        message: "Failed to save email config",
        severity: "error",
      });
      return false;
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to save email config",
        severity: "error",
      });
      return false;
    }
  };

  const validate = (): boolean => {
    if (hasValidationErrors()) {
      // Mark all fields as touched to show errors
      setTouched([true, true, true]);
      return false;
    }
    return true;
  };

  useImperativeHandle(ref, () => ({
    save,
    validate,
    getConfigData: () => ({
      recipients: recipients.filter((e) => e.trim() !== ""),
      is_enabled: isEnabled,
    }),
  }));

  const handleSendNow = async () => {
    if (!eventId) return;
    setSending(true);
    try {
      const result = await apiService.sendReportEmail(eventId);
      if (result.data?.success) {
        setSnackbar({
          open: true,
          message: "Report emails sent!",
          severity: "success",
        });
        setSentAt(new Date().toISOString());
      } else {
        setSnackbar({
          open: true,
          message: result.data?.message || "Failed to send emails",
          severity: "error",
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to send emails",
        severity: "error",
      });
    }
    setSending(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{ mb: 1, fontFamily: "Montserrat, sans-serif" }}
      >
        Report Email Automation
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            disabled={disabled}
          />
        }
        label="Send reports automatically after event"
        sx={{ mb: 1 }}
      />

      {[0, 1, 2].map((i) => (
        <TextField
          key={i}
          fullWidth
          size="small"
          label={`Recipient ${i + 1}`}
          type="email"
          value={recipients[i]}
          onChange={(e) => {
            const updated = [...recipients];
            updated[i] = e.target.value;
            setRecipients(updated);
          }}
          onBlur={() => {
            const updated = [...touched];
            updated[i] = true;
            setTouched(updated);
          }}
          error={
            touched[i] &&
            recipients[i] !== "" &&
            !validateEmail(recipients[i])
          }
          helperText={
            touched[i] &&
            recipients[i] !== "" &&
            !validateEmail(recipients[i])
              ? "Please enter a valid email address"
              : undefined
          }
          disabled={disabled}
          margin="dense"
        />
      ))}

      {isTemplateLevel && eventId && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: "block", fontStyle: "italic" }}
        >
          Inherited from event template — saving will create an event-level
          override
        </Typography>
      )}

      {sentAt && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Last sent: {new Date(sentAt).toLocaleString()}
        </Typography>
      )}

      {eventId && (
        <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleSendNow}
            disabled={disabled || sending}
            sx={{
              color: "#e79727",
              borderColor: "#e79727",
              fontFamily: "Montserrat, sans-serif",
            }}
          >
            {sending ? "Sending..." : "Send Now"}
          </Button>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

export default ReportEmailConfig;
