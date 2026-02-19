/**
 * Job Notification Tracker — Router, Rendering, Filters & Match Scoring
 */

const ROUTES = ['/', '/dashboard', '/saved', '/digest', '/settings', '/proof', '/jt/proof', '/jt/07-test', '/jt/08-ship'];
const STORAGE_KEY = 'jnt-saved-ids';
const TEST_CHECKLIST_KEY = 'jobTrackerTestChecklist';
const PROOF_ARTIFACTS_KEY = 'jobTrackerProofArtifacts';
const PREF_STORAGE_KEY = 'jobTrackerPreferences';
const DIGEST_STORAGE_PREFIX = 'jobTrackerDigest_';
const STATUS_STORAGE_KEY = 'jobTrackerStatus';
const STATUS_HISTORY_KEY = 'jobTrackerStatusHistory';

const JOB_STATUSES = ['Not Applied', 'Applied', 'Rejected', 'Selected'];

const TEST_ITEMS = [
  { id: 'prefs-persist', label: 'Preferences persist after refresh', tooltip: 'Save preferences in Settings, refresh page, confirm form is prefilled.' },
  { id: 'match-score', label: 'Match score calculates correctly', tooltip: 'Set role keywords in Settings, check job cards show match % badge.' },
  { id: 'show-matches', label: '"Show only matches" toggle works', tooltip: 'Enable toggle on Dashboard, verify only jobs above threshold appear.' },
  { id: 'save-persist', label: 'Save job persists after refresh', tooltip: 'Save a job on Dashboard, refresh, confirm it appears in Saved.' },
  { id: 'apply-new-tab', label: 'Apply opens in new tab', tooltip: 'Click Apply on any job card, verify URL opens in new tab.' },
  { id: 'status-persist', label: 'Status update persists after refresh', tooltip: 'Change job status to Applied, refresh, confirm status remains.' },
  { id: 'status-filter', label: 'Status filter works correctly', tooltip: 'Filter by Applied on Dashboard, confirm only Applied jobs show.' },
  { id: 'digest-top10', label: 'Digest generates top 10 by score', tooltip: 'Generate digest, confirm 10 jobs sorted by match score.' },
  { id: 'digest-persist', label: 'Digest persists for the day', tooltip: 'Generate digest, refresh page, confirm digest still visible.' },
  { id: 'no-console', label: 'No console errors on main pages', tooltip: 'Open DevTools console, visit Dashboard, Settings, Digest, Saved; check for errors.' }
];

const PROOF_STEPS = [
  { id: 1, label: 'Design system created', completed: true },
  { id: 2, label: 'Route skeleton & navigation', completed: true },
  { id: 3, label: 'Job data & dashboard rendering', completed: true },
  { id: 4, label: 'Preferences & match scoring', completed: true },
  { id: 5, label: 'Digest engine', completed: true },
  { id: 6, label: 'Status tracking', completed: true },
  { id: 7, label: 'Test checklist', completed: true },
  { id: 8, label: 'Proof & submission', completed: null }
];

const DEFAULT_PREFS = {
  roleKeywords: '',
  preferredLocations: [],
  preferredMode: [],
  experienceLevel: '',
  skills: '',
  minMatchScore: 40
};

function getPath() {
  const hash = window.location.hash.slice(1);
  return hash || '/';
}

function getSavedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveJob(id) {
  const ids = getSavedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}

