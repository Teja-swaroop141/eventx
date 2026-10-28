const Redis = require('ioredis');

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const redis = new Redis({
  host: redisHost,
  port: redisPort,
  retryStrategy(times) {
    return Math.min(times * 200, 3000);
  }
});

redis.on('connect', () => {
  console.log(`[Worker] Connected to Redis at ${redisHost}:${redisPort}`);
});

redis.on('error', (err) => {
  console.error(`[Worker] Redis error: ${err.message}`);
});

async function closeRedis() {
  await redis.quit();
  console.log('[Worker] Redis connection closed.');
}

module.exports = { redis, closeRedis };
