/**
 * Login page - industry-standard auth UI with validation and Remember Me
 */

(function () {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeInput = document.getElementById('rememberMe');
  const formError = document.getElementById('formError');
  const submitBtn = document.getElementById('submitBtn');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');

  // Redirect if already logged in
  if (typeof isLoggedIn === 'function' && isLoggedIn()) {
    window.location.href = 'home.html';
    return;
  }

  // Pre-fill remembered email if any
  if (typeof getRememberedEmail === 'function') {
    const remembered = getRememberedEmail();
    if (remembered && emailInput) {
      emailInput.value = remembered;
      if (rememberMeInput) rememberMeInput.checked = true;
    }
  }

  function showFieldError(el, message) {
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('visible', !!message);
  }

  function setInputError(input, hasError) {
    if (!input) return;
    input.classList.toggle('error', !!hasError);
  }

  function showFormError(message) {
    formError.textContent = message || '';
    formError.classList.toggle('visible', !!message);
  }

  // Password visibility toggle
  const toggleBtn = document.getElementById('togglePassword');
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', function () {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? 'Hide' : 'Show';
      toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  }

  function validateForm() {
    let valid = true;
    const email = (emailInput && emailInput.value || '').trim();
    const password = passwordInput ? passwordInput.value : '';

    if (!email) {
      showFieldError(emailError, 'Email is required.');
      setInputError(emailInput, true);
      valid = false;
    } else if (!isValidEmail(email)) {
      showFieldError(emailError, 'Please enter a valid email address.');
      setInputError(emailInput, true);
      valid = false;
    } else {
      showFieldError(emailError, '');
      setInputError(emailInput, false);
    }

    if (!password) {
      showFieldError(passwordError, 'Password is required.');
      setInputError(passwordInput, true);
      valid = false;
    } else {
      showFieldError(passwordError, '');
      setInputError(passwordInput, false);
    }

    return valid;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    showFormError('');
    showFieldError(emailError, '');
    showFieldError(passwordError, '');
    setInputError(emailInput, false);
    setInputError(passwordInput, false);

    if (!validateForm()) {
      showFormError('Please fix the errors above.');
      return;
    }

    submitBtn.disabled = true;
    const result = login(emailInput.value.trim(), passwordInput.value);

    if (result.success) {
      if (rememberMeInput && rememberMeInput.checked && typeof setRememberEmail === 'function') {
        setRememberEmail(emailInput.value.trim());
      } else if (typeof setRememberEmail === 'function') {
        setRememberEmail(null);
      }
      window.location.href = 'home.html';
    } else {
      showFormError(result.error || 'Invalid email or password.');
      submitBtn.disabled = false;
    }
  });

  var forgotLink = document.getElementById('forgotPassword');
  if (forgotLink) {
    forgotLink.addEventListener('click', function(e) {
      e.preventDefault();
      alert('This is a demo app. There is no password reset. Please use the password you used when signing up. If you don\'t remember it, you can sign up again with a new account.');
    });
  }

  [emailInput, passwordInput].forEach(function (input) {
    if (!input) return;
    input.addEventListener('input', function () {
      setInputError(input, false);
      showFieldError(document.getElementById(input.id + 'Error'), '');
      showFormError('');
    });
  });
})();
