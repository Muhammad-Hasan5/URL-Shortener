import type { Request, Response } from "express";
import { resolveLongUrl, resolveShortCode } from "../services/url.service.js";

// covnert long url to SHORT one
export const shortURL = async (req: Request, res: Response): Promise<any> => {
  //fetch
  const { longURL } = req.body;

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
  const result = await resolveLongUrl(req.id, String(longURL));

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
    data: result.data,
    msg: "url has been shorten successfully",
  });
};

// REDIRECT to long url
export const redirect = async (req: Request, res: Response) => {
  //fetch
  const shortCode = req.params.shortCode;

  //validate param: short code
  if (!shortCode) {
    return res.status(400).json({
      status: 400,
      success: false,
      msg: "short code is not available",
    });
  }

  //resolve
  const result = await resolveShortCode(req.id, String(shortCode));

  //response
  if (result === null) {
    return res.status(400).json({
      success: false,
      msg: "short code is not available",
    });
  }

  return res.redirect(302, String(result.data));
};
