/**
 * Movie Dashboard - OMDb API integration, Netflix-style layout, protected route
 */

const OMDb = {
  BASE_URL: 'https://www.omdbapi.com/',
  API_KEY: '9b5a4b78'
};

// Default search terms for initial load and rows
const DEFAULT_SEARCHES = ['avengers', 'batman', 'matrix', 'inception'];

/**
 * Fetch movies from OMDb by search term
 * @param {string} query - Search query
 * @param {number} page - Page number (1-based)
 * @returns {Promise<{Response: string, Search?: Array, totalResults?: string, Error?: string}>}
 */
function fetchMovies(query, page) {
  page = page || 1;
  var url = OMDb.BASE_URL + '?apikey=' + OMDb.API_KEY + '&s=' + encodeURIComponent(query) + '&page=' + page;
  return fetch(url).then(function (res) {
    if (!res.ok) throw new Error('Network error: ' + res.status);
    return res.json();
  }).then(function (data) {
    if (data.Response === 'False' && data.Error) {
      throw new Error(data.Error);
    }
    return data;
  });
}

/**
 * Render a single movie card
 * @param {object} movie - { Title, Year, Type, Poster, imdbID }
 * @returns {string} HTML string
 */
function renderMovieCard(movie) {
  const title = escapeHtml(movie.Title || 'Unknown');
  const year = movie.Year || 'N/A';
  const type = (movie.Type || 'movie').charAt(0).toUpperCase() + (movie.Type || '').slice(1);
  var poster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : '';
  var posterAlt = poster ? title : 'No poster';
  var imdbID = movie.imdbID || '';
  var isFavorite = typeof Favorites !== 'undefined' && Favorites.isFavorite(imdbID);
  var posterPlaceholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22240%22%3E%3Crect fill=%22%232a2a2a%22 width=%22100%25%22 height=%22100%25%22/%3E%3Ctext fill=%22%23808080%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2212%22 font-family=%22sans-serif%22%3ENo image%3C/text%3E%3C/svg%3E';
  var imgOrPlaceholder = poster
    ? '<img class="movie-card-poster" src="' + poster + '" alt="' + posterAlt + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + posterPlaceholder + '\';this.alt=\'No poster\';">'
    : '<div class="movie-card-poster poster-placeholder">No image</div>';

  return (
    '<div class="movie-card" data-imdb-id="' + imdbID + '" tabindex="0" role="button" aria-label="View details for ' + title + '">' +
      '<div class="movie-card-overlay">' +
        '<button class="movie-card-favorite-btn" data-imdb-id="' + imdbID + '" aria-label="' + (isFavorite ? 'Remove from favorites' : 'Add to favorites') + '">' +
          (isFavorite ? '❤️' : '🤍') +
        '</button>' +
      '</div>' +
      imgOrPlaceholder +
      '<div class="movie-card-info">' +
        '<div class="movie-card-title">' + title + '</div>' +
        '<div class="movie-card-meta">' + year + ' · ' + type + '</div>' +
      '</div>' +
    '</div>'
  );
}

/**
 * Render a row of movies
 * @param {string} rowTitle
 * @param {Array} movies
 * @returns {string} HTML string
 */
function renderMovieRow(rowTitle, movies) {
  if (!movies || !movies.length) return '';
  const cards = movies.slice(0, 12).map(renderMovieCard).join('');
  return (
    '<div class="movie-row">' +
      '<h3>' + (rowTitle || 'Movies').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</h3>' +
      '<div class="movie-cards">' + cards + '</div>' +
    '</div>'
  );
}

/**
 * Show/hide UI states
 */
function setLoading(show) {
  var el = document.getElementById('loadingState');
  if (el) el.style.display = show ? 'block' : 'none';
}

function setEmpty(show) {
  var el = document.getElementById('emptyState');
  if (el) el.style.display = show ? 'block' : 'none';
}

function setApiError(message) {
  var wrap = document.getElementById('apiError');
  if (!wrap) return;
  var textEl = wrap.querySelector('.api-error-text');
  if (textEl) textEl.textContent = message || '';
  wrap.style.display = message ? 'block' : 'none';
}

function setSkeleton(show) {
  var el = document.getElementById('skeletonGrid');
  if (el) el.style.display = show ? 'grid' : 'none';
}

function setMovieRows(html) {
  var el = document.getElementById('movieRows');
  if (el) {
    el.innerHTML = html || '';
    el.style.display = html ? 'block' : 'none';
    attachMovieCardHandlers();
  }
}

