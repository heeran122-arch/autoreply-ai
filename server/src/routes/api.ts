import { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { decrypt } from "../utils/crypto";

export function setupApiRoutes(app: Express, prisma: PrismaClient) {
  // Auth middleware
  async function requireUser(req: Request, res: Response, next: any) {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).send({ error: "not_authenticated" });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).send({ error: "not_authenticated" });
    (req as any).user = user;
    next();
  }

  app.get("/api/me", requireUser, async (req: Request, res: Response) => {
    const user = (req as any).user;
    res.send({
      id: user.id,
      email: user.email,
      name: user.name,
      agentEnabled: user.agentEnabled,
      settings: user.settings || {},
    });
  });

  app.post("/api/agent/toggle", requireUser, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { enabled } = req.body;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { agentEnabled: !!enabled }
    });
    res.send({ agentEnabled: updated.agentEnabled });
  });

  app.get("/api/history", requireUser, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const histories = await prisma.history.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.send(histories);
  });

  app.get("/api/never-reply", requireUser, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const list = await prisma.neverReply.findMany({ where: { userId: user.id } });
    res.send(list);
  });

  app.post("/api/never-reply", requireUser, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { value } = req.body;
    if (!value) return res.status(400).send({ error: "missing value" });
    const item = await prisma.neverReply.create({ data: { userId: user.id, value } });
    res.send(item);
  });

  app.delete("/api/never-reply/:id", requireUser, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const id = Number(req.params.id);
    await prisma.neverReply.deleteMany({ where: { id, userId: user.id } });
    res.send({ ok: true });
  });

  // Settings update (tone/instructions)
  app.post("/api/settings", requireUser, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const settings = req.body || {};
    const updated = await prisma.user.update({ where: { id: user.id }, data: { settings } });
    res.send({ settings: updated.settings });
  });
}
