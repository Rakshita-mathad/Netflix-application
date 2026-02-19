/**
 * Utility functions - Toast notifications, Favorites, Recently Viewed
 */

const STORAGE_KEYS = {
  FAVORITES: 'netflix_favorites',
  RECENTLY_VIEWED: 'netflix_recently_viewed',
  WATCHLIST: 'netflix_watchlist',
  SEARCH_HISTORY: 'netflix_search_history',
  USER_DATA: 'netflix_user_data'
};

/** Popular search suggestions */
const POPULAR_SEARCHES = ['action', 'comedy', 'drama', 'sci-fi', 'marvel', 'avengers', 'batman', 'inception'];

/**
 * Toast notification system
 */
const Toast = {
  container: null,
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }
  },
  
  show(message, type = 'info', duration = 3000) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    
    this.container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
    
    return toast;
  },
  
  success(message, duration) {
    return this.show(message, 'success', duration);
  },
  
  error(message, duration) {
    return this.show(message, 'error', duration);
  },
  
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
};

/**
 * Favorites management
 */
const Favorites = {
  getFavorites() {
    try {
      const user = getCurrentUser();
      if (!user) return [];
      const key = `${STORAGE_KEYS.FAVORITES}_${user.email}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },
  
  saveFavorites(favorites) {
    try {
      const user = getCurrentUser();
      if (!user) return false;
      const key = `${STORAGE_KEYS.FAVORITES}_${user.email}`;
      localStorage.setItem(key, JSON.stringify(favorites));
      return true;
    } catch (e) {
      return false;
    }
  },
  
  addFavorite(movie) {
    const favorites = this.getFavorites();
    if (!favorites.find(f => f.imdbID === movie.imdbID)) {
      favorites.push(movie);
      this.saveFavorites(favorites);
      return true;
    }
    return false;
  },
  
  removeFavorite(imdbID) {
    const favorites = this.getFavorites();
    const filtered = favorites.filter(f => f.imdbID !== imdbID);
    if (filtered.length !== favorites.length) {
      this.saveFavorites(filtered);
      return true;
    }
    return false;
  },
  
  isFavorite(imdbID) {
    return this.getFavorites().some(f => f.imdbID === imdbID);
  }
};

/**
 * Recently Viewed management
 */
const RecentlyViewed = {
  MAX_ITEMS: 20,
  
  getRecentlyViewed() {
    try {
      const user = getCurrentUser();
      if (!user) return [];
      const key = `${STORAGE_KEYS.RECENTLY_VIEWED}_${user.email}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },
  
  saveRecentlyViewed(items) {
    try {
      const user = getCurrentUser();
      if (!user) return false;
      const key = `${STORAGE_KEYS.RECENTLY_VIEWED}_${user.email}`;
      localStorage.setItem(key, JSON.stringify(items));
      return true;
    } catch (e) {
      return false;
    }
  },
  
  addViewed(movie) {
    let viewed = this.getRecentlyViewed();
    viewed = viewed.filter(v => v.imdbID !== movie.imdbID);
    viewed.unshift(movie);
    viewed = viewed.slice(0, this.MAX_ITEMS);
    this.saveRecentlyViewed(viewed);
  }
};

/**
 * Watchlist (watch later) - separate from favorites
 */
const Watchlist = {
  getWatchlist() {
    try {
      const user = getCurrentUser();
      if (!user) return [];
      const key = `${STORAGE_KEYS.WATCHLIST}_${user.email}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },
  saveWatchlist(items) {
    try {
      const user = getCurrentUser();
      if (!user) return false;
      const key = `${STORAGE_KEYS.WATCHLIST}_${user.email}`;
      localStorage.setItem(key, JSON.stringify(items));
      return true;
    } catch (e) {
      return false;
    }
  },
  add(movie) {
    const list = this.getWatchlist();
    if (!list.find(m => m.imdbID === movie.imdbID)) {
      list.push(movie);
      this.saveWatchlist(list);
      return true;
    }
    return false;
  },
  remove(imdbID) {
    const list = this.getWatchlist().filter(m => m.imdbID !== imdbID);
    this.saveWatchlist(list);
    return true;
  },
  has(imdbID) {
    return this.getWatchlist().some(m => m.imdbID === imdbID);
  }
};

/**
 * Search history (recent searches)
 */
const SearchHistory = {
  MAX: 10,
  getHistory() {
    try {
      const user = getCurrentUser();
      if (!user) return [];
      const key = `${STORAGE_KEYS.SEARCH_HISTORY}_${user.email}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },
  add(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return;
    let list = this.getHistory();
    list = list.filter(x => x !== q);
    list.unshift(q);
    list = list.slice(0, this.MAX);
    try {
      const user = getCurrentUser();
      if (!user) return;
      localStorage.setItem(`${STORAGE_KEYS.SEARCH_HISTORY}_${user.email}`, JSON.stringify(list));
    } catch (e) {}
  }
};

/**
 * Debounce function for search
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format date string
 */
function formatDate(dateString) {
  if (!dateString || dateString === 'N/A') return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateString;
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
