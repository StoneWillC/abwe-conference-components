import {
  AddUserData,
  EditUserData,
  UserModalProps,
} from "@/interfaces/ModalProps";
import { Role } from "@/types/role";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";

export const UserModal = ({
  open,
  onClose,
  mode = "add",
  user = null,
  roles,
  rolesLoading,
  rolesError,
  onSubmit,
}: UserModalProps) => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: "Presenter",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Set initial values based on mode
  useEffect(() => {
    if (mode === "edit" && user) {
      setUserData({
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else if (mode === "add" && roles.length > 0) {
      const presenterRole = roles.find(
        (role: Role) => role.name === "Presenter",
      );
      if (presenterRole) {
        setUserData((prev) => ({ ...prev, role: presenterRole.name }));
      }
    }
  }, [mode, user, roles]);

  const handleClose = () => {
    setUserData({
      name: "",
      email: "",
      role: "Presenter",
    });
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (mode === "add") {
        await onSubmit({
          name: userData.name,
          email: userData.email,
          role: userData.role,
        } as AddUserData);
      } else if (mode === "edit" && user) {
        await onSubmit({
          id: user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        } as EditUserData);
      }
      handleClose();
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if data has changed from original (for edit mode)
  const hasChanges =
    mode === "add"
      ? userData.name.trim() !== "" && userData.email.trim() !== ""
      : user &&
        (userData.name !== user.name ||
          userData.email !== user.email ||
          userData.role !== user.role);

  const isValid = userData.name.trim() !== "" && userData.email.trim() !== "";

  const title = mode === "add" ? "Add New User" : "Edit User";
  const submitButtonText = mode === "add" ? "Add User" : "Save Changes";
  const submittingText = mode === "add" ? "Adding..." : "Saving...";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          fullWidth
          variant="outlined"
          value={userData.name}
          onChange={(e) =>
            setUserData((prev) => ({ ...prev, name: e.target.value }))
          }
        />
        <TextField
          margin="dense"
          label="Email"
          type="email"
          fullWidth
          variant="outlined"
          value={userData.email}
          onChange={(e) =>
            setUserData((prev) => ({ ...prev, email: e.target.value }))
          }
        />
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={userData.role}
            label="Role"
            onChange={(e: SelectChangeEvent) =>
              setUserData((prev) => ({
                ...prev,
                role: e.target.value,
              }))
            }
            disabled={rolesLoading}
            MenuProps={{
              anchorOrigin: { vertical: "bottom", horizontal: "left" },
              transformOrigin: { vertical: "top", horizontal: "left" },
            }}
          >
            {rolesLoading ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading roles...
              </MenuItem>
            ) : rolesError ? (
              <MenuItem disabled>{rolesError}</MenuItem>
            ) : (
              roles.map((role: Role) => (
                <MenuItem key={role.id} value={role.name}>
                  {role.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
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
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || !hasChanges || isSubmitting}
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
          {isSubmitting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {submittingText}
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
