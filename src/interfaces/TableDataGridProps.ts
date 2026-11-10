import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";

export default interface TableDataGridProps {
  rows: any[];
  columns: GridColDef[];
  selectionModel: GridRowSelectionModel;
  onSelectionChange: (model: GridRowSelectionModel) => void;
  loading?: boolean;
  height?: number | string;
}
