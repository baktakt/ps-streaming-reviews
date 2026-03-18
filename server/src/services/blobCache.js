/**
 * Two-layer cache: L1 = in-memory NodeCache (fast, ephemeral)
 *                  L2 = Vercel Blob (persistent across deploys/restarts)
 *
 * Falls back to L1-only when BLOB_READ_WRITE_TOKEN is not set.
 */

const NodeCache = require('node-cache');
const { put, list } = require('@vercel/blob');

// Sanitise arbitrary cache keys to safe blob pathnames
function encodeKey(key) {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

class BlobCache {
  /**
   * @param {object} opts
   * @param {number} opts.stdTTL   - TTL in seconds (used for both layers)
   * @param {string} opts.prefix  - blob path prefix, e.g. 'ps-portal/list/'
   */
  constructor({ stdTTL, prefix }) {
    this.ttl = stdTTL;
    this.prefix = prefix;
    // L1: keep entries for at most 5 min (or the configured TTL, whichever is shorter)
    this.mem = new NodeCache({ stdTTL: Math.min(stdTTL, 300), useClones: false });
  }

  async get(key) {
    // L1 hit
    const memVal = this.mem.get(key);
    if (memVal !== undefined) return memVal;

    // L2 – only attempt if the token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

    try {
      const pathname = this.prefix + encodeKey(key) + '.json';
      const { blobs } = await list({
        prefix: pathname,
        limit: 1,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      const blob = blobs.find((b) => b.pathname === pathname);
      if (!blob) return null;

      const res = await fetch(blob.downloadUrl);
      if (!res.ok) return null;

      const { v, exp } = await res.json();

      // Honour TTL stored alongside the value
      if (exp && Date.now() > exp) return null;

      // Populate L1 so the next read within the same process is instant
      this.mem.set(key, v);
      return v;
    } catch (err) {
      console.warn(`[BlobCache] get("${key}") failed:`, err.message);
      return null;
    }
  }

  async set(key, value) {
    // Always write L1
    this.mem.set(key, value);

    if (!process.env.BLOB_READ_WRITE_TOKEN) return;

    try {
      const pathname = this.prefix + encodeKey(key) + '.json';
      const entry = {
        v: value,
        exp: Date.now() + this.ttl * 1000,
      };
      await put(pathname, JSON.stringify(entry), {
        access: 'public',
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: 'application/json',
      });
    } catch (err) {
      console.warn(`[BlobCache] set("${key}") failed:`, err.message);
    }
  }
}

module.exports = { BlobCache };
