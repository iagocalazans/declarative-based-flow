# GitHub Actions Workflows

This directory contains automated workflows for the declarative-based-flow project.

## Available Workflows

### 📦 Publish to npm (`publish.yml`)

**Trigger:** When a GitHub Release is published

**Purpose:** Automatically publish the package to npm with version synchronization

**Steps:**

1. Checkout repository
2. Setup Node.js 18
3. Install dependencies (`npm ci`)
4. Sync version from release tag to package.json
5. Run tests (`npm test`)
6. Build package (`npm run build`)
7. Verify package contents
8. Publish to npm with provenance

**Requirements:**

- `NPM_TOKEN` secret must be configured in repository settings
- Release tag should follow format `v0.1.0` or `0.1.0`

**Example Usage:**

```bash
# Create a new release
gh release create v0.1.0 --title "🎉 Release v0.1.0" --notes "Initial release"

# Workflow automatically:
# - Syncs version 0.1.0 to package.json
# - Runs tests
# - Builds package
# - Publishes to npm
```

---

### 🧪 Node.js CI (`node.js.yml`)

**Trigger:** On push to master branch and pull requests

**Purpose:** Run tests and ensure code quality

**Steps:**

1. Checkout repository
2. Setup Node.js
3. Install dependencies
4. Run tests
5. Build package

---

## Secrets Configuration

Add the following secrets in repository settings:

```
Settings → Secrets and variables → Actions → New repository secret
```

### Required Secrets

- **`NPM_TOKEN`**: npm automation token for publishing
  - Get from: https://www.npmjs.com/settings/[username]/tokens
  - Type: Automation token

---

## Workflow Status

Check workflow runs at:

https://github.com/iagocalazans/declarative-based-flow/actions

---

## Troubleshooting

### Publish workflow fails with "npm ERR! need auth"

- Ensure `NPM_TOKEN` secret is correctly configured
- Verify token has publish permissions
- Check token hasn't expired

### Version mismatch errors

- Ensure release tag matches semver format (e.g., `v0.1.0`)
- Check package.json version before creating release

### Tests failing in CI

- Run `npm test` locally to reproduce
- Check Node.js version compatibility
- Verify all dependencies are in package.json

---