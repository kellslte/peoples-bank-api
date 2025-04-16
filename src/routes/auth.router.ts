import { AuthController } from "@/auth/auth.controller";
import authorizeUserAction from "@/middleware/authorization.middleware";
import { Router } from "express";
const router = Router();

router.post("/sign-in", AuthController.authenticateUser);
router.post("/sign-up", AuthController.createUserAccount);
router.post("/sign-out", AuthController.signOutUser);
router.post("/refresh-token", AuthController.refreshToken);
router.get('/user', authorizeUserAction(), AuthController.getUserDetails);


const authRouter: Router = router;
export default authRouter;