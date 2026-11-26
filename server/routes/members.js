import { Router } from "express";
import {
  createMember,
  deleteMember,
  listMembers,
  updateMember,
} from "../controllers/membersController.js";
import findGroup, { requireGroup } from "../middleware/findGroup.js";
import requireAuth from "../middleware/requireAuth.js";
import validateMember from "../middleware/validateMember.js";

const router = Router();

router.get("/", findGroup, listMembers);
router.post("/", requireAuth, validateMember, requireGroup, createMember);
router.patch("/:id", requireAuth, updateMember);
router.delete("/:id", requireAuth, deleteMember);

export default router;
