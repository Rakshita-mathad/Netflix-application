/**
 * Authentication module - localStorage-based user management
 * Handles signup, login, validation, and session state.
 */

const AUTH_KEYS = {
  USERS: 'netflix_users',
  CURRENT_USER: 'netflix_current_user',
  REMEMBER_EMAIL: 'netflix_remember_email'
};

/**
 * Get all registered users from localStorage
 * @returns {Array<{fullName: string, email: string, password: string}>}
 */
function getUsers() {
  try {
    const data = localStorage.getItem(AUTH_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save users array to localStorage
 * @param {Array} users
 */
function saveUsers(users) {
  localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
}

/**
 * Find user by email
 * @param {string} email
 * @returns {object|null}
 */
function getUserByEmail(email) {
  const users = getUsers();
  const normalized = (email || '').trim().toLowerCase();
  return users.find(u => u.email.toLowerCase() === normalized) || null;
}

/**
 * Register a new user (no duplicate emails)
 * @param {object} user - { fullName, email, password }
 * @returns {{ success: boolean, error?: string }}
 */
function registerUser(user) {
  const { fullName, email, password } = user || {};
  if (!fullName || !email || !password) {
    return { success: false, error: 'All fields are required.' };
  }
  if (getUserByEmail(email)) {
    return { success: false, error: 'An account with this email already exists.' };
  }
  const users = getUsers();
  users.push({
    fullName: (fullName || '').trim(),
    email: (email || '').trim().toLowerCase(),
    password: password
  });
  saveUsers(users);
  return { success: true };
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test((email || '').trim());
}

/**
 * Strong password rules: min 8 chars, uppercase, lowercase, number, special char
 * @param {string} password
 * @returns {{ valid: boolean, message?: string }}
 */
function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*(), etc.).' };
  }
  return { valid: true };
}

/**
 * Set current logged-in user (session)
 * @param {object} user - { fullName, email }
 */
function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
  }
}

/**
 * Get current logged-in user
 * @returns {object|null} { fullName, email } or null
 */
function getCurrentUser() {
  try {
    const data = localStorage.getItem(AUTH_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isLoggedIn() {
  return !!getCurrentUser();
}

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {{ success: boolean, user?: object, error?: string }}
 */
function login(email, password) {
  const trimmedEmail = (email || '').trim();
  if (!trimmedEmail || !password) {
    return { success: false, error: 'Email and password are required.' };
  }
  const user = getUserByEmail(trimmedEmail);
  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }
  if (user.password !== password) {
    return { success: false, error: 'Invalid email or password.' };
  }
  const sessionUser = { fullName: user.fullName, email: user.email };
  setCurrentUser(sessionUser);
  return { success: true, user: sessionUser };
}

/**
 * Logout - clear session
 */
function logout() {
  setCurrentUser(null);
}

/**
 * Remember email for "Remember Me" (store email only, not password)
 * @param {string} email
 */
function setRememberEmail(email) {
  if (email) {
    localStorage.setItem(AUTH_KEYS.REMEMBER_EMAIL, (email || '').trim());
  } else {
    localStorage.removeItem(AUTH_KEYS.REMEMBER_EMAIL);
  }
}

/**
 * Get remembered email if any
 * @returns {string|null}
 */
function getRememberedEmail() {
  return localStorage.getItem(AUTH_KEYS.REMEMBER_EMAIL);
}