function unsaveJob(id) {
  const ids = getSavedIds().filter((i) => i !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function isSaved(id) {
  return getSavedIds().includes(id);
}

// ===== Job Status =====

function getJobStatusMap() {
  try {
    const raw = localStorage.getItem(STATUS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getJobStatus(id) {
  const map = getJobStatusMap();
  return map[id] || 'Not Applied';
}

function setJobStatus(id, status) {
  const map = getJobStatusMap();
  map[id] = status;
  localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(map));
}

function getStatusHistory() {
  try {
    const raw = localStorage.getItem(STATUS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addStatusHistory(entry) {
  const hist = getStatusHistory();
  hist.unshift(entry);
  const capped = hist.slice(0, 50);
  localStorage.setItem(STATUS_HISTORY_KEY, JSON.stringify(capped));
}

function recordStatusChange(jobId, status) {
  const job = typeof JOBS !== 'undefined' ? JOBS.find((j) => j.id === jobId) : null;
  addStatusHistory({
    jobId,
    title: job?.title || 'Unknown',
    company: job?.company || 'Unknown',
    status,
    date: new Date().toISOString()
  });
}

// ===== Test Checklist =====

function getTestChecklist() {
  try {
    const raw = localStorage.getItem(TEST_CHECKLIST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setTestChecklistItem(id, checked) {
  const map = getTestChecklist();
  map[id] = !!checked;
  localStorage.setItem(TEST_CHECKLIST_KEY, JSON.stringify(map));
}

function allTestsPassed() {
  const map = getTestChecklist();
  return TEST_ITEMS.every((item) => map[item.id] === true);
}

function resetTestChecklist() {
  localStorage.setItem(TEST_CHECKLIST_KEY, JSON.stringify({}));
  handleRoute();
}

// ===== Proof Artifacts =====

function getProofArtifacts() {
  try {
    const raw = localStorage.getItem(PROOF_ARTIFACTS_KEY);
    return raw ? JSON.parse(raw) : { lovable: '', github: '', deployed: '' };
  } catch {
    return { lovable: '', github: '', deployed: '' };
  }
}

function setProofArtifacts(artifacts) {
  localStorage.setItem(PROOF_ARTIFACTS_KEY, JSON.stringify(artifacts));
}

function validateUrl(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function allArtifactsComplete() {
  const a = getProofArtifacts();
  return validateUrl(a.lovable) && validateUrl(a.github) && validateUrl(a.deployed);
}

function canShip() {
  return allTestsPassed() && allArtifactsComplete();
}

function getShipStatus() {
  const testsOk = allTestsPassed();
  const artifactsOk = allArtifactsComplete();
  if (testsOk && artifactsOk) return 'Shipped';
  if (testsOk || artifactsOk) return 'In Progress';
  return 'Not Started';
}

function formatFinalSubmission() {
  const a = getProofArtifacts();
  return `------------------------------------------
Job Notification Tracker — Final Submission

Lovable Project:
${a.lovable || '(not provided)'}

GitHub Repository:
${a.github || '(not provided)'}

Live Deployment:
${a.deployed || '(not provided)'}

Core Features:
- Intelligent match scoring
- Daily digest simulation
- Status tracking
- Test checklist enforced
------------------------------------------`;
}

// ===== Toast =====

function showToast(message) {
  const existing = document.getElementById('kn-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'kn-toast';
  toast.className = 'kn-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 200);
  }, 2500);
}

// ===== Preferences =====

function getPreferences() {
  try {
    const raw = localStorage.getItem(PREF_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      ...DEFAULT_PREFS,
      ...p,
      preferredLocations: Array.isArray(p.preferredLocations) ? p.preferredLocations : [],
      preferredMode: Array.isArray(p.preferredMode) ? p.preferredMode : []
    };
  } catch {
    return null;
  }
}

function savePreferences(prefs) {
  localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(prefs));
}

function hasPreferences() {
  const p = getPreferences();
  return p !== null;
}

// ===== Match Score Engine =====

function computeMatchScore(job, prefs) {
  if (!prefs) return 0;

  let score = 0;

  const roleKeywords = (prefs.roleKeywords || '')
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  const titleLower = (job.title || '').toLowerCase();
  const descLower = (job.description || '').toLowerCase();

  if (roleKeywords.length > 0) {
    if (roleKeywords.some((k) => titleLower.includes(k))) score += 25;
    if (roleKeywords.some((k) => descLower.includes(k))) score += 15;
  }

  const locations = prefs.preferredLocations || [];
  if (locations.length > 0 && job.location && locations.includes(job.location)) {
    score += 15;
  }

  const modes = prefs.preferredMode || [];
  if (modes.length > 0 && job.mode && modes.includes(job.mode)) {
    score += 10;
  }

  if (prefs.experienceLevel && job.experience === prefs.experienceLevel) {
    score += 10;
  }

  const userSkills = (prefs.skills || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const jobSkills = (job.skills || []).map((s) => String(s).toLowerCase());
  const hasSkillOverlap = userSkills.length > 0 && jobSkills.some((js) =>
    userSkills.some((us) => js === us || js.includes(us) || us.includes(js))
  );
  if (hasSkillOverlap) score += 15;

  if (job.postedDaysAgo != null && job.postedDaysAgo <= 2) {
    score += 5;
  }

  if (job.source === 'LinkedIn') {
    score += 5;
  }

  return Math.min(100, score);
}

function getMatchBadgeClass(score) {
  if (score >= 80) return 'kn-match-high';
  if (score >= 60) return 'kn-match-medium';
  if (score >= 40) return 'kn-match-low';
  return 'kn-match-none';
}

// ===== Digest Engine =====

function getTodayDateStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getDigestStorageKey(dateStr) {
  return DIGEST_STORAGE_PREFIX + dateStr;
}

function getTodayDigest() {
  const key = getDigestStorageKey(getTodayDateStr());
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function generateDigest(prefs) {
  const jobs = typeof JOBS !== 'undefined' ? JOBS : [];
  const withScores = jobs.map((j) => ({
    ...j,
    matchScore: computeMatchScore(j, prefs)
  }));
  const sorted = withScores.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.postedDaysAgo - b.postedDaysAgo;
  });
  return sorted.slice(0, 10);
}

function saveDigest(jobs, dateStr) {
  const key = getDigestStorageKey(dateStr || getTodayDateStr());
  localStorage.setItem(key, JSON.stringify(jobs));
}

function formatDigestPlainText(jobs) {
  const lines = [
    'Top 10 Jobs For You — 9AM Digest',
    new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    '',
    ...jobs.map((j, i) => {
      return [
        `${i + 1}. ${j.title}`,
        `   ${j.company} · ${j.location} · ${j.experience}`,
        `   Match: ${j.matchScore}%`,
        `   Apply: ${j.applyUrl}`,
        ''
      ].join('\n');
    }),
    'This digest was generated based on your preferences.'
  ];
  return lines.join('\n');
}

// ===== Filter & Sort =====

function getFilterValues(jobs) {
  const locations = [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort();
  const modes = [...new Set(jobs.map((j) => j.mode).filter(Boolean))].sort();
  const experiences = [...new Set(jobs.map((j) => j.experience).filter(Boolean))].sort();
  const sources = [...new Set(jobs.map((j) => j.source).filter(Boolean))].sort();
  return { locations, modes, experiences, sources };
}

function extractSalaryNum(str) {
  if (!str) return 0;
  const m = str.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function filterAndSortJobs(jobsWithScores, filters, prefs) {
  let result = [...jobsWithScores];

  if (filters.keyword) {
    const k = filters.keyword.toLowerCase();
    result = result.filter(
      (j) =>
        j.title.toLowerCase().includes(k) ||
        j.company.toLowerCase().includes(k)
    );
  }
  if (filters.location) {
    result = result.filter((j) => j.location === filters.location);
  }
  if (filters.mode) {
    result = result.filter((j) => j.mode === filters.mode);
  }
  if (filters.experience) {
    result = result.filter((j) => j.experience === filters.experience);
  }
  if (filters.source) {
    result = result.filter((j) => j.source === filters.source);
  }
  if (filters.status) {
    result = result.filter((j) => getJobStatus(j.id) === filters.status);
  }

  if (filters.showMatchesOnly && prefs) {
    const threshold = prefs.minMatchScore ?? 40;
    result = result.filter((j) => j.matchScore >= threshold);
  }

  const sortBy = filters.sortBy || 'latest';
  if (sortBy === 'latest') {
    result.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  } else if (sortBy === 'salary') {
    result.sort((a, b) => {
      const aNum = extractSalaryNum(a.salaryRange);
      const bNum = extractSalaryNum(b.salaryRange);
      return bNum - aNum;
    });
  } else if (sortBy === 'match') {
    result.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }

  return result;
}

// ===== Posted days text =====

function postedText(days) {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

// ===== Job card HTML =====

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Applied': return 'kn-status-applied';
    case 'Rejected': return 'kn-status-rejected';
    case 'Selected': return 'kn-status-selected';
    default: return 'kn-status-neutral';
  }
}

function jobCardHtml(job, showUnsave = false) {
  const saved = isSaved(job.id);
  const score = job.matchScore ?? 0;
  const badgeClass = getMatchBadgeClass(score);
  const status = getJobStatus(job.id);
  const statusClass = getStatusBadgeClass(status);
  return `
    <div class="kn-job-card" data-id="${job.id}">
      <div class="kn-job-card-header">
        <h3 class="kn-job-card-title">${escapeHtml(job.title)}</h3>
        <div class="kn-job-card-badges">
          <span class="kn-match-badge ${badgeClass}">${score}%</span>
          <span class="kn-job-badge kn-job-badge-${(job.source || '').toLowerCase()}">${escapeHtml(job.source)}</span>
        </div>
      </div>
      <p class="kn-job-card-company">${escapeHtml(job.company)}</p>
      <div class="kn-job-card-meta">
        <span>${escapeHtml(job.location)} · ${escapeHtml(job.mode)}</span>
        <span>${escapeHtml(job.experience)}</span>
      </div>
      <p class="kn-job-card-salary">${escapeHtml(job.salaryRange)}</p>
      <p class="kn-job-card-posted">${postedText(job.postedDaysAgo)}</p>
      <div class="kn-job-card-status">
        <label class="kn-status-label">Status</label>
        <select class="kn-input kn-input-select kn-status-select ${statusClass}" data-id="${job.id}">
          ${JOB_STATUSES.map((s) => `<option value="${escapeHtml(s)}" ${status === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
        </select>
      </div>
      <div class="kn-job-card-actions">
        <button class="kn-btn kn-btn-secondary kn-job-btn-view" data-id="${job.id}">View</button>
        <button class="kn-btn kn-btn-secondary kn-job-btn-save ${saved ? 'is-saved' : ''}" data-id="${job.id}">${saved ? 'Saved' : 'Save'}</button>
        <a href="${escapeHtml(job.applyUrl)}" target="_blank" rel="noopener" class="kn-btn kn-btn-primary">Apply</a>
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// ===== Filter bar HTML =====

function filterBarHtml(values, filters, prefs) {
  const showMatchesChecked = filters.showMatchesOnly ? 'checked' : '';
  return `
    <div class="kn-filter-bar">
      <input type="text" class="kn-input kn-filter-keyword" placeholder="Search title or company" value="${escapeHtml(filters.keyword || '')}">
      <select class="kn-input kn-input-select kn-filter-location">
        <option value="">All locations</option>
        ${values.locations.map((l) => `<option value="${escapeHtml(l)}" ${filters.location === l ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}
      </select>
      <select class="kn-input kn-input-select kn-filter-mode">
        <option value="">All modes</option>
        ${values.modes.map((m) => `<option value="${escapeHtml(m)}" ${filters.mode === m ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('')}
      </select>
      <select class="kn-input kn-input-select kn-filter-experience">
        <option value="">All experience</option>
        ${values.experiences.map((e) => `<option value="${escapeHtml(e)}" ${filters.experience === e ? 'selected' : ''}>${escapeHtml(e)}</option>`).join('')}
      </select>
      <select class="kn-input kn-input-select kn-filter-source">
        <option value="">All sources</option>
        ${values.sources.map((s) => `<option value="${escapeHtml(s)}" ${filters.source === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
      </select>
      <select class="kn-input kn-input-select kn-filter-status">
        <option value="">All</option>
        ${JOB_STATUSES.map((s) => `<option value="${escapeHtml(s)}" ${filters.status === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
      </select>
      <select class="kn-input kn-input-select kn-filter-sort">
        <option value="latest" ${filters.sortBy === 'latest' ? 'selected' : ''}>Latest</option>
        <option value="match" ${filters.sortBy === 'match' ? 'selected' : ''}>Match Score</option>
        <option value="salary" ${filters.sortBy === 'salary' ? 'selected' : ''}>Salary</option>
      </select>
      ${prefs ? `
        <label class="kn-filter-toggle">
          <input type="checkbox" class="kn-filter-show-matches" ${showMatchesChecked}>
          <span>Show only jobs above my threshold</span>
        </label>
      ` : ''}
    </div>
  `;
}

// ===== Modal =====

function showJobModal(job) {
  const overlay = document.createElement('div');
  overlay.className = 'kn-modal-overlay';
  overlay.innerHTML = `
    <div class="kn-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="kn-modal-header">
        <h2 id="modal-title" class="kn-modal-title">${escapeHtml(job.title)}</h2>
        <button class="kn-modal-close" aria-label="Close">&times;</button>
      </div>
      <p class="kn-modal-company">${escapeHtml(job.company)} · ${escapeHtml(job.location)}</p>
      <div class="kn-modal-section">
        <h4>Description</h4>
        <p>${escapeHtml(job.description)}</p>
      </div>
      <div class="kn-modal-section">
        <h4>Skills</h4>
        <div class="kn-modal-skills">${(job.skills || []).map((s) => `<span class="kn-skill-tag">${escapeHtml(s)}</span>`).join('')}</div>
      </div>
      <div class="kn-modal-actions">
        <button class="kn-btn kn-btn-secondary kn-job-btn-save ${isSaved(job.id) ? 'is-saved' : ''}" data-id="${job.id}">${isSaved(job.id) ? 'Saved' : 'Save'}</button>
        <a href="${escapeHtml(job.applyUrl)}" target="_blank" rel="noopener" class="kn-btn kn-btn-primary">Apply</a>
      </div>
    </div>
  `;

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('.kn-modal-close')) close();
  });
  overlay.querySelector('.kn-job-btn-save')?.addEventListener('click', () => {
    saveJob(job.id);
    overlay.querySelector('.kn-job-btn-save').textContent = 'Saved';
    overlay.querySelector('.kn-job-btn-save').classList.add('is-saved');
  });

  document.body.style.overflow = 'hidden';
  document.body.appendChild(overlay);
}

// ===== Page renderers =====

function renderLanding() {
  return `
    <div class="kn-app-landing">
      <h1 class="kn-app-landing-headline">Stop Missing The Right Jobs.</h1>
      <p class="kn-app-landing-subtext">Precision-matched job discovery delivered daily at 9AM.</p>
      <a href="#/settings" class="kn-btn kn-btn-primary">Start Tracking</a>
    </div>
  `;
}

function renderSettings() {
  const prefs = getPreferences();
  const jobs = typeof JOBS !== 'undefined' ? JOBS : [];
  const locations = [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort();
  const experienceOptions = ['Fresher', '0-1', '1-3', '3-5'];

  const roleKeywords = (prefs?.roleKeywords ?? '');
  const skills = (prefs?.skills ?? '');
  const experienceLevel = (prefs?.experienceLevel ?? '');
  const minMatchScore = prefs?.minMatchScore ?? 40;
  const preferredLocations = prefs?.preferredLocations ?? [];
  const preferredMode = prefs?.preferredMode ?? [];

  return `
    <div class="kn-app-page">
      <h1>Settings</h1>
      <p class="kn-app-page-subtext">Configure your job preferences.</p>
      <form class="kn-app-settings-form" id="settings-form">
        <div class="kn-app-field">
          <label class="kn-app-field-label">Role keywords</label>
          <input type="text" class="kn-input" name="roleKeywords" placeholder="e.g. SDE, React, Backend (comma-separated)" value="${escapeHtml(roleKeywords)}">
        </div>
        <div class="kn-app-field">
          <label class="kn-app-field-label">Preferred locations</label>
          <select class="kn-input kn-input-select kn-input-multi" name="preferredLocations" multiple size="4">
            ${locations.map((l) => `<option value="${escapeHtml(l)}" ${preferredLocations.includes(l) ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}
          </select>
          <span class="kn-field-hint">Hold Ctrl/Cmd to select multiple</span>
        </div>
        <div class="kn-app-field">
          <label class="kn-app-field-label">Preferred mode</label>
          <div class="kn-checkbox-group">
            <label class="kn-checkbox"><input type="checkbox" name="preferredMode" value="Remote" ${preferredMode.includes('Remote') ? 'checked' : ''}> Remote</label>
            <label class="kn-checkbox"><input type="checkbox" name="preferredMode" value="Hybrid" ${preferredMode.includes('Hybrid') ? 'checked' : ''}> Hybrid</label>
            <label class="kn-checkbox"><input type="checkbox" name="preferredMode" value="Onsite" ${preferredMode.includes('Onsite') ? 'checked' : ''}> Onsite</label>
          </div>
        </div>
        <div class="kn-app-field">
          <label class="kn-app-field-label">Experience level</label>
          <select class="kn-input kn-input-select" name="experienceLevel">
            <option value="">Any</option>
            ${experienceOptions.map((e) => `<option value="${escapeHtml(e)}" ${experienceLevel === e ? 'selected' : ''}>${escapeHtml(e)}</option>`).join('')}
          </select>
        </div>
        <div class="kn-app-field">
          <label class="kn-app-field-label">Skills</label>
          <input type="text" class="kn-input" name="skills" placeholder="e.g. React, Python, SQL (comma-separated)" value="${escapeHtml(skills)}">
        </div>
        <div class="kn-app-field">
          <label class="kn-app-field-label">Minimum match score <span class="kn-slider-value" id="minMatchScore-value">${minMatchScore}</span></label>
          <input type="range" class="kn-input-slider" name="minMatchScore" min="0" max="100" value="${minMatchScore}">
        </div>
        <button type="submit" class="kn-btn kn-btn-primary">Save preferences</button>
      </form>
    </div>
  `;
}

function getDashboardFilters() {
  return {
    keyword: sessionStorage.getItem('jnt-filt-keyword') || '',
    location: sessionStorage.getItem('jnt-filt-location') || '',
    mode: sessionStorage.getItem('jnt-filt-mode') || '',
    experience: sessionStorage.getItem('jnt-filt-experience') || '',
    source: sessionStorage.getItem('jnt-filt-source') || '',
    status: sessionStorage.getItem('jnt-filt-status') || '',
    sortBy: sessionStorage.getItem('jnt-filt-sort') || 'latest',
    showMatchesOnly: sessionStorage.getItem('jnt-filt-show-matches') === '1'
  };
}

function setDashboardFilters(f) {
  sessionStorage.setItem('jnt-filt-keyword', f.keyword);
  sessionStorage.setItem('jnt-filt-location', f.location);
  sessionStorage.setItem('jnt-filt-mode', f.mode);
  sessionStorage.setItem('jnt-filt-experience', f.experience);
  sessionStorage.setItem('jnt-filt-source', f.source);
  sessionStorage.setItem('jnt-filt-status', f.status || '');
  sessionStorage.setItem('jnt-filt-sort', f.sortBy);
  sessionStorage.setItem('jnt-filt-show-matches', f.showMatchesOnly ? '1' : '0');
}

function renderDashboard() {
  const jobs = typeof JOBS !== 'undefined' ? JOBS : [];
  const prefs = getPreferences();
  const filters = getDashboardFilters();
  const values = getFilterValues(jobs);

  const jobsWithScores = jobs.map((j) => ({
    ...j,
    matchScore: computeMatchScore(j, prefs)
  }));

  const filtered = filterAndSortJobs(jobsWithScores, filters, prefs);

  const noPrefsBanner = !prefs ? `
    <div class="kn-banner kn-banner-info">
      Set your preferences to activate intelligent matching.
    </div>
  ` : '';

  const emptyMsg = filtered.length === 0
    ? 'No roles match your criteria. Adjust filters or lower threshold.'
    : null;

  return `
    <div class="kn-app-page kn-app-dashboard">
      <h1>Dashboard</h1>
      <p class="kn-app-page-subtext">Browse and filter jobs.</p>
      ${noPrefsBanner}
      ${filterBarHtml(values, filters, prefs)}
      <div class="kn-job-grid" id="job-grid">
        ${filtered.length ? filtered.map((j) => jobCardHtml(j)).join('') : `
          <div class="kn-app-empty">
            <p class="kn-app-empty-message">${escapeHtml(emptyMsg || 'No jobs match your filters. Try adjusting the filters above.')}</p>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderSaved() {
  const ids = getSavedIds();
  const jobs = (typeof JOBS !== 'undefined' ? JOBS : []).filter((j) => ids.includes(j.id));
  const prefs = getPreferences();
  const jobsWithScores = jobs.map((j) => ({
    ...j,
    matchScore: computeMatchScore(j, prefs)
  }));

  return `
    <div class="kn-app-page">
      <h1>Saved</h1>
      ${jobsWithScores.length ? `
        <p class="kn-app-page-subtext">${jobsWithScores.length} saved job${jobsWithScores.length === 1 ? '' : 's'}.</p>
        <div class="kn-job-grid" id="saved-job-grid">
          ${jobsWithScores.map((j) => jobCardHtml(j, true)).join('')}
        </div>
      ` : `
        <div class="kn-app-empty">
          <p class="kn-app-empty-message">Saved jobs will appear here once you start tracking.</p>
        </div>
      `}
    </div>
  `;
}

function renderDigest() {
  const prefs = getPreferences();
  const digestJobs = getTodayDigest();

  if (!prefs) {
    return `
      <div class="kn-app-page">
        <h1>Digest</h1>
        <div class="kn-digest-blocked">
          <p class="kn-app-empty-message">Set preferences to generate a personalized digest.</p>
        </div>
      </div>
    `;
  }

  const hasDigest = digestJobs !== null;
  const hasJobs = hasDigest && digestJobs.length > 0;

  const todayFormatted = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const statusHistory = getStatusHistory();
  const recentStatusHtml = statusHistory.length > 0 ? `
    <div class="kn-digest-status-section">
      <h3 class="kn-digest-section-title">Recent Status Updates</h3>
      <div class="kn-digest-status-list">
        ${statusHistory.slice(0, 10).map((e) => `
          <div class="kn-digest-status-item">
            <div class="kn-digest-status-item-main">
              <span class="kn-digest-status-title">${escapeHtml(e.title)}</span>
              <span class="kn-digest-status-company">${escapeHtml(e.company)}</span>
            </div>
            <span class="kn-status-badge ${getStatusBadgeClass(e.status)}">${escapeHtml(e.status)}</span>
            <span class="kn-digest-status-date">${new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
    <div class="kn-app-page kn-app-digest">
      <h1>Digest</h1>
      ${recentStatusHtml}
      ${!hasDigest || !hasJobs ? `
        <div class="kn-digest-actions-top">
          <button type="button" class="kn-btn kn-btn-primary" id="digest-generate-btn">Generate Today's 9AM Digest (Simulated)</button>
        </div>
        <div class="kn-digest-empty">
          <p class="kn-app-empty-message">${hasDigest && !hasJobs ? 'No matching roles today. Check again tomorrow.' : 'Generate your digest to see today\'s top 10 matches.'}</p>
        </div>
      ` : `
        <div class="kn-digest-card">
          <div class="kn-digest-header">
            <h2 class="kn-digest-title">Top 10 Jobs For You — 9AM Digest</h2>
            <p class="kn-digest-date">${escapeHtml(todayFormatted)}</p>
          </div>
          <div class="kn-digest-list">
            ${digestJobs.map((j, i) => `
              <div class="kn-digest-item">
                <div class="kn-digest-item-main">
                  <h3 class="kn-digest-item-title">${escapeHtml(j.title)}</h3>
                  <p class="kn-digest-item-company">${escapeHtml(j.company)}</p>
                  <p class="kn-digest-item-meta">${escapeHtml(j.location)} · ${escapeHtml(j.experience)}</p>
                  <span class="kn-match-badge ${getMatchBadgeClass(j.matchScore || 0)}">${j.matchScore || 0}%</span>
                </div>
                <a href="${escapeHtml(j.applyUrl)}" target="_blank" rel="noopener" class="kn-btn kn-btn-primary">Apply</a>
              </div>
            `).join('')}
          </div>
          <div class="kn-digest-footer">
            <p>This digest was generated based on your preferences.</p>
          </div>
        </div>
        <div class="kn-digest-actions">
          <button type="button" class="kn-btn kn-btn-secondary" id="digest-copy-btn">Copy Digest to Clipboard</button>
          <a href="#" class="kn-btn kn-btn-secondary" id="digest-email-btn">Create Email Draft</a>
        </div>
        <p class="kn-digest-note">Demo Mode: Daily 9AM trigger simulated manually.</p>
      `}
    </div>
  `;
}

function renderProof() {
  return `
    <div class="kn-app-page">
      <h1>Proof</h1>
      <p class="kn-app-page-subtext">Artifact collection and verification.</p>
      <div class="kn-app-empty">
        <p class="kn-app-empty-message">This section will hold your proof artifacts.</p>
      </div>
    </div>
  `;
}

function renderProofPage() {
  const artifacts = getProofArtifacts();
  const step8Complete = allArtifactsComplete();
  const steps = PROOF_STEPS.map((s) => {
    const done = s.completed === true || (s.id === 8 && step8Complete);
    return { ...s, status: done ? 'Completed' : 'Pending' };
  });

  return `
    <div class="kn-app-page kn-app-proof">
      <h1>Project 1 — Job Notification Tracker</h1>
      <p class="kn-app-page-subtext">Final proof and submission.</p>

      <div class="kn-proof-section">
        <h2 class="kn-proof-section-title">A) Step Completion Summary</h2>
        <div class="kn-proof-steps">
          ${steps.map((s) => `
            <div class="kn-proof-step">
              <span class="kn-proof-step-label">${s.id}. ${escapeHtml(s.label)}</span>
              <span class="kn-proof-step-status kn-proof-step-${s.status.toLowerCase()}">${s.status}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="kn-proof-section">
        <h2 class="kn-proof-section-title">B) Artifact Collection</h2>
        <form class="kn-proof-artifacts-form" id="proof-artifacts-form">
          <div class="kn-app-field">
            <label class="kn-app-field-label">Lovable Project Link</label>
            <input type="url" class="kn-input" name="lovable" placeholder="https://..." value="${escapeHtml(artifacts.lovable || '')}">
            <span class="kn-proof-input-error" id="proof-error-lovable"></span>
          </div>
          <div class="kn-app-field">
            <label class="kn-app-field-label">GitHub Repository Link</label>
            <input type="url" class="kn-input" name="github" placeholder="https://github.com/..." value="${escapeHtml(artifacts.github || '')}">
            <span class="kn-proof-input-error" id="proof-error-github"></span>
          </div>
          <div class="kn-app-field">
            <label class="kn-app-field-label">Deployed URL (Vercel or equivalent)</label>
            <input type="url" class="kn-input" name="deployed" placeholder="https://..." value="${escapeHtml(artifacts.deployed || '')}">
            <span class="kn-proof-input-error" id="proof-error-deployed"></span>
          </div>
          <button type="submit" class="kn-btn kn-btn-primary">Save Artifacts</button>
        </form>
      </div>

      <div class="kn-proof-actions">
        <button type="button" class="kn-btn kn-btn-primary" id="proof-copy-btn">Copy Final Submission</button>
      </div>
    </div>
  `;
}

function renderTestChecklist() {
  const checklist = getTestChecklist();
  const passed = TEST_ITEMS.filter((item) => checklist[item.id]).length;
  const allPassed = passed === 10;

  return `
    <div class="kn-app-page kn-app-test">
      <h1>Test Checklist</h1>
      <p class="kn-app-page-subtext">Verify all features before shipping.</p>
      <div class="kn-test-summary ${allPassed ? '' : 'kn-test-summary-warning'}">
        <span class="kn-test-summary-count">Tests Passed: ${passed} / 10</span>
        ${!allPassed ? '<p class="kn-test-summary-msg">Resolve all issues before shipping.</p>' : ''}
      </div>
      <div class="kn-test-checklist">
        ${TEST_ITEMS.map((item) => {
          const checked = checklist[item.id] === true;
          return `
            <label class="kn-test-item" title="${escapeHtml(item.tooltip || '')}">
              <input type="checkbox" class="kn-test-checkbox" data-id="${escapeHtml(item.id)}" ${checked ? 'checked' : ''}>
              <span class="kn-test-label">${escapeHtml(item.label)}</span>
              <span class="kn-test-tooltip">How to test</span>
            </label>
          `;
        }).join('')}
      </div>
      <button type="button" class="kn-btn kn-btn-secondary kn-test-reset" id="test-reset-btn">Reset Test Status</button>
    </div>
  `;
}

function renderShip() {
  const shipStatus = getShipStatus();
  const canShipNow = canShip();

  return `
    <div class="kn-app-page kn-app-ship">
      <h1>Ship</h1>
      <div class="kn-ship-status-bar">
        <span class="kn-ship-badge kn-ship-badge-${shipStatus.toLowerCase().replace(/\s+/g, '-')}">${shipStatus}</span>
      </div>
      ${!canShipNow ? `
        <div class="kn-ship-locked">
          <p class="kn-ship-locked-msg">Complete all 10 tests and provide all 3 proof artifacts to unlock shipping.</p>
          <div class="kn-ship-locked-actions">
            <a href="#/jt/07-test" class="kn-btn kn-btn-secondary">Go to Test Checklist</a>
            <a href="#/jt/proof" class="kn-btn kn-btn-primary">Go to Proof</a>
          </div>
        </div>
      ` : `
        <p class="kn-app-page-subtext">All tests passed and artifacts complete. Ready to ship.</p>
        <div class="kn-ship-ready">
          <p class="kn-ship-success-msg">Project 1 Shipped Successfully.</p>
        </div>
      `}
    </div>
  `;
}

function renderPage(path) {
  const main = document.getElementById('app-content');
  let html = '';
  switch (path) {
    case '/': html = renderLanding(); break;
    case '/settings': html = renderSettings(); break;
    case '/dashboard': html = renderDashboard(); break;
    case '/saved': html = renderSaved(); break;
    case '/digest': html = renderDigest(); break;
    case '/proof': html = renderProof(); break;
    case '/jt/proof': html = renderProofPage(); break;
    case '/jt/07-test': html = renderTestChecklist(); break;
    case '/jt/08-ship': html = renderShip(); break;
    default: html = renderLanding();
  }
  main.innerHTML = html;
  bindJobEvents(path);
}

// ===== Event binding =====

function bindJobEvents(path) {
  const grid = document.getElementById('job-grid') || document.getElementById('saved-job-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('.kn-job-btn-view');
      const saveBtn = e.target.closest('.kn-job-btn-save');
      if (viewBtn) {
        const id = parseInt(viewBtn.dataset.id, 10);
        const job = JOBS.find((j) => j.id === id);
        if (job) showJobModal(job);
      }
      if (saveBtn) {
        const id = parseInt(saveBtn.dataset.id, 10);
        if (isSaved(id)) {
          unsaveJob(id);
          saveBtn.textContent = 'Save';
          saveBtn.classList.remove('is-saved');
          if (path === '/saved') handleRoute();
        } else {
          saveJob(id);
          saveBtn.textContent = 'Saved';
          saveBtn.classList.add('is-saved');
        }
      }
    });
    grid.addEventListener('change', (e) => {
      const sel = e.target.closest('.kn-status-select');
      if (sel) {
        const id = parseInt(sel.dataset.id, 10);
        const status = sel.value;
        setJobStatus(id, status);
        sel.className = 'kn-input kn-input-select kn-status-select ' + getStatusBadgeClass(status);
        if (['Applied', 'Rejected', 'Selected'].includes(status)) {
          recordStatusChange(id, status);
          showToast(`Status updated: ${status}`);
        }
      }
    });
  }

  // Settings form
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    const slider = settingsForm.querySelector('[name="minMatchScore"]');
    const valueSpan = document.getElementById('minMatchScore-value');
    if (slider && valueSpan) {
      slider.addEventListener('input', () => {
        valueSpan.textContent = slider.value;
      });
    }
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(settingsForm);
      const preferredLocations = [];
      settingsForm.querySelectorAll('[name="preferredLocations"] option:checked').forEach((o) => {
        preferredLocations.push(o.value);
      });
      const preferredMode = [];
      settingsForm.querySelectorAll('[name="preferredMode"]:checked').forEach((cb) => {
        preferredMode.push(cb.value);
      });
      const prefs = {
        roleKeywords: (fd.get('roleKeywords') || '').toString().trim(),
        preferredLocations,
        preferredMode,
        experienceLevel: (fd.get('experienceLevel') || '').toString().trim(),
        skills: (fd.get('skills') || '').toString().trim(),
        minMatchScore: Math.min(100, Math.max(0, parseInt(fd.get('minMatchScore'), 10) || 40))
      };
      savePreferences(prefs);
      window.location.hash = '#/dashboard';
    });
  }

  // Proof page
  if (path === '/jt/proof') {
    const proofForm = document.getElementById('proof-artifacts-form');
    if (proofForm) {
      proofForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(proofForm);
        const lovable = (fd.get('lovable') || '').toString().trim();
        const github = (fd.get('github') || '').toString().trim();
        const deployed = (fd.get('deployed') || '').toString().trim();
        let valid = true;
        const errLovable = document.getElementById('proof-error-lovable');
        const errGithub = document.getElementById('proof-error-github');
        const errDeployed = document.getElementById('proof-error-deployed');
        if (errLovable) { errLovable.textContent = ''; }
        if (errGithub) { errGithub.textContent = ''; }
        if (errDeployed) { errDeployed.textContent = ''; }
        if (lovable && !validateUrl(lovable)) {
          if (errLovable) errLovable.textContent = 'Invalid URL format';
          valid = false;
        }
        if (github && !validateUrl(github)) {
          if (errGithub) errGithub.textContent = 'Invalid URL format';
          valid = false;
        }
        if (deployed && !validateUrl(deployed)) {
          if (errDeployed) errDeployed.textContent = 'Invalid URL format';
          valid = false;
        }
        if (valid) {
          setProofArtifacts({ lovable, github, deployed });
          showToast('Artifacts saved.');
          handleRoute();
        }
      });
    }
    const copyBtn = document.getElementById('proof-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = formatFinalSubmission();
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy Final Submission'; }, 1500);
        });
      });
    }
  }

  // Test checklist
  if (path === '/jt/07-test') {
    const container = document.querySelector('.kn-test-checklist');
    if (container) {
      container.addEventListener('change', (e) => {
        const cb = e.target.closest('.kn-test-checkbox');
        if (cb) {
          setTestChecklistItem(cb.dataset.id, cb.checked);
          handleRoute();
        }
      });
    }
    const resetBtn = document.getElementById('test-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetTestChecklist);
    }
  }

  // Digest page
  if (path === '/digest') {
    const genBtn = document.getElementById('digest-generate-btn');
    if (genBtn) {
      genBtn.addEventListener('click', () => {
        const prefs = getPreferences();
        if (!prefs) return;
        const jobs = generateDigest(prefs);
        saveDigest(jobs);
        handleRoute();
      });
    }
    const copyBtn = document.getElementById('digest-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const digest = getTodayDigest();
        if (!digest || digest.length === 0) return;
        const text = formatDigestPlainText(digest);
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy Digest to Clipboard'; }, 1500);
        });
      });
    }
    const emailBtn = document.getElementById('digest-email-btn');
    if (emailBtn) {
      emailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const digest = getTodayDigest();
        if (!digest || digest.length === 0) return;
        const body = encodeURIComponent(formatDigestPlainText(digest));
        const subject = encodeURIComponent('My 9AM Job Digest');
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      });
    }
  }

  // Filter bar
  const bar = document.querySelector('.kn-filter-bar');
  if (bar) {
    const applyFilters = () => {
      const f = {
        keyword: bar.querySelector('.kn-filter-keyword')?.value?.trim() || '',
        location: bar.querySelector('.kn-filter-location')?.value || '',
        mode: bar.querySelector('.kn-filter-mode')?.value || '',
        experience: bar.querySelector('.kn-filter-experience')?.value || '',
        source: bar.querySelector('.kn-filter-source')?.value || '',
        status: bar.querySelector('.kn-filter-status')?.value || '',
        sortBy: bar.querySelector('.kn-filter-sort')?.value || 'latest',
        showMatchesOnly: bar.querySelector('.kn-filter-show-matches')?.checked || false
      };
      setDashboardFilters(f);
      handleRoute();
    };

    bar.querySelector('.kn-filter-keyword')?.addEventListener('input', debounce(applyFilters, 300));
    bar.querySelector('.kn-filter-location')?.addEventListener('change', applyFilters);
    bar.querySelector('.kn-filter-mode')?.addEventListener('change', applyFilters);
    bar.querySelector('.kn-filter-experience')?.addEventListener('change', applyFilters);
    bar.querySelector('.kn-filter-source')?.addEventListener('change', applyFilters);
    bar.querySelector('.kn-filter-status')?.addEventListener('change', applyFilters);
    bar.querySelector('.kn-filter-sort')?.addEventListener('change', applyFilters);
    bar.querySelector('.kn-filter-show-matches')?.addEventListener('change', applyFilters);
  }
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ===== Router =====

function setActiveLink(path) {
  const norm = path === '/' ? null : (path || '/dashboard');
  document.querySelectorAll('.kn-app-nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    const linkPath = (href === '#' ? '/' : (href || '#').replace('#', '') || '/');
    link.classList.toggle('is-active', norm && linkPath === path);
  });
}

function handleRoute() {
  const path = getPath();
  if (!ROUTES.includes(path)) {
    window.location.hash = '/';
    return;
  }
  renderPage(path);
  setActiveLink(path);
}

function initHamburger() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('is-open');
  });

  document.querySelectorAll('.kn-app-nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('is-open');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  handleRoute();
  initHamburger();
  window.addEventListener('hashchange', handleRoute);
});
