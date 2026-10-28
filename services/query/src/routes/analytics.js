const express = require('express');
const { getDb } = require('../db');
const { redis } = require('../redis');
const router = express.Router();

// How long results live in Redis before MongoDB has to crunch the numbers again
const CACHE_TTL = 10; 

// A clever helper function that completely abstracts caching away from the API logic
async function getCachedOrFetch(cacheKey, fetchFunction) {
  // 1. Try Redis first
  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    const parsed = JSON.parse(cachedData);
    parsed._source = 'REDIS_CACHE'; // For debugging/visibility
    return parsed; 
  }

  // 2. Cache Miss - Execute the slow MongoDB task
  const freshData = await fetchFunction();
  freshData._source = 'MONGODB_LIVE';
  
  // 3. Save to Redis with an expiration of 10s
  await redis.set(cacheKey, JSON.stringify(freshData), 'EX', CACHE_TTL);
  
  return freshData;
}

// ---------------------------------------------------------
// GET /api/query/metrics/overview
// ---------------------------------------------------------
router.get('/metrics/overview', async (req, res) => {
  try {
    const db = getDb();
    
    const userId = req.user.id || req.user.user_id || 'default';
    const cacheKey = `cache:query:overview:${userId}`;

    const data = await getCachedOrFetch(cacheKey, async () => {
      // MongoDB Aggregations
      const totalEvents = await db.collection('events').countDocuments({});
      const uniqueUsersList = await db.collection('events').distinct('user_id');

      return {
        total_events: totalEvents,
        unique_users: uniqueUsersList.length,
        timestamp: new Date().toISOString()
      };
    });

    res.json(data);
  } catch (err) {
    console.error('Overview query error:', err);
    res.status(500).json({ error: 'Failed to generate overview metrics.' });
  }
});

// ---------------------------------------------------------
// GET /api/query/events/list
// ---------------------------------------------------------
router.get('/events/list', async (req, res) => {
  try {
    const db = getDb();
    // Fetch live from MongoDB so simulated & real-time events appear immediately without cache staleness
    const recentEvents = await db.collection('events')
      .find({})
      .sort({ _id: -1 })
      .limit(100)
      .toArray();
    
    res.json({ events: recentEvents, _source: 'MONGODB_LIVE' });
  } catch (err) {
    console.error('List query error:', err);
    res.status(500).json({ error: 'Failed to fetch event list.' });
  }
});

// ---------------------------------------------------------
// GET /api/query/events/breakdown
// ---------------------------------------------------------
router.get('/events/breakdown', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id || req.user.user_id || 'default';
    const cacheKey = `cache:query:breakdown:${userId}`;

    const data = await getCachedOrFetch(cacheKey, async () => {
      // A powerful MongoDB pipeline: Group everything by the "event" string, and count them
      const pipeline = [
        { 
          $group: { 
            _id: "$event", 
            count: { $sum: 1 } 
          } 
        },
        { 
          $sort: { count: -1 } // Sort highest counts first
        }
      ];

      const breakdown = await db.collection('events').aggregate(pipeline).toArray();
      return { breakdown };
    });

    res.json(data);
  } catch (err) {
    console.error('Breakdown query error:', err);
    res.status(500).json({ error: 'Failed to generate event breakdown.' });
  }
});

module.exports = router;
