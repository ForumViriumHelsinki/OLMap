# OLMap Dependency Analysis Report
**Generated:** 2025-11-13

## Executive Summary

This analysis reveals significant technical debt in both frontend and backend dependencies. The project is using outdated versions with multiple critical security vulnerabilities and deprecated packages.

**Key Findings:**
- 🔴 **Critical**: 2 critical vulnerabilities, 8+ high-severity issues in frontend
- 🟡 **Moderate**: Multiple breaking changes required for major upgrades
- 🟢 **Backend**: Relatively well-maintained with minor updates needed
- ⚠️ **Deprecated**: Several packages superseded or approaching EOL

---

## 🎨 Frontend Dependencies (React/npm)

### Current State
- **React**: 16.12.0 (Latest: 19.2.0) - **3 major versions behind**
- **react-scripts**: 3.4.4 (Latest: 5.0.1) - **DEPRECATED** (no longer maintained)
- **TypeScript**: 3.7.4 (Latest: 5.9.3) - **2 major versions behind**
- **Node Version**: Requires `--openssl-legacy-provider` flag (outdated OpenSSL)

### 🚨 Critical Security Vulnerabilities

#### 1. **@xmldom/xmldom** (CRITICAL - CVSS 9.8)
- **Issue**: Allows multiple root nodes in DOM
- **CVE**: GHSA-crh6-fp67-6883
- **Affected**: `osmtogeojson@3.0.0-beta.4`
- **Fix**: Upgrade to `osmtogeojson@2.2.12` (downgrade) or wait for beta.5+

#### 2. **cipher-base** (CRITICAL - CVSS 9.1)
- **Issue**: Missing type checks, hash rewind vulnerability
- **CVE**: GHSA-cpq7-6gpm-g9rc
- **Fix**: Update to latest version via react-scripts upgrade

#### 3. **form-data** (CRITICAL)
- **Issue**: Uses unsafe random function for boundary generation
- **CVE**: GHSA-fjxv-7rqg-78g4
- **Fix**: Indirect dependency, resolved with updates

### 🔴 High-Severity Vulnerabilities

1. **braces** (CVSS 7.5) - Resource consumption DoS
2. **ansi-html** (CVSS 7.5) - Uncontrolled resource consumption
3. **ip** (CVSS 8.1) - SSRF vulnerability
4. **cross-spawn** (CVSS 7.5) - ReDoS vulnerability
5. **http-proxy-middleware** (Multiple CVEs)
6. **svgo/css-select** (nth-check vulnerability)

### 📦 Major Packages Requiring Updates

#### Core Framework (BREAKING CHANGES)
```json
{
  "react": "^16.12.0" → "^18.3.1" (recommend 18.x, not 19.x yet)
  "react-dom": "^16.12.0" → "^18.3.1"
  "react-scripts": "^3.4" → "^5.0.1" (or migrate to Vite)
  "typescript": "^3.7.4" → "^5.9.3"
}
```

**Migration Impact**:
- React 16→18 requires:
  - Replace `ReactDOM.render()` with `createRoot()`
  - Update testing utilities
  - Review deprecated lifecycle methods
  - Test Concurrent Mode features

#### Testing Libraries (BREAKING CHANGES)
```json
{
  "@testing-library/react": "^9.3.2" → "^16.3.0"
  "@testing-library/jest-dom": "^4.2.4" → "^6.9.1"
  "@testing-library/user-event": "^7.1.2" → "^14.6.1"
}
```

#### Form Libraries (BREAKING CHANGES)
```json
{
  "@rjsf/core": "^2.5.1" → "^6.1.0" (security fix required)
  "@rjsf/bootstrap-4": "^2.5.1" → "^5.24.13"
}
```

**Note**: react-jsonschema-form is SUPERSEDED by @rjsf packages. Remove `react-jsonschema-form` entirely.

#### Maps & GIS
```json
{
  "react-leaflet": "^2.8.0" → "^5.0.0" (MAJOR rewrite)
  "leaflet": "^1.6.0" → "^1.9.4" (good, only minor update)
  "mapbox-gl": "^1.12.0" → "^3.16.0" (breaking changes)
  "@turf/turf": "^6.5.0" → "^7.2.0"
}
```

**⚠️ react-leaflet v2→v5**: Complete API rewrite
- Now uses React Hooks exclusively
- Different component structure
- Requires refactoring all map components

#### Monitoring & Error Tracking
```json
{
  "@sentry/browser": "^5.12.1" → "^10.25.0" (security fix)
}
```

#### UI Framework
```json
{
  "bootstrap": "^4.4.1" → "^5.3.8" (breaking)
  "react-bootstrap": "^1.6.0" → "^2.10.10"
  "reactstrap": "^8.4.0" → "^9.2.3"
}
```

**Note**: Bootstrap 4→5 is a major rewrite with breaking changes

#### Routing
```json
{
  "react-router-dom": "^5.1.2" → "^7.9.5" (v6 API changes)
}
```

