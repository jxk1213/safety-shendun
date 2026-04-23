(function () {
  'use strict';

  var AUTH_KEY = 'shendun_auth_v1';
  var VALID_USERNAME = 'shendun';
  var VALID_PASSWORD = 'shendun';

  function readAuth() {
    try {
      return sessionStorage.getItem(AUTH_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function writeAuth(isAuthenticated) {
    try {
      if (isAuthenticated) {
        sessionStorage.setItem(AUTH_KEY, '1');
      } else {
        sessionStorage.removeItem(AUTH_KEY);
      }
    } catch (error) {
      // noop
    }
  }

  function normalizeRedirectTarget(target) {
    if (!target) return 'index.html';
    if (/^https?:\/\//i.test(target)) return 'index.html';
    return target;
  }

  function getRedirectTarget() {
    try {
      var params = new URLSearchParams(window.location.search);
      return normalizeRedirectTarget(params.get('redirect'));
    } catch (error) {
      return 'index.html';
    }
  }

  function redirectToLogin() {
    var current = window.location.pathname + window.location.search + window.location.hash;
    var redirect = encodeURIComponent(current || 'index.html');
    window.location.replace('login.html?redirect=' + redirect);
  }

  function redirectAfterLogin() {
    window.location.href = getRedirectTarget();
  }

  function login(username, password) {
    var isValid = username === VALID_USERNAME && password === VALID_PASSWORD;
    writeAuth(isValid);
    return isValid;
  }

  function logout() {
    writeAuth(false);
    redirectToLogin();
  }

  window.ShendunAuth = {
    getRedirectTarget: getRedirectTarget,
    isAuthenticated: readAuth,
    login: login,
    logout: logout,
    redirectAfterLogin: redirectAfterLogin,
    redirectToLogin: redirectToLogin
  };
})();
