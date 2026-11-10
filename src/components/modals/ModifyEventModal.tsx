import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { Event } from "../../interfaces/Event";
import { EventTemplate } from "../../interfaces/EventTemplate";
import { ModifyEventModalProps } from "../../interfaces/ModalProps";
import Session from "../../interfaces/Session";
import Survey from "../../interfaces/Survey";
import apiService from "../../services/api";
import ReportEmailConfig, {
  ReportEmailConfigHandle,
} from "../ReportEmailConfig";
import SurveyPreview from "../survey/SurveyPreview";

export default function ModifyEventModal({
  open,
  onClose,
  action,
  item,
  onSubmit,
  loading = false,
}: ModifyEventModalProps) {
  const emailConfigRef = useRef<ReportEmailConfigHandle>(null);
  // Survey preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSurveyId, setPreviewSurveyId] = useState<number | null>(null);
  const [previewSurveyName, setPreviewSurveyName] = useState("");
  const [formData, setFormData] = useState<Partial<Event>>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [eventTemplates, setEventTemplates] = useState<EventTemplate[]>([]);
  const [templateSessions, setTemplateSessions] = useState<Session[]>([]);
  const [sessionSurveys, setSessionSurveys] = useState<
    Record<number, Survey[]>
  >({});
  const [expandedSessions, setExpandedSessions] = useState<number[]>([]);
  const [initialTemplateId, setInitialTemplateId] = useState<
    number | undefined
  >(undefined);

  // Load event templates
  useEffect(() => {
    if (open) {
      loadEventTemplates();
    }
  }, [open]);

  const loadEventTemplates = async () => {
    const response = await apiService.getEventTemplates();
    if (response.success && response.data) {
      setEventTemplates(response.data);
    }
  };

  // Load sessions and surveys when template changes
  useEffect(() => {
    if (formData.event_template_id) {
      // Check if this is the initial load or a template change
      const isTemplateChange =
        initialTemplateId !== undefined &&
        initialTemplateId !== formData.event_template_id;

      if (action === "create" || isTemplateChange) {
        // For create mode or when template changes, load template sessions
        setInitialTemplateId(formData.event_template_id); // Update to track new template
        loadTemplateContent(formData.event_template_id);
      } else if (
        action === "edit" &&
        item?.id &&
        initialTemplateId === undefined
      ) {
        // For edit mode on initial load, load existing event sessions
        setInitialTemplateId(formData.event_template_id);
        loadExistingEventContent(item.id);
      }
    } else {
      // Clear data when no template is selected
      setTemplateSessions([]);
      setSessionSurveys({});
      setExpandedSessions([]);
    }
  }, [formData.event_template_id, action, item, initialTemplateId]);

  const loadTemplateContent = async (templateId: number) => {
    try {
      // Load session templates for this event template (filtered by event_template_id)
      const sessionsResponse =
        await apiService.getSessionTemplatesByEvent(templateId);
      if (sessionsResponse.success && sessionsResponse.data) {
        setTemplateSessions(sessionsResponse.data);

        // Load survey templates for each session template
        const surveysMap: Record<number, Survey[]> = {};

        const surveyPromises = sessionsResponse.data.map(async (session) => {
          const response = await apiService.getSurveyTemplatesBySession(
            session.id,
          );

          // Handle both empty arrays and null/undefined data
          if (
            response.success &&
            response.data &&
            Array.isArray(response.data)
          ) {
            surveysMap[session.id] = response.data;
          } else {
            surveysMap[session.id] = [];
          }
        });
        await Promise.all(surveyPromises);
        setSessionSurveys(surveysMap);
      }
    } catch (error) {
      console.error("Failed to load template content:", error);
    }
  };

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open) {
      if (action === "create") {
        setFormData({
          name: "",
          location: "",
          start_date: "",
          end_date: "",
          event_template_id: undefined,
        });
        setSessionSurveys({});
        setExpandedSessions([]);
        setInitialTemplateId(undefined);
      } else if (item) {
        setFormData({
          ...item,
          end_date: item.end_date && item.end_date !== "0000-00-00" && item.end_date !== "1899-11-30" ? item.end_date : "",
        });
        setInitialTemplateId(undefined);
      }
    } else {
      // Reset when dialog closes
      setInitialTemplateId(undefined);
    }
  }, [open, action, item]);

  const loadExistingEventContent = async (eventId: number) => {
    try {
      // Load existing event sessions (these are the copies with times already set)
      const eventSessionsResponse = await apiService.getSessions(
        undefined,
        eventId,
      );
      if (eventSessionsResponse.success && eventSessionsResponse.data) {
        const eventSessions = eventSessionsResponse.data;

        // Use event sessions as the template sessions
        setTemplateSessions(eventSessions);

        const surveysMap: Record<number, Survey[]> = {};

        // Load surveys for each event session
        const surveyPromises = eventSessions.map(async (session) => {
          // Load surveys
          const response = await apiService.getSurveys(session.id);
          if (response.success && response.data) {
            surveysMap[session.id] = response.data;
          } else {
            surveysMap[session.id] = [];
          }
        });

        await Promise.all(surveyPromises);
        setSessionSurveys(surveysMap);
      }
    } catch (error) {
      console.error("Failed to load existing event content:", error);
    }
  };

  const handleInputChange = (field: keyof Event, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "start_date" && value && !prev.end_date) {
        updated.end_date = value;
      }
      return updated;
    });
  };

  const toggleSessionExpanded = (sessionId: number) => {
    setExpandedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId],
    );
  };

  const handleClose = () => {
    setFormData({});
    setTemplateSessions([]);
    setSessionSurveys({});
    setExpandedSessions([]);
    setInitialTemplateId(undefined);
    onClose();
  };

  const getTitle = () => {
    switch (action) {
      case "create":
        return "Create Event";
      case "edit":
        return "Edit Event";
      case "view":
        return "View Event";
      default:
        return "Event";
    }
  };

  const isFormValid = () => {
    const basicFieldsValid =
      formData.name &&
      formData.location &&
      formData.start_date &&
      (action === "edit" || formData.event_template_id);

    return basicFieldsValid;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 3 }}
      >
        {action === "create" && (
          <FormControl fullWidth sx={{ mt: 1 }} required>
            <InputLabel id="event-template-label" shrink>
              Event Template
            </InputLabel>
            <Select
              labelId="event-template-label"
              label="Event Template"
              value={formData.event_template_id || ""}
              onChange={(e) =>
                handleInputChange("event_template_id", Number(e.target.value))
              }
              displayEmpty
              notched
              required
              endAdornment={
                formData.event_template_id ? (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        handleInputChange("event_template_id", undefined)
                      }
                      size="small"
                      edge="end"
                      sx={{ mr: 2 }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }
            >
              <MenuItem value="" disabled>
                Select a template
              </MenuItem>
              {eventTemplates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          fullWidth
          label="Event Name"
          variant="outlined"
          value={formData.name || ""}
          onChange={(e) => handleInputChange("name", e.target.value)}
          disabled={action === "view"}
          required
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
          sx={{ mt: 1 }}
        />

        <TextField
          fullWidth
          variant="outlined"
          label="Location"
          value={formData.location || ""}
          onChange={(e) => handleInputChange("location", e.target.value)}
          disabled={action === "view"}
          required
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
            }}
          >
            <DatePicker
              label="Start Date"
              value={formData.start_date ? dayjs(formData.start_date) : null}
              onChange={(value) =>
                handleInputChange(
                  "start_date",
                  value ? value.format("YYYY-MM-DD") : "",
                )
              }
              format="YYYY-MM-DD"
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  disabled: action === "view",
                  InputLabelProps: { shrink: true },
                },
              }}
            />

            <DatePicker
              label="End Date (Optional)"
              value={formData.end_date ? dayjs(formData.end_date) : null}
              onChange={(value) =>
                handleInputChange(
                  "end_date",
                  value ? value.format("YYYY-MM-DD") : "",
                )
              }
              format="YYYY-MM-DD"
              minDate={
                formData.start_date ? dayjs(formData.start_date) : undefined
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  disabled: action === "view" || !formData.start_date,
                  InputLabelProps: { shrink: true },
                },
              }}
            />
          </Box>
        </LocalizationProvider>

        {/* Show session/survey selection for both create and edit */}
        {formData.event_template_id &&
          (action === "create" || action === "edit") && (
            <Box sx={{ mt: 2 }}>
              {/* Sessions */}
              <Box>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Sessions & Surveys ({templateSessions.length})
                </Typography>
                {templateSessions.length > 0 ? (
                  <List dense>
                    {templateSessions.map((session) => {
                      const surveys = sessionSurveys[session.id] || [];
                      const isExpanded = expandedSessions.includes(session.id);
                      return (
                        <Box key={session.id} sx={{ mb: 2 }}>
                          <ListItem
                            disablePadding
                            sx={{
                              border: "1px solid #e0e0e0",
                              borderRadius: 1,
                              p: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                flexGrow: 1,
                                minWidth: 0,
                                cursor:
                                  surveys.length > 0 ? "pointer" : "default",
                              }}
                              onClick={() =>
                                surveys.length > 0 &&
                                toggleSessionExpanded(session.id)
                              }
                            >
                              <ListItemText
                                primary={session.name}
                                secondary={
                                  surveys.length > 0
                                    ? `${surveys.length} survey${
                                        surveys.length !== 1 ? "s" : ""
                                      }`
                                    : ""
                                }
                                sx={{ my: 0 }}
                              />
                            </Box>
                          </ListItem>

                          {/* Show surveys for this session */}
                          {surveys.length > 0 && (
                            <Collapse
                              in={isExpanded}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box sx={{ ml: 2, mt: 1, mb: 1 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", mb: 0.5 }}
                                >
                                  Linked Surveys
                                </Typography>
                                <List dense sx={{ pt: 0 }}>
                                  {surveys.map((survey) => (
                                    <ListItem
                                      key={survey.id}
                                      sx={{ py: 0.25, minHeight: "auto" }}
                                    >
                                      <ListItemIcon
                                        sx={{ minWidth: "auto", mr: 1 }}
                                      >
                                        <IconButton
                                          edge="start"
                                          aria-label="preview"
                                          size="small"
                                          onClick={() => {
                                            setPreviewSurveyId(
                                              survey.id ?? null,
                                            );
                                            setPreviewSurveyName(
                                              survey.name ?? "",
                                            );
                                            setPreviewOpen(true);
                                          }}
                                        >
                                          <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={survey.name}
                                        slotProps={{
                                          primary: {
                                            variant: "body2",
                                          },
                                        }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            </Collapse>
                          )}
                        </Box>
                      );
                    })}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No sessions in this template
                  </Typography>
                )}
              </Box>
            </Box>
          )}

        {((action === "create" && formData.event_template_id) ||
          (action !== "create" && item?.id)) && (
          <Accordion
            disableGutters
            elevation={0}
            sx={{
              mt: 2,
              "&:before": { display: "none" },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography
                variant="subtitle2"
                sx={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}
              >
                Email Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {action === "create" && formData.event_template_id ? (
                <ReportEmailConfig
                  ref={emailConfigRef}
                  templateId={formData.event_template_id}
                />
              ) : (
                <ReportEmailConfig
                  ref={emailConfigRef}
                  eventId={item!.id}
                  disabled={action === "view"}
                />
              )}
            </AccordionDetails>
          </Accordion>
        )}
      </DialogContent>
      <DialogActions>
        <SurveyPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          surveyId={previewSurveyId !== null ? String(previewSurveyId) : ""}
          surveyName={previewSurveyName}
        />
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
            onClick={async () => {
              // Validate email config
              if (emailConfigRef.current && !emailConfigRef.current.validate()) {
                return;
              }
              // Validate end date is not before start date
              if (
                formData.end_date &&
                formData.start_date &&
                new Date(formData.end_date) < new Date(formData.start_date)
              ) {
                alert("End date cannot be earlier than start date");
                return;
              }

              const submitData = { ...formData };
              await onSubmit(submitData);
              if (emailConfigRef.current) {
                await emailConfigRef.current.save();
              }
            }}
            variant="contained"
            disabled={loading || !isFormValid()}
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
