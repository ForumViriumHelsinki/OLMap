import settings from './settings';

// SECURITY NOTE: Tokens stored in localStorage are vulnerable to XSS attacks.
// TODO: Consider migrating to httpOnly cookies for improved security.
// This would require backend changes to set cookies on login and read them on requests.
// See: https://owasp.org/www-community/HttpOnly

export function login(token) {
  localStorage.setItem('olmap-token', token);
}

export function logout() {
  localStorage.clear();
}

export function sessionRequest(url, options = {}) {
  options.headers = options.headers || {};
  if (options && options.data && typeof options.data == 'object') {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.data);
  }
  try {
    const token = localStorage.getItem('olmap-token');
    if (token) {
      options.headers.Authorization = 'Token ' + token;
    }
  } catch (DOMException) {
    console.log('Local storage not accessible, proceeding as anonymous user.');
  }
  return fetch(settings.serverRoot + url, options);
}

export default sessionRequest;
