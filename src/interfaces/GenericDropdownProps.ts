import { ComponentType } from "react";
import ApiMethods from "./ApiMethods";
import GenericItem from "./GenericItem";

export default interface GenericDropdownProps<T extends GenericItem> {
  // Core props
  title: string;
  value: number | string | "";
  onChange: (value: number | string | "") => void;
  disabled?: boolean;
  readOnly?: boolean; // Hide action buttons (create, edit, delete)
  pageName: string;

  // API methods
  apiMethods: ApiMethods<T>;

  // Dependencies
  dependency?: number | string | "";
  dependencyName?: string; // For display in disabled state

  // Modal component - accepts any props
  ModalComponent: ComponentType<any>;
  modalProps?: Record<string, any>; // Additional props to pass to modal

  // Optional formatting
  formatItemDisplay?: (item: T) => string;
  displayField?: keyof T; // Field to use for display (defaults to 'name')
  emptyMessage?: string;
  deleteButtonText?: string; // Custom text for remove/delete button (defaults to 'Clear')
  idField?: "id" | "code"; // Field to use as identifier (defaults to 'id')
  enableAddOverwrite?: boolean; // Enable "Add" button and functionality

  // Add existing functionality
  enableAddExisting?: boolean; // Enable "Add Existing" button and functionality
  addExistingTitle?: string; // Custom title for add existing modal (defaults to "Add Existing {title}")

  // Restricted edit - allows editing even when readOnly (e.g., adding questions to in-use survey templates)
  allowRestrictedEdit?: boolean;

  // Clone functionality
  onClone?: (
    selectedId: number | string,
    name: string,
  ) => Promise<number | string | void> | number | string | void; // Called when clone button is clicked with selected ID and custom name
  cloneLoading?: boolean; // Show loading state on clone button
}
