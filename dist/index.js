process.loadEnvFile();
import app from "./app.js";
import { PgPool } from "./db/index.js";
import redis from "./config/redis/index.redis.js";
const server = app.listen(process.env.PORT, () => {
    console.log(`App is running on port http://localhost:${process.env.PORT}`);
});
process.on("SIGTERM", async () => {
    server.close(async () => {
        await PgPool.end();
        await redis.quit();
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map