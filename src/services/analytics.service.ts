import * as analyticsRepo from "../repositories/analytics.repository.js";

export async function getDataForDashboard(
  urlId: string,
  shortCode: string,
  { rangeInDays = 30 } = {},
) {
  const today = new Date();
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - rangeInDays);

  const prevRangeStart = new Date(rangeStart);
  prevRangeStart.setDate(prevRangeStart.getDate() - rangeInDays);

  const [
    live,
    clicksOverTime,
    topCountries,
    deviceBreakdown,
    referrerBreakdown,
    browserBreakdown,
    recentClicks,
    currentPeriodTotal,
    previousPeriodTotal,
  ] = await Promise.all([
    analyticsRepo.getLiveStats(shortCode),
    analyticsRepo.getClicksOverTime(urlId, rangeInDays),
    analyticsRepo.getBreakdownBy("country_code", urlId, rangeInDays, 10),
    analyticsRepo.getBreakdownBy("device_type", urlId, rangeInDays),
    analyticsRepo.getBreakdownBy("referrer_type", urlId, rangeInDays),
    analyticsRepo.getBreakdownBy("browser_name", urlId, rangeInDays, 5),
    analyticsRepo.getRecentClicks(urlId, 20),
    analyticsRepo.getTotalClicksForRange(urlId, rangeStart, today),
    analyticsRepo.getTotalClicksForRange(urlId, prevRangeStart, rangeStart),
  ]);

  const percentChange =
    previousPeriodTotal === 0
      ? null 
      : Math.round(
          ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) *
            100,
        );

  const countriesForChart = topCountries.length
    ? topCountries
    : live?.topCountries.map((c) => ({ key: c.key, clicks: c.count }));

  return {
    summary: {
      totalClicksAllTime: live!.totalClicks,
      humanClicksAllTime: live!.humanClicks,
      totalClicksInRange: currentPeriodTotal,
      percentChangeVsPreviousPeriod: percentChange,
      clicksLast24h: live!.last24hTotal,
    },
    charts: {
      clicksOverTime, 
      hourlyLast24h: live!.last24hHourly, 
      topCountries: countriesForChart, 
      deviceBreakdown, 
      referrerBreakdown, 
      browserBreakdown, 
    },
    recentClicks, 
  };
}