/** Apply filter/sort to array of movies */
function filterAndSortMovies(movies, typeFilter, sortBy) {
  if (!movies || !movies.length) return movies;
  let list = typeFilter ? movies.filter(function (m) { return (m.Type || '').toLowerCase() === typeFilter; }) : movies.slice();
  if (sortBy === 'title') {
    list.sort(function (a, b) { return (a.Title || '').localeCompare(b.Title || ''); });
  } else if (sortBy === 'year-desc') {
    list.sort(function (a, b) { return parseInt(b.Year, 10) - parseInt(a.Year, 10); });
  } else if (sortBy === 'year-asc') {
    list.sort(function (a, b) { return parseInt(a.Year, 10) - parseInt(b.Year, 10); });
  }
  return list;
}

/**
 * Attach event handlers to movie cards
 */
function attachMovieCardHandlers() {
  const cards = document.querySelectorAll('.movie-card[data-imdb-id]');
  cards.forEach(card => {
    const imdbID = card.getAttribute('data-imdb-id');
    if (!imdbID) return;
    
    // Click to view details
    card.addEventListener('click', function(e) {
      // Don't trigger if clicking favorite button
      if (e.target.closest('.movie-card-favorite-btn')) return;
      if (typeof MovieDetails !== 'undefined') {
        MovieDetails.show(imdbID);
      }
    });
    
    // Enter key support
    card.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && typeof MovieDetails !== 'undefined') {
        MovieDetails.show(imdbID);
      }
    });
    
    // Favorite button
    const favBtn = card.querySelector('.movie-card-favorite-btn');
    if (favBtn && typeof Favorites !== 'undefined') {
      favBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const movie = {
          imdbID: imdbID,
          Title: card.querySelector('.movie-card-title')?.textContent || '',
          Year: card.querySelector('.movie-card-meta')?.textContent.split(' · ')[0] || '',
          Type: card.querySelector('.movie-card-meta')?.textContent.split(' · ')[1] || '',
          Poster: card.querySelector('.movie-card-poster')?.src || ''
        };
        
        const isFavorite = Favorites.isFavorite(imdbID);
        if (isFavorite) {
          Favorites.removeFavorite(imdbID);
          favBtn.textContent = '🤍';
          favBtn.setAttribute('aria-label', 'Add to favorites');
          if (typeof Toast !== 'undefined') Toast.info('Removed from favorites');
        } else {
          Favorites.addFavorite(movie);
          favBtn.textContent = '❤️';
          favBtn.setAttribute('aria-label', 'Remove from favorites');
          if (typeof Toast !== 'undefined') Toast.success('Added to favorites!');
        }
      });
    }
  });
}

// State for search pagination and filter/sort
var currentSearchQuery = '';
var currentSearchPage = 1;
var currentSearchResults = [];
var currentTotalResults = 0;

/**
 * Run search and display results
 */
function doSearch(query, page, append) {
  page = page || 1;
  var sectionTitle = document.getElementById('sectionTitle');
  var filterBar = document.getElementById('filterBar');
  var loadMoreWrap = document.getElementById('loadMoreWrap');

  setApiError('');
  setEmpty(false);
  if (!append) {
    setMovieRows('');
    setLoading(true);
    setSkeleton(false);
  }

  fetchMovies(query, page)
    .then(function (data) {
      setLoading(false);
      setSkeleton(false);
      if (data.Response === 'True' && data.Search && data.Search.length) {
        currentSearchQuery = query;
        currentSearchPage = page;
        if (append) {
          currentSearchResults = currentSearchResults.concat(data.Search);
        } else {
          currentSearchResults = data.Search.slice();
        }
        currentTotalResults = parseInt(data.totalResults, 10) || 0;

        var filterType = (document.getElementById('filterType') && document.getElementById('filterType').value) || '';
        var sortBy = (document.getElementById('sortBy') && document.getElementById('sortBy').value) || 'title';
        var filtered = filterAndSortMovies(currentSearchResults, filterType || null, sortBy);

        if (sectionTitle) sectionTitle.textContent = 'Results: "' + escapeHtml(query) + '"';
        if (filterBar) filterBar.style.display = 'flex';
        setMovieRows(renderMovieRow('', filtered));

        var totalSoFar = currentSearchResults.length;
        if (loadMoreWrap) {
          loadMoreWrap.style.display = (totalSoFar < currentTotalResults) ? 'block' : 'none';
        }
        if (typeof SearchHistory !== 'undefined') SearchHistory.add(query);
      } else {
        if (!append) {
          currentSearchResults = [];
          if (sectionTitle) sectionTitle.textContent = 'Movies';
          if (filterBar) filterBar.style.display = 'none';
          if (loadMoreWrap) loadMoreWrap.style.display = 'none';
          setEmpty(true);
        }
      }
    })
    .catch(function (err) {
      setLoading(false);
      setSkeleton(false);
      var msg = (err && err.message) ? err.message : 'Unknown error';
      if (msg === 'Failed to fetch' || msg.indexOf('Network error') === 0) {
        setApiError('Cannot reach the server. Check your internet connection or run the app from a local server (e.g. npx serve .).');
      } else {
        setApiError(msg + ' Try again later.');
      }
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    });
}

