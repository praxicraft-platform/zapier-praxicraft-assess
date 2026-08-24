# Releasing

Pushes to `main` that change integration source auto-bump the patch version, update `CHANGELOG.md`, tag `vX.Y.Z`, create a GitHub Release, and push to Zapier when `ZAPIER_DEPLOY_KEY` + `ZAPIER_APP_ID` secrets are set.

Skip with `[skip release]` in the commit message.

## Zapier versioning

Zapier rejects skipped unlabelled versions (`0.0.1` needs `0.0.0`). The first production push must be **`1.0.0`** (or higher major). CI uses `package.json` for the first release and only patch-bumps from existing `v1.x.x` (or later) git tags.
