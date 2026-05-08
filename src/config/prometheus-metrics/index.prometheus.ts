import client from "prom-client";

const Registery = client.Registry;
const register = new Registery();

client.collectDefaultMetrics({ register });

// a histogram for request duration
// metrics checking a req completion time
export const requestDuration = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "status"],
  buckets: [5, 10, 25, 50, 100, 250, 500],
});

register.registerMetric(requestDuration)

//calculating number of cache requests 
// segmented on hit or miss
export const cacheRequests = new client.Counter({
  name: "cache_requets",
  help: "Total number of cache requests, labeled by result (hit/miss).",
  labelNames: ["result", "cache_method"],
});

register.registerMetric(cacheRequests);

export default register
