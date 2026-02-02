# OLMap Security Analysis Report

**Date:** 2026-02-02
**Scope:** Full codebase security review
**Classification:** Internal Security Assessment

---

## Executive Summary

This security analysis covers the OLMap (Open Logistics Map) application, a Django REST API backend with a React TypeScript frontend. The application handles geospatial data collection for OpenStreetMap integration. Overall, the codebase follows reasonable security practices but has several areas requiring attention.

### Risk Summary

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 1 | Hardcoded API keys in repository |
| High | 3 | Missing security headers, token storage, no rate limiting |
| Medium | 5 | Anonymous access window, CORS configuration, image handling |
| Low | 4 | Minor configuration and code quality issues |

---

## Critical Findings

### 1. Hardcoded API Keys in Repository (CRITICAL)

**Location:** `k8s/local/secrets.yaml:12-15`

```yaml
REACT_APP_DIGITRANSIT_KEY: "d253c31db9ab41c195f7ef36fc250da4"
REACT_APP_MAPBOX_TOKEN: "pk.eyJ1Ijoiam9oYW4tZnZoIiwiYSI6ImNrNDJtOGh5cDAxczIzb3FpdHg1Z3c5MGwifQ.bp9ubCm67HLIorEUb21K3A"
```

**Risk:** API keys are committed to version control and could be exposed. Even in a "local" config, these keys appear to be real production tokens that provide access to external services.

**Recommendation:**
- Immediately rotate both API keys
- Move all secrets to environment variables or a secrets manager (e.g., HashiCorp Vault, AWS Secrets Manager)
- Add `k8s/local/secrets.yaml` to `.gitignore`
- Use sealed secrets or external secrets operator for Kubernetes

---

## High Severity Findings

### 2. Missing Security Headers (HIGH)

**Location:** `django_server/olmap_config/settings.py`

The Django settings lack several important security headers:

**Missing configurations:**
- `SECURE_HSTS_SECONDS` - No HSTS enforcement
- `SECURE_HSTS_INCLUDE_SUBDOMAINS` - Not set
- `SECURE_HSTS_PRELOAD` - Not set
- `SECURE_CONTENT_TYPE_NOSNIFF` - Not set
- `SECURE_BROWSER_XSS_FILTER` - Not set (deprecated but harmless)
- `X_FRAME_OPTIONS` - Using default (may not be set explicitly)
- `SECURE_SSL_REDIRECT` - Not set

**Recommendation:**
Add to `settings.py` for production:
```python
if not DEBUG:
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
```

### 3. Token Storage in localStorage (HIGH)

**Location:** `react_ui/src/sessionRequest.js:4,18`

```javascript
localStorage.setItem('olmap-token', token);
const token = localStorage.getItem('olmap-token');
```

**Risk:** Tokens stored in localStorage are vulnerable to XSS attacks. If an attacker injects malicious JavaScript, they can steal authentication tokens.

**Recommendation:**
- Consider using `httpOnly` cookies for token storage (requires backend changes)
- Alternatively, use `sessionStorage` for shorter-lived sessions
- Implement Content Security Policy (CSP) to mitigate XSS risks

### 4. No Rate Limiting (HIGH)

**Location:** `django_server/olmap_config/settings.py`

No rate limiting is configured in Django REST Framework settings.

**Risk:** API endpoints are vulnerable to:
- Brute force attacks on login
- Denial of service
- Data scraping
- Resource exhaustion

**Recommendation:**
Add throttling to REST Framework settings:
```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '5/minute',
    }
}
```

---

## Medium Severity Findings

### 5. Anonymous User 30-Minute Edit Window (MEDIUM)

**Location:** `django_server/olmap/rest/permissions.py:27-30,40-43`

```python
return image_note_obj.created_by is None and image_note_obj.created_at > now() - timedelta(minutes=30)
```

**Risk:** Anonymous users can create and edit notes for 30 minutes without authentication. This could be abused for:
- Spam/vandalism attacks
- Injection of malicious content
- Difficult to trace malicious activity

