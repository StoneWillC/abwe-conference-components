import ApiMethods from "@/interfaces/ApiMethods";
import GenericDropdownProps from "@/interfaces/GenericDropdownProps";
import GenericItem from "@/interfaces/GenericItem";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileCopy as FileCopyIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import apiService from "../services/api";
import AddExistingDialog from "./modals/AddExistingModal";
import CloneNameModal from "./modals/CloneNameModal";
import ConfirmationModal from "./modals/ConfirmationModal";

export default function GenericDropdown<T extends GenericItem>({
  title,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  apiMethods,
  dependency,
  dependencyName,
  ModalComponent,
  modalProps = {},
  formatItemDisplay = (item) =>
    displayField
      ? String(item[displayField])
      : item.name || String(item[idField || "id"]),
  displayField,
  emptyMessage,
  deleteButtonText = "Delete",
  idField = "id",
  enableAddOverwrite = false,
  enableAddExisting = false,
  addExistingTitle,
  pageName,
  allowRestrictedEdit = false,
  onClone,
  cloneLoading = false,
}: GenericDropdownProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh trigger to force reload after CRUD operations
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [preserveSelection, setPreserveSelection] = useState(false);

  // Internal state for current selection
  const [currentSelected, setCurrentSelected] = useState<number | string | "">(
    value,
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"create" | "edit">("create");
  const [dialogItem, setDialogItem] = useState<T | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | string | null>(
    null,
  );

  // Add existing dialog state
  const [addExistingDialogOpen, setAddExistingDialogOpen] = useState(false);
  const [allItems, setAllItems] = useState<T[]>([]);
  const [loadingAllItems, setLoadingAllItems] = useState(false);

  // Track pending auto-selection after adding existing item
  const [pendingAutoSelect, setPendingAutoSelect] = useState<
    number | string | null
  >(null);

  // Clone name modal state
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneDefaultName, setCloneDefaultName] = useState("");
  const [cloningInProgress, setCloningInProgress] = useState(false);

  // Sync internal state with prop
  useEffect(() => {
    setCurrentSelected(value);
  }, [value]);

  // Load items when dependency changes, on mount if no dependency, or when refresh is triggered
  useEffect(() => {
    if (dependency !== undefined) {
      // Has dependency - only load if dependency has value
      if (dependency) {
        loadItems();
        // Only clear selection if we're not preserving it (i.e., dependency actually changed)
        if (!preserveSelection) {
          handleSelectionChange("");
        }
      } else {
        setItems([]);
        handleSelectionChange("");
      }
    } else {
      // No dependency - load immediately
      loadItems();
    }

    // Reset preserve selection flag after handling
    if (preserveSelection) {
      setPreserveSelection(false);
    }
  }, [dependency, refreshTrigger]);

  // Auto-select first item when items are loaded and nothing is selected
  useEffect(() => {
    if (items.length > 0 && !currentSelected && !loading) {
      const firstItem = items[0];
      const itemId = firstItem[idField];
      if (itemId !== undefined) {
        handleSelectionChange(itemId);
      }
    }
  }, [items, currentSelected, loading, idField]);

  // Helper function to trigger a refresh
  const triggerRefresh = (preserveCurrentSelection = false) => {
    setPreserveSelection(preserveCurrentSelection);
    setRefreshTrigger((prev) => prev + 1);
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      // Pass dependency only if it exists and has a value, otherwise pass undefined
      // Convert string to number if needed
      let dependencyValue: number | undefined = undefined;
      if (
        dependency !== undefined &&
        dependency !== null &&
        dependency !== ""
      ) {
        dependencyValue =
          typeof dependency === "number"
            ? dependency
            : parseInt(String(dependency));
      }
      const response = await apiMethods.load(dependencyValue);
      if (response.success && response.data) {
        setItems(response.data);
      } else {
        setError(response.error || `Failed to load ${title.toLowerCase()}`);
      }
    } catch (err) {
      console.error(`Error loading ${title.toLowerCase()}:`, err);
      setError(`Failed to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  // Internal handlers
  const handleSelectionChange = (itemId: number | string | "") => {
    setCurrentSelected(itemId);
    onChange(itemId);

    // If dialog is open and in edit mode, update the dialog item to reflect the new selection
    const selectedItem = items.find((item) => item[idField] == itemId);

    if (selectedItem) {
      setDialogItem(selectedItem);
    }
  };

  const handleCloneButtonClick = () => {
    if (!onClone || !currentSelected) {
      return;
    }

    const currentItem = items.find((item) => item[idField] == currentSelected);
    const itemName = currentItem?.name ?? "";
    const defaultName = `${itemName} (Clone)`;

    setCloneDefaultName(defaultName);
    setCloneModalOpen(true);
  };

  const handleClone = async (name: string) => {
    if (!onClone || !currentSelected) {
      return;
    }

    try {
      setCloningInProgress(true);
      setError(null);
      const clonedId = await onClone(currentSelected, name);
      await loadItems();

      if (clonedId !== undefined && clonedId !== null && clonedId !== "") {
        handleSelectionChange(clonedId);
      }
    } catch (err) {
      console.error(`Error cloning ${title.toLowerCase().slice(0, -1)}:`, err);
      setError(`Failed to clone ${title.toLowerCase().slice(0, -1)}`);
    } finally {
      setCloningInProgress(false);
      setCloneModalOpen(false);
    }
  };

  // Handle pending auto-selection after items are loaded
  useEffect(() => {
    if (pendingAutoSelect && items.length > 0) {
      const selectedItem = items.find(
        (item) => item[idField] === pendingAutoSelect,
      );

      // Try loose equality in case of type mismatch
      const selectedItemLoose = items.find(
        (item) => item[idField] == pendingAutoSelect,
      );

      if (selectedItem || selectedItemLoose) {
        const foundItem = selectedItem || selectedItemLoose;
        if (foundItem) {
          handleSelectionChange(pendingAutoSelect);
          setPendingAutoSelect(null);
        }
      }
    }
  }, [items, pendingAutoSelect, handleSelectionChange, idField]);

  const openDialog = (action: "create" | "edit", item?: T) => {
    setDialogAction(action);
    setDialogItem(item || null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogItem(null);
  };

  const handleCreate = async (itemData: Partial<T>): Promise<number | void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiMethods.create(
        itemData,
        dependency ? Number(dependency) : undefined,
      );
      if (response.success && response.data) {
        // Store the ID to auto-select after refresh
        const newItemId = response.data[idField];
        // Save bundled email config if provided (from template creation)
        const emailConfig = (itemData as any)._emailConfig;
        if (emailConfig?.recipients?.length > 0 && newItemId) {
          await apiService.saveTemplateReportEmailConfig(
            newItemId as number,
            emailConfig,
          );
        }
        closeDialog();
        // Trigger a refresh and wait for it to complete
        await loadItems();
        // Auto-select the newly created item
        if (newItemId !== undefined) {
          handleSelectionChange(newItemId);
        }
        return newItemId as number | undefined;
      } else {
        setError(
          response.error ||
            `Failed to create ${title.toLowerCase().slice(0, -1)}`,
        );
      }
    } catch (err) {
      console.error(`Error creating ${title.toLowerCase().slice(0, -1)}:`, err);
      setError(`Failed to create ${title.toLowerCase().slice(0, -1)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: number | string, itemData: Partial<T>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiMethods.update(
        typeof id === "string" ? parseInt(id) : id,
        itemData,
      );
      if (response.success) {
        closeDialog();
        // Trigger a refresh to reload the list with updated data, preserving current selection
        triggerRefresh(true);
      } else {
        setError(
          response.error ||
            `Failed to update ${title.toLowerCase().slice(0, -1)}`,
        );
      }
    } catch (err) {
      console.error(`Error updating ${title.toLowerCase().slice(0, -1)}:`, err);
      setError(`Failed to update ${title.toLowerCase().slice(0, -1)}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number | string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiMethods.delete(
        typeof itemToDelete === "string"
          ? parseInt(itemToDelete)
          : itemToDelete,
      );
      if (response.success) {
        setItems((prev) =>
          prev.filter((item) => item[idField] !== itemToDelete),
        );
        if (currentSelected === itemToDelete) {
          handleSelectionChange("");
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } else {
        setError(
          response.error ||
            `Failed to delete ${title.toLowerCase().slice(0, -1)}`,
        );
        cancelDelete();
      }
    } catch (err) {
      console.error(`Error deleting ${title.toLowerCase().slice(0, -1)}:`, err);
      setError(`Failed to delete ${title.toLowerCase().slice(0, -1)}`);
      cancelDelete();
    } finally {
      setLoading(false);
    }
  };

  const handleDialogSubmit = async (
    itemData: Partial<T>,
  ): Promise<number | void> => {
    if (dialogAction === "create") {
      return await handleCreate(itemData);
    } else if (
      dialogAction === "edit" &&
      dialogItem &&
      dialogItem.id !== undefined
    ) {
      await handleEdit(dialogItem.id, itemData);
    }
  };

  const isDependencyMissing = dependency !== undefined && !dependency;
  const isDisabled = disabled || isDependencyMissing || loading;

  const getEmptyMessage = () => {
    if (emptyMessage) return emptyMessage;
    if (isDependencyMissing && dependencyName) {
      return `Select a ${dependencyName} first`;
    }
    return `Click + to create a ${title.toLowerCase().slice(0, -1)}`;
  };

  // Add Existing functionality
  const openAddExistingDialog = async () => {
    if (!apiMethods.loadAll) return;

    setAddExistingDialogOpen(true);
    setLoadingAllItems(true);
    try {
      const response = await apiMethods.loadAll();
      if (response.success && response.data) {
        // Filter out items that are already in the current list (by ID and name)
        const currentItemIds = items.map((item) => item[idField]);
        const currentItemNames = items
          .map((item) => item.name?.toLowerCase().trim())
          .filter(Boolean);

        const availableItems = response.data.filter(
          (item) =>
            !currentItemIds.includes(item[idField]) &&
            !currentItemNames.includes(item.name?.toLowerCase().trim()),
        );

        // Further deduplicate by name in case there are multiple items with same name
        const uniqueItems = availableItems.filter(
          (item, index, self) =>
            index ===
            self.findIndex(
              (t) =>
                t.name?.toLowerCase().trim() ===
                item.name?.toLowerCase().trim(),
            ),
        );

        setAllItems(uniqueItems);
      } else {
        setError(
          response.error || `Failed to load available ${title.toLowerCase()}`,
        );
      }
    } catch (err) {
      console.error(`Error loading all ${title.toLowerCase()}:`, err);
      setError(`Failed to load available ${title.toLowerCase()}`);
    } finally {
      setLoadingAllItems(false);
    }
  };

  const handleAddExisting = async (itemIds: (number | string)[]) => {
    if (!apiMethods.addExisting) return;

    // Process each item ID
    for (const itemId of itemIds) {
      // Check if an item with the same source ID already exists
      const selectedItem = allItems.find((item) => item[idField] === itemId);
      const existingDuplicate = items.find(
        (item) => selectedItem && item.name === selectedItem.name,
      );

      if (existingDuplicate) {
        setError(
          `"${selectedItem?.name}" is already added to this ${
            dependencyName || "list"
          }`,
        );
        continue; // Skip this item and continue with next
      }

      try {
        setLoading(true);
        setError(null);
        const response = await apiMethods.addExisting(
          typeof itemId === "string" ? parseInt(itemId) : itemId,
          dependency ? Number(dependency) : undefined,
        );
        if (response.success && response.data) {
          // Store the ID to auto-select after refresh
          // The response.data contains the nested template object (session_template or survey_template)
          // We need to extract the actual item from the response
          let newItemId: string | number | undefined = undefined;

          // Try to get the ID from common response patterns
          if (response.data[idField]) {
            // Direct ID field on response
            newItemId = response.data[idField];
          } else if (
            response.data.session_template &&
            response.data.session_template[idField]
          ) {
            // Nested session_template
            newItemId = response.data.session_template[idField];
          } else if (
            response.data.survey_template &&
            response.data.survey_template[idField]
          ) {
            // Nested survey_template
            newItemId = response.data.survey_template[idField];
          }

          // Set up pending auto-selection and trigger a refresh
          if (newItemId !== undefined) {
            setPendingAutoSelect(newItemId);
          }

          // Add a small delay to ensure backend has time to process
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Trigger a refresh - the useEffect will handle auto-selection when items are loaded
          await loadItems();
        } else {
          setError(
            response.error ||
              `Failed to add ${title.toLowerCase().slice(0, -1)}`,
          );
        }
      } catch (err) {
        console.error(
          `Error adding existing ${title.toLowerCase().slice(0, -1)}:`,
          err,
        );
        setError(`Failed to add ${title.toLowerCase().slice(0, -1)}`);
      } finally {
        setLoading(false);
      }
    } // End of for loop

    setAddExistingDialogOpen(false);
  };

  const closeAddExistingDialog = () => {
    setAddExistingDialogOpen(false);
    setAllItems([]);
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            color={isDependencyMissing ? "textSecondary" : "inherit"}
          >
            {title}
          </Typography>
        </Box>

        <FormControl fullWidth sx={{ mb: 1 }}>
          <InputLabel>Select {title.slice(0, -1)}</InputLabel>
          <Select
            value={currentSelected}
            label={`Select ${title.slice(0, -1)}`}
            disabled={isDisabled}
            onChange={(e) =>
              handleSelectionChange(e.target.value as number | string | "")
            }
          >
            {items.length === 0 ? (
              <MenuItem value="no-items" disabled>
                {getEmptyMessage()}
              </MenuItem>
            ) : (
              items.map((item) => (
                <MenuItem key={item[idField]} value={item[idField]}>
                  {formatItemDisplay(item)}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 1,
            minHeight: 28,
            flexWrap: "wrap",
          }}
        >
          {enableAddExisting && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={openAddExistingDialog}
              disabled={!((!isDisabled && !readOnly) || enableAddOverwrite)}
              sx={{
                height: { xs: 26, sm: 28 },
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontSize: { xs: "0.65rem", sm: "0.75rem" },
                px: { xs: 0.75, sm: 1.5 },
                whiteSpace: "nowrap",
                minWidth: { xs: "auto", sm: "64px" },
                "& .MuiButton-startIcon": {
                  marginRight: { xs: "4px", sm: "8px" },
                },
              }}
            >
              LINK
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => openDialog("create")}
            disabled={!((!isDisabled && !readOnly) || enableAddOverwrite)}
            sx={{
              height: { xs: 26, sm: 28 },
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
              px: { xs: 0.75, sm: 1.5 },
              minWidth: { xs: "auto", sm: "64px" },
              "& .MuiButton-startIcon": {
                marginRight: { xs: "4px", sm: "8px" },
              },
            }}
          >
            Add
          </Button>
          {onClone && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileCopyIcon />}
              onClick={handleCloneButtonClick}
              disabled={!currentSelected || cloneLoading || cloningInProgress}
              sx={{
                height: { xs: 26, sm: 28 },
                color: "#004e7d",
                borderColor: "#004e7d",
                "&:hover": { borderColor: "#001d44", color: "#001d44" },
                fontFamily: "Montserrat, sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontSize: { xs: "0.65rem", sm: "0.75rem" },
                px: { xs: 0.75, sm: 1.5 },
                minWidth: { xs: "auto", sm: "64px" },
                "& .MuiButton-startIcon": {
                  marginRight: { xs: "4px", sm: "8px" },
                },
              }}
            >
              Clone
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() =>
              openDialog(
                "edit",
                items.find((item) => item[idField] == currentSelected),
              )
            }
            disabled={!currentSelected || (readOnly && !allowRestrictedEdit)}
            sx={{
              height: { xs: 26, sm: 28 },
              color: "#004e7d",
              borderColor: "#004e7d",
              "&:hover": { borderColor: "#001d44", color: "#001d44" },
              fontFamily: "Montserrat, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
              px: { xs: 0.75, sm: 1.5 },
              minWidth: { xs: "auto", sm: "64px" },
              "& .MuiButton-startIcon": {
                marginRight: { xs: "4px", sm: "8px" },
              },
            }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => confirmDelete(currentSelected as number | string)}
            disabled={!currentSelected || readOnly}
            sx={{
              height: { xs: 26, sm: 28 },
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
              px: { xs: 0.75, sm: 1.5 },
              minWidth: { xs: "auto", sm: "64px" },
              "& .MuiButton-startIcon": {
                marginRight: { xs: "4px", sm: "8px" },
              },
            }}
          >
            {deleteButtonText}
          </Button>
          {readOnly && currentSelected && pageName !== "Presenter" && (
            <Typography variant="body2" color="text.secondary">
              Template is in use
            </Typography>
          )}
        </Box>

        {/* Dialog */}
        <ModalComponent
          open={dialogOpen}
          onClose={closeDialog}
          action={dialogAction}
          item={dialogItem}
          onSubmit={handleDialogSubmit}
          loading={loading}
          {...modalProps}
          {...(readOnly && allowRestrictedEdit ? { restrictedEdit: true } : {})}
        />

        <ConfirmationModal
          open={deleteDialogOpen}
          onClose={cancelDelete}
          onConfirm={handleDelete}
          title={
            title.slice(0, -1) === "Event Template"
              ? `Delete ${title.slice(0, -1)}`
              : `Remove ${title.slice(0, -1)}`
          }
          message={`Are you sure you want to ${
            title.slice(0, -1) === "Event Template" ? "delete" : "remove"
          } this ${title.slice(0, -1)}${
            dependencyName ? ` from the ${dependencyName}` : ""
          }? This action cannot be undone.`}
          loading={loading}
        />

        <AddExistingDialog
          open={addExistingDialogOpen}
          onClose={closeAddExistingDialog}
          onAddExisting={handleAddExisting}
          title={addExistingTitle || `Add Existing ${title.slice(0, -1)}`}
          items={
            allItems.filter((item) => item.id !== undefined) as Array<
              T & { id: string | number }
            >
          }
          loading={loading}
          loadingItems={loadingAllItems}
          formatItemDisplay={
            formatItemDisplay as (item: T & { id: string | number }) => string
          }
        />

        <CloneNameModal
          open={cloneModalOpen}
          onClose={() => setCloneModalOpen(false)}
          onConfirm={handleClone}
          defaultName={cloneDefaultName}
          loading={cloningInProgress}
        />

        {/* Error Dialog */}
        <Dialog open={!!error} onClose={() => setError(null)}>
          <DialogTitle>Error</DialogTitle>
          <DialogContent>
            <Typography>{error}</Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setError(null)}
              variant="contained"
              sx={{
                bgcolor: "#e79727",
                "&:hover": { bgcolor: "#cb5f1a" },
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export type { ApiMethods, GenericDropdownProps, GenericItem };
