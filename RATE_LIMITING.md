# Rate Limiting Configuration

The backend rate limiting system supports per-environment defaults and explicit environment variable overrides.

## Environment Profile

The profile is selected from:
- `ENV`
- fallback: `ENVIRONMENT`
- fallback default: `development`

Supported values:
- `development` (or anything not matched below)
- `staging` / `stage`
- `production` / `prod`

## Environment Variables

All values must be integers. Invalid values fall back to defaults.

### Global API limiter
- `API_GLOBAL_RATE_LIMIT` (requests per window, per IP)
- `API_GLOBAL_RATE_WINDOW_SECONDS` (window size)

### Login endpoint limiter
- `LOGIN_RATE_LIMIT` (requests per window, per IP)
- `LOGIN_RATE_WINDOW_SECONDS` (window size)

### Brute-force lockout
- `LOGIN_FAIL_THRESHOLD` (failed attempts before lockout, per IP + username)
- `LOGIN_LOCKOUT_SECONDS` (lockout duration)

## Defaults by Profile

### development
- Global API: `1200 / 60s`
- Login rate: `30 / 60s`
- Lockout threshold: `10`
- Lockout duration: `300s`

### staging
- Global API: `300 / 60s`
- Login rate: `10 / 60s`
- Lockout threshold: `5`
- Lockout duration: `600s`

### production
- Global API: `240 / 60s`
- Login rate: `8 / 60s`
- Lockout threshold: `5`
- Lockout duration: `900s`

## Example

```bash
ENV=production
API_GLOBAL_RATE_LIMIT=180
API_GLOBAL_RATE_WINDOW_SECONDS=60
LOGIN_RATE_LIMIT=6
LOGIN_RATE_WINDOW_SECONDS=60
LOGIN_FAIL_THRESHOLD=4
LOGIN_LOCKOUT_SECONDS=1200
```
