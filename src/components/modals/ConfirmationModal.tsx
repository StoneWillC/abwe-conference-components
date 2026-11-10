import { ConfirmationModalProps } from "@/interfaces/ModalProps";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = "Confirm",
  message = "Are you sure?",
  loading = false,
}: ConfirmationModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            color: "#001d44",
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          autoFocus
          disabled={loading}
          sx={{
            bgcolor: "#d32f2f",
            "&:hover": { bgcolor: "#b71c1c" },
            fontFamily: "Montserrat, sans-serif",
            "&.Mui-disabled": {
              bgcolor: "#d32f2f",
              color: "#ffffff",
              opacity: 0.6,
            },
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
