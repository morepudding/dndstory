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

    const openStory = await rpc({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "open_after_story",
        arguments: { playerName: "Romain" },
      },
    }, sessionId);

    const resourceRead = await rpc({
      jsonrpc: "2.0",
      id: 5,
      method: "resources/read",
      params: { uri: "ui://after/story.html" },
    }, sessionId);

    const renderTurn = await rpc({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "render_after_turn",
        arguments: {
          headline: "Test de continuité",
          timeLabel: "VENDREDI · 03:14 · SALLE COMMUNE",
          narration: "Le test MCP confirme que la scène peut être rendue depuis ChatGPT.",
          dialogue: [
            { speaker: "lea", text: "Ça marche." },
            { speaker: "maya", text: "Alors on continue." }
          ],
          choices: ["Écouter le couloir", "Vérifier la radio"],
          objective: "Valider la boucle ChatGPT → interface.",
          waterDays: 5,
          foodDays: 4,
          batteryPercent: 51,
          sceneSummary: "Smoke test technique réussi ; aucune modification narrative persistante.",
          chapter: "CHAPITRE 01",
          chapterTitle: "LE CENTRE"
        },
      },
    }, sessionId);

    res.status(200).json({
      ok: tools.ok && resources.ok && openStory.ok && resourceRead.ok && renderTurn.ok,
      endpoint: baseURL + "/mcp",
      initialize: init.json,
      tools: tools.json,
      resources: resources.json,
      openStory: openStory.json,
      resourceRead: {
        status: resourceRead.status,
        ok: resourceRead.ok,
        hasHtml: JSON.stringify(resourceRead.json).includes("AFTER // 02:47"),
      },
      renderTurn: renderTurn.json,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
}
