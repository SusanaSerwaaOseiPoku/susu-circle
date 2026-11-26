import { Router } from "express";
import {
  getCurrentUser,
  login,
  register,
} from "../controllers/authController.js";
import requireAuth from "../middleware/requireAuth.js";
import { validateLogin, validateRegister } from "../middleware/validateAuth.js";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", requireAuth, getCurrentUser);

export default router;
