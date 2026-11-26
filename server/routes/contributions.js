import { Router } from "express";
import {
  createContribution,
  listContributions,
} from "../controllers/contributionsController.js";
import findGroup, { requireGroup } from "../middleware/findGroup.js";
import requireAuth from "../middleware/requireAuth.js";
import validateContribution from "../middleware/validateContribution.js";

const router = Router();

router.get("/", findGroup, listContributions);
router.post(
  "/",
  requireAuth,
  requireGroup,
  validateContribution,
  createContribution,
);

export default router;
