// Internus contact form handler.
// Receives POST /api/contact (JSON or form-encoded), validates, rate-limits,
// and forwards the message by email via SMTP.
//
// Configuration via environment (see .env.example):
//   PORT, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO

"use strict";

const http = require("http");
const nodemailer = require("nodemailer");

const PORT = parseInt(process.env.PORT || "8721", 10);
const MAIL_TO = process.env.MAIL_TO;
const MAIL_FROM = process.env.MAIL_FROM || MAIL_TO;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_PORT === "465",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// Per-IP rate limit: max 5 submissions per hour, in-memory.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10000) hits.clear(); // memory backstop
  return false;
}

function send(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

function parseBody(req, cb) {
  let raw = "";
  req.on("data", (c) => {
    raw += c;
    if (raw.length > 64 * 1024) req.destroy();
  });
  req.on("end", () => {
    try {
      const type = req.headers["content-type"] || "";
      if (type.includes("application/json")) return cb(null, JSON.parse(raw));
      const params = new URLSearchParams(raw);
      cb(null, Object.fromEntries(params));
    } catch (err) {
      cb(err);
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || !req.url.startsWith("/api/contact")) {
    return send(res, 404, { error: "Not found" });
  }

  // Caddy sits in front; trust its forwarded header.
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket.remoteAddress;

  if (rateLimited(ip)) {
    return send(res, 429, { error: "Too many messages — try again later or email us directly." });
  }

  parseBody(req, (err, body) => {
    if (err) return send(res, 400, { error: "Invalid request." });

    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().slice(0, 200);
    const message = String(body.message || "").trim().slice(0, 5000);
    const honeypot = String(body.website || "").trim();

    // Bots fill the hidden field; pretend success so they don't adapt.
    if (honeypot) return send(res, 200, { ok: true });

    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return send(res, 400, { error: "Please fill in all fields with a valid email." });
    }

    transporter
      .sendMail({
        from: `"Internus website" <${MAIL_FROM}>`,
        to: MAIL_TO,
        replyTo: `"${name.replace(/"/g, "")}" <${email}>`,
        subject: `[internus.dev] Contact form: ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nIP: ${ip}\n\n${message}`,
      })
      .then(() => send(res, 200, { ok: true }))
      .catch((mailErr) => {
        console.error("sendMail failed:", mailErr.message);
        send(res, 502, { error: "Could not send the message — email us directly instead." });
      });
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`contact form handler listening on 127.0.0.1:${PORT}`);
});
