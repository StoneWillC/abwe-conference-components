import { DISPLAY_ICON_OPTIONS } from "../constants/fontAwesomeIcons";
import DisplayIconOption from "../interfaces/DisplayIconOption";
import SortableQuestionProps from "../interfaces/SortableQuestion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconName,
  findIconDefinition,
  library,
} from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

let isFontAwesomeInitialized = false;

const ensureFontAwesomeLibrary = () => {
  if (!isFontAwesomeInitialized) {
    library.add(fas);
    isFontAwesomeInitialized = true;
  }
};

const resolveIconDefinition = (iconClass?: string) => {
  if (!iconClass) {
    return null;
  }

  const tokens = iconClass.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const nameToken = tokens.find(
    (token) => token.startsWith("fa-") && token !== "fa-solid",
  );

  if (!nameToken) {
    return null;
  }

  const iconName = nameToken.slice(3);
  if (!iconName) {
    return null;
  }

  ensureFontAwesomeLibrary();

  try {
    const iconDefinition = findIconDefinition({
      prefix: "fas",
      iconName: iconName as IconName,
    });
    return iconDefinition?.icon ? iconDefinition : null;
  } catch {
    return null;
  }
};

export default function SortableQuestion({
  id,
  option,
  index,
  onUpdate,
  onRemove,
  disabled = false,
  disableValue = false,
}: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    data: {
      type: "option",
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const selectedDisplayIconOption =
    DISPLAY_ICON_OPTIONS.find((entry) => entry.value === option.displayIcon) ||
    null;

  const selectedDisplayIconValue = option.displayIcon || "";
  const autocompleteValue: DisplayIconOption | string | null =
    selectedDisplayIconOption ||
    (selectedDisplayIconValue ? selectedDisplayIconValue : null);

  const currentIconDefinition = resolveIconDefinition(option.displayIcon);

  const filterIconOptions = (
    options: DisplayIconOption[],
    { inputValue }: { inputValue: string },
  ) => {
    const needle = inputValue.trim().toLowerCase();
    if (!needle) {
      return options;
    }

    return options.filter((entry) => {
      return (
        entry.label.toLowerCase().includes(needle) ||
        entry.value.toLowerCase().includes(needle) ||
        entry.keywords.some((keyword) => keyword.toLowerCase().includes(needle))
      );
    });
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: { xs: "stretch", md: "center" },
        mb: 1,
        backgroundColor: isDragging ? "action.hover" : "transparent",
        borderRadius: 1,
        p: isDragging ? 0.5 : 0,
        position: "relative",
      }}
    >
      <Box
        {...attributes}
        {...(disabled ? {} : listeners)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
          mr: 1,
          touchAction: "none",
          borderRadius: 1,
          "&:hover": {
            backgroundColor: disabled ? "transparent" : "action.hover",
          },
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <DragIcon fontSize="small" color="action" />
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr 1.1fr" },
          gap: 1,
          alignItems: "center",
        }}
      >
        <TextField
          fullWidth
          size="small"
          label={`Option ${index + 1}`}
          value={option.value}
          onChange={(e) => onUpdate(index, "value", e.target.value)}
          disabled={disableValue || disabled}
        />

        <TextField
          fullWidth
          size="small"
          label="Display Text"
          placeholder="Optional label under icon"
          value={option.displayText || ""}
          onChange={(e) => onUpdate(index, "displayText", e.target.value)}
          disabled={false}
        />

        <Autocomplete
          options={DISPLAY_ICON_OPTIONS}
          size="small"
          freeSolo
          value={autocompleteValue}
          onInputChange={(_, inputValue, reason) => {
            if (reason === "input") {
              onUpdate(index, "displayIcon", inputValue);
            }
          }}
          onChange={(_, value) => {
            if (!value) {
              onUpdate(index, "displayIcon", "");
              return;
            }

            if (typeof value === "string") {
              onUpdate(index, "displayIcon", value);
              return;
            }

            onUpdate(index, "displayIcon", value.value || "");
          }}
          filterOptions={filterIconOptions}
          getOptionLabel={(entry) =>
            typeof entry === "string" ? entry : entry.label
          }
          isOptionEqualToValue={(entry, value) => {
            if (typeof value === "string") {
              return entry.value === value;
            }

            return entry.value === value.value;
          }}
          disabled={false}
          renderOption={(props, entry) => {
            const iconDefinition = resolveIconDefinition(entry.value);

            return (
              <Box
                component="li"
                {...props}
                sx={{ display: "flex", gap: 1.2, alignItems: "center" }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.primary",
                    flexShrink: 0,
                  }}
                >
                  {iconDefinition ? (
                    <FontAwesomeIcon icon={iconDefinition} />
                  ) : null}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2">{entry.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {entry.value}
                  </Typography>
                </Box>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Display Icon"
              placeholder="Search icons"
              slotProps={{
                input: {
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      {currentIconDefinition ? (
                        <InputAdornment position="start" sx={{ mr: 0.5 }}>
                          <FontAwesomeIcon icon={currentIconDefinition} />
                        </InputAdornment>
                      ) : null}
                      {params.InputProps.startAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
      </Box>

      <IconButton
        onClick={() => onRemove(index)}
        color="error"
        sx={{
          ml: 1,
          border: 1,
          borderColor: "divider",
        }}
        disabled={disabled}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );
}
