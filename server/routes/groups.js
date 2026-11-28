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
import checkId from "../middleware/checkId.js";
import checkOwner from "../middleware/checkOwner.js";
import findGroup from "../middleware/findGroup.js";
import requireAuth from "../middleware/requireAuth.js";
import validateGroup, {
  validateGroupUpdate,
} from "../middleware/validateGroup.js";

const router = Router();
const checkGroupId = checkId("group");

router.get("/", listGroups);
router.get("/mine", requireAuth, listMyGroups);
router.get("/:id/members", checkGroupId, findGroup, listGroupMembers);
router.get(
  "/:id/contributions",
  checkGroupId,
  findGroup,
  listGroupContributions,
);
router.get("/:id", checkGroupId, findGroup, getGroup);
router.post("/", requireAuth, validateGroup, createGroup);
router.patch(
  "/:id",
  requireAuth,
  checkGroupId,
  findGroup,
  checkOwner,
  validateGroupUpdate,
  updateGroup,
);
router.delete(
  "/:id",
  requireAuth,
  checkGroupId,
  findGroup,
  checkOwner,
  deleteGroup,
);

export default router;
