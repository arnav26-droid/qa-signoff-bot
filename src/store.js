const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data.json");

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    return { claims: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    console.error("Failed to read data.json, starting fresh:", e.message);
    return { claims: {} };
  }
}

let state = load();

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

/**
 * claim shape:
 * {
 *   branch, userId, userName, note, inSyncWithMain,
 *   claimedAt (ms epoch), expiresAt (ms epoch),
 *   waiters: [{ userId, userName }]
 * }
 */

function getClaim(branch) {
  return state.claims[branch] || null;
}

function getAllClaims() {
  return state.claims;
}

function claimBranch(branch, userId, userName, durationMinutes, note, channelId, inSyncWithMain) {
  const now = Date.now();
  const expiresAt = now + durationMinutes * 60 * 1000;
  state.claims[branch] = {
    branch,
    userId,
    userName,
    note: note || "",
    inSyncWithMain: !!inSyncWithMain,
    claimedAt: now,
    expiresAt,
    waiters: [],
    channelId: channelId || null,
  };
  persist();
  return state.claims[branch];
}

function releaseBranch(branch) {
  const claim = state.claims[branch];
  delete state.claims[branch];
  persist();
  return claim || null;
}

function addWaiter(branch, userId, userName) {
  const claim = state.claims[branch];
  if (!claim) return null;
  if (!claim.waiters.some((w) => w.userId === userId)) {
    claim.waiters.push({ userId, userName });
    persist();
  }
  return claim;
}

function getExpiredBranches() {
  const now = Date.now();
  return Object.values(state.claims).filter((c) => c.expiresAt <= now);
}

module.exports = {
  getClaim,
  getAllClaims,
  claimBranch,
  releaseBranch,
  addWaiter,
  getExpiredBranches,
};
