import settings from './settings';

export function login(token) {
  sessionStorage.setItem('token', token);
}

export function logout() {
  sessionStorage.clear();
}

export function sessionRequest(url, options={}) {
  options.headers = options.headers || {};
  if (options && options.data && typeof options.data == 'object') {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.data);
  }
  const token = sessionStorage.getItem('token');
  if (token) {
    options.headers.Authorization = "Token " + token;
  }
  return fetch(settings.serverRoot + url, options);
}

export default sessionRequest;
