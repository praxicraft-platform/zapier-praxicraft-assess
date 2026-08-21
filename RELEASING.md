# Releasing

Pushes to `main` that change integration source auto-bump the patch version, update `CHANGELOG.md`, tag `vX.Y.Z`, create a GitHub Release, and push to Zapier when `ZAPIER_DEPLOY_KEY` + `ZAPIER_APP_ID` secrets are set.

Skip with `[skip release]` in the commit message.
