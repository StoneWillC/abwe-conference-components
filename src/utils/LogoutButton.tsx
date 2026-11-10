import LogoutIcon from "@mui/icons-material/Logout";
import { Button } from "@mui/material";
import { useAuth } from "../components/AuthContext";

export const LogoutButton = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Button
      variant="contained"
      size="small"
      startIcon={<LogoutIcon />}
      onClick={handleLogout}
      sx={{
        bgcolor: "#c62828 !important",
        color: "#ffffff",
        "&:hover": { bgcolor: "#b71c1c !important" },
      }}
    >
      Logout
    </Button>
  );
};
