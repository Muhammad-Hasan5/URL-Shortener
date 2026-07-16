import client from "prom-client";

const Registry = client.Registry;
const register = new Registry();

client.collectDefaultMetrics();

export const requestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
});

register.registerMetric(requestDuration);

export const cacheRequests = new client.Counter({
  name: "cache_requests",
  help: "Total cache requests segmented by hit/miss",
  labelNames: ["result", "cache_method"],
});

register.registerMetric(cacheRequests);

export default register;
