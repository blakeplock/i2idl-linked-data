I2IDL EXPLORER ACTIVITY — PUBLIC DASHBOARD

REQUIRED: Provision an Upstash Redis database and attach its REST URL and token to your Vercel project. Configure these names for Production and Preview:
 UPSTASH_REDIS_REST_URL
 UPSTASH_REDIS_REST_TOKEN
Never commit credentials to GitHub. Until configured, /activity shows an honest unavailable message.

INSTALL
1. Create fresh branch from main in GitHub Desktop.
2. Unzip package INSIDE repository root. It will create the folder i2idl_activity_pkg.
3. Run: python3 i2idl_activity_pkg/apply_activity.py
4. Run: node --check api/activity.mjs && node --check lib/activity-store.mjs && node --check public/activity-dashboard.js && node --check public/explorer-activity.js && node --check api/research.mjs && npm run validate && git diff --check
5. Commit ONLY:
   api/activity.mjs
   lib/activity-store.mjs
   api/research.mjs
   public/activity.html
   public/activity-dashboard.js
   public/explorer-activity.js
   public/graph.html
   vercel.json
6. Push, PR, run checks and merge. Do NOT commit i2idl_activity_pkg folder. Delete it locally afterward.
7. With credentials configured, open https://id.i2idl.org/explore, select concepts, run a successful paper search, and then visit https://id.i2idl.org/activity.

DATA DEFINITIONS
Pageviews = Explorer page loads, not unique visitors.
Nodes explored = concept selections, including the initial selected concept.
Research searches = successful OpenAlex research queries.
Papers discovered = number of displayed results across searches, NOT unique papers.
Period = last 30 UTC calendar days, refresh on page load. Per-day aggregates expire after 90 days. No past activity is backfilled.

PRIVACY & ABUSE LIMITATIONS
No cookies, IPs, visitor identifiers, fingerprints or individual reading histories are stored by this feature. Requests to the Vercel platform may still be included in hosting logs per provider configuration. Same-origin checking, limited event schema, and client suppression discourage accidental events but are not bot-proof. Public counts are approximate, not audit-grade.
