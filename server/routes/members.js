import { Router } from "express";
import {
  createMember,
  deleteMember,
  listMembers,
  updateMember,
} from "../controllers/membersController.js";
import checkId from "../middleware/checkId.js";
import findGroup, { requireGroup } from "../middleware/findGroup.js";
import requireAuth from "../middleware/requireAuth.js";
import validateMember from "../middleware/validateMember.js";

const router = Router();
const checkMemberId = checkId("member");

router.get("/", findGroup, listMembers);
router.post("/", requireAuth, validateMember, requireGroup, createMember);
router.patch("/:id", requireAuth, checkMemberId, updateMember);
router.delete("/:id", requireAuth, checkMemberId, deleteMember);

export default router;