/**
 * Load default rows (multiple searches)
 */
function loadDefaultRows() {
  var sectionTitle = document.getElementById('sectionTitle');
  if (sectionTitle) sectionTitle.textContent = 'Movies';

  setLoading(false);
  setSkeleton(true);
  setApiError('');
  setEmpty(false);
  setMovieRows('');
  var loadMoreWrap = document.getElementById('loadMoreWrap');
  if (loadMoreWrap) loadMoreWrap.style.display = 'none';

  var promises = DEFAULT_SEARCHES.map(function (term) {
    return fetchMovies(term)
      .then(function (data) { return { term: term, data: data, ok: true }; })
      .catch(function (err) { return { term: term, error: err && err.message, ok: false }; });
  });

  Promise.all(promises).then(function (results) {
    setLoading(false);
    setSkeleton(false);
    var html = '';
    var firstError = null;
    results.forEach(function (r) {
      if (r.ok && r.data && r.data.Response === 'True' && r.data.Search && r.data.Search.length) {
        var title = (r.term.charAt(0).toUpperCase() + r.term.slice(1));
        html += renderMovieRow(title, r.data.Search);
      } else if (!r.ok && r.error && !firstError) {
        firstError = r.error;
      }
    });
    if (html) {
      setMovieRows(html);
      setApiError('');
      var filterBar = document.getElementById('filterBar');
      if (filterBar) filterBar.style.display = 'none';
    } else {
      var errMsg = firstError || 'No results.';
      if (errMsg === 'Failed to fetch' || errMsg.indexOf('Network error') === 0) {
        errMsg = 'Cannot reach the server. Check your internet and try running from a local server (e.g. npx serve .).';
      }
      setApiError(errMsg);
    }
  });
}

/**
 * Auth guard - redirect to login if not authenticated
 */
