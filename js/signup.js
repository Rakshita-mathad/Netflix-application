/**
 * Signup page - form validation and registration
 */

(function () {
  const form = document.getElementById('signupForm');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const formError = document.getElementById('formError');
  const submitBtn = document.getElementById('submitBtn');
  const fullNameError = document.getElementById('fullNameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');

  // Redirect if already logged in
  if (typeof isLoggedIn === 'function' && isLoggedIn()) {
    window.location.href = 'home.html';
    return;
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

  // Password visibility toggles
  function setupToggle(buttonId, inputId) {
    const btn = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener('click', function () {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.textContent = isPassword ? 'Hide' : 'Show';
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  }
  setupToggle('togglePassword', 'password');
  setupToggle('toggleConfirmPassword', 'confirmPassword');

  function validateForm() {
    let valid = true;
    const fullName = (fullNameInput && fullNameInput.value || '').trim();
    const email = (emailInput && emailInput.value || '').trim();
    const password = passwordInput ? passwordInput.value : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

    // Full name
    if (!fullName) {
      showFieldError(fullNameError, 'Full name is required.');
      setInputError(fullNameInput, true);
      valid = false;
    } else {
      showFieldError(fullNameError, '');
      setInputError(fullNameInput, false);
    }

    // Email
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

    // Password
    const pwdCheck = validatePasswordStrength(password);
    if (!pwdCheck.valid) {
      showFieldError(passwordError, pwdCheck.message);
      setInputError(passwordInput, true);
      valid = false;
    } else {
      showFieldError(passwordError, '');
      setInputError(passwordInput, false);
    }

    // Confirm password
    if (password !== confirmPassword) {
      showFieldError(confirmPasswordError, 'Passwords do not match.');
      setInputError(confirmPasswordInput, true);
      valid = false;
    } else if (confirmPassword) {
      showFieldError(confirmPasswordError, '');
      setInputError(confirmPasswordInput, false);
    } else {
      showFieldError(confirmPasswordError, 'Please confirm your password.');
      setInputError(confirmPasswordInput, true);
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    showFormError('');

    if (!validateForm()) {
      showFormError('Please fix the errors above.');
      return;
    }

    submitBtn.disabled = true;
    const result = registerUser({
      fullName: fullNameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value
    });

    if (result.success) {
      // Auto-login and redirect to dashboard
      login(emailInput.value.trim(), passwordInput.value);
      window.location.href = 'home.html';
    } else {
      showFormError(result.error || 'Registration failed.');
      if (result.error && result.error.toLowerCase().includes('email')) {
        showFieldError(emailError, result.error);
        setInputError(emailInput, true);
      }
      submitBtn.disabled = false;
    }
  });

  // Clear inline errors on input
  [fullNameInput, emailInput, passwordInput, confirmPasswordInput].forEach(function (input) {
    if (!input) return;
    input.addEventListener('input', function () {
      setInputError(input, false);
      showFieldError(document.getElementById(input.id + 'Error'), '');
      showFormError('');
    });
  });
})();