**Recommendation:**
- Consider implementing CAPTCHA for anonymous submissions
- Require email verification even for anonymous users
- Implement IP-based tracking for abuse detection
- Consider reducing the 30-minute window

### 6. CORS Credential Configuration (MEDIUM)

**Location:** `django_server/olmap_config/settings.py:157-163`

```python
CORS_ORIGIN_ALLOW_ALL = os.environ.get("DJANGO_CORS_ALLOW_ALL", "False").lower() in ("true", "1", "yes", "on")
CORS_ALLOW_CREDENTIALS = True
```

**Risk:** When `CORS_ALLOW_CREDENTIALS = True`, credentials (cookies, auth headers) are sent cross-origin. If `CORS_ORIGIN_ALLOW_ALL` is accidentally enabled, this creates a significant security vulnerability.

**Recommendation:**
- Ensure `CORS_ORIGIN_ALLOW_ALL` is never enabled in production
- Explicitly set `CORS_ALLOWED_ORIGINS` with specific trusted domains
- Add validation to prevent credentials with wildcard origins

### 7. Potential XSS in Django Admin via mark_safe (MEDIUM)

**Location:** `django_server/olmap/admin.py:85,90,98,102`

```python
return mark_safe(f'<a target="_osm" href="{self.osm_url(location)}">osm</a>')
return mark_safe(f'<img src="{settings.MEDIA_URL}{image_note.image}" ...')
```

**Risk:** If `lat`, `lon`, or image filenames contain malicious content, XSS could occur in the admin interface. While admin access is restricted, this could be exploited if an attacker manipulates database records.

**Recommendation:**
- Use `format_html()` instead of `mark_safe()` with f-strings
- Validate and sanitize lat/lon values
- Ensure image filenames are sanitized on upload

### 8. Image Upload Processing (MEDIUM)

**Location:** `django_server/olmap/models/osm_image_notes.py:27-28,64-98`

```python
def upload_osm_images_to(instance, filename):
    return f"osm_image_notes/{instance.id}/{filename}"
```

**Concerns:**
- Filename is used directly without sanitization
- No file type validation beyond Django's ImageField
- Image processing with PIL could be vulnerable to image bombs
- EXIF data processing could expose sensitive information

**Recommendation:**
- Sanitize filenames (remove special characters, limit length)
- Validate file extensions AND magic bytes
- Add image dimension limits to prevent decompression bombs
- Strip all EXIF data before saving (currently only orientation is used)
- Consider using a separate domain/CDN for uploaded content

### 9. Email Enumeration via Password Reset (MEDIUM)

**Location:** `react_ui/src/util_components/account/LoginForm.tsx:145-148`

```javascript
sessionRequest(passwordResetUrl, { method: 'POST', data: { email } }).then((response) => {
  if (response.status == 200) this.setState({ resetEmailSent: true });
  else this.setState({ error: true });
});
```

**Risk:** Different responses for valid vs invalid emails allow attackers to enumerate registered users.

**Recommendation:**
- Return the same response regardless of email existence
- Always display "If this email exists, a reset link has been sent"
- Implement rate limiting on password reset endpoint

---

## Low Severity Findings

### 10. Debug Settings Fallback (LOW)

**Location:** `django_server/olmap_config/settings.py:42-44`

```python
if DEBUG:
    SECRET_KEY = "dev-only-secret-key-not-for-production"
```

**Note:** This is properly gated behind DEBUG mode, but the fallback key should be more random to prevent any accidental use.

### 11. Sentry PII Collection Default (LOW)

**Location:** `django_server/olmap_config/settings.py:236`

```python
send_default_pii=os.environ.get("SENTRY_SEND_PII", "True").lower() in ("true", "1", "yes", "on"),
```

**Risk:** PII collection is enabled by default. This could violate GDPR or other privacy regulations.

**Recommendation:** Default to `False` and explicitly enable when needed.

### 12. Input Type Typo (LOW)

**Location:** `react_ui/src/util_components/account/LoginForm.tsx:41,96`

