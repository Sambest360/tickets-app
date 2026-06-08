import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ticketsRouter from "./tickets";
import checkinRouter from "./checkin";
import statsRouter from "./stats";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ticketsRouter);
router.use(checkinRouter);
router.use(statsRouter);
router.use(adminRouter);

export default router;
