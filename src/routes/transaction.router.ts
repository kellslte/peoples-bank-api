import { TransactionController } from "@/transaction/transaction.controller";
import { Router } from "express";
const router = Router();

router.post("/withdraw", TransactionController.withdrawFunds);
router.post("/deposit", TransactionController.depositFunds);
router.post("/transfer", TransactionController.transferFunds);
router.get("/history/:accountNumber", TransactionController.transactionHistory);
router.get("/history/:accountNumber/:transactionId", TransactionController.transactionHistory);

const transactionRouter: Router = router;
export default transactionRouter;