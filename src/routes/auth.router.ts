import { AuthController } from "@/auth/auth.controller";
import { Router } from "express";
const router = Router();

router.post("/sign-in", AuthController.authenticateUser);
router.post("/sign-up", AuthController.createUserAccount);
router.post("/sign-out", AuthController.signOutUser);
router.post("/refresh-token", AuthController.refreshToken);
router.get('/user', AuthController.getUserDetails);


const authRouter: Router = router;
export default authRouter;