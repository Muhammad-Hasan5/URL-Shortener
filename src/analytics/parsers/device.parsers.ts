import UAParser from "ua-parser-js";
import { isbot } from "isbot";
import type { Request } from "express";

export function parseDevice(req: Request) {
  const userAgent = req.headers["user-agent"];

  if (!userAgent) return null;

  const bot = isbot(userAgent);
  if (bot) return { isBot: true, botName: bot };

  const res = UAParser.UAParser(userAgent);

  return {
    isBot: false,
    deviceType: res.device.type || "Desktop",
    OSName: res.os.name,
    OSVersion: res.os.version,
    browserName: res.browser.name,
    browserVersion: res.browser.major,
  };
}
