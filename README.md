# Netflix-Style Movie App 🎬

A feature-rich, user-friendly Netflix-style web application with authentication, movie browsing, favorites, and more!

## 🚀 How to Run

- **Option 1:** Open `index.html` in a browser (double-click or drag into Chrome/Edge/Firefox).
- **Option 2:** For best API compatibility (avoids CORS with `file://`), run a local server from this folder:
  ```bash
  npx serve . -l 3000
  ```
  Then open `http://localhost:3000` in your browser.

## ✨ Features

### 🔐 Authentication
- **Signup Page** – Full name, email, password, confirm password
  - Strong password validation (8+ chars, uppercase, lowercase, number, special char)
  - Duplicate email prevention
  - Inline error messages
  - Password visibility toggle
  - Data stored in `localStorage`

- **Login Page** – Industry-standard authentication UI
  - Email & password validation
  - Password show/hide toggle
  - "Remember Me" checkbox (stores email)
  - Accessible labels and placeholders
  - Error messages for invalid credentials
  - Auto-redirect to dashboard on success

### 🎬 Movie Dashboard
- **Protected Route** – Only accessible when logged in
- **Movie Browsing** – Fetches from OMDb API
  - Default trending rows (Avengers, Batman, Matrix, Inception)
  - Search functionality with debounced input
  - Clear search button
  - Real-time search results

- **Movie Cards**
  - Click to view full details
  - Hover to reveal favorite button
  - Keyboard navigation support (Enter key)
  - Poster, title, year, type display
  - Lazy loading for images

### 🎯 Enhanced Features

- **Movie Details Modal**
  - Full movie information (plot, cast, director, ratings, etc.)
  - IMDb rating display
  - Add/remove favorites and **watchlist** from modal
  - **View on IMDb** link (opens in new tab)
  - **Share** button (native share or copy link)
  - ESC key to close
  - Click outside to close

- **Favorites System** ❤️
  - Add/remove favorites from cards or modal
  - Dedicated favorites page (`favorites.html`)
  - Per-user favorites stored in localStorage
  - Visual feedback (heart icons)

- **Recently Viewed** 📚
  - Automatically tracks viewed movies
  - Quick access via navigation
  - Shows last 20 viewed items

- **User Profile** 👤
  - View account information
  - See favorites and recently viewed counts
  - Change password
  - Delete account option

- **Toast Notifications** 🔔
  - Success, error, and info messages
  - Auto-dismiss after 3 seconds
  - Smooth animations
  - Non-intrusive design

- **Watchlist** 📋
  - Save movies/series to watch later (separate from favorites)
  - Add/remove from movie details modal
  - Dedicated watchlist page (`watchlist.html`)
  - Quick nav and profile links

- **Quick Navigation**
  - Trending movies
  - My Favorites
  - Recently Viewed
  - Watchlist
  - Active section highlighting

- **Enhanced Search**
  - Debounced search (500ms delay)
  - Clear button when typing
  - Real-time results
  - Enter key support
  - **Popular search chips** (Action, Comedy, Drama, Sci-Fi, Marvel) – one click to search
  - **Keyboard shortcut**: press `/` to focus search from anywhere
  - Search history saved per user (used for future suggestions)

- **Filter & Sort** (when viewing search results)
  - Filter by type: All / Movies / Series
  - Sort by: Title A–Z, Newest first, Oldest first

- **Load More** – Pagination for search results (OMDb pages)

- **Back to top** – Floating button appears on scroll; smooth scroll to top

- **Accessibility & UX**
  - **Skip to main content** link (visible on focus)
  - **Logout confirmation** (“Are you sure?”)
  - **Forgot password?** link on login (demo message)
  - **Retry** button on API errors
  - **Skeleton loaders** for initial movie load (no blank spinner)
  - Empty state with “Search movies” button that focuses search
  - Profile links to Favorites and Watchlist
  - Smooth animations and transitions
  - Responsive design (mobile-friendly)
  - Sticky header on scroll
  - Focus states for keyboard users

## 📁 File Structure

```
├── index.html          # Redirects to login or home
├── signup.html         # User registration
├── login.html          # User login
├── home.html           # Movie dashboard (main page)
├── profile.html        # User profile & settings
├── favorites.html      # User's favorite movies
├── watchlist.html      # Watch later list
├── css/
│   └── style.css       # All styles (Netflix dark theme)
├── js/
│   ├── auth.js         # Authentication & user management
│   ├── utils.js        # Utilities (toast, favorites, recently viewed)
│   ├── movie-details.js # Movie details modal
│   ├── signup.js       # Signup page logic
│   ├── login.js        # Login page logic
│   ├── dashboard.js    # Dashboard & movie browsing
│   ├── profile.js      # Profile page logic
│   ├── favorites.js    # Favorites page logic
│   └── watchlist.js    # Watchlist page logic
└── README.md
```

## 🔌 API

- **OMDb API**
  - Base URL: `https://www.omdbapi.com/`
  - API Key: `9b5a4b78`
  - Search: `?apikey=9b5a4b78&s={query}`
  - Details: `?apikey=9b5a4b78&i={imdbID}&plot=full`

## 🎨 Design

- **Netflix-style dark theme**
- **Responsive layout** (mobile, tablet, desktop)
- **Smooth animations** and transitions
- **Accessible** (ARIA labels, keyboard navigation)
- **Modern UI** with hover effects and visual feedback

## 💾 Data Storage

All data is stored in browser `localStorage`:
- User accounts (`netflix_users`)
- Current session (`netflix_current_user`)
- Favorites (per user: `netflix_favorites_{email}`)
- Watchlist (per user: `netflix_watchlist_{email}`)
- Recently viewed (per user: `netflix_recently_viewed_{email}`)
- Search history (per user: `netflix_search_history_{email}`)
- Remember email (`netflix_remember_email`)

## 🎯 User Flow

1. **Sign Up** → Create account with email & password
2. **Login** → Authenticate and access dashboard
3. **Browse** → View trending movies or search
4. **Explore** → Click movie cards to see details
5. **Favorite** → Add movies to favorites
6. **Profile** → Manage account settings
7. **Logout** → End session

## 🚀 Ready for Demo!

All features are fully functional and ready to showcase. The app provides a complete, user-friendly movie browsing experience with modern UI/UX patterns.
