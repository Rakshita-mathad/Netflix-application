/**
 * Profile page - User account management
 */

(function() {
  function ensureLoggedIn() {
    if (typeof isLoggedIn !== 'function' || !isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function init() {
    if (!ensureLoggedIn()) return;

    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    // Display user info
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    if (profileName) profileName.textContent = user.fullName || 'User';
    if (profileEmail) profileEmail.textContent = user.email || '';

    // Update stats
    if (typeof Favorites !== 'undefined') {
      const favorites = Favorites.getFavorites();
      const favoritesCount = document.getElementById('favoritesCount');
      if (favoritesCount) favoritesCount.textContent = favorites.length;
    }

    if (typeof Watchlist !== 'undefined') {
      const watchlist = Watchlist.getWatchlist();
      const watchlistCount = document.getElementById('watchlistCount');
      if (watchlistCount) watchlistCount.textContent = watchlist.length;
    }

    if (typeof RecentlyViewed !== 'undefined') {
      const recent = RecentlyViewed.getRecentlyViewed();
      const recentCount = document.getElementById('recentCount');
      if (recentCount) recentCount.textContent = recent.length;
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof logout === 'function') logout();
        window.location.href = 'login.html';
      });
    }

    // Change password
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', function() {
        const newPassword = prompt('Enter new password (min 8 chars, uppercase, lowercase, number, special char):');
        if (!newPassword) return;

        const validation = validatePasswordStrength(newPassword);
        if (!validation.valid) {
          alert(validation.message);
          return;
        }

        const users = getUsers();
        const userIndex = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
        if (userIndex !== -1) {
          users[userIndex].password = newPassword;
          saveUsers(users);
          if (typeof Toast !== 'undefined') {
            Toast.success('Password changed successfully!');
          } else {
            alert('Password changed successfully!');
          }
        }
      });
    }

    // Delete account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', function() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
          return;
        }

        const users = getUsers();
        const filtered = users.filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
        saveUsers(filtered);
        
        // Clear user data
        if (typeof logout === 'function') logout();
        if (typeof Favorites !== 'undefined') {
          const key = `netflix_favorites_${user.email}`;
          localStorage.removeItem(key);
        }
        if (typeof RecentlyViewed !== 'undefined') {
          const key = `netflix_recently_viewed_${user.email}`;
          localStorage.removeItem(key);
        }

        alert('Account deleted successfully.');
        window.location.href = 'login.html';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
