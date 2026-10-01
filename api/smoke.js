import { baseURL } from "../mcp-base-url.js";

function pickJson(text) {
  try { return JSON.parse(text); } catch {}
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.startsWith("data:")) {
      const raw = line.slice(5).trim();
      if (raw && raw !== "[DONE]") {
        try { return JSON.parse(raw); } catch {}
      }
    }
  }
  return { raw: text.slice(0, 4000) };
}

async function rpc(body, sessionId) {
  const headers = {
    "content-type": "application/json",
    "accept": "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const res = await fetch(baseURL + "/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return {
    ok: res.ok,
    status: res.status,
    sessionId: res.headers.get("mcp-session-id") || sessionId || null,
    json: pickJson(text),
  };
}

export default async function handler(req, res) {
  try {
    const init = await rpc({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "after-smoke-test", version: "1.0.0" },
      },
    });

    if (!init.ok) return res.status(500).json({ stage: "initialize", init });

    const sessionId = init.sessionId;
    await rpc({
      jsonrpc: "2.0",
      method: "notifications/initialized",
      params: {},
    }, sessionId);

    const tools = await rpc({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    }, sessionId);

    const resources = await rpc({
      jsonrpc: "2.0",
      id: 3,
      method: "resources/list",
      params: {},
    }, sessionId);

    res.status(200).json({
      ok: tools.ok && resources.ok,
      endpoint: baseURL + "/mcp",
      initialize: init.json,
      tools: tools.json,
      resources: resources.json,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
}
