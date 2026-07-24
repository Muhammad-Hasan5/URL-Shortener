import express from "express";
import swaggerJSDoc from "swagger-jsdoc";
import { serve, setup } from "swagger-ui-express";
import env from "../config/env.js";

const router = express.Router();

const options: swaggerJSDoc.Options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "URL Shortener API",
      version: "2.0.0",
      description: "Swagger documentation for the URL shortening service",
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication and account management endpoints",
      },
      {
        name: "URL",
        description: "Short URL creation, listing, and deletion endpoints",
      },
      {
        name: "Analytics",
        description: "Analytics endpoints for shortened URLs",
      },
      { name: "Health", description: "Service health and metrics endpoints" },
    ],
    servers: [
      {
        url: `${env.APP_URL}`,
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        accessTokenCookie: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
        },
        refreshTokenCookie: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "verifyJWT also accepts 'Authorization: Bearer <accessToken>' as a fallback if the accessToken cookie is absent.",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          description:
            "Standard success envelope used by auth/url/analytics controllers.",
          properties: {
            status: { type: "integer", example: 200 },
            data: { nullable: true },
            msg: { type: "string", example: "Success" },
          },
        },
        ErrorResponse: {
          type: "object",
          description:
            "Standard error envelope used by auth/url/analytics controllers.",
          properties: {
            status: { type: "integer", example: 400 },
            data: { nullable: true },
            msg: { type: "string", example: "Something went wrong" },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          description:
            "Returned by the validateRequest (Zod) middleware when request validation fails. Note this shape (status:'fail' + errors[]) is DIFFERENT from ErrorResponse used everywhere else.",
          properties: {
            status: { type: "string", example: "fail" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "email" },
                  message: { type: "string", example: "Invalid email" },
                },
              },
            },
          },
        },
        UserObject: {
          type: "object",
          description:
            "Sanitized user row (password_hash, refresh_token, and verification/reset tokens stripped by sanitizeUser()).",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "9c858901-8a57-4791-81fe-4c455b099bc9",
            },
            first_name: { type: "string", nullable: true, example: "John" },
            last_name: { type: "string", nullable: true, example: "Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            provider: { type: "string", example: "local" },
            provider_id: { type: "string", nullable: true, example: null },
            status: {
              type: "string",
              enum: ["active", "inactive", "suspended", "deleted"],
              example: "active",
            },
            email_verified: { type: "boolean", example: true },
            email_verified_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2025-01-15T10:30:00.000Z",
            },
            avatar_url: { type: "string", nullable: true, example: null },
            last_login_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2025-02-01T08:15:00.000Z",
            },
            last_login_ip: {
              type: "string",
              nullable: true,
              description: "Hashed IP (see haship util), not a raw IP.",
              example: "6f1e2c9b1a...",
            },
            failed_login_attempts: { type: "integer", example: 0 },
            locked_until: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: null,
            },
            deleted_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: null,
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2025-01-15T10:30:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2025-01-15T10:30:00.000Z",
            },
          },
        },

        UrlListItem: {
          type: "object",
          description:
            "Shape returned by GET /urls-list.",
          properties: {
            short_code: { type: "string", example: "aZ3xQ1" },
            long_url: {
              type: "string",
              example: "https://example.com/very/long/path",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2025-01-15T10:30:00.000Z",
            },
          },
        },
        UrlRecord: {
          type: "object",
          description:
            "Full 'urls' table row. This is what /shorten currently returns.",
          properties: {
            id: { type: "string", example: "7361028450123456789" },
            user_id: { type: "string", format: "uuid" },
            short_code: { type: "string", example: "aZ3xQ1" },
            long_url: {
              type: "string",
              example: "https://example.com/very/long/path",
            },
            click_count: { type: "integer", example: 0 },
            created_at: { type: "string", format: "date-time" },
            last_accessed_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            expires_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            deleted_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },
        ShortenSuccessData: {
          type: "object",
          description:
            "Shape returned on 201 (newly created short URL) and on the cache-hit 200 path (url is a plain string).",
          properties: {
            url_id: { type: "string", example: "7361028450123456789" },
            url: {
              type: "string",
              example: "https://url.ly/aZ3xQ1",
            },
          },
        },

        ClicksOverTimePoint: {
          type: "object",
          properties: {
            date: { type: "string", format: "date", example: "2025-02-01" },
            totalClicks: { type: "integer", example: 42 },
            uniqueClicks: { type: "integer", example: 30 },
          },
        },
        BreakdownEntry: {
          type: "object",
          properties: {
            key: { type: "string", example: "US" },
            clicks: { type: "integer", example: 128 },
          },
        },
        RecentClick: {
          type: "object",
          properties: {
            clicked_at: { type: "string", format: "date-time" },
            country_name: {
              type: "string",
              nullable: true,
              example: "United States",
            },
            city: { type: "string", nullable: true, example: "New York" },
            device_type: { type: "string", nullable: true, example: "mobile" },
            browser_name: { type: "string", nullable: true, example: "Chrome" },
            referrer_type: {
              type: "string",
              nullable: true,
              example: "social",
            },
          },
        },
        AnalyticsData: {
          type: "object",
          description:
            "Return value of getDataForDashboard (analytics.service.ts), for a fixed 30-day range.",
          properties: {
            summary: {
              type: "object",
              properties: {
                totalClicksAllTime: { type: "integer", example: 5210 },
                humanClicksAllTime: { type: "integer", example: 4830 },
                totalClicksInRange: { type: "integer", example: 812 },
                percentChangeVsPreviousPeriod: {
                  type: "integer",
                  nullable: true,
                  description: "null when the previous period had 0 clicks.",
                  example: 12,
                },
                clicksLast24h: { type: "integer", example: 37 },
              },
            },
            charts: {
              type: "object",
              properties: {
                clicksOverTime: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ClicksOverTimePoint" },
                },
                hourlyLast24h: {
                  type: "array",
                  description: "24 integers, oldest hour first.",
                  items: { type: "integer" },
                  example: [
                    1, 0, 2, 3, 1, 0, 0, 4, 5, 2, 1, 0, 3, 2, 1, 0, 1, 2, 3, 4,
                    2, 1, 0, 1,
                  ],
                },
                topCountries: {
                  type: "array",
                  items: { $ref: "#/components/schemas/BreakdownEntry" },
                },
                deviceBreakdown: {
                  type: "array",
                  items: { $ref: "#/components/schemas/BreakdownEntry" },
                },
                referrerBreakdown: {
                  type: "array",
                  items: { $ref: "#/components/schemas/BreakdownEntry" },
                },
                browserBreakdown: {
                  type: "array",
                  items: { $ref: "#/components/schemas/BreakdownEntry" },
                },
              },
            },
            recentClicks: {
              type: "array",
              items: { $ref: "#/components/schemas/RecentClick" },
            },
          },
        },

        HealthLiveResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Server is healthy and live.",
            },
          },
        },
        HealthReadyResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["ready", "degraded", "not_ready"],
              example: "ready",
            },
            database: { type: "string", example: "up" },
            cache: { type: "string", example: "up" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

require("swagger-model-validator")(swaggerSpec);

router.use("/", serve, setup(swaggerSpec));

export default router;
