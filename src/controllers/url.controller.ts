import type { Request, Response } from "express";
import {
  deleteShortUrl,
  fetchAllUrls,
  resolveLongUrl,
  resolveShortCode,
} from "../services/url.service.js";
import { analyticsQueue } from "../analytics/analytics.queue.js";
import { getClientIp } from "../utils/analytics-utils/getClientIP.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";

// covnert long url to SHORT one
export const shortURL = asyncHandler(async (req: Request, res: Response) => {
  //fetch
  const { longURL } = req.body;
  const userId = req.user?.id;

  //validate incoming long url & expiry date
  try {
    new URL(longURL);
  } catch {
    return res.status(400).json({
      status: 400,
      success: false,
      msg: "invalid url",
    });
  }

  //resolve
  const result = await resolveLongUrl(req.id, String(longURL), userId!);

  // response
  if (result === null) {
    return res.status(400).json({
      success: false,
      msg: `error resolving this long url: ${longURL}`,
    });
  }

  if (result.status === 200) {
    return res.status(200).json({
      success: true,
      data: result.data,
      msg: "this url was already shorten",
    });
  }

  return res.status(201).json({
    success: true,
    data: { url_id: result.url_id, url: result.data },
    msg: "url has been shorten successfully",
  });
});

// REDIRECT to long url
export const redirect = asyncHandler(async (req: Request, res: Response) => {
  //fetch
  const shortCode = req.params.shortCode;
  const userId = req.user?.id;

  //validate param: short code
  if (!shortCode) {
    return res.status(400).json({
      status: 400,
      success: false,
      msg: "short code is not available",
    });
  }

  //resolve
  const result = await resolveShortCode(req.id, String(shortCode), userId!);

  //response
  if (result === null) {
    return res.status(400).json({
      success: false,
      msg: "short code is not available",
    });
  }

  res.redirect(302, String(result.data));

  analyticsQueue.add(
    "click",
    {
      short_code: shortCode,
      url_id: result.url_id,
      user_id: userId,
      ip: getClientIp(req),
      user_agent: req.headers["user-agent"],
      referrer: req.headers["referer"],
      clicked_at: new Date().toISOString(),
    },
    { removeOnComplete: 500, attempts: 3 },
  );
});

//fetch all urls of a user
export const getUrlsList = asyncHandler(async (req: Request, res: Response) => {
  const reqId = req.id;
  const userId = req.user?.id;

  const result = await fetchAllUrls(reqId, userId!);

  if (result?.status === 404) {
    return res.status(404).json({
      status: 404,
      data: null,
      msg: "unable to fetch user's urls from database",
    });
  } else if (result?.status == 200 && result?.data == null) {
    return res.status(200).json({
      status: 200,
      data: null,
      msg: "user have no short urls generated",
    });
  }
  return res.status(200).json({
    status: 200,
    data: result?.data,
    msg: "user's urls fetched successfully",
  });
});

export const deleteUrl = asyncHandler(async (req: Request, res: Response) => {
  const shortCode = req.params.shortCode;
  const userId = req.user?.id;

  const result = await deleteShortUrl(userId!, String(shortCode));

  if (result?.status == 500) {
    return res.status(500).json({
      status: 500,
      data: null,
      msg: result?.data,
    });
  }

  return res.status(200).json({
    status: 200,
    data: null,
    msg: "url deleted successfully",
  });
});
