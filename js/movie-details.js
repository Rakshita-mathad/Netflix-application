/**
 * Movie Details Modal - Fetch and display full movie information
 */

const MovieDetails = {
  modal: null,
  
  init() {
    if (!this.modal) {
      this.modal = document.createElement('div');
      this.modal.className = 'movie-modal';
      this.modal.innerHTML = `
        <div class="movie-modal-backdrop"></div>
        <div class="movie-modal-content">
          <button class="movie-modal-close" aria-label="Close modal">&times;</button>
          <div class="movie-modal-body" id="movieModalBody">
            <div class="loading">
              <div class="loading-spinner"></div>
              <p>Loading movie details...</p>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(this.modal);
      
      // Close handlers
      const backdrop = this.modal.querySelector('.movie-modal-backdrop');
      const closeBtn = this.modal.querySelector('.movie-modal-close');
      
      [backdrop, closeBtn].forEach(el => {
        if (el) el.addEventListener('click', () => this.close());
      });
      
      // ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal.classList.contains('active')) {
          this.close();
        }
      });
    }
  },
  
  async show(imdbID) {
    this.init();
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const body = this.modal.querySelector('#movieModalBody');
    if (!body) return;
    
    body.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Loading movie details...</p></div>';
    
    try {
      const movie = await this.fetchMovieDetails(imdbID);
      body.innerHTML = this.renderMovieDetails(movie);
      this.attachEventListeners(movie);
    } catch (error) {
      body.innerHTML = '<div class="api-error">Failed to load movie details. Please try again.</div>';
    }
  },
  
  async fetchMovieDetails(imdbID) {
    const url = `https://www.omdbapi.com/?apikey=9b5a4b78&i=${encodeURIComponent(imdbID)}&plot=full`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    if (data.Response === 'False') throw new Error(data.Error || 'Movie not found');
    return data;
  },
  
  renderMovieDetails(movie) {
    const title = escapeHtml(movie.Title || 'Unknown');
    const year = movie.Year || 'N/A';
    const rated = movie.Rated || 'N/A';
    const released = formatDate(movie.Released);
    const runtime = movie.Runtime || 'N/A';
    const genre = movie.Genre || 'N/A';
    const director = movie.Director || 'N/A';
    const writer = movie.Writer || 'N/A';
    const actors = movie.Actors || 'N/A';
    const plot = movie.Plot || 'No plot available.';
    const language = movie.Language || 'N/A';
    const country = movie.Country || 'N/A';
    const awards = movie.Awards || 'N/A';
    const imdbRating = movie.imdbRating || 'N/A';
    const imdbVotes = movie.imdbVotes || 'N/A';
    var poster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : '';
    var posterPlaceholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22370%22%3E%3Crect fill=%22%232a2a2a%22 width=%22100%25%22 height=%22100%25%22/%3E%3Ctext fill=%22%23808080%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2214%22%3ENo image%3C/text%3E%3C/svg%3E';
    const isFavorite = typeof Favorites !== 'undefined' && Favorites.isFavorite(movie.imdbID);
    const onWatchlist = typeof Watchlist !== 'undefined' && Watchlist.has(movie.imdbID);
    const imdbUrl = movie.imdbID ? 'https://www.imdb.com/title/' + movie.imdbID + '/' : '';
    
    return `
      <div class="movie-details">
        <div class="movie-details-header">
          ${poster ? '<img src="' + poster + '" alt="' + title + '" class="movie-details-poster" onerror="this.onerror=null;this.src=\'' + posterPlaceholder + '\';this.alt=\'No poster\';">' : '<div class="movie-details-poster poster-placeholder">No image</div>'}
          <div class="movie-details-info">
            <h1 class="movie-details-title">${title}</h1>
            <div class="movie-details-meta">
              <span>${year}</span>
              <span>${rated}</span>
              <span>${runtime}</span>
              ${imdbRating !== 'N/A' ? `<span class="imdb-rating">⭐ ${imdbRating}/10</span>` : ''}
            </div>
            <div class="movie-details-genre">${genre}</div>
            <div class="movie-details-actions">
              <button class="btn-favorite ${isFavorite ? 'active' : ''}" data-imdb-id="${movie.imdbID}" aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                ${isFavorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
              </button>
              <button class="btn-watchlist ${onWatchlist ? 'active' : ''}" data-imdb-id="${movie.imdbID}" aria-label="${onWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}">
                ${onWatchlist ? '✓ In Watchlist' : '+ Watchlist'}
              </button>
              ${imdbUrl ? `<a href="${imdbUrl}" target="_blank" rel="noopener" class="btn-imdb">View on IMDb</a>` : ''}
              <button class="btn-share" aria-label="Share">Share</button>
            </div>
          </div>
        </div>
        <div class="movie-details-content">
          <div class="movie-details-section">
            <h3>Plot</h3>
            <p>${escapeHtml(plot)}</p>
          </div>
          <div class="movie-details-grid">
            <div class="movie-details-item">
              <strong>Director:</strong> ${escapeHtml(director)}
            </div>
            <div class="movie-details-item">
              <strong>Writer:</strong> ${escapeHtml(writer)}
            </div>
            <div class="movie-details-item">
              <strong>Actors:</strong> ${escapeHtml(actors)}
            </div>
            <div class="movie-details-item">
              <strong>Released:</strong> ${released}
            </div>
            <div class="movie-details-item">
              <strong>Language:</strong> ${escapeHtml(language)}
            </div>
            <div class="movie-details-item">
              <strong>Country:</strong> ${escapeHtml(country)}
            </div>
            ${awards !== 'N/A' ? `<div class="movie-details-item"><strong>Awards:</strong> ${escapeHtml(awards)}</div>` : ''}
            ${imdbVotes !== 'N/A' ? `<div class="movie-details-item"><strong>IMDb Votes:</strong> ${imdbVotes}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  },
  
  attachEventListeners(movie) {
    const favoriteBtn = this.modal.querySelector('.btn-favorite');
    if (favoriteBtn && typeof Favorites !== 'undefined') {
      favoriteBtn.addEventListener('click', () => {
        const isFavorite = Favorites.isFavorite(movie.imdbID);
        if (isFavorite) {
          Favorites.removeFavorite(movie.imdbID);
          favoriteBtn.textContent = '🤍 Add to Favorites';
          favoriteBtn.classList.remove('active');
          if (typeof Toast !== 'undefined') Toast.info('Removed from favorites');
        } else {
          Favorites.addFavorite(movie);
          favoriteBtn.textContent = '❤️ Remove from Favorites';
          favoriteBtn.classList.add('active');
          if (typeof Toast !== 'undefined') Toast.success('Added to favorites!');
        }
      });
    }

    const watchlistBtn = this.modal.querySelector('.btn-watchlist');
    if (watchlistBtn && typeof Watchlist !== 'undefined') {
      watchlistBtn.addEventListener('click', () => {
        const onList = Watchlist.has(movie.imdbID);
        if (onList) {
          Watchlist.remove(movie.imdbID);
          watchlistBtn.textContent = '+ Watchlist';
          watchlistBtn.classList.remove('active');
          if (typeof Toast !== 'undefined') Toast.info('Removed from watchlist');
        } else {
          Watchlist.add(movie);
          watchlistBtn.textContent = '✓ In Watchlist';
          watchlistBtn.classList.add('active');
          if (typeof Toast !== 'undefined') Toast.success('Added to watchlist!');
        }
      });
    }

    const shareBtn = this.modal.querySelector('.btn-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const url = movie.imdbID ? 'https://www.imdb.com/title/' + movie.imdbID + '/' : window.location.href;
        const text = (movie.Title || 'Movie') + (movie.Year ? ' (' + movie.Year + ')' : '');
        if (navigator.share) {
          navigator.share({
            title: text,
            text: 'Check out this movie: ' + text,
            url: url
          }).then(() => {
            if (typeof Toast !== 'undefined') Toast.success('Shared!');
          }).catch(() => {});
        } else {
          try {
            navigator.clipboard.writeText(url);
            if (typeof Toast !== 'undefined') Toast.success('Link copied to clipboard!');
          } catch (e) {
            if (typeof Toast !== 'undefined') Toast.info('Share: ' + url);
          }
        }
      });
    }
    
    if (typeof RecentlyViewed !== 'undefined') {
      RecentlyViewed.addViewed(movie);
    }
  },
  
  close() {
    if (this.modal) {
      this.modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
};
