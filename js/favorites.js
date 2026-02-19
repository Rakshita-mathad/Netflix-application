/**
 * Favorites page - Display user's favorite movies
 */

(function() {
  function ensureLoggedIn() {
    if (typeof isLoggedIn !== 'function' || !isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function renderMovieCard(movie) {
    const title = escapeHtml(movie.Title || 'Unknown');
    const year = movie.Year || 'N/A';
    const type = (movie.Type || 'movie').charAt(0).toUpperCase() + (movie.Type || '').slice(1);
    var poster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : '';
    var imdbID = movie.imdbID || '';
    var placeholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22240%22%3E%3Crect fill=%22%232a2a2a%22 width=%22100%25%22 height=%22100%25%22/%3E%3Ctext fill=%22%23808080%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2212%22%3ENo image%3C/text%3E%3C/svg%3E';
    var imgOrPlaceholder = poster
      ? '<img class="movie-card-poster" src="' + poster + '" alt="' + title + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + placeholder + '\';this.alt=\'No poster\';">'
      : '<div class="movie-card-poster poster-placeholder">No image</div>';

    return (
      '<div class="movie-card" data-imdb-id="' + imdbID + '" tabindex="0" role="button" aria-label="View details for ' + title + '">' +
        '<div class="movie-card-overlay">' +
          '<button class="movie-card-favorite-btn active" data-imdb-id="' + imdbID + '" aria-label="Remove from favorites">❤️</button>' +
        '</div>' +
        imgOrPlaceholder +
        '<div class="movie-card-info">' +
          '<div class="movie-card-title">' + title + '</div>' +
          '<div class="movie-card-meta">' + year + ' · ' + type + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function attachHandlers() {
    const cards = document.querySelectorAll('.movie-card[data-imdb-id]');
    cards.forEach(card => {
      const imdbID = card.getAttribute('data-imdb-id');
      if (!imdbID) return;

      // Click to view details
      card.addEventListener('click', function(e) {
        if (e.target.closest('.movie-card-favorite-btn')) return;
        if (typeof MovieDetails !== 'undefined') {
          MovieDetails.show(imdbID);
        }
      });

      // Enter key
      card.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && typeof MovieDetails !== 'undefined') {
          MovieDetails.show(imdbID);
        }
      });

      // Remove from favorites
      const favBtn = card.querySelector('.movie-card-favorite-btn');
      if (favBtn && typeof Favorites !== 'undefined') {
        favBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          Favorites.removeFavorite(imdbID);
          if (typeof Toast !== 'undefined') {
            Toast.info('Removed from favorites');
          }
          loadFavorites(); // Reload
        });
      }
    });
  }

  function loadFavorites() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const favoritesGrid = document.getElementById('favoritesGrid');

    // Verify DOM elements exist
    if (!loadingState || !emptyState || !favoritesGrid) {
      console.error('Required DOM elements not found. Check HTML structure.');
      return;
    }

    // Check if required dependencies are available
    if (typeof Favorites === 'undefined') {
      console.error('Favorites object is not defined. Make sure utils.js is loaded.');
      loadingState.style.display = 'none';
      emptyState.innerHTML = '<p>Error loading favorites. Please refresh the page.</p>';
      emptyState.style.display = 'block';
      return;
    }

    if (typeof escapeHtml === 'undefined') {
      console.error('escapeHtml function is not defined. Make sure utils.js is loaded.');
      loadingState.style.display = 'none';
      emptyState.innerHTML = '<p>Error loading favorites. Please refresh the page.</p>';
      emptyState.style.display = 'block';
      return;
    }

    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    favoritesGrid.style.display = 'none';

    try {
      setTimeout(() => {
        const favorites = Favorites.getFavorites();
        
        loadingState.style.display = 'none';

        if (!favorites || favorites.length === 0) {
          emptyState.innerHTML = '<p>You haven\'t added any favorites yet.</p><p style="margin-top: 1rem;"><a href="home.html" style="color: var(--red-accent);">Browse movies</a> to add favorites!</p>';
          emptyState.style.display = 'block';
        } else {
          const html = '<div class="movie-cards">' + favorites.map(renderMovieCard).join('') + '</div>';
          favoritesGrid.innerHTML = html;
          favoritesGrid.style.display = 'block';
          attachHandlers();
        }
      }, 300);
    } catch (error) {
      console.error('Error loading favorites:', error);
      loadingState.style.display = 'none';
      emptyState.innerHTML = '<p>Error loading favorites. Please refresh the page.</p><p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted);">' + error.message + '</p>';
      emptyState.style.display = 'block';
    }
  }

  function init() {
    // Wait a bit to ensure all scripts are loaded
    setTimeout(function() {
      if (!ensureLoggedIn()) return;

      // Verify dependencies are available
      if (typeof isLoggedIn === 'undefined') {
        console.error('auth.js not loaded properly');
        return;
      }

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
          e.preventDefault();
          if (typeof logout === 'function') {
            logout();
          }
          window.location.href = 'login.html';
        });
      }

      loadFavorites();
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