**⚠️ v5→v6→v7**: Major API changes
- `<Switch>` → `<Routes>`
- `<Route component={}>` → `<Route element={</>}`
- Hook-based navigation

#### Deprecated/Superseded

1. **react-scripts** - No longer actively maintained
   - **Recommended**: Migrate to **Vite** or **Next.js**
   - Vite offers faster builds and better DX
   - Can use `@vitejs/plugin-react` for migration

2. **moment.js** - In maintenance mode (not receiving updates)
   - **Recommended**: Migrate to **date-fns** or **Day.js**
   - Moment is much larger (~67KB) vs Day.js (~2KB)

3. **react-jsonschema-form** - Superseded by @rjsf packages
   - Already using @rjsf/* packages
   - Remove the legacy package completely

### 🎯 Recommended Frontend Upgrade Path

#### Phase 1: Security Fixes (URGENT)
```bash
# Fix critical vulnerabilities
npm update @sentry/browser@10.25.0
npm update osmtogeojson  # May need to test beta.5
npm audit fix --force  # With caution, test thoroughly
```

#### Phase 2: React 18 Migration (HIGH PRIORITY)
```bash
npm install react@18.3.1 react-dom@18.3.1
npm install react-scripts@5.0.1
npm install typescript@5.9.3
```

**Required Code Changes:**
- Update `src/index.tsx`: Use `createRoot()` API
- Update tests: New testing library APIs
- Remove `--openssl-legacy-provider` flags
- Test all components for React 18 compatibility

#### Phase 3: Consider Vite Migration (RECOMMENDED)
react-scripts is no longer actively maintained. Modern alternatives:

**Option A: Vite (Recommended)**
```bash
npm create vite@latest olmap_ui -- --template react-ts
# Migrate files gradually
```

**Benefits:**
- Extremely fast hot reload
- Better build performance
- Active development
- Smaller bundle sizes

**Option B: Stay with CRA 5.0.1**
- Less migration work
- But limited future support

#### Phase 4: Library Updates (MEDIUM PRIORITY)
```bash
# Maps
npm install react-leaflet@5.0.0  # Breaking changes!
npm install mapbox-gl@3.16.0

# Forms
npm install @rjsf/core@6.1.0 @rjsf/bootstrap-4@5.24.13
npm uninstall react-jsonschema-form

# Testing
npm install @testing-library/react@16.3.0
npm install @testing-library/jest-dom@6.9.1
npm install @testing-library/user-event@14.6.1

# Routing
npm install react-router-dom@6.28.0  # v7 may be too new
```

#### Phase 5: Date Library (LOW PRIORITY)
```bash
# Replace moment with day.js
npm uninstall moment
npm install dayjs@1.11.13

# Or date-fns
npm install date-fns@4.1.0
```

### 🔧 Breaking Change Mitigation

**1. React 18 Migration**
```typescript
// Old (React 16)
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// New (React 18)
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

**2. React Router v6**
```typescript
// Old (v5)
<Switch>
  <Route path="/notes" component={NotesPage} />
</Switch>

// New (v6)
<Routes>
  <Route path="/notes" element={<NotesPage />} />
</Routes>
```

**3. react-leaflet v5**
Complete rewrite - requires full refactor of map components. Consider:
- Allocate 2-3 days for migration
- Test all map interactions thoroughly
- New hook-based API

---

## 🐍 Backend Dependencies (Python/Django)

### Current State
Much better maintained than frontend! Django and core packages are relatively up-to-date.

### 📊 Minor Updates Available

```toml
# All are patch/minor updates (safe to upgrade)
django = "5.2.7" → "5.2.8"
django-allauth = "65.12.1" → "65.13.0"
google-cloud-translate = "3.22.0" → "3.23.0"
sentry-sdk = "2.43.0" → "2.44.0"
twilio = "9.8.5" → "9.8.6"
ruff = "0.14.2" → "0.14.4"
coverage = "7.11.0" → "7.11.3"
```

### ⚠️ Concerns & Recommendations

#### 1. **Loose Version Constraints**
Current `pyproject.toml` uses `>=` which can lead to breaking changes:

```toml
# Current (risky)
django>=3.0

# Recommended
django>=5.2,<6.0  # Pin major version
```

**Action Required:**
```toml
[project]
dependencies = [
    "django>=5.2,<6.0",
    "djangorestframework>=3.10,<4.0",
    "django-allauth>=65.0,<66.0",
    # ... apply to all
]
```

#### 2. **UUID Package**
```toml
"uuid",  # This is built-in to Python 3.x, remove this line
```
**Action**: Remove from dependencies (built-in since Python 2.5)

#### 3. **Django Version Support**
Metadata claims Django 3.0 support but requires Django 5.2:
```toml
# Update classifiers
"Framework :: Django :: 5.0",
"Framework :: Django :: 5.1",
"Framework :: Django :: 5.2",
```

#### 4. **Python Version Alignment**
```toml
requires-python = ">=3.11"  # Good!

# But remove outdated classifiers:
# Remove: "Programming Language :: Python :: 3.9",
# Remove: "Programming Language :: Python :: 3.10",
```

### 🎯 Backend Upgrade Commands

```bash
cd django_server

# Safe minor updates
uv sync --upgrade

# Update pyproject.toml with version constraints
# Then lock new versions
uv lock --upgrade
```

### 🔍 Backend Security Notes

No critical vulnerabilities found in backend dependencies! The Python ecosystem is well-maintained.

**Good practices already in place:**
- Using `uv` for fast dependency management
- Ruff for modern linting
- Django 5.2 (current stable)
- Python 3.11+ requirement

---

## 🗺️ Migration Roadmap

### Immediate (This Week)
1. ✅ Fix critical npm vulnerabilities
2. ✅ Update backend dependencies (minor versions)
3. ✅ Clean up pyproject.toml (remove uuid, fix constraints)

### Short Term (1-2 Months)
1. 🔄 Upgrade to React 18
2. 🔄 Upgrade react-scripts to 5.0.1
3. 🔄 Update TypeScript to 5.x
4. 🔄 Migrate testing libraries

### Medium Term (3-6 Months)
1. 🔄 Evaluate Vite migration vs staying on CRA
2. 🔄 Upgrade react-router to v6
3. 🔄 Upgrade react-leaflet to v5 (major effort)
4. 🔄 Replace Moment.js with Day.js

### Long Term (6+ Months)
1. 🔄 Consider React 19 (after ecosystem stabilizes)
2. 🔄 Bootstrap 5 migration (if needed)
3. 🔄 Evaluate Mapbox GL alternatives (licensing considerations)

---

## 📈 Effort Estimates

### Frontend
| Task | Effort | Risk | Priority |
|------|--------|------|----------|
| Security fixes | 1-2 days | Medium | URGENT |
| React 18 upgrade | 3-5 days | Medium | High |
| Testing library updates | 2-3 days | Low | High |
| Vite migration | 5-10 days | High | Medium |
| react-leaflet v5 | 5-7 days | High | Medium |
| react-router v6 | 2-4 days | Medium | Medium |
| Moment.js replacement | 1-2 days | Low | Low |

### Backend
| Task | Effort | Risk | Priority |
|------|--------|------|----------|
| Update pyproject.toml | 1 hour | Low | High |
| Minor version updates | 1 hour | Low | High |
| Testing after updates | 2-4 hours | Low | High |

**Total Estimated Effort:** 3-5 weeks of development time

---

## 🎓 Key Recommendations

### 1. **Prioritize Security**
Address critical vulnerabilities immediately. The @xmldom and cipher-base vulnerabilities are actively exploitable.

### 2. **Incremental Migration**
Don't try to upgrade everything at once. Follow the phased approach:
- Security fixes first
- React 18 next
- Other libraries gradually

### 3. **Consider Vite**
react-scripts is no longer maintained. Starting a Vite migration now will save pain later.

### 4. **Test Coverage**
Ensure good test coverage before major upgrades. The existing Playwright e2e tests will be invaluable.

### 5. **React-Leaflet Challenge**
The react-leaflet v2→v5 upgrade is the most significant change. Budget adequate time and consider:
- Can you delay this?
- Are there alternative approaches?
- Test map functionality extensively

### 6. **Backend is Good!**
Your Python/Django stack is well-maintained. Just tighten version constraints and update minor versions.

### 7. **Node Version**
Remove `--openssl-legacy-provider` flags after React 18 upgrade. This indicates outdated Node version or dependencies.

---

## 🔗 Useful Resources

### React 18 Migration
- https://react.dev/blog/2022/03/08/react-18-upgrade-guide
- https://github.com/reactwg/react-18/discussions

### Vite Migration
- https://vitejs.dev/guide/migration-from-v2.html
- https://github.com/vitejs/vite/tree/main/packages/plugin-react

### React Router v6
- https://reactrouter.com/en/main/upgrading/v5

### React-Leaflet v4/v5
- https://react-leaflet.js.org/docs/start-installation/
- Major API rewrite, read docs carefully

### Day.js (Moment replacement)
- https://day.js.org/docs/en/installation/installation

---

## 📋 Next Steps

1. **Review this document** with the team
2. **Prioritize** based on business needs and risk tolerance
3. **Create tickets** for each phase
4. **Allocate resources** (estimated 3-5 weeks total)
5. **Set up feature branch** for major upgrades
6. **Plan for downtime/testing** after each phase

---

## ⚙️ Configuration Changes Needed

### Remove after React 18 upgrade:
```json
// package.json - Remove these flags
"scripts": {
  "start": "react-scripts start",  // Remove --openssl-legacy-provider
  "build": "react-scripts build",  // Remove --openssl-legacy-provider
}
```

### Update Python classifiers:
```toml
[project]
classifiers = [
    "Framework :: Django :: 5.2",  # Update to actual version
    "Programming Language :: Python :: 3.11",  # Remove old versions
    "Programming Language :: Python :: 3.12",
]
```

---

**Report prepared by:** Claude (Anthropic)
**Project:** OLMap (Open Logistics Map)
**Date:** November 13, 2025
