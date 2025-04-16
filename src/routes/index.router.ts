import { HttpStatus } from "@/lib/classes/http-status.class";
import authRouter from "./auth.router";
import transactionRouter from "./transaction.router";
import type { Request, Response } from "express";
import { Router } from "express";
import authorizeUserAction from "@/middleware/authorization.middleware";
const router = Router();

router.get("/health", function (req: Request, res: Response) {
  res.status(HttpStatus.OK).json({
    success: true,
    message: `✅ Server is healthy and running now`,
  });
});

// Other routes go here
router.use("/transactions", authorizeUserAction(), transactionRouter);
router.use("/auth", authRouter);

// Not Found routes are caught here
router.all("*", function (req: Request, res: Response) {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    message: `The request route ${
      req.originalUrl
    } does not exist on this server or is not supported for the ${req.method.toLowerCase()} method`,
  });
});

const appRouter: Router = router;
export default appRouter;
