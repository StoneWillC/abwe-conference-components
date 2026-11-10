import { AddExistingModalProps } from "@/interfaces/ModalProps";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { TableDataGrid } from "../AddExistingTable";

export default function AddExistingModal<
  T extends { id: number | string; name?: string; description?: string },
>({
  open,
  onClose,
  onAddExisting,
  title,
  items,
  loading,
  loadingItems,
  formatItemDisplay,
  selectionLimit,
  questionTypes,
  questionColumnMode = "type",
  questionShowSurveyColumn = false,
}: AddExistingModalProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(
    new Set(),
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleAddSelected = () => {
    const idsToAdd = Array.from(selectedIds);
    setSelectedIds(new Set());
    onAddExisting(idsToAdd);
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  const selectionModel: GridRowSelectionModel = useMemo(
    () => ({ type: "include", ids: new Set(selectedIds) }),
    [selectedIds],
  );

  const isQuestionItems = useMemo(() => {
    if (items.length === 0) return false;
    const sample: any = items[0];
    return "question_type_id" in sample || "question_type" in sample;
  }, [items]);

  const questionTypeLookup = useMemo(() => {
    if (!questionTypes) return new Map<number | string, string>();
    return new Map(questionTypes.map((qt) => [qt.id, qt.name]));
  }, [questionTypes]);

  const formatQuestionType = (value: string) => {
    if (value === "map") return "Global Country Map";
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const rows = useMemo(() => {
    return items.map((item: any) => {
      const name =
        item.text || item.name || item.description || formatItemDisplay(item);
      const typeFromId =
        item.question_type_id !== undefined
          ? questionTypeLookup.get(item.question_type_id)
          : undefined;
      const typeFromField =
        item.question_type || item.question_type_name || item.type;

      const rawType = typeFromId || typeFromField || "";
      const formattedType = rawType ? formatQuestionType(rawType) : "";

      return {
        id: item.id,
        name,
        description: item.description || "",
        type: formattedType,
        surveyName:
          item.survey_name ||
          item.surveyName ||
          item.survey_title ||
          item.survey ||
          "",
      };
    });
  }, [items, formatItemDisplay, questionTypeLookup]);

  const columns = useMemo(() => {
    if (isQuestionItems) {
      const usesDescription = questionColumnMode === "description";
      const questionColumns = [
        { field: "name", headerName: "Question", flex: 1, minWidth: 260 },
      ];

      if (questionShowSurveyColumn) {
        questionColumns.push({
          field: "surveyName",
          headerName: "Survey",
          flex: 0.8,
          minWidth: 170,
        });
      }

      questionColumns.push({
        field: usesDescription ? "description" : "type",
        headerName: usesDescription ? "Display Options" : "Type",
        flex: 1,
        minWidth: 160,
      });

      return questionColumns;
    }

    const hasDescription = rows.some((row) => row.description);
    return hasDescription
      ? [
          { field: "name", headerName: "Name", flex: 1, minWidth: 220 },
          {
            field: "description",
            headerName: "Description",
            flex: 1,
            minWidth: 220,
          },
        ]
      : [{ field: "name", headerName: "Name", flex: 1, minWidth: 220 }];
  }, [isQuestionItems, questionColumnMode, questionShowSurveyColumn, rows]);

  const contentHeight = "50vh";
  const tableHeight = "calc(50vh - 48px)";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={isQuestionItems ? "md" : "sm"}
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ height: contentHeight }}>
        {loadingItems ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: contentHeight,
            }}
          >
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: contentHeight,
              textAlign: "center",
              px: 2,
            }}
          >
            <Typography color="textSecondary">
              No available items to add
            </Typography>
          </Box>
        ) : (
          <TableDataGrid
            rows={rows}
            columns={columns}
            selectionModel={selectionModel}
            onSelectionChange={(newSelection) => {
              const idsArray = Array.from(newSelection.ids);
              if (selectionLimit && idsArray.length > selectionLimit) {
                return;
              }
              setSelectedIds(new Set(idsArray as Array<number | string>));
            }}
            loading={loadingItems}
            height={tableHeight}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: "#001d44",
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => setSelectedIds(new Set())}
          disabled={loading || selectedIds.size === 0}
          variant="outlined"
        >
          Clear Selection
        </Button>
        <Button
          onClick={handleAddSelected}
          disabled={loading || selectedIds.size === 0}
          variant="contained"
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
          Add Selected ({selectedIds.size}
          {selectionLimit ? `/${selectionLimit}` : ""})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
