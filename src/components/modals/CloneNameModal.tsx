import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

export interface CloneNameModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  defaultName: string;
  loading?: boolean;
}

export default function CloneNameModal({
  open,
  onClose,
  onConfirm,
  defaultName,
  loading = false,
}: CloneNameModalProps) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (open) {
      setName(defaultName);
    }
  }, [open, defaultName]);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim() && !loading) {
      handleConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="clone-dialog-title"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="clone-dialog-title">Clone</DialogTitle>
      <DialogContent sx={{ pt: 4, pb: 3, overflow: "visible" }}>
        <TextField
          fullWidth
          label="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoFocus
          inputProps={{ maxLength: 255 }}
          sx={{
            "& .MuiOutlinedInput-root": {
              overflow: "visible",
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: "#001d44",
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!name.trim() || loading}
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
          Clone
        </Button>
      </DialogActions>
    </Dialog>
  );
}