```jsx
<input type="test" ...  // Should be "text"
```

**Risk:** While browsers handle this gracefully, it's a code quality issue that could cause inconsistent behavior.

### 13. Permission Logic Bug (LOW)

**Location:** `django_server/olmap/rest/views/osm_image_note.py:55-56`

```python
elif self.action == ["mark_accepted", "mark_reviewed"]:  # Bug: == should be 'in'
    return [IsReviewer()]
```

**Risk:** This condition will never be true (comparing string to list with `==` instead of `in`). The `mark_accepted` and `mark_reviewed` actions won't get `IsReviewer` permission class.

**Recommendation:** Change `==` to `in`:
```python
elif self.action in ["mark_accepted", "mark_reviewed"]:
```

---

## Positive Security Observations

The codebase includes several good security practices:

1. **Secret Key Protection:** Production requires `DJANGO_SECRET_KEY` environment variable
2. **Password Validation:** Django's built-in password validators are enabled
3. **Authentication:** Uses industry-standard django-allauth and dj-rest-auth
4. **Secrets Detection:** `.secrets.baseline` configured for detect-secrets scanning
5. **CSRF Protection:** CsrfViewMiddleware is enabled
6. **SSL Support:** `SECURE_PROXY_SSL_HEADER` is configured
7. **Role-Based Access:** Reviewer group with proper permission classes
8. **No Raw SQL:** Uses Django ORM throughout (one safe `SELECT 1` health check)
9. **No eval/exec:** No dangerous code execution patterns found
10. **No dangerouslySetInnerHTML:** React code doesn't use unsafe innerHTML

---

## Dependency Analysis

### Backend Dependencies (`pyproject.toml`)

| Package | Version | Notes |
|---------|---------|-------|
| Django | >=5.2,<6.0 | Current major version, regularly updated |
| djangorestframework | >=3.10,<4.0 | Monitor for security updates |
| Pillow | >=7.0,<12.0 | Wide version range; consider pinning |
| psycopg2-binary | >=2.9,<3.0 | Recommend native psycopg2 for production |

### Frontend Dependencies (`package.json`)

| Package | Version | Notes |
|---------|---------|-------|
| react | ^18.3.1 | Current version |
| react-scripts | ^5.0.1 | Contains webpack/babel - monitor CVEs |
| mapbox-gl | ^1.13.3 | Older version; consider updating |

**Recommendation:**
- Run `npm audit` regularly
- Run `pip-audit` or `safety check` for Python dependencies
- Consider using Dependabot or Renovate for automated updates

---

## Recommendations Summary

### Immediate Actions (Critical/High)
1. Rotate and remove hardcoded API keys from repository
2. Implement rate limiting on all API endpoints
3. Add security headers for production
4. Fix permission logic bug in `osm_image_note.py:55`

### Short-Term Actions (Medium)
5. Review anonymous user access policy
6. Sanitize image filenames on upload
7. Use `format_html()` instead of `mark_safe()` in admin
8. Implement uniform password reset responses
9. Audit CORS configuration for production

### Long-Term Improvements (Low)
10. Consider httpOnly cookie authentication
11. Implement Content Security Policy (CSP)
12. Set up automated security scanning in CI/CD
13. Conduct penetration testing before major releases

---

## Appendix: Files Reviewed

- `django_server/olmap_config/settings.py`
- `django_server/olmap/rest/permissions.py`
- `django_server/olmap/rest/views/osm_image_note.py`
- `django_server/olmap/rest/views/map_features.py`
- `django_server/olmap/models/osm_image_notes.py`
- `django_server/olmap/admin.py`
- `django_server/olmap/rest/serializers/*.py`
- `react_ui/src/sessionRequest.js`
- `react_ui/src/util_components/account/LoginForm.tsx`
- `react_ui/package.json`
- `django_server/pyproject.toml`
- `k8s/local/secrets.yaml`
- `.env.example`
- `.env.dev`
- `docker-compose.yml`
- `.secrets.baseline`
