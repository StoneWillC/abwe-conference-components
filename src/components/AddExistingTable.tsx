import TableDataGridProps from "@/interfaces/TableDataGridProps";
import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useMemo, useState } from "react";

export const TableDataGrid = ({
  rows,
  columns,
  selectionModel,
  onSelectionChange,
  loading = false,
  height = 360,
}: TableDataGridProps) => {
  const [searchText, setSearchText] = useState("");

  const quickFilterValues = useMemo(
    () =>
      searchText
        .split(/\s+/)
        .map((value) => value.trim())
        .filter(Boolean),
    [searchText],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        height,
      }}
    >
      <TextField
        size="small"
        placeholder="Search"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            "aria-label": "Search rows",
          },
        }}
      />
      <DataGrid
        rows={rows}
        columns={columns}
        checkboxSelection
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={onSelectionChange}
        loading={loading}
        sx={{
          flex: 1,
          minHeight: 0,
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
            outline: "none",
            boxShadow: "none",
          },
          "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within":
            {
              outline: "none",
              boxShadow: "none",
            },
          "& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-columnHeaderTitleContainer":
            {
              display: "none",
            },
        }}
        filterModel={{
          items: [],
          quickFilterValues,
        }}
      />
    </Box>
  );
};
