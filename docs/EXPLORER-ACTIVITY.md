# Explorer Activity: Public Aggregate Analytics

[Documentation index](README.md) · [Project overview](../README.md)

Public dashboard: [id.i2idl.org/activity](https://id.i2idl.org/activity). The dashboard provides a rolling 30-day UTC view using Upstash Redis through Vercel serverless functions.

## Metrics and definitions

| Metric | Definition |
|---|---|
| Pageviews | Graph Explorer page loads; not unique visitors |
| Nodes explored | Concept selections, including the initially selected concept; repeated selections count again |
| Research searches | Successful OpenAlex research requests (as counted by the server) |
| Papers discovered | Number of publication results returned across successful research searches; **not** distinct papers |
| Popular concepts | Aggregated counts of concept selections over the reporting period |

Counting begins when collection is deployed and properly configured. This feature does not reconstruct historical usage. Counts are approximate and can be affected by scripted traffic, retries, and browser/network conditions.

## Architecture and privacy

`public/explorer-activity.js` sends restricted anonymous Explorer events to `POST /api/activity`. The research API counts completed scholarly searches and returned results on the server; the browser cannot submit arbitrary paper totals. `GET /api/activity` reads rolling aggregates for `public/activity-dashboard.js`.

The analytics store contains aggregate counters keyed by day and concept slug. Application code does **not intentionally write** IP addresses, cookies, visitor IDs, fingerprints, search text, or personal reading histories to Redis. Upstream hosting, network, and provider logs are separate and subject to their own retention settings. Redis counters expire after 90 days, while the public dashboard currently summarizes 30 days.

This is **not** a unique-visitor analytics system or an abuse-proof accounting mechanism. Same-origin validation, input constraints, and client throttling reduce accidental abuse but cannot prevent all automated traffic. Do not interpret counts as independent people, unique papers, or verified academic engagement.

## Environment configuration

Configure these secret environment variables for each Vercel deployment environment that serves this feature:

- `UPSTASH_REDIS_REST_URL` — HTTPS REST endpoint for a write-capable Upstash Redis database.
- `UPSTASH_REDIS_REST_TOKEN` — write-capable REST token, **not** a read-only token.

Vercel marketplace integrations may initially create variables such as `KV_REST_API_URL` and `KV_REST_API_TOKEN`; the current implementation specifically reads the `UPSTASH_REDIS_REST_*` names. Do not put credential values in GitHub or support screenshots. **Redeploy after changing environment variables** so the running functions receive the new values.

## Diagnostics

1. Visit `/activity` and check for the public dashboard.
2. Open `/api/activity` in a browser. A healthy response has `totals`, `trend`, and `popularConcepts`.
3. A message saying **Activity dashboard is not configured yet** means the required variable names/values were not available in the deployment.
4. A message saying **Activity statistics unavailable** means the server attempted a storage operation but failed; inspect sanitized Vercel function logs and Upstash health/permissions.
5. Visit `/explore`, select a few concepts, perform a successful scholarly search, and refresh `/activity` to verify counts move.

Avoid logging secrets or complete authorization headers while troubleshooting.
