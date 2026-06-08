import { Router } from "express";
import type { IRouter } from "express";
import jwt from "jsonwebtoken";
import { AdminLoginBody } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "glory2026";
const JWT_SECRET = process.env.SESSION_SECRET ?? "crowned-in-glory-2026-secret";

async function authenticateAdmin(
  username: string,
  password: string,
): Promise<boolean> {
  try {
    const result = await pool.query<{ ok: boolean }>(
      `SELECT (password_hash = crypt($2, password_hash)) AS ok
       FROM users
       WHERE username = $1
         AND is_active = TRUE
         AND role = 'admin'
         AND password_hash IS NOT NULL
       LIMIT 1`,
      [username, password],
    );

    if (result.rows[0]?.ok) {
      await pool.query(
        `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE username = $1`,
        [username],
      );
      return true;
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[admin] DB auth unavailable, using env fallback:", err);
    }
  }

  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  if (!(await authenticateAdmin(username, password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
  req.log.info({ username }, "Admin logged in");
  res.json({ token, username });
});

router.get("/admin/verify", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    res.json({ valid: true, username: decoded.username });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
