/**
 * Watchlist page - Watch later list
 */
(function() {
  function ensureLoggedIn() {
    if (typeof isLoggedIn !== 'function' || !isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function renderCard(movie) {
    var title = escapeHtml(movie.Title || 'Unknown');
    var year = movie.Year || 'N/A';
    var type = (movie.Type || 'movie').charAt(0).toUpperCase() + (movie.Type || '').slice(1);
    var poster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : '';
    var imdbID = movie.imdbID || '';
    var placeholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22240%22%3E%3Crect fill=%22%232a2a2a%22 width=%22100%25%22 height=%22100%25%22/%3E%3Ctext fill=%22%23808080%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2212%22%3ENo image%3C/text%3E%3C/svg%3E';
    var imgEl = poster
      ? '<img class="movie-card-poster" src="' + poster + '" alt="' + title + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + placeholder + '\';this.alt=\'No poster\';">'
      : '<div class="movie-card-poster poster-placeholder">No image</div>';
    return (
      '<div class="movie-card" data-imdb-id="' + imdbID + '" tabindex="0" role="button" aria-label="View details for ' + title + '">' +
        '<div class="movie-card-overlay">' +
          '<button class="movie-card-watchlist-btn active" data-imdb-id="' + imdbID + '" aria-label="Remove from watchlist">− Watchlist</button>' +
        '</div>' +
        imgEl +
        '<div class="movie-card-info">' +
          '<div class="movie-card-title">' + title + '</div>' +
          '<div class="movie-card-meta">' + year + ' · ' + type + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function attachHandlers() {
    var cards = document.querySelectorAll('.movie-card[data-imdb-id]');
    cards.forEach(function(card) {
      var imdbID = card.getAttribute('data-imdb-id');
      if (!imdbID) return;
      card.addEventListener('click', function(e) {
        if (e.target.closest('.movie-card-watchlist-btn')) return;
        if (typeof MovieDetails !== 'undefined') MovieDetails.show(imdbID);
      });
      card.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && typeof MovieDetails !== 'undefined') MovieDetails.show(imdbID);
      });
      var btn = card.querySelector('.movie-card-watchlist-btn');
      if (btn && typeof Watchlist !== 'undefined') {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          Watchlist.remove(imdbID);
          if (typeof Toast !== 'undefined') Toast.info('Removed from watchlist');
          loadWatchlist();
        });
      }
    });
  }

  function loadWatchlist() {
    if (typeof Watchlist === 'undefined') return;
    var loadingState = document.getElementById('loadingState');
    var emptyState = document.getElementById('emptyState');
    var grid = document.getElementById('watchlistGrid');
    if (loadingState) loadingState.style.display = 'none';
    var list = Watchlist.getWatchlist();
    if (list.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (grid) { grid.style.display = 'none'; grid.innerHTML = ''; }
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (grid) {
        grid.innerHTML = '<div class="movie-cards">' + list.map(renderCard).join('') + '</div>';
        grid.style.display = 'block';
        attachHandlers();
      }
    }
  }

  function init() {
    if (!ensureLoggedIn()) return;
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (!confirm('Are you sure you want to sign out?')) return;
        if (typeof logout === 'function') logout();
        window.location.href = 'login.html';
      });
    }
    loadWatchlist();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
