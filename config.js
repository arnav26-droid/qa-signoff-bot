// Curated list of repos to show in /qa's repo picker (rather than every repo
// in the org). Edit this list directly to add/remove repos.
const REPOS = [
  "apiForge",
  "banking-integrations",
  "db-proxy",
  "devops",
  "email-parser",
  "exchange-server",
  "fix-trading",
  "github-actions",
  "mavericks",
  "ofx-application-platform",
  "ofx-bank-service",
  "ofx-electrum",
  "ofx-emails",
  "ofx-payouts-mvp-service",
  "ofx-post-trade-ops-service",
  "ofx-primevault-integration",
  "ofx-sentinel",
  "omni",
  "pricing-oracle-anomaly-detection",
  "pricing-oracle-consumer",
  "pricing-oracle-rest-server",
  "pricing-oracle-s3-writer",
  "pricing-oracle-ws-server",
  "procurement-engine",
  "procurement-server",
  "re-admin-service",
  "re-api-service",
  "re-auth-service",
  "re-automation",
  "re-banking-webhook-service",
  "re-client-service",
  "re-email-service",
  "re-liminal-proxy-service",
  "re-lp-adapters",
  "re-ops-service",
  "re-primevault-webhook-service",
  "simple-order-router",
  "temporal-workers",
  "typescript-packages",
];

// Claim durations offered on /branch, in minutes.
const DURATIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
];

module.exports = { REPOS, DURATIONS };
