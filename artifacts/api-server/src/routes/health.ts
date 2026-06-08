import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/", (_req, res) => {
  res.json({
    name: "Crowned In His Glory 2026 API",
    version: "0.1.0",
    docs: "/api/healthz",
    endpoints: {
      health: "GET /api/healthz",
      register: "POST /api/tickets",
      checkIn: "POST /api/checkin",
      adminLogin: "POST /api/admin/login",
      stats: "GET /api/stats/summary",
    },
  });
});

export default router;
