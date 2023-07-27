import { Router } from "express";
import { profileController } from "./controllers/profileController";
import {mockController} from "./controllers/mockController";
import {familyController} from "./controllers/familyController";

const router = Router();

router.use("/profile", profileController);
router.use("/family", familyController);
router.use("/mock", mockController);
export default router;
