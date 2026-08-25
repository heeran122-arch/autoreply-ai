import { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";
import crypto from "crypto";
import { encrypt } from "../utils/crypto";

export function setupAuthRoutes(app: Express, prisma: PrismaClient) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  app.get("/auth/google", (req: Request, res: Response) => {
    const scopes = [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send"
    ];
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes
    });
    res.redirect(url);
  });

  app.get("/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const { code } = req.query;
      if (!code) return res.status(400).send("Missing code");

      const { tokens } = await oauth2Client.getToken(String(code));
      oauth2Client.setCredentials(tokens);

      // get userinfo
      const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
      const userinfo = await oauth2.userinfo.get();
      const email = userinfo.data.email;
      const name = userinfo.data.name;

      // save user and tokens (encrypt tokens)
      const encRefresh = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
      const encAccess = tokens.access_token ? encrypt(tokens.access_token) : null;
      const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

      let user = await prisma.user.findUnique({ where: { email: String(email) } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: String(email),
            name: name ?? undefined,
            googleRefreshToken: encRefresh,
            googleAccessToken: encAccess,
            tokenExpiry: expiry ?? undefined,
            agentEnabled: false
          }
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleRefreshToken: encRefresh ?? user.googleRefreshToken,
            googleAccessToken: encAccess ?? user.googleAccessToken,
            tokenExpiry: expiry ?? user.tokenExpiry,
            name: name ?? user.name
          }
        });
      }

      // set session
      // store minimal session data
      (req.session as any).userId = user.id;
      res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
    } catch (err) {
      console.error("OAuth callback error", err);
      res.status(500).send("OAuth error");
    }
  });
}