function ensureLoggedIn() {
  if (typeof isLoggedIn !== 'function' || !isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/**
 * Logout with confirmation
 */
function handleLogout(e) {
  e.preventDefault();
  if (!confirm('Are you sure you want to sign out?')) return;
  if (typeof logout === 'function') logout();
  window.location.href = 'login.html';
}

function loadWatchlist() {
  if (typeof Watchlist === 'undefined') return;
  var list = Watchlist.getWatchlist();
  var sectionTitle = document.getElementById('sectionTitle');
  var filterBar = document.getElementById('filterBar');
  var loadMoreWrap = document.getElementById('loadMoreWrap');
  if (sectionTitle) sectionTitle.textContent = 'Watchlist';
  if (filterBar) filterBar.style.display = 'none';
  if (loadMoreWrap) loadMoreWrap.style.display = 'none';
  if (list.length) {
    setLoading(false);
    setEmpty(false);
    setApiError('');
    setMovieRows(renderMovieRow('', list));
  } else {
    setEmpty(true);
    setMovieRows('');
  }
}

function applyFilterSort() {
  var typeFilter = (document.getElementById('filterType') && document.getElementById('filterType').value) || '';
  var sortBy = (document.getElementById('sortBy') && document.getElementById('sortBy').value) || 'title';
  var filtered = filterAndSortMovies(currentSearchResults, typeFilter || null, sortBy);
  setMovieRows(renderMovieRow('', filtered));
}

/**
 * Init dashboard
 */
function init() {
  if (!ensureLoggedIn()) return;

  var user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  var welcome = document.getElementById('welcomeMsg');
  if (welcome && user && user.fullName) {
    welcome.textContent = 'Welcome, ' + user.fullName + '!';
  }

  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  var searchInput = document.getElementById('searchInput');
  var searchBtn = document.getElementById('searchBtn');
  var clearSearchBtn = document.getElementById('clearSearchBtn');
  var quickNav = document.getElementById('quickNav');
  var filterBar = document.getElementById('filterBar');
  var filterType = document.getElementById('filterType');
  var sortBy = document.getElementById('sortBy');
  var loadMoreBtn = document.getElementById('loadMoreBtn');
  var loadMoreWrap = document.getElementById('loadMoreWrap');
  var retryBtn = document.getElementById('retryBtn');
  var emptyStateSearchBtn = document.getElementById('emptyStateSearchBtn');
  var backToTop = document.getElementById('backToTop');

  // Debounced search
  const debouncedSearch = typeof debounce !== 'undefined' ? debounce(function(query) {
    if (query.trim()) doSearch(query);
  }, 500) : null;

  function onSearch() {
    var q = searchInput ? searchInput.value.trim() : '';
    if (q) {
      doSearch(q);
      if (clearSearchBtn) clearSearchBtn.style.display = 'block';
      if (quickNav) quickNav.style.display = 'flex';
      setQuickNavActive(null);
    } else {
      loadDefaultRows();
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      if (quickNav) quickNav.style.display = 'flex';
      setQuickNavActive('trending');
    }
  }

  function setQuickNavActive(section) {
    if (!quickNav) return;
    quickNav.querySelectorAll('.quick-nav-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-section') === section);
    });
  }

  function clearSearch() {
    if (searchInput) searchInput.value = '';
    onSearch();
    if (searchInput) searchInput.focus();
  }

  if (searchBtn) searchBtn.addEventListener('click', onSearch);
  if (clearSearchBtn) clearSearchBtn.addEventListener('click', clearSearch);

  if (searchInput) {
    searchInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSearch();
      }
    });
    searchInput.addEventListener('input', function() {
      var q = searchInput.value.trim();
      if (clearSearchBtn) clearSearchBtn.style.display = q ? 'block' : 'none';
      if (q && debouncedSearch) {
        setLoading(true);
        setSkeleton(false);
        debouncedSearch(q);
      } else if (!q) {
        loadDefaultRows();
      }
    });
  }

  // Keyboard shortcut: / to focus search
  document.addEventListener('keydown', function(e) {
    if (e.key === '/' && document.activeElement !== searchInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      if (searchInput) searchInput.focus();
    }
  });

  // Popular search chips
  document.querySelectorAll('.chip[data-search]').forEach(function(chip) {
    chip.addEventListener('click', function() {
      var q = this.getAttribute('data-search') || '';
      if (searchInput) searchInput.value = q;
      onSearch();
    });
  });

  // Filter / Sort
  if (filterType) filterType.addEventListener('change', applyFilterSort);
  if (sortBy) sortBy.addEventListener('change', applyFilterSort);

  // Load more
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      var nextPage = currentSearchPage + 1;
      doSearch(currentSearchQuery, nextPage, true);
    });
  }

  // Retry on error
  if (retryBtn) {
    retryBtn.addEventListener('click', function() {
      if (currentSearchQuery) {
        doSearch(currentSearchQuery, 1);
      } else {
        loadDefaultRows();
      }
    });
  }

  // Empty state: focus search
  if (emptyStateSearchBtn) {
    emptyStateSearchBtn.addEventListener('click', function() {
      if (searchInput) searchInput.focus();
    });
  }

  // Back to top
  if (backToTop) {
    window.addEventListener('scroll', function() {
      backToTop.style.display = window.scrollY > 400 ? 'block' : 'none';
    });
    backToTop.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Quick navigation
  if (quickNav) {
    setQuickNavActive('trending');
    quickNav.querySelectorAll('.quick-nav-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var section = this.getAttribute('data-section');
        setQuickNavActive(section);
        if (section === 'favorites') {
          window.location.href = 'favorites.html';
        } else if (section === 'recent') {
          loadRecentlyViewed();
        } else if (section === 'watchlist') {
          loadWatchlist();
        } else {
          loadDefaultRows();
        }
      });
    });
  }

  function loadRecentlyViewed() {
    if (typeof RecentlyViewed === 'undefined') return;
    var viewed = RecentlyViewed.getRecentlyViewed();
    var sectionTitle = document.getElementById('sectionTitle');
    var filterBar = document.getElementById('filterBar');
    var loadMoreWrap = document.getElementById('loadMoreWrap');
    if (sectionTitle) sectionTitle.textContent = 'Recently Viewed';
    if (filterBar) filterBar.style.display = 'none';
    if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    if (viewed.length) {
      setLoading(false);
      setEmpty(false);
      setApiError('');
      setMovieRows(renderMovieRow('', viewed));
    } else {
      setEmpty(true);
      setMovieRows('');
    }
  }

  // Sticky header on scroll
  var header = document.getElementById('dashboardHeader');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // Initial load: default rows
  loadDefaultRows();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
