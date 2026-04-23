(function () {
  'use strict';

  var switchButtons = Array.prototype.slice.call(document.querySelectorAll('.switch-btn'));
  var panes = Array.prototype.slice.call(document.querySelectorAll('.login-pane'));
  var passwordForm = document.getElementById('passwordLoginForm');
  var passwordToggle = document.getElementById('passwordToggle');
  var passwordInput = document.getElementById('password');
  var usernameInput = document.getElementById('username');
  var passwordSubmit = document.getElementById('passwordSubmit');
  var passwordMessage = document.getElementById('passwordMessage');
  var scanLoginBtn = document.getElementById('scanLoginBtn');
  var scanMessage = document.getElementById('scanMessage');

  function setMessage(element, text, isSuccess) {
    if (!element) return;
    element.textContent = text;
    element.classList.toggle('success', !!isSuccess);
  }

  function setMode(mode) {
    switchButtons.forEach(function (button) {
      var isActive = button.getAttribute('data-mode') === mode;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });

    panes.forEach(function (pane) {
      var isActive = pane.getAttribute('data-pane') === mode;
      pane.classList.toggle('active', isActive);
      pane.setAttribute('aria-hidden', String(!isActive));
    });
  }

  switchButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setMode(button.getAttribute('data-mode'));
    });
  });

  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', function () {
      var nextType = passwordInput.type === 'password' ? 'text' : 'password';
      var nextLabel = nextType === 'password' ? '显示密码' : '隐藏密码';
      passwordInput.type = nextType;
      passwordToggle.setAttribute('aria-label', nextLabel);
    });
  }

  function redirectToPlatform() {
    window.setTimeout(function () {
      if (window.ShendunAuth) {
        window.ShendunAuth.redirectAfterLogin();
        return;
      }
      window.location.href = 'index.html';
    }, 900);
  }

  if (passwordForm) {
    passwordForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var username = usernameInput ? usernameInput.value.trim() : '';
      var password = passwordInput ? passwordInput.value : '';
      var isValid = window.ShendunAuth && window.ShendunAuth.login(username, password);

      if (!isValid) {
        setMessage(passwordMessage, '账号或密码错误，请输入 shendun / shendun。', false);
        if (passwordInput) {
          passwordInput.focus();
          passwordInput.select();
        }
        return;
      }

      passwordSubmit.classList.add('loading');
      passwordSubmit.disabled = true;
      setMessage(passwordMessage, '账号校验通过，正在进入平台...', true);

      window.setTimeout(function () {
        passwordSubmit.classList.remove('loading');
        passwordSubmit.disabled = false;
        redirectToPlatform();
      }, 900);
    });
  }

  if (scanLoginBtn) {
    scanLoginBtn.addEventListener('click', function () {
      if (window.ShendunAuth) {
        window.ShendunAuth.login('shendun', 'shendun');
      }
      scanLoginBtn.disabled = true;
      setMessage(scanMessage, '扫码确认成功，正在跳转...', true);
      redirectToPlatform();
    });
  }
})();
