# Contributing

Thanks for helping improve the Praxicraft Assess Zapier integration.

## Local setup

```bash
git clone https://github.com/praxicraft-platform/zapier-praxicraft-assess.git
cd zapier-praxicraft-assess
npm install
npm test
npx zapier validate
```

## Guidelines

- This app is a thin wrapper around the [Assess Public API](https://docs.praxicraft.com). Prefer matching documented paths and error codes over inventing new abstractions.
- Keep HTTP mocked in tests. Do not call production from CI.
- Creates are writes; searches are GET / list. The REST Hook trigger subscribes one event per Zap.

## Pull requests

1. Open a PR against `main`.
2. Ensure `npm test` and `npx zapier validate` are green locally; CI runs both on every push.
3. Describe the user-facing change briefly in the PR body.

## Deploy

GitHub Actions runs tests on every pull request and push. Pushes to `main` also run `zapier push` when these repo secrets are set:

| Secret | Where to get it |
|--------|-----------------|
| `ZAPIER_DEPLOY_KEY` | [Zapier deploy keys](https://developer.zapier.com/partner-settings/deploy-keys/) |
| `ZAPIER_APP_ID` | Numeric `id` in `.zapierapprc` after `npx zapier register "Praxicraft Assess"` (once) |

Until both secrets exist, the deploy step is skipped and tests still run. `.zapierapprc` is gitignored; CI writes it from `ZAPIER_APP_ID`.
