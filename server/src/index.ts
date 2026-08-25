import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";
import crypto from "crypto";
import path from "path";
import cron from "node-cron";

import { setupAuthRoutes } from "./routes/auth";
import { setupApiRoutes } from "./routes/api";
import { startWorkerLoop } from "./worker";
import { decrypt, encrypt } from "./utils/crypto";

const prisma = new PrismaClient();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(bodyParser.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // in production, set secure: true with HTTPS
}));

// Routes
setupAuthRoutes(app, prisma);
setupApiRoutes(app, prisma);

// static production build (if you build client into /client/dist)
app.use("/static", express.static(path.join(__dirname, "../../client/dist")));

app.get("/", (req, res) => {
  res.send({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  // start background worker loop (polling)
  startWorkerLoop(prisma);
});
