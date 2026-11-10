import { ModifySessionModalProps } from "@/interfaces/ModalProps";
import Session from "@/interfaces/Session";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";

export default function ModifySessionModal({
  open,
  onClose,
  action,
  item,
  onSubmit,
  loading = false,
  hideTimeFields = false,
}: ModifySessionModalProps) {
  const [formData, setFormData] = useState<Partial<Session>>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open) {
      if (action === "create") {
        setFormData({
          name: "",
        });
      } else if (item) {
        setFormData({ ...item });
      }
    }
  }, [open, action, item, hideTimeFields]);

  const handleInputChange = (field: keyof Session, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({});
    onClose();
  };

  const getTitle = () => {
    switch (action) {
      case "create":
        return "Create Session Template";
      case "edit":
        return "Edit Session Template";
      case "view":
        return "View Session Template";
      default:
        return "Session Template";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Session Template Name"
          value={formData.name || ""}
          onChange={(e) => handleInputChange("name", e.target.value)}
          disabled={action === "view"}
          margin="normal"
          required
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          sx={{
            color: "#001d44",
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          Cancel
        </Button>
        {action !== "view" && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.name}
            sx={{
              bgcolor: "#e79727",
              "&:hover": { bgcolor: "#cb5f1a" },
              fontFamily: "Montserrat, sans-serif",
              "&.Mui-disabled": {
                bgcolor: "#e79727",
                color: "#ffffff",
                opacity: 0.6,
              },
            }}
          >
            {action === "create" ? "Create" : "Save Changes"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
