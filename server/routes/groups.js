import { Router } from "express";
import {
  createGroup,
  deleteGroup,
  getGroup,
  listGroupContributions,
  listGroupMembers,
  listGroups,
  listMyGroups,
  updateGroup,
} from "../controllers/groupsController.js";
import checkOwner from "../middleware/checkOwner.js";
import findGroup from "../middleware/findGroup.js";
import requireAuth from "../middleware/requireAuth.js";
import validateGroup, { validateGroupUpdate } from "../middleware/validateGroup.js";

const router = Router();

router.get("/", listGroups);
router.get("/mine", requireAuth, listMyGroups);
router.get("/:id/members", findGroup, listGroupMembers);
router.get("/:id/contributions", findGroup, listGroupContributions);
router.get("/:id", findGroup, getGroup);
router.post("/", requireAuth, validateGroup, createGroup);
router.patch(
  "/:id",
  requireAuth,
  findGroup,
  checkOwner,
  validateGroupUpdate,
  updateGroup,
);
router.delete("/:id", requireAuth, findGroup, checkOwner, deleteGroup);

export default router;
