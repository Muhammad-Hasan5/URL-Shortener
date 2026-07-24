import type { Request, Response } from "express";
import { getDataForDashboard } from "../services/analytics.service.js";
import { getUrlId } from "../services/url.service.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";

export const getDashBoardData = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const shortCode = req.params.shortCode;

    if (!shortCode) {
      return res.status(400).json({
        status: 400,
        success: false,
        msg: "short code is not provided in params",
      });
    }

    const id = await getUrlId(String(shortCode), req.id, userId!);
    if (!id) {
      return res.status(404).json({
        status: 404,
        success: false,
        msg: "short url is not available or got deleted",
      });
    }

    const result = await getDataForDashboard(
      id.data as string,
      String(shortCode),
      userId!,
      { rangeInDays: 30 },
    );

    if(!result || result === null || result === undefined ){
      return res.status(500).json({
        status: 500,
        success: false,
        msg: "internal server error, problems fetching analytics",
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      data: result,
      msg: "analytics fetched",
    });
  },
);
