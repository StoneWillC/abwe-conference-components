import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AssessmentIcon from "@mui/icons-material/Assessment";
import EditIcon from "@mui/icons-material/Edit";
import MenuIcon from "@mui/icons-material/Menu";
import PresentToAllIcon from "@mui/icons-material/PresentToAll";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import abweLogo from "../../assets/ABWE-Icon-WHITE.png";
import { LogoutButton } from "../../utils/LogoutButton";
import { useOptionalAuth } from "../AuthContext";

interface HeaderProps {
  showNavigation?: boolean;
  publicMode?: boolean;
}

export default function Header({
  showNavigation = false,
  publicMode = false,
}: HeaderProps) {
  const navigate = useNavigate();
  const auth = useOptionalAuth();
  const user = publicMode ? null : (auth?.user ?? null);
  const canNavigateViaLogo = !publicMode && !!user;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogoClick = () => {
    if (publicMode || !user) return;

    const role = user.role.toLowerCase();
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "creator") {
      navigate("/creator");
    } else if (role === "presenter") {
      navigate("/presenter");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <header className="abwe-header">
      <div className="abwe-header-content">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Centered Logo */}
          <Box
            onClick={handleLogoClick}
            sx={{
              cursor: canNavigateViaLogo ? "pointer" : "default",
            }}
          >
            <img
              src={abweLogo}
              alt="ABWE"
              className="abwe-logo"
              style={{ alignSelf: "center" }}
            />
          </Box>

          {/* Navigation Buttons - Absolute positioned to the very right */}
          {showNavigation && (
            <Box
              sx={{
                position: "absolute",
                right: { xs: "0.5rem", sm: "1rem" },
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                gap: 1,
                alignItems: "center",
              }}
            >
              {isMobile ? (
                <>
                  <IconButton
                    onClick={handleMenuOpen}
                    sx={{
                      color: "white",
                      bgcolor: "rgba(0, 29, 68, 0.7)",
                      "&:hover": { bgcolor: "rgba(0, 29, 68, 0.5)" },
                    }}
                    aria-label="navigation menu"
                  >
                    <MenuIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    slotProps={{
                      paper: {
                        sx: {
                          minWidth: 150,
                        },
                      },
                    }}
                  >
                    {user?.role.toLowerCase() === "admin" && (
                      <MenuItem onClick={() => handleNavigate("/admin")}>
                        <AdminPanelSettingsIcon sx={{ mr: 1 }} />
                        Admin
                      </MenuItem>
                    )}
                    {(user?.role.toLowerCase() === "admin" ||
                      user?.role.toLowerCase() === "creator") && (
                      <MenuItem onClick={() => handleNavigate("/creator")}>
                        <EditIcon sx={{ mr: 1 }} />
                        Creator
                      </MenuItem>
                    )}
                    {(user?.role.toLowerCase() === "admin" ||
                      user?.role.toLowerCase() === "creator" ||
                      user?.role.toLowerCase() === "presenter") && (
                      <MenuItem onClick={() => handleNavigate("/presenter")}>
                        <PresentToAllIcon sx={{ mr: 1 }} />
                        Presenter
                      </MenuItem>
                    )}
                    {(user?.role.toLowerCase() === "admin" ||
                      user?.role.toLowerCase() === "creator" ||
                      user?.role.toLowerCase() === "presenter") && (
                      <MenuItem onClick={() => handleNavigate("/reporting")}>
                        <AssessmentIcon sx={{ mr: 1 }} />
                        Reporting
                      </MenuItem>
                    )}
                    <MenuItem>
                      <LogoutButton />
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  {user?.role.toLowerCase() === "admin" && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AdminPanelSettingsIcon />}
                      onClick={() => navigate("/admin")}
                      sx={{
                        bgcolor: "rgba(0, 29, 68, 0.7)",
                        "&:hover": { bgcolor: "rgba(0, 29, 68, 0.5)" },
                      }}
                    >
                      Admin
                    </Button>
                  )}
                  {(user?.role.toLowerCase() === "admin" ||
                    user?.role.toLowerCase() === "creator") && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => navigate("/creator")}
                      sx={{
                        bgcolor: "rgba(0, 29, 68, 0.7)",
                        "&:hover": { bgcolor: "rgba(0, 29, 68, 0.5)" },
                      }}
                    >
                      Creator
                    </Button>
                  )}
                  {(user?.role.toLowerCase() === "admin" ||
                    user?.role.toLowerCase() === "creator" ||
                    user?.role.toLowerCase() === "presenter") && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PresentToAllIcon />}
                      onClick={() => navigate("/presenter")}
                      sx={{
                        bgcolor: "rgba(0, 29, 68, 0.7)",
                        "&:hover": { bgcolor: "rgba(0, 29, 68, 0.5)" },
                      }}
                    >
                      Presenter
                    </Button>
                  )}
                  {(user?.role.toLowerCase() === "admin" ||
                    user?.role.toLowerCase() === "creator" ||
                    user?.role.toLowerCase() === "presenter") && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AssessmentIcon />}
                      onClick={() => navigate("/reporting")}
                      sx={{
                        bgcolor: "rgba(0, 29, 68, 0.7)",
                        "&:hover": { bgcolor: "rgba(0, 29, 68, 0.5)" },
                      }}
                    >
                      Reporting
                    </Button>
                  )}
                  <LogoutButton />
                </>
              )}
            </Box>
          )}
        </Box>
      </div>
    </header>
  );
}
