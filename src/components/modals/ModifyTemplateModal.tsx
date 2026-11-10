import { EventTemplate } from "@/interfaces/EventTemplate";
import { ModifyTemplateModalProps } from "@/interfaces/ModalProps";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import ReportEmailConfig, {
  ReportEmailConfigHandle,
} from "../ReportEmailConfig";

export default function ModifyTemplateModal({
  open,
  onClose,
  action,
  item,
  onSubmit,
  loading = false,
}: ModifyTemplateModalProps) {
  const [formData, setFormData] = useState<Partial<EventTemplate>>({});
  const emailConfigRef = useRef<ReportEmailConfigHandle>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open) {
      if (action === "create") {
        setFormData({ name: "" });
      } else if (item) {
        setFormData({ ...item });
      }
    }
  }, [open, action, item]);

  const handleInputChange = (field: keyof EventTemplate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (emailConfigRef.current && !emailConfigRef.current.validate()) {
      return;
    }
    if (action === "create") {
      // Bundle email config into formData so GenericDropdown can save it after creation
      const emailData = emailConfigRef.current?.getConfigData();
      await onSubmit({ ...formData, _emailConfig: emailData } as any);
    } else {
      await onSubmit(formData);
      if (emailConfigRef.current) {
        await emailConfigRef.current.save();
      }
    }
  };

  const handleClose = () => {
    setFormData({});
    onClose();
  };

  const getTitle = () => {
    switch (action) {
      case "create":
        return "Create Event Template";
      case "edit":
        return "Edit Event Template";
      case "view":
        return "View Event Template";
      default:
        return "Event Template";
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
          label="Template Name"
          value={formData.name || ""}
          onChange={(e) => handleInputChange("name", e.target.value)}
          disabled={action === "view"}
          margin="normal"
          required
          autoFocus
        />
        <>
          <Divider sx={{ mt: 2 }} />
          <ReportEmailConfig
            ref={emailConfigRef}
            templateId={action !== "create" ? item?.id : undefined}
            disabled={action === "view"}
          />
        </>
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
