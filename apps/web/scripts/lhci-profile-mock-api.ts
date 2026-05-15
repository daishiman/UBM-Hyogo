import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { verifySessionJwt } from "@ubm-hyogo/shared";

const PORT = Number(process.env.LHCI_PROFILE_MOCK_PORT ?? "8787");

const cookieValue = (req: IncomingMessage, name: string): string | null => {
  const raw = req.headers.cookie ?? "";
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
};

const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

const requireSession = async (req: IncomingMessage): Promise<boolean> => {
  const secret = process.env.AUTH_SECRET;
  const token =
    cookieValue(req, "authjs.session-token") ??
    cookieValue(req, "__Secure-authjs.session-token");
  if (!secret || !token) return false;
  return (await verifySessionJwt(token, secret)) !== null;
};

const profileBody = {
  profile: {
    sections: [
      {
        key: "basic",
        title: "基本情報",
        fields: [
          { stableKey: "full_name", label: "氏名", value: "LHCI Test Member" },
          { stableKey: "ubm_zone", label: "所属", value: "Hyogo" },
        ],
      },
    ],
    attendance: [],
    attendanceMeta: { hasMore: false, nextCursor: null },
  },
  statusSummary: {
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
  },
  editResponseUrl: "https://forms.example.test/edit",
  fallbackResponderUrl: "https://forms.example.test/new",
  pendingRequests: {},
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
  if (req.method !== "GET") {
    sendJson(res, 405, { code: "METHOD_NOT_ALLOWED" });
    return;
  }
  if (url.pathname === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (!(await requireSession(req))) {
    sendJson(res, 401, { code: "UNAUTHENTICATED" });
    return;
  }
  if (url.pathname === "/me") {
    sendJson(res, 200, {
      user: {
        memberId: "e2e-lhci-member-0001",
        responseId: "lhci-response-0001",
        email: "lhci-test@example.invalid",
        isAdmin: false,
        authGateState: "active",
      },
      authGateState: "active",
    });
    return;
  }
  if (url.pathname === "/me/profile") {
    sendJson(res, 200, profileBody);
    return;
  }
  if (url.pathname === "/me/attendance") {
    sendJson(res, 200, { records: [], hasMore: false, nextCursor: null });
    return;
  }
  sendJson(res, 404, { code: "NOT_FOUND" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[lhci-profile-mock-api] listening on http://127.0.0.1:${PORT}`);
});
