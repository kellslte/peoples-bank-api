import { Router } from "express";
import type { Request, Response } from "express";
const router = Router();

router.get("/health", function (req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: `✅ Server is healthy and running now`,
  });
});
// Other routes go here

// Not Found routes are caught here
router.all("*", function (req: Request, res: Response) {
  res.status(200).json({
    success: false,
    message: `The request route ${
      req.originalUrl
    } does not exist on this server or is not supported for the ${req.method.toLowerCase()} method`,
  });
});

const appRouter = router;
export default appRouter;
