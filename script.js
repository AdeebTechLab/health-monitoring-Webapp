
function playReminderChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Create a 3-tone pleasant alarm chime
    const tones = [587.33, 880.00, 1174.66]; // D5, A5, D6
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.16);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + idx * 0.16 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.16);
      osc.stop(ctx.currentTime + idx * 0.16 + 0.6);
    });
  } catch (err) {
    console.warn('Audio chime notice:', err);
  }
}


window.switchWorkspaceTab = function(tabId) {
  const tabButtons = document.querySelectorAll('[data-workspace-tab]');
  const panels = document.querySelectorAll('.workspace-panel');

  tabButtons.forEach(btn => {
    if (btn.getAttribute('data-workspace-tab') === tabId) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  panels.forEach(p => {
    if (p.id === 'ws-' + tabId) p.classList.add('active');
    else p.classList.remove('active');
  });

  if (tabId === 'health' || tabId === 'dashboard') {
    setTimeout(initOrUpdateCharts, 120);
  }
  if (tabId === 'profile') {
    renderProfilePanel();
  }
};


window.openAuthModal = function(showSignup = false) {
  const modal = document.getElementById('authScreenModal');
  const loginForm = document.getElementById('loginFormContainer');
  const signupForm = document.getElementById('signupFormContainer');
  if (!modal) return;
  modal.classList.remove('hidden');
  if (showSignup) {
    if (loginForm) loginForm.classList.add('hidden');
    if (signupForm) signupForm.classList.remove('hidden');
  } else {
    if (loginForm) loginForm.classList.remove('hidden');
    if (signupForm) signupForm.classList.add('hidden');
  }
};

window.closeAuthModal = function() {
  const modal = document.getElementById('authScreenModal');
  if (modal) modal.classList.add('hidden');
};

/**
 * HEALTHHUB - Personal Health and Wellness Tracker
 * Enhanced with:
 * 1. Auth Page System (Exact match to green gradient card interface).
 * 2. User Profile Management Panel (Update name, password, custom profile picture).
 * 3. Modern Smooth Dashboard:
 *    - 8-Tile "My Metrics" grid (Blood Pressure, Heart Rate, Glucose, Weight, Workout, Calories, Medication, Music).
 *    - Dual-line smooth curved Chart.js graph matching user image (Systole & Diastole).
 *    - CarePulse-style Notification Alert Widget & Daily Calorie progress card.
 * 4. Custom Music Player: Local MP3 upload + URL streams + continuous playback.
 * 5. Full LocalStorage persistence for all modules.
 */

// ==========================================================================
// 1. DATA CONSTANTS & STORAGE KEYS
// ==========================================================================

const STORAGE_KEYS = {
  USERS: 'healthhub_users_accounts',
  CURRENT_USER: 'healthhub_current_session_user',
  HEALTH: 'healthhub_health_records',
  WORKOUT: 'healthhub_workout_records',
  MEALS: 'healthhub_meals_records',
  REMINDERS: 'healthhub_reminders_list',
  CUSTOM_SONGS: 'healthhub_custom_user_songs',
  NOTIFICATIONS: 'healthhub_notifications_log',
  THEME: 'healthhub_theme_preference'
};

const NUTRITION_GOALS = {
  calories: 2000,
  protein: 140,
  carbs: 250,
  fat: 70
};

// 4 Pre-made Workout Plans
const WORKOUT_PLANS = [
  {
    id: 'full-body',
    title: 'Full Body Sculpt',
    category: 'Full Body',
    duration: 40,
    caloriesEst: 320,
    badgeColor: '#0284c7',
    exercises: [
      { name: 'Goblet Squats', sets: '3 sets', reps: '12 reps' },
      { name: 'Push-ups / Incline', sets: '3 sets', reps: '10 reps' },
      { name: 'Dumbbell Bent-Over Row', sets: '3 sets', reps: '12 reps' },
      { name: 'Plank Hold', sets: '3 sets', reps: '45 secs' }
    ]
  },
  {
    id: 'cardio-hiit',
    title: 'High-Intensity Cardio Blast',
    category: 'Cardio',
    duration: 30,
    caloriesEst: 280,
    badgeColor: '#f59e0b',
    exercises: [
      { name: 'Jumping Jacks Warmup', sets: '2 sets', reps: '60 secs' },
      { name: 'High Knees Sprint', sets: '4 sets', reps: '40 secs' },
      { name: 'Mountain Climbers', sets: '4 sets', reps: '30 secs' },
      { name: 'Burpee Intervals', sets: '3 sets', reps: '10 reps' }
    ]
  },
  {
    id: 'strength-power',
    title: 'Upper Body Strength',
    category: 'Strength',
    duration: 45,
    caloriesEst: 350,
    badgeColor: '#3b82f6',
    exercises: [
      { name: 'Overhead Dumbbell Press', sets: '4 sets', reps: '8 reps' },
      { name: 'Bicep Curls & Hammer Curls', sets: '3 sets', reps: '12 reps' },
      { name: 'Tricep Dips / Pushdowns', sets: '3 sets', reps: '12 reps' },
      { name: 'Dumbbell Lateral Raises', sets: '3 sets', reps: '15 reps' }
    ]
  },
  {
    id: 'mindful-yoga',
    title: 'Mindful Flow & Core Yoga',
    category: 'Yoga',
    duration: 35,
    caloriesEst: 160,
    badgeColor: '#8b5cf6',
    exercises: [
      { name: 'Sun Salutations A & B', sets: '5 rounds', reps: 'Flow' },
      { name: 'Warrior II to Triangle Pose', sets: '3 sets', reps: '5 breaths' },
      { name: 'Downward Dog to Cobra', sets: '4 sets', reps: 'Fluid' },
      { name: 'Seated Spinal Twist & Savasana', sets: '1 set', reps: '5 mins' }
    ]
  }
];

// 6 Balanced Suggested Meals
const MEAL_SUGGESTIONS = [
  {
    name: 'Greek Yogurt & Berry Bowl',
    time: 'Breakfast',
    calories: 340,
    protein: 26,
    carbs: 42,
    fat: 6,
    desc: 'Protein-rich yogurt topped with blueberries, chia seeds, and raw honey.'
  },
  {
    name: 'Grilled Salmon Quinoa Bowl',
    time: 'Lunch',
    calories: 520,
    protein: 42,
    carbs: 38,
    fat: 16,
    desc: 'Atlantic salmon fillet, fluffy quinoa, and steamed garden greens.'
  },
  {
    name: 'Herb Roast Chicken Breast',
    time: 'Dinner',
    calories: 480,
    protein: 45,
    carbs: 40,
    fat: 12,
    desc: 'Tender chicken breast served with roasted sweet potatoes and broccoli.'
  }
];

// 5 Royalty-Free Workout Tracks
const DEFAULT_MUSIC_TRACKS = [
  {
    id: 'track_1',
    title: 'Energize Warmup',
    artist: 'SoundHelix Beats',
    duration: '6:12',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    art: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80',
    isCustom: false
  },
  {
    id: 'track_2',
    title: 'Tempo Cardio Surge',
    artist: 'SoundHelix Synth',
    duration: '7:05',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    art: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
    isCustom: false
  },
  {
    id: 'track_3',
    title: 'Heavy Lift Focus',
    artist: 'SoundHelix Bassline',
    duration: '5:44',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    art: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
    isCustom: false
  },
  {
    id: 'track_4',
    title: 'Flow & Breathe',
    artist: 'SoundHelix Ambient',
    duration: '5:02',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    art: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=400&q=80',
    isCustom: false
  },
  {
    id: 'track_5',
    title: 'Endurance Final Sprint',
    artist: 'SoundHelix Electronic',
    duration: '6:30',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    art: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80',
    isCustom: false
  }
];

let activePlaylist = [...DEFAULT_MUSIC_TRACKS];

// ==========================================================================
// 2. SEED INITIAL DATA & AUTH
// ==========================================================================

function seedInitialDataIfEmpty() {
  // Ensure storage keys are initialized as empty arrays for new users
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const demoUsers = [
      {
        name: 'Anza',
        email: 'anza@healthhub.com',
        password: 'password123',
        photo: ''
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(demoUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.HEALTH)) {
    localStorage.setItem(STORAGE_KEYS.HEALTH, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.WORKOUT)) {
    localStorage.setItem(STORAGE_KEYS.WORKOUT, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.MEALS)) {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.REMINDERS)) {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify([]));
  }
}

function getTodayISO() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getPastDateISO(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function formatPrettyDate(isoDateStr) {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length < 3) return isoDateStr;
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDayOfWeek(isoDateStr) {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length < 3) return '';
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
}

// ==========================================================================
// 3. AUTHENTICATION & PROFILE REPOSITORY
// ==========================================================================

const AuthManager = {
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    } catch (e) {
      return [];
    }
  },
  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
    } catch (e) {
      return null;
    }
  },
  setCurrentUser(userData) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
  },
  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      this.setCurrentUser({
        name: user.name,
        email: user.email,
        photo: user.photo || ''
      });
      return { success: true, user };
    }
    return { success: false, message: 'Invalid email or password. Please try again.' };
  },
  signup(name, email, password) {
    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'An account with this email already exists.' };
    }
    const newUser = { name, email, password, photo: '' };
    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser({ name, email, photo: '' });

    return { success: true, user: newUser };
  },
  updateProfile(newName, newPassword, newPhoto) {
    const current = this.getCurrentUser();
    if (!current) return { success: false, message: 'No active session.' };

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === current.email.toLowerCase());
    if (userIndex === -1) return { success: false, message: 'User record not found.' };

    if (newName) {
      users[userIndex].name = newName;
      current.name = newName;
    }
    if (newPassword && newPassword.length >= 6) {
      users[userIndex].password = newPassword;
    }
    if (newPhoto !== undefined) {
      users[userIndex].photo = newPhoto;
      current.photo = newPhoto;
    }

    this.saveUsers(users);
    this.setCurrentUser(current);
    return { success: true, user: current };
  },
  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

function checkAuthAndRenderUI() {
  const currentUser = AuthManager.getCurrentUser();
  const landingView = document.getElementById('landingView');
  const appWorkspace = document.getElementById('app-workspace');
  const navLoggedOut = document.getElementById('navAuthLoggedOut');
  const navLoggedIn = document.getElementById('navAuthLoggedIn');
  const navLandingMenu = document.getElementById('navLandingMenu');
  const navAppMenu = document.getElementById('navAppMenu');

  if (currentUser) {
    // Hide landing view completely so Dashboard takes Home spot cleanly
    if (landingView) landingView.classList.add('hidden');
    if (appWorkspace) {
      appWorkspace.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (navLoggedOut) navLoggedOut.classList.add('hidden');
    if (navLoggedIn) navLoggedIn.classList.remove('hidden');

    // Switch Header Navigation: Hide Home/Features, Show Dashboard & Module tabs
    if (navLandingMenu) navLandingMenu.classList.add('hidden');
    if (navAppMenu) navAppMenu.classList.remove('hidden');

    updateHeaderUserUI(currentUser);

    // Switch to Dashboard tab by default
    switchWorkspaceTab('dashboard');

    // Render Modules
    renderDashboard();
    renderHealthHistory();
    renderExerciseSection();
    renderNutritionSection();
    renderRemindersSection();
    renderProfilePanel();
    initOrUpdateCharts();
    renderNotificationBadgeAndDropdown();
    checkNotificationPermissionUI();
  } else {
    // When logged out, show clean landing page at home position
    if (landingView) {
      landingView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (appWorkspace) appWorkspace.classList.add('hidden');
    if (navLoggedOut) navLoggedOut.classList.remove('hidden');
    if (navLoggedIn) navLoggedIn.classList.add('hidden');

    // Show Home/Features/Contact in Header
    if (navLandingMenu) navLandingMenu.classList.remove('hidden');
    if (navAppMenu) navAppMenu.classList.add('hidden');
  }
}

function updateHeaderUserUI(user) {
  const usernameEl = document.getElementById('headerUsername');
  const avatarCircle = document.getElementById('headerAvatarCircle');
  const avatarInitial = document.getElementById('headerAvatarInitial');

  if (usernameEl) usernameEl.textContent = user.name || 'User';

  if (avatarCircle) {
    if (user.photo) {
      avatarCircle.style.backgroundImage = `url('${user.photo}')`; avatarCircle.style.backgroundPosition = user.photoFocus || 'center 20%';
      if (avatarInitial) avatarInitial.style.display = 'none';
    } else {
      avatarCircle.style.backgroundImage = 'none';
      if (avatarInitial) {
        avatarInitial.style.display = 'inline';
        avatarInitial.textContent = (user.name || 'U').charAt(0).toUpperCase();
      }
    }
  }
}

function renderProfilePanel() {
  const user = AuthManager.getCurrentUser();
  if (!user) return;

  const cardName = document.getElementById('profileCardName');
  const cardEmail = document.getElementById('profileCardEmail');
  const editName = document.getElementById('editFullName');
  const editEmail = document.getElementById('editEmail');
  const largeAvatar = document.getElementById('profileLargeAvatar');
  const largeInitial = document.getElementById('profileLargeAvatarInitial');

  if (cardName) cardName.textContent = user.name;
  if (cardEmail) cardEmail.textContent = user.email;
  if (editName) editName.value = user.name;
  if (editEmail) editEmail.value = user.email;

  if (largeAvatar) {
    if (user.photo) {
      largeAvatar.style.backgroundImage = `url('${user.photo}')`;
      largeAvatar.style.backgroundPosition = user.photoFocus || 'center 20%';
      const adjustBox = document.getElementById('avatarAdjustControls');
      if (adjustBox) adjustBox.classList.remove('hidden');
      if (largeInitial) largeInitial.style.display = 'none';
    } else {
      largeAvatar.style.backgroundImage = 'none';
      const adjustBox = document.getElementById('avatarAdjustControls');
      if (adjustBox) adjustBox.classList.add('hidden');
      if (largeInitial) {
        largeInitial.style.display = 'inline';
        largeInitial.textContent = (user.name || 'U').charAt(0).toUpperCase();
      }
    }
  }

  const statV = document.getElementById('profileStatVitals');
  const statW = document.getElementById('profileStatWorkouts');
  const statR = document.getElementById('profileStatReminders');
  if (statV) statV.textContent = AppState.getHealthRecords().length;
  if (statW) statW.textContent = AppState.getWorkouts().length;
  if (statR) statR.textContent = AppState.getReminders().length;
}

// ==========================================================================
// 4. LOCALSTORAGE REPOSITORIES
// ==========================================================================

// Helper to get user-scoped LocalStorage key so each user's records persist independently
function getUserScopedStorageKey(baseKey) {
  const current = AuthManager.getCurrentUser();
  if (!current || !current.email) return baseKey;
  const userSafeId = current.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${baseKey}_${userSafeId}`;
}

const AppState = {
  getHealthRecords() {
    try {
      const key = getUserScopedStorageKey(STORAGE_KEYS.HEALTH);
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return data.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
      return [];
    }
  },
  saveHealthRecords(list) {
    const key = getUserScopedStorageKey(STORAGE_KEYS.HEALTH);
    localStorage.setItem(key, JSON.stringify(list));
  },
  addHealthRecord(record) {
    const list = this.getHealthRecords();
    list.push(record);
    this.saveHealthRecords(list);
  },
  deleteHealthRecord(id) {
    const list = this.getHealthRecords().filter(r => r.id !== id);
    this.saveHealthRecords(list);
  },

  getWorkouts() {
    try {
      const key = getUserScopedStorageKey(STORAGE_KEYS.WORKOUT);
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return data.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
      return [];
    }
  },
  saveWorkouts(list) {
    const key = getUserScopedStorageKey(STORAGE_KEYS.WORKOUT);
    localStorage.setItem(key, JSON.stringify(list));
  },
  addWorkout(item) {
    const list = this.getWorkouts();
    list.push(item);
    this.saveWorkouts(list);
  },
  deleteWorkout(id) {
    const list = this.getWorkouts().filter(w => w.id !== id);
    this.saveWorkouts(list);
  },

  getMeals() {
    try {
      const key = getUserScopedStorageKey(STORAGE_KEYS.MEALS);
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return data.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
      return [];
    }
  },
  saveMeals(list) {
    const key = getUserScopedStorageKey(STORAGE_KEYS.MEALS);
    localStorage.setItem(key, JSON.stringify(list));
  },
  addMeal(item) {
    const list = this.getMeals();
    list.push(item);
    this.saveMeals(list);
  },
  deleteMeal(id) {
    const list = this.getMeals().filter(m => m.id !== id);
    this.saveMeals(list);
  },

  getReminders() {
    try {
      const key = getUserScopedStorageKey(STORAGE_KEYS.REMINDERS);
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return data.sort((a, b) => a.time.localeCompare(b.time));
    } catch (e) {
      return [];
    }
  },
  saveReminders(list) {
    const key = getUserScopedStorageKey(STORAGE_KEYS.REMINDERS);
    localStorage.setItem(key, JSON.stringify(list));
  },
  addReminder(item) {
    const list = this.getReminders();
    list.push(item);
    this.saveReminders(list);
  },
  toggleReminderDone(id) {
    const list = this.getReminders();
    const item = list.find(r => r.id === id);
    if (item) {
      item.completed = !item.completed;
      this.saveReminders(list);
    }
  },
  deleteReminder(id) {
    const list = this.getReminders().filter(r => r.id !== id);
    this.saveReminders(list);
  },

  getNotifications() {
    try {
      const key = getUserScopedStorageKey(STORAGE_KEYS.NOTIFICATIONS);
      const data = JSON.parse(localStorage.getItem(key) || 'null');
      if (data && Array.isArray(data)) return data;
      const defaultNotifs = [
        {
          id: 'notif_welcome',
          title: 'Welcome to HealthHub!',
          message: 'Your personal health, vitals & workout dashboard is active.',
          time: 'Just now',
          icon: 'fas fa-heartbeat',
          iconColor: 'var(--primary-color)',
          read: false
        }
      ];
      return defaultNotifs;
    } catch (e) {
      return [];
    }
  },
  saveNotifications(list) {
    const key = getUserScopedStorageKey(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.setItem(key, JSON.stringify(list));
  },
  addNotification(notif) {
    const list = this.getNotifications();
    list.unshift(notif);
    if (list.length > 20) list.pop();
    this.saveNotifications(list);
    if (typeof renderNotificationBadgeAndDropdown === 'function') {
      renderNotificationBadgeAndDropdown();
    }
  },
  markAllNotificationsRead() {
    const list = this.getNotifications();
    list.forEach(n => n.read = true);
    this.saveNotifications(list);
    if (typeof renderNotificationBadgeAndDropdown === 'function') {
      renderNotificationBadgeAndDropdown();
    }
  },
  markNotificationRead(id) {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      this.saveNotifications(list);
      if (typeof renderNotificationBadgeAndDropdown === 'function') {
        renderNotificationBadgeAndDropdown();
      }
    }
  },

  getCustomSongs() {
    try {
      const key = getUserScopedStorageKey(STORAGE_KEYS.CUSTOM_SONGS);
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  },
  saveCustomSongs(list) {
    const key = getUserScopedStorageKey(STORAGE_KEYS.CUSTOM_SONGS);
    localStorage.setItem(key, JSON.stringify(list));
  },
  addCustomSong(song) {
    const list = this.getCustomSongs();
    list.unshift(song);
    this.saveCustomSongs(list);
    loadFullPlaylist();
  },
  deleteCustomSong(id) {
    const list = this.getCustomSongs().filter(s => s.id !== id);
    this.saveCustomSongs(list);
    loadFullPlaylist();
  }
};

function loadFullPlaylist() {
  const custom = AppState.getCustomSongs();
  activePlaylist = [...custom, ...DEFAULT_MUSIC_TRACKS];
  const countBadge = document.getElementById('trackCountBadge');
  if (countBadge) countBadge.textContent = `${activePlaylist.length} Tracks`;
  renderPlaylistView();
}

// ==========================================================================
// 5. TOAST NOTIFICATIONS
// ==========================================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================================================
// 6. CHART.JS CHARTS & CLINICAL STATUS
// ==========================================================================

let dashboardTrendChartInstance = null;
let weightChartInstance = null;
let bpChartInstance = null;

function initOrUpdateCharts() {
  const records = AppState.getHealthRecords().slice(0, 7).reverse(); // Last 7 readings
  
  const labels = records.map(r => formatDayOfWeek(r.date) || formatPrettyDate(r.date));
  const systolic = records.map(r => r.bpSystolic);
  const diastolic = records.map(r => r.bpDiastolic);
  const weights = records.map(r => r.weight);

  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? '#334155' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  // 1. Dashboard Smooth Dual Curve (Matches Left Chart in User Image)
  const dashCanvas = document.getElementById('dashboardTrendChart');
  if (dashCanvas) {
    if (dashboardTrendChartInstance) {
      dashboardTrendChartInstance.destroy();
    }
    dashboardTrendChartInstance = new Chart(dashCanvas, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['Mn', 'Tu', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Systole',
            data: systolic.length ? systolic : [120, 140, 130, 135, 128, 132, 120],
            borderColor: '#f43f5e', // Warm pink line like image
            backgroundColor: 'rgba(244, 63, 94, 0.05)',
            tension: 0.45,         // Smooth curved wave
            fill: true,
            pointRadius: 6,
            pointBackgroundColor: '#f43f5e',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          },
          {
            label: 'Diastole',
            data: diastolic.length ? diastolic : [78, 85, 80, 82, 79, 81, 76],
            borderColor: '#0284c7', // Cyan/blue line like image
            backgroundColor: 'rgba(2, 132, 199, 0.05)',
            tension: 0.45,         // Smooth curved wave
            fill: true,
            pointRadius: 6,
            pointBackgroundColor: '#0284c7',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false } // Custom legend pill badges in HTML
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { weight: 600 } } },
          y: { grid: { color: gridColor }, min: 40, max: 200, ticks: { color: textColor, stepSize: 40 } }
        }
      }
    });
  }

  // 2. Health Tab Weight Line Chart
  const weightCanvas = document.getElementById('weightChart');
  if (weightCanvas) {
    if (weightChartInstance) {
      weightChartInstance.destroy();
    }
    weightChartInstance = new Chart(weightCanvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Weight (kg)',
          data: weights,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#10b981'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor } }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  }

  // 3. Health Tab Blood Pressure Dual-Line Chart
  const bpCanvas = document.getElementById('bpChart');
  if (bpCanvas) {
    if (bpChartInstance) {
      bpChartInstance.destroy();
    }
    bpChartInstance = new Chart(bpCanvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Systolic (mmHg)',
            data: systolic,
            borderColor: '#f43f5e',
            backgroundColor: 'transparent',
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#f43f5e'
          },
          {
            label: 'Diastolic (mmHg)',
            data: diastolic,
            borderColor: '#0284c7',
            backgroundColor: 'transparent',
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#0284c7'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor } }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  }
}

function evaluateHealthStatus(bpSys, bpDia, bloodSugar) {
  let bpLevel = 'normal';
  if (bpSys >= 130 || bpDia >= 80) {
    bpLevel = 'elevated';
  } else if (bpSys >= 120 && bpDia < 80) {
    bpLevel = 'warning';
  }

  let sugarLevel = 'normal';
  if (bloodSugar >= 126) {
    sugarLevel = 'elevated';
  } else if (bloodSugar >= 100) {
    sugarLevel = 'warning';
  }

  if (bpLevel === 'elevated' || sugarLevel === 'elevated') {
    return {
      label: 'High / Attention',
      cssClass: 'status-elevated',
      dotColor: 'danger'
    };
  } else if (bpLevel === 'warning' || sugarLevel === 'warning') {
    return {
      label: 'Pre-Elevated',
      cssClass: 'status-warning',
      dotColor: 'warn'
    };
  }
  return {
    label: 'Normal / Optimal',
    cssClass: 'status-normal',
    dotColor: 'good'
  };
}

// ==========================================================================
// 7. MODULE RENDERERS
// ==========================================================================

// --- 7.1 Dashboard Overview (Smooth UI) ---
function renderDashboard() {
  const today = getTodayISO();
  const dateHeading = document.getElementById('todayDateStr');
  if (dateHeading) {
    const now = new Date();
    dateHeading.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // 1. Update 8-Tile "My Metrics" Readings
  const healthRecords = AppState.getHealthRecords();
  const latestHealth = healthRecords.find(r => r.date === today) || healthRecords[0];

  const bpTile = document.getElementById('metricTileBP');
  const hrTile = document.getElementById('metricTileHR');
  const glucoseTile = document.getElementById('metricTileGlucose');
  const weightTile = document.getElementById('metricTileWeight');

  if (latestHealth) {
    if (bpTile) bpTile.innerHTML = `${latestHealth.bpSystolic}/${latestHealth.bpDiastolic} <small>mmHg</small>`;
    if (hrTile) hrTile.innerHTML = `${latestHealth.heartRate} <small>bpm</small>`;
    if (glucoseTile) glucoseTile.innerHTML = `${latestHealth.bloodSugar} <small>mg/dL</small>`;
    if (weightTile) weightTile.innerHTML = `${latestHealth.weight} <small>kg</small>`;
  }

  // 2. Workouts Tile
  const workouts = AppState.getWorkouts();
  const todayWorkout = workouts.find(w => w.date === today);
  const workoutTile = document.getElementById('metricTileWorkout');
  if (workoutTile) {
    if (todayWorkout) workoutTile.innerHTML = `${todayWorkout.duration} <small>mins</small>`;
    else workoutTile.innerHTML = `0 <small>mins</small>`;
  }

  // 3. Nutrition & Calorie Card
  const meals = AppState.getMeals();
  const todayMeals = meals.filter(m => m.date === today);
  const totalCals = todayMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const totalProt = todayMeals.reduce((acc, m) => acc + (Number(m.protein) || 0), 0);
  const totalCarbs = todayMeals.reduce((acc, m) => acc + (Number(m.carbs) || 0), 0);
  const totalFat = todayMeals.reduce((acc, m) => acc + (Number(m.fat) || 0), 0);

  const calTile = document.getElementById('metricTileCalories');
  if (calTile) calTile.innerHTML = `${totalCals.toLocaleString()} <small>kcal</small>`;

  const fillEl = document.getElementById('dashCalFill');
  const badgeEl = document.getElementById('dashRemainingBadge');
  if (fillEl) {
    const pct = Math.min(100, Math.round((totalCals / NUTRITION_GOALS.calories) * 100));
    fillEl.style.width = `${pct}%`;
  }
  if (badgeEl) {
    const remaining = NUTRITION_GOALS.calories - totalCals;
    badgeEl.textContent = remaining >= 0 ? `${remaining.toLocaleString()} kcal left` : `+${Math.abs(remaining)} kcal over`;
  }
  const dp = document.getElementById('dashProt');
  const dc = document.getElementById('dashCarb');
  const df = document.getElementById('dashFat');
  if (dp) dp.textContent = `${totalProt}g`;
  if (dc) dc.textContent = `${totalCarbs}g`;
  if (df) df.textContent = `${totalFat}g`;

  // 4. Reminders Tile & Notification Card
  const reminders = AppState.getReminders();
  const pendingReminders = reminders.filter(r => !r.completed);
  const remTile = document.getElementById('metricTileReminders');
  if (remTile) remTile.innerHTML = `${pendingReminders.length} <small>alerts</small>`;

  const briefEl = document.getElementById('nextReminderBrief');
  if (briefEl) {
    if (pendingReminders.length > 0) {
      const nextR = pendingReminders[0];
      briefEl.textContent = `Next Reminder: ${nextR.title} (${nextR.time})`;
    } else {
      briefEl.textContent = 'All scheduled wellness reminders completed! 🎉';
    }
  }

  initOrUpdateCharts();
}

// --- 7.2 Health Vitals & History Table ---
function renderHealthHistory() {
  const records = AppState.getHealthRecords();
  const countBadge = document.getElementById('healthCountBadge');
  if (countBadge) countBadge.textContent = `${records.length} records`;

  // Update Right-Column Vitals Status Card
  const latestDateEl = document.getElementById('vitalsLatestDate');
  const latestBadge = document.getElementById('vitalsLatestBadge');
  const statBP = document.getElementById('vStatBP');
  const statHR = document.getElementById('vStatHR');
  const statSugar = document.getElementById('vStatSugar');
  const statWeight = document.getElementById('vStatWeight');

  if (records.length > 0) {
    const latest = records[0];
    const status = evaluateHealthStatus(latest.bpSystolic, latest.bpDiastolic, latest.bloodSugar);
    if (latestDateEl) latestDateEl.textContent = 'Recorded on ' + formatPrettyDate(latest.date);
    if (latestBadge) {
      latestBadge.textContent = status.label;
      latestBadge.className = 'status-pill ' + status.cssClass;
    }
    if (statBP) statBP.textContent = `${latest.bpSystolic}/${latest.bpDiastolic}`;
    if (statHR) statHR.textContent = `${latest.heartRate} bpm`;
    if (statSugar) statSugar.textContent = `${latest.bloodSugar} mg/dL`;
    if (statWeight) statWeight.textContent = `${latest.weight} kg`;
  } else {
    if (latestDateEl) latestDateEl.textContent = 'No records logged yet';
    if (latestBadge) {
      latestBadge.textContent = 'Awaiting Data';
      latestBadge.className = 'status-pill status-normal';
    }
    if (statBP) statBP.textContent = '--/--';
    if (statHR) statHR.textContent = '-- bpm';
    if (statSugar) statSugar.textContent = '-- mg/dL';
    if (statWeight) statWeight.textContent = '-- kg';
  }

  const tbody = document.getElementById('healthTableBody');
  if (!tbody) return;

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="padding: 1.5rem;">No health records logged yet. Click "+ Log Health Record" above to add your first reading.</td></tr>`;
    initOrUpdateCharts();
    return;
  }

  tbody.innerHTML = records.map(record => {
    const status = evaluateHealthStatus(record.bpSystolic, record.bpDiastolic, record.bloodSugar);
    return `
      <tr>
        <td><strong>${formatPrettyDate(record.date)}</strong></td>
        <td>
          <span class="ref-item">
            <span class="indicator-dot ${status.dotColor}"></span>
            ${record.bpSystolic} / ${record.bpDiastolic}
          </span>
        </td>
        <td>${record.heartRate} bpm</td>
        <td>${record.bloodSugar} mg/dL</td>
        <td>${record.weight} kg</td>
        <td><span class="status-pill ${status.cssClass}">${status.label}</span></td>
        <td>
          <button class="action-delete-btn" onclick="handleDeleteHealthRecord('${record.id}')" title="Delete record">
            <i class="fas fa-trash-alt"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  initOrUpdateCharts();
}

function exportHealthCSV() {
  const records = AppState.getHealthRecords();
  if (records.length === 0) {
    showToast('No health records to export.', 'error');
    return;
  }

  const headers = ['Date', 'Systolic_mmHg', 'Diastolic_mmHg', 'HeartRate_bpm', 'BloodSugar_mg_dL', 'Weight_kg'];
  const rows = records.map(r => [
    r.date,
    r.bpSystolic,
    r.bpDiastolic,
    r.heartRate,
    r.bloodSugar,
    r.weight
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `HealthHub_Health_Vitals_${getTodayISO()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Health data exported as CSV successfully!', 'success');
}

// --- 7.3 Exercise, Plans, & Workout Timer ---
function renderExerciseSection() {
  const plansContainer = document.getElementById('plansGrid');
  if (plansContainer) {
    plansContainer.innerHTML = WORKOUT_PLANS.map(plan => `
      <div class="clean-plan-card">
        <div>
          <span class="clean-plan-badge" style="background-color: ${plan.badgeColor}18; color: ${plan.badgeColor}; border: 1px solid ${plan.badgeColor}35;">
            ${plan.category}
          </span>
          <h4 class="clean-plan-title">${plan.title}</h4>
          <div class="clean-plan-meta">
            <span><i class="fas fa-stopwatch" style="color:var(--primary-color);"></i> ${plan.duration} mins</span>
            <span>&bull;</span>
            <span><i class="fas fa-fire" style="color:#ef4444;"></i> ~${plan.caloriesEst} kcal</span>
          </div>
          
          <table class="clean-ex-table">
            <tbody>
              ${plan.exercises.map(ex => `
                <tr>
                  <td class="clean-ex-name">${ex.name}</td>
                  <td class="clean-ex-rep">${ex.sets} &times; ${ex.reps}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <button class="pill-btn primary-btn mt-3" style="width: 100%; justify-content: center;" onclick="launchPlanTimer('${plan.id}')">
          <i class="fas fa-play"></i> Start This Routine
        </button>
      </div>
    `).join('');
  }

  const workouts = AppState.getWorkouts();
  const countBadge = document.getElementById('workoutCountBadge');
  if (countBadge) countBadge.textContent = `${workouts.length} sessions`;

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  let weeklyMins = 0;
  let weeklyCals = 0;
  let weeklyCount = 0;

  workouts.forEach(w => {
    const wDate = new Date(w.date);
    if (wDate >= sevenDaysAgo && wDate <= now) {
      weeklyMins += Number(w.duration) || 0;
      weeklyCals += Number(w.calories) || 0;
      weeklyCount += 1;
    }
  });

  const minEl = document.getElementById('weeklyMinutes');
  const calEl = document.getElementById('weeklyCalories');
  const cntEl = document.getElementById('weeklyCount');
  if (minEl) minEl.innerHTML = `${weeklyMins} <small>mins</small>`;
  if (calEl) calEl.innerHTML = `${weeklyCals.toLocaleString()} <small>kcal</small>`;
  if (cntEl) cntEl.innerHTML = `${weeklyCount} <small>sessions</small>`;

  const tbody = document.getElementById('workoutTableBody');
  if (!tbody) return;

  if (workouts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted text-center" style="padding: 1.5rem;">No workouts recorded yet. Start a routine above or log a custom session.</td></tr>`;
    return;
  }

  tbody.innerHTML = workouts.map(w => `
    <tr>
      <td><strong>${formatPrettyDate(w.date)}</strong></td>
      <td><strong>${escapeHtml(w.exercise)}</strong></td>
      <td><span class="badge-pill">${escapeHtml(w.type)}</span></td>
      <td>${w.duration} mins</td>
      <td>${w.calories} kcal</td>
      <td>
        <button class="action-delete-btn" onclick="handleDeleteWorkout('${w.id}')" title="Delete workout">
          <i class="fas fa-trash-alt"></i> Delete
        </button>
      </td>
    </tr>
  `).join('');
}

let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;
let activeWorkoutContext = {
  name: 'Free Form Session',
  type: 'Full Body',
  caloriesPerMinute: 8
};

function formatTimerClock(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

function launchPlanTimer(planId) {
  const plan = WORKOUT_PLANS.find(p => p.id === planId);
  if (!plan) return;

  activeWorkoutContext = {
    name: plan.title,
    type: plan.category,
    defaultDuration: plan.duration,
    caloriesEst: plan.caloriesEst
  };

  const nameEl = document.getElementById('activeRoutineName');
  const descEl = document.getElementById('activeRoutineDesc');
  if (nameEl) nameEl.textContent = plan.title;
  if (descEl) descEl.textContent = `Curated ${plan.category} session &bull; ${plan.duration} mins &bull; ~${plan.caloriesEst} kcal`;

  // Open the dedicated Live Timer Modal
  openModal('modal-live-timer');
  showToast(`Starting ${plan.title}! Timer ready.`, 'info');
}

function startWorkoutTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;

  const startBtn = document.getElementById('startTimerBtn');
  const pauseBtn = document.getElementById('pauseTimerBtn');
  const finishBtn = document.getElementById('finishWorkoutBtn');

  if (startBtn) startBtn.disabled = true;
  if (pauseBtn) {
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pause';
  }
  if (finishBtn) finishBtn.disabled = false;

  timerInterval = setInterval(() => {
    timerSeconds += 1;
    const clock = document.getElementById('workoutTimerClock');
    if (clock) clock.textContent = formatTimerClock(timerSeconds);
  }, 1000);
}

function pauseWorkoutTimer() {
  if (!isTimerRunning) return;
  clearInterval(timerInterval);
  isTimerRunning = false;

  const startBtn = document.getElementById('startTimerBtn');
  const pauseBtn = document.getElementById('pauseTimerBtn');

  if (startBtn) {
    startBtn.disabled = false;
    startBtn.textContent = 'Resume';
  }
  if (pauseBtn) pauseBtn.disabled = true;
}

function finishAndLogWorkout() {
  clearInterval(timerInterval);
  isTimerRunning = false;

  const durationMins = Math.max(1, Math.round(timerSeconds / 60));
  const estimatedCalories = Math.round(durationMins * (activeWorkoutContext.caloriesPerMinute || 8));

  const newWorkout = {
    id: 'w_' + Date.now(),
    date: getTodayISO(),
    exercise: activeWorkoutContext.name,
    type: activeWorkoutContext.type || 'Cardio',
    duration: durationMins,
    calories: estimatedCalories
  };

  AppState.addWorkout(newWorkout);

  timerSeconds = 0;
  const clock = document.getElementById('workoutTimerClock');
  if (clock) clock.textContent = '00:00';

  const startBtn = document.getElementById('startTimerBtn');
  const pauseBtn = document.getElementById('pauseTimerBtn');
  const finishBtn = document.getElementById('finishWorkoutBtn');

  if (startBtn) {
    startBtn.disabled = false;
    startBtn.textContent = 'Start Timer';
  }
  if (pauseBtn) pauseBtn.disabled = true;
  if (finishBtn) finishBtn.disabled = true;

  renderExerciseSection();
  renderDashboard();
  renderProfilePanel();
  showToast(`Workout logged! ${durationMins} mins, ${estimatedCalories} kcal burned.`, 'success');
}

// --- 7.4 Nutrition & Meals ---
function renderNutritionSection() {
  const today = getTodayISO();
  const meals = AppState.getMeals();
  const countBadge = document.getElementById('mealCountBadge');
  if (countBadge) countBadge.textContent = `${meals.length} meals`;

  const todayMeals = meals.filter(m => m.date === today);
  const totalCal = todayMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const totalProt = todayMeals.reduce((acc, m) => acc + (Number(m.protein) || 0), 0);
  const totalCarb = todayMeals.reduce((acc, m) => acc + (Number(m.carbs) || 0), 0);
  const totalFat = todayMeals.reduce((acc, m) => acc + (Number(m.fat) || 0), 0);

  const calBadge = document.getElementById('calorieSurplusDeficitBadge');
  if (calBadge) {
    const diff = NUTRITION_GOALS.calories - totalCal;
    if (diff >= 0) {
      calBadge.textContent = `Remaining: ${diff.toLocaleString()} kcal`;
      calBadge.style.backgroundColor = 'var(--primary-soft)';
      calBadge.style.color = 'var(--primary-color)';
    } else {
      calBadge.textContent = `Over Goal: +${Math.abs(diff).toLocaleString()} kcal`;
      calBadge.style.backgroundColor = 'var(--status-warn-bg)';
      calBadge.style.color = 'var(--status-warn)';
    }
  }

  const updateBar = (valId, barId, pctId, current, target) => {
    const vEl = document.getElementById(valId);
    const bEl = document.getElementById(barId);
    const pEl = document.getElementById(pctId);
    if (vEl) vEl.textContent = current.toLocaleString();
    const pct = Math.round((current / target) * 100);
    if (bEl) bEl.style.width = `${Math.min(100, pct)}%`;
    if (pEl) pEl.textContent = `${pct}% of target`;
  };

  updateBar('ntrCalVal', 'ntrCalBar', 'ntrCalPct', totalCal, NUTRITION_GOALS.calories);
  updateBar('ntrProteinVal', 'ntrProteinBar', 'ntrProteinPct', totalProt, NUTRITION_GOALS.protein);
  updateBar('ntrCarbsVal', 'ntrCarbsBar', 'ntrCarbsPct', totalCarb, NUTRITION_GOALS.carbs);
  updateBar('ntrFatVal', 'ntrFatBar', 'ntrFatPct', totalFat, NUTRITION_GOALS.fat);

  const suggContainer = document.getElementById('mealSuggestionsGrid');
  if (suggContainer) {
    suggContainer.innerHTML = MEAL_SUGGESTIONS.map((meal, index) => `
      <div class="meal-card">
        <div>
          <span class="meal-timing-tag">${meal.time}</span>
          <h4 class="meal-name">${meal.name}</h4>
          <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 0.85rem;">${meal.desc}</p>
          <div class="meal-metrics">
            <span>🔥 <strong>${meal.calories}</strong> kcal</span>
            <span>🥩 <strong>${meal.protein}g</strong> P</span>
            <span>🌾 <strong>${meal.carbs}g</strong> C</span>
            <span>🥑 <strong>${meal.fat}g</strong> F</span>
          </div>
        </div>
        <button class="pill-btn secondary-btn" onclick="quickAddSuggestedMeal(${index})">
          + Quick Add to Log
        </button>
      </div>
    `).join('');
  }

  const tbody = document.getElementById('mealsTableBody');
  if (!tbody) return;

  if (meals.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="padding: 1.5rem;">No meals logged yet. Use the "+ Log Meal" or "+ Quick Add" buttons above.</td></tr>`;
    return;
  }

  tbody.innerHTML = meals.map(m => `
    <tr>
      <td><strong>${formatPrettyDate(m.date)}</strong></td>
      <td><strong>${escapeHtml(m.name)}</strong></td>
      <td>${m.calories} kcal</td>
      <td>${m.protein} g</td>
      <td>${m.carbs} g</td>
      <td>${m.fat} g</td>
      <td>
        <button class="action-delete-btn" onclick="handleDeleteMeal('${m.id}')" title="Delete meal">
          <i class="fas fa-trash-alt"></i> Delete
        </button>
      </td>
    </tr>
  `).join('');
}

function quickAddSuggestedMeal(index) {
  const item = MEAL_SUGGESTIONS[index];
  if (!item) return;

  const newMeal = {
    id: 'm_' + Date.now(),
    date: getTodayISO(),
    name: item.name,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat
  };

  AppState.addMeal(newMeal);
  renderNutritionSection();
  renderDashboard();
  showToast(`Added "${item.name}" to today's log!`, 'success');
}

// --- 7.5 Music Player Module ---
let currentTrackIndex = 0;
let isAudioPlaying = false;
let globalAudio = null;

function initMusicPlayer() {
  globalAudio = document.getElementById('globalAudioPlayer');
  if (!globalAudio) return;

  loadFullPlaylist();
  loadTrack(0, false);

  globalAudio.addEventListener('timeupdate', () => {
    if (!globalAudio.duration) return;
    const current = globalAudio.currentTime;
    const duration = globalAudio.duration;
    const pct = (current / duration) * 100;

    const dockCur = document.getElementById('dockTimeCurrent');
    const dockDur = document.getElementById('dockTimeDuration');
    const dockProg = document.getElementById('dockProgressBar');
    if (dockCur) dockCur.textContent = formatAudioTime(current);
    if (dockDur) dockDur.textContent = formatAudioTime(duration);
    if (dockProg) dockProg.value = pct;

    const mainCur = document.getElementById('mainPlayerCurrentTime');
    const mainDur = document.getElementById('mainPlayerDuration');
    const mainProg = document.getElementById('mainPlayerProgress');
    if (mainCur) mainCur.textContent = formatAudioTime(current);
    if (mainDur) mainDur.textContent = formatAudioTime(duration);
    if (mainProg) mainProg.value = pct;
  });

  globalAudio.addEventListener('ended', () => {
    nextTrack();
  });

  // Dock controls
  const dockPlayPause = document.getElementById('dockPlayPauseBtn');
  const dockPrev = document.getElementById('dockPrevBtn');
  const dockNext = document.getElementById('dockNextBtn');
  const dockProgress = document.getElementById('dockProgressBar');
  const dockVolume = document.getElementById('dockVolumeBar');

  if (dockPlayPause) dockPlayPause.addEventListener('click', toggleAudioPlay);
  if (dockPrev) dockPrev.addEventListener('click', prevTrack);
  if (dockNext) dockNext.addEventListener('click', nextTrack);
  if (dockProgress) {
    dockProgress.addEventListener('input', (e) => {
      if (globalAudio.duration) {
        globalAudio.currentTime = (e.target.value / 100) * globalAudio.duration;
      }
    });
  }
  if (dockVolume) {
    dockVolume.addEventListener('input', (e) => {
      setVolume(e.target.value);
    });
  }

  // Hero controls
  const mainPlayPause = document.getElementById('mainPlayPauseBtn');
  const mainPrev = document.getElementById('mainPrevBtn');
  const mainNext = document.getElementById('mainNextBtn');
  const mainProgress = document.getElementById('mainPlayerProgress');
  const mainVolume = document.getElementById('mainVolumeSlider');

  if (mainPlayPause) mainPlayPause.addEventListener('click', toggleAudioPlay);
  if (mainPrev) mainPrev.addEventListener('click', prevTrack);
  if (mainNext) mainNext.addEventListener('click', nextTrack);
  if (mainProgress) {
    mainProgress.addEventListener('input', (e) => {
      if (globalAudio.duration) {
        globalAudio.currentTime = (e.target.value / 100) * globalAudio.duration;
      }
    });
  }
  if (mainVolume) {
    mainVolume.addEventListener('input', (e) => {
      setVolume(e.target.value);
    });
  }

  const fileInput = document.getElementById('customAudioFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleUserAudioFileUpload);
  }
}

function handleUserAudioFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const trackUrl = URL.createObjectURL(file);
  const titleName = file.name.replace(/\.[^/.]+$/, "");

  const newSong = {
    id: 'custom_audio_' + Date.now(),
    title: titleName,
    artist: 'My Audio File',
    duration: 'Custom',
    src: trackUrl,
    art: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
    isCustom: true
  };

  AppState.addCustomSong(newSong);
  loadTrack(0, true);
  showToast(`Added custom song "${titleName}"! Playing now.`, 'success');
  e.target.value = '';
}

function loadTrack(index, autoPlay = true) {
  if (index < 0 || index >= activePlaylist.length) return;
  currentTrackIndex = index;
  const track = activePlaylist[index];

  if (!globalAudio) return;
  globalAudio.src = track.src;

  const dockTitle = document.getElementById('dockTrackTitle');
  const dockArtist = document.getElementById('dockTrackArtist');
  const dockArt = document.getElementById('dockAlbumArt');
  if (dockTitle) dockTitle.textContent = track.title;
  if (dockArtist) dockArtist.textContent = track.artist;
  if (dockArt) dockArt.src = track.art;

  const mainTitle = document.getElementById('mainPlayerTitle');
  const mainArtist = document.getElementById('mainPlayerArtist');
  const mainArt = document.getElementById('mainPlayerArt');
  if (mainTitle) mainTitle.textContent = track.title;
  if (mainArtist) mainArtist.textContent = track.artist;
  if (mainArt) mainArt.src = track.art;

  renderPlaylistView();

  if (autoPlay) {
    globalAudio.play().then(() => {
      updatePlaybackUI(true);
    }).catch(err => {
      console.warn('Playback policy warning:', err);
      updatePlaybackUI(false);
    });
  } else {
    updatePlaybackUI(false);
  }
}

function toggleAudioPlay() {
  if (!globalAudio) return;
  if (globalAudio.paused) {
    globalAudio.play().then(() => {
      updatePlaybackUI(true);
    }).catch(e => {
      console.warn('Audio play request blocked:', e);
    });
  } else {
    globalAudio.pause();
    updatePlaybackUI(false);
  }
}

function prevTrack() {
  let prevIdx = currentTrackIndex - 1;
  if (prevIdx < 0) prevIdx = activePlaylist.length - 1;
  loadTrack(prevIdx, true);
}

function nextTrack() {
  let nextIdx = (currentTrackIndex + 1) % activePlaylist.length;
  loadTrack(nextIdx, true);
}

function setVolume(val) {
  if (globalAudio) globalAudio.volume = parseFloat(val);
  const dockVolume = document.getElementById('dockVolumeBar');
  const mainVolume = document.getElementById('mainVolumeSlider');
  if (dockVolume && dockVolume.value !== val) dockVolume.value = val;
  if (mainVolume && mainVolume.value !== val) mainVolume.value = val;
}

function updatePlaybackUI(isPlaying) {
  isAudioPlaying = isPlaying;

  const dockIcon = document.getElementById('dockPlayIcon');
  if (dockIcon) {
    dockIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
  }

  const playIcon = document.getElementById('mainPlayIcon');
  const pauseIcon = document.getElementById('mainPauseIcon');
  if (playIcon && pauseIcon) {
    playIcon.style.display = isPlaying ? 'none' : 'block';
    pauseIcon.style.display = isPlaying ? 'block' : 'none';
  }

  const dot = document.getElementById('playerPulseDot');
  if (dot) {
    if (isPlaying) dot.classList.add('active');
    else dot.classList.remove('active');
  }
}

function renderPlaylistView() {
  const container = document.getElementById('trackListContainer');
  if (!container) return;

  container.innerHTML = activePlaylist.map((t, idx) => `
    <div class="track-item ${idx === currentTrackIndex ? 'active' : ''}">
      <div class="track-item-left" onclick="loadTrack(${idx}, true)">
        <img src="${t.art}" alt="${t.title}" class="track-item-img">
        <div class="track-item-meta">
          <strong>${escapeHtml(t.title)}</strong>
          <span>${escapeHtml(t.artist)} ${t.isCustom ? '<span class="custom-track-badge">Custom</span>' : ''}</span>
        </div>
      </div>
      <div class="track-item-right">
        <span class="track-item-dur">${t.duration}</span>
        ${t.isCustom ? `
          <button class="track-del-btn" onclick="event.stopPropagation(); handleDeleteCustomSong('${t.id}')" title="Delete custom song">
            <i class="fas fa-trash-alt"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function formatAudioTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

window.handleDeleteCustomSong = function(id) {
  if (confirm('Delete this custom song from library?')) {
    AppState.deleteCustomSong(id);
    showToast('Custom song deleted.', 'info');
  }
};

// --- 7.6 Health Reminders & Alerts ---
function renderRemindersSection() {
  const reminders = AppState.getReminders();
  const container = document.getElementById('remindersListContainer');
  if (!container) return;

  if (reminders.length === 0) {
    container.innerHTML = `<div class="empty-state-mini" style="grid-column: 1 / -1; padding: 2rem; text-align: center;">No reminders set. Click "+ Set Reminder" to add your medication or hydration schedules.</div>`;
    return;
  }

  container.innerHTML = reminders.map(r => `
    <div class="reminder-card ${r.completed ? 'completed' : ''}">
      <div>
        <div class="reminder-card-top">
          <span class="reminder-type-tag type-${r.type}">${r.type}</span>
          <span class="reminder-time-badge">${r.time}</span>
        </div>
        <h4 class="reminder-card-title">${escapeHtml(r.title)}</h4>
        <p class="reminder-card-sub">Repeat: ${r.repeat}</p>
      </div>
      <div class="reminder-actions">
        <button class="pill-btn mini-btn ${r.completed ? 'secondary-btn' : 'primary-btn'}" onclick="handleToggleReminder('${r.id}')">
          ${r.completed ? '↩ Mark Pending' : '✓ Mark Done'}
        </button>
        <button class="action-delete-btn" onclick="handleDeleteReminder('${r.id}')" title="Delete reminder">
          <i class="fas fa-trash-alt"></i> Delete
        </button>
      </div>
    </div>
  `).join('');

  checkNotificationPermissionUI();
}

function checkNotificationPermissionUI() {
  const permBanner = document.getElementById('permBanner');
  if (!permBanner) return;

  if (!('Notification' in window)) {
    permBanner.style.display = 'none';
    return;
  }

  // If permission is already granted or denied, hide the banner completely
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    permBanner.style.display = 'none';
  } else {
    // Only show if default (not decided yet)
    permBanner.style.display = 'flex';
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Browser Notifications not supported in this browser.', 'error');
    return;
  }

  Notification.requestPermission().then(permission => {
    checkNotificationPermissionUI();
    if (permission === 'granted') {
      showToast('Notifications enabled! You will receive scheduled reminders.', 'success');
      new Notification('HealthHub Reminders Active', {
        body: 'You will receive timely alerts for medication, workouts, and hydration.',
        icon: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=128&q=80'
      });
    } else {
      showToast('Notification permission denied or dismissed.', 'error');
    }
  });
}

let lastTriggeredMinute = '';

function startReminderScheduler() {
  setInterval(() => {
    const now = new Date();
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (currentHourMin === lastTriggeredMinute) return;

    const reminders = AppState.getReminders();
    reminders.forEach(r => {
      if (!r.completed && r.time === currentHourMin) {
        lastTriggeredMinute = currentHourMin;
        triggerReminderAlert(r);
        if (r.repeat === 'Once') {
          AppState.toggleReminderDone(r.id);
          renderRemindersSection();
          renderDashboard();
        }
      }
    });
  }, 30000);
}


function renderNotificationBadgeAndDropdown() {
  const wrapper = document.getElementById('navNotificationWrapper');
  const badge = document.getElementById('headerNotificationBadge');
  const countPill = document.getElementById('notifDropdownCount');
  const listEl = document.getElementById('notifDropdownList');
  const currentUser = AuthManager.getCurrentUser();

  if (!currentUser) {
    if (wrapper) wrapper.classList.add('hidden');
    return;
  }
  if (wrapper) wrapper.classList.remove('hidden');

  const notifs = AppState.getNotifications();
  const unreadCount = notifs.filter(n => !n.read).length;

  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
  if (countPill) countPill.textContent = unreadCount;

  if (listEl) {
    if (notifs.length === 0) {
      listEl.innerHTML = '<div class="notif-empty-state"><i class="fas fa-bell-slash" style="font-size:1.5rem; margin-bottom:0.5rem; opacity:0.6;"></i><br>No notifications yet</div>';
    } else {
      listEl.innerHTML = notifs.map(n => {
        const bgIconColor = n.iconColor || 'var(--primary-color)';
        return '<div class="notif-item ' + (n.read ? 'read' : 'unread') + '" onclick="handleNotificationItemClick(\'' + n.id + '\')">' +
          '<div class="notif-item-icon" style="background-color:' + bgIconColor + '18; color:' + bgIconColor + ';">' +
            '<i class="' + (n.icon || 'fas fa-bell') + '"></i>' +
          '</div>' +
          '<div class="notif-item-content">' +
            '<div class="notif-item-title">' +
              '<span>' + escapeHtml(n.title) + '</span>' +
              (!n.read ? '<span style="width:7px; height:7px; border-radius:50%; background:#0284c7; display:inline-block;"></span>' : '') +
            '</div>' +
            '<div class="notif-item-desc">' + escapeHtml(n.message) + '</div>' +
            '<div class="notif-item-time"><i class="far fa-clock"></i> ' + escapeHtml(n.time) + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  }
}

window.handleNotificationItemClick = function(id) {
  AppState.markNotificationRead(id);
  switchWorkspaceTab('reminders');
  const dropdown = document.getElementById('headerNotificationDropdown');
  if (dropdown) dropdown.classList.add('hidden');
};

function triggerReminderAlert(reminder) {
  playReminderChime();
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`HealthHub: ${reminder.title}`, {
        body: `Scheduled for ${reminder.time} (${reminder.type.toUpperCase()}). Keep up your healthy routine!`,
        icon: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=128&q=80'
      });
    } catch (e) {
      console.warn('Browser notification error:', e);
    }
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  let iconClass = 'fas fa-bell';
  let iconColor = '#f59e0b';
  if (reminder.type === 'medicine') { iconClass = 'fas fa-pills'; iconColor = '#ec4899'; }
  else if (reminder.type === 'water') { iconClass = 'fas fa-tint'; iconColor = '#0284c7'; }
  else if (reminder.type === 'workout') { iconClass = 'fas fa-dumbbell'; iconColor = '#10b981'; }
  else if (reminder.type === 'checkup') { iconClass = 'fas fa-user-md'; iconColor = '#8b5cf6'; }

  AppState.addNotification({
    id: 'notif_' + Date.now(),
    title: reminder.title,
    message: 'Reminder scheduled for ' + reminder.time + ' (' + reminder.type + ')',
    time: timeStr,
    icon: iconClass,
    iconColor: iconColor,
    read: false
  });

  showToast(`⏰ REMINDER: ${reminder.title} (${reminder.time})`, 'info');
}

// ==========================================================================
// 8. GLOBAL EVENT HANDLERS
// ==========================================================================

window.handleDeleteHealthRecord = function(id) {
  if (confirm('Are you sure you want to delete this health record?')) {
    AppState.deleteHealthRecord(id);
    renderHealthHistory();
    renderDashboard();
    renderProfilePanel();
    showToast('Health record removed.', 'info');
  }
};

window.handleDeleteWorkout = function(id) {
  if (confirm('Are you sure you want to delete this workout log?')) {
    AppState.deleteWorkout(id);
    renderExerciseSection();
    renderDashboard();
    renderProfilePanel();
    showToast('Workout log removed.', 'info');
  }
};

window.handleDeleteMeal = function(id) {
  if (confirm('Are you sure you want to remove this meal?')) {
    AppState.deleteMeal(id);
    renderNutritionSection();
    renderDashboard();
    showToast('Meal log deleted.', 'info');
  }
};

window.handleToggleReminder = function(id) {
  AppState.toggleReminderDone(id);
  renderRemindersSection();
  renderDashboard();
  renderProfilePanel();
  showToast('Reminder status updated.', 'success');
};

window.handleDeleteReminder = function(id) {
  if (confirm('Delete this reminder?')) {
    AppState.deleteReminder(id);
    renderRemindersSection();
    renderDashboard();
    renderProfilePanel();
    showToast('Reminder deleted.', 'info');
  }
};

window.launchPlanTimer = launchPlanTimer;
window.quickAddSuggestedMeal = quickAddSuggestedMeal;
window.loadTrack = loadTrack;

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

function switchTab(tabId) {
  const tabs = document.querySelectorAll('.nav-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(t => {
    if (t.getAttribute('data-tab') === tabId) t.classList.add('active');
    else t.classList.remove('active');
  });

  panels.forEach(p => {
    if (p.id === `tab-${tabId}`) p.classList.add('active');
    else p.classList.remove('active');
  });

  if (tabId === 'health' || tabId === 'dashboard') {
    setTimeout(initOrUpdateCharts, 120);
  }
  if (tabId === 'profile') {
    renderProfilePanel();
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('active');

  const dateInput = modal.querySelector('input[type="date"]');
  if (dateInput && !dateInput.value) {
    dateInput.value = getTodayISO();
  }
}

function closeModal(modal) {
  modal.classList.remove('active');
}

// ==========================================================================
// 9. APP INITIALIZATION & EVENT LISTENERS
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  seedInitialDataIfEmpty();

  // Open Live Workout Stopwatch Button
  const openLiveTimerBtn = document.getElementById('openLiveTimerBtn');
  if (openLiveTimerBtn) {
    openLiveTimerBtn.addEventListener('click', () => {
      activeWorkoutContext = {
        name: 'Free Form Session',
        type: 'General Workout',
        defaultDuration: 30,
        caloriesEst: 200
      };
      const nameEl = document.getElementById('activeRoutineName');
      const descEl = document.getElementById('activeRoutineDesc');
      if (nameEl) nameEl.textContent = 'Free Form Workout Session';
      if (descEl) descEl.textContent = 'Music continues in background while timer runs.';
      openModal('modal-live-timer');
    });
  }


  // Avatar Vertical Position Focus (To center face)
  const avatarPosYSlider = document.getElementById('avatarPosY');
  const avatarAdjustBox = document.getElementById('avatarAdjustControls');
  
  if (avatarPosYSlider) {
    avatarPosYSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      const posStr = `center ${val}%`;
      const headerAvatar = document.getElementById('headerAvatarCircle');
      const largeAvatar = document.getElementById('profileLargeAvatar');
      if (headerAvatar) headerAvatar.style.backgroundPosition = posStr;
      if (largeAvatar) largeAvatar.style.backgroundPosition = posStr;
      
      // Save focus in current user record
      const currentUser = AuthManager.getCurrentUser();
      if (currentUser) {
        currentUser.photoFocus = posStr;
        AuthManager.setCurrentUser(currentUser);
      }
    });
  }


  // Header User Profile Click (Opens Profile Settings inside user profile)
  const headerUserProfileTrigger = document.getElementById('headerUserProfileTrigger');
  if (headerUserProfileTrigger) {
    headerUserProfileTrigger.addEventListener('click', () => {
      switchWorkspaceTab('profile');
      document.getElementById('app-workspace')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Home nav link handler
  const navHomeLink = document.getElementById('navHomeLink');
  if (navHomeLink) {
    navHomeLink.addEventListener('click', (e) => {
      e.preventDefault();
      const currentUser = AuthManager.getCurrentUser();
      if (currentUser) {
        switchWorkspaceTab('dashboard');
        document.getElementById('app-workspace')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        document.getElementById('hero-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Logo click handler
  const navLogo = document.getElementById('navLogo');
  if (navLogo) {
    navLogo.addEventListener('click', () => {
      const currentUser = AuthManager.getCurrentUser();
      if (currentUser) {
        switchWorkspaceTab('dashboard');
        document.getElementById('app-workspace')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        document.getElementById('hero-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Wire up Auth modal buttons
  const navLoginBtn = document.getElementById('navLoginBtn');
  const navSignupBtn = document.getElementById('navSignupBtn');
  const heroStartBtn = document.getElementById('heroStartTrackingBtn');
  const ctaSignupBtn = document.getElementById('ctaSignupBtn');
  const closeAuthBtn = document.getElementById('closeAuthModalBtn');
  const authModal = document.getElementById('authScreenModal');

  if (navLoginBtn) navLoginBtn.addEventListener('click', () => openAuthModal(false));
  if (navSignupBtn) navSignupBtn.addEventListener('click', () => openAuthModal(true));
  if (heroStartBtn) heroStartBtn.addEventListener('click', () => openAuthModal(true));
  if (ctaSignupBtn) ctaSignupBtn.addEventListener('click', () => openAuthModal(true));
  if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthModal);
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthModal();
    });
  }

  // Hero Open Live Vitals Button
  const heroOpenVitalsBtn = document.getElementById('heroOpenVitalsBtn');
  if (heroOpenVitalsBtn) {
    heroOpenVitalsBtn.addEventListener('click', () => {
      const current = AuthManager.getCurrentUser();
      if (!current) {
        openAuthModal(false);
      } else {
        switchWorkspaceTab('health');
        document.getElementById('app-workspace')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Workspace Tab buttons
  document.querySelectorAll('[data-workspace-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-workspace-tab');
      switchWorkspaceTab(tab);
    });
  });

  // Top nav links
  document.querySelectorAll('.nav-link-item').forEach(link => {
    link.addEventListener('click', (e) => {
      const navTarget = link.getAttribute('data-nav');
      document.querySelectorAll('.nav-link-item').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      if (navTarget === 'app') {
        document.getElementById('app-workspace')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });


  // Set Theme
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  document.body.setAttribute('data-theme', savedTheme);

  const themeToggle = document.getElementById('themeToggleBtn');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme');
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', nextTheme);
      localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
      initOrUpdateCharts();
      showToast(`Switched to ${nextTheme} theme.`, 'info');
    });
  }

  // Auth Screen Switchers
  const showSignupLink = document.getElementById('showSignupLink');
  const showLoginLink = document.getElementById('showLoginLink');
  const loginFormContainer = document.getElementById('loginFormContainer');
  const signupFormContainer = document.getElementById('signupFormContainer');

  if (showSignupLink) {
    showSignupLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginFormContainer.classList.add('hidden');
      signupFormContainer.classList.remove('hidden');
    });
  }
  if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      signupFormContainer.classList.add('hidden');
      loginFormContainer.classList.remove('hidden');
    });
  }

  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pass = document.getElementById('loginPassword').value.trim();
      const res = AuthManager.login(email, pass);
      if (res.success) {
        showToast(`Welcome back, ${res.user.name}!`, 'success'); closeAuthModal();
        checkAuthAndRenderUI();
  checkNotificationPermissionUI();
  renderNotificationBadgeAndDropdown();
      } else {
        showToast(res.message, 'error');
      }
    });
  }

  // Signup Form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const pass = document.getElementById('signupPassword').value.trim();
      const confirmPass = document.getElementById('signupConfirm').value.trim();

      if (pass !== confirmPass) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      const res = AuthManager.signup(name, email, pass);
      if (res.success) {
        showToast(`Account created! Welcome, ${name}.`, 'success'); closeAuthModal();
        checkAuthAndRenderUI();
      } else {
        showToast(res.message, 'error');
      }
    });
  }

  // Header Profile Widget Click -> Opens Profile Tab
  const headerProfileWidget = document.getElementById('headerProfileWidget');
  if (headerProfileWidget) {
    headerProfileWidget.addEventListener('click', (e) => {
      if (e.target.closest('#logoutBtn')) return;
      switchTab('profile');
    });
  }

  // Header Notification Bell Click -> Toggle Dropdown
  const headerNotifBellBtn = document.getElementById('headerNotificationBellBtn');
  const notifDropdown = document.getElementById('headerNotificationDropdown');

  if (headerNotifBellBtn && notifDropdown) {
    headerNotifBellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('hidden');
      renderNotificationBadgeAndDropdown();
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== headerNotifBellBtn && !headerNotifBellBtn.contains(e.target)) {
        notifDropdown.classList.add('hidden');
      }
    });
  }

  const markAllReadBtn = document.getElementById('markAllNotifsReadBtn');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      AppState.markAllNotificationsRead();
      showToast('All notifications marked as read', 'info');
    });
  }

  const viewRemindersBtn = document.getElementById('goToRemindersFromNotifBtn');
  if (viewRemindersBtn) {
    viewRemindersBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (notifDropdown) notifDropdown.classList.add('hidden');
      switchWorkspaceTab('reminders');
    });
  }

  // Brand Home Click
  const brandHome = document.getElementById('brandHomeLink');
  if (brandHome) {
    brandHome.addEventListener('click', () => switchTab('dashboard'));
  }

  // Logout Button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to sign out?')) {
        AuthManager.logout();
        if (globalAudio) globalAudio.pause();
        updatePlaybackUI(false);
        checkAuthAndRenderUI();
        showToast('Signed out successfully.', 'info');
      }
    });
  }

  // Profile Update Form
  const profileUpdateForm = document.getElementById('profileUpdateForm');
  if (profileUpdateForm) {
    profileUpdateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = document.getElementById('editFullName').value.trim();
      const newPass = document.getElementById('editNewPassword').value.trim();
      const confirmPass = document.getElementById('editConfirmPassword').value.trim();

      if (newPass || confirmPass) {
        if (newPass !== confirmPass) {
          showToast('New passwords do not match.', 'error');
          return;
        }
        if (newPass.length < 6) {
          showToast('Password must be at least 6 characters long.', 'error');
          return;
        }
      }

      const res = AuthManager.updateProfile(newName, newPass);
      if (res.success) {
        updateHeaderUserUI(res.user);
        renderProfilePanel();
        document.getElementById('editNewPassword').value = '';
        document.getElementById('editConfirmPassword').value = '';
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast(res.message, 'error');
      }
    });
  }

  // Profile Picture Upload Handler (Base64)
  const profilePicInput = document.getElementById('profilePicInput');
  if (profilePicInput) {
    profilePicInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(evt) {
        const base64Data = evt.target.result;
        AuthManager.updateProfile(null, null, base64Data);
        const currentUser = AuthManager.getCurrentUser();
        updateHeaderUserUI(currentUser);
        renderProfilePanel();
        showToast('Profile picture updated!', 'success');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    });
  }

  // Remove Profile Picture Handler
  const removeProfilePicBtn = document.getElementById('removeProfilePicBtn');
  if (removeProfilePicBtn) {
    removeProfilePicBtn.addEventListener('click', () => {
      AuthManager.updateProfile(null, null, '');
      const currentUser = AuthManager.getCurrentUser();
      updateHeaderUserUI(currentUser);
      renderProfilePanel();
      showToast('Profile photo removed.', 'info');
    });
  }

  // Quick Search Bar Filter
  const searchInput = document.getElementById('quickSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.clean-metric-tile').forEach(tile => {
        const txt = tile.textContent.toLowerCase();
        if (txt.includes(q)) {
          tile.style.display = 'flex';
        } else {
          tile.style.display = 'none';
        }
      });
    });
  }

  // Tab switching
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  document.querySelectorAll('[data-tab-link]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab-link');
      switchTab(tab);
    });
  });

  const dockOpenPlayerBtn = document.getElementById('dockOpenPlayerBtn');
  if (dockOpenPlayerBtn) {
    dockOpenPlayerBtn.addEventListener('click', () => switchTab('music'));
  }

  // Modals
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal');
      openModal(modalId);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.hasAttribute('data-close')) {
        closeModal(overlay);
      }
    });
  });

  // Health Form
  const healthForm = document.getElementById('healthForm');
  if (healthForm) {
    healthForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const record = {
        id: 'h_' + Date.now(),
        date: document.getElementById('healthDate').value,
        bpSystolic: Number(document.getElementById('bpSystolic').value),
        bpDiastolic: Number(document.getElementById('bpDiastolic').value),
        heartRate: Number(document.getElementById('heartRate').value),
        bloodSugar: Number(document.getElementById('bloodSugar').value),
        weight: Number(document.getElementById('weight').value)
      };
      AppState.addHealthRecord(record);
      closeModal(document.getElementById('modal-health'));
      healthForm.reset();
      renderHealthHistory();
      renderDashboard();
      renderProfilePanel();
      showToast('Health vital record saved successfully!', 'success');
    });
  }

  // Workout Form
  const workoutForm = document.getElementById('workoutForm');
  if (workoutForm) {
    workoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const item = {
        id: 'w_' + Date.now(),
        date: document.getElementById('workoutDate').value,
        exercise: document.getElementById('workoutExercise').value,
        type: document.getElementById('workoutType').value,
        duration: Number(document.getElementById('workoutDuration').value),
        calories: Number(document.getElementById('workoutCalories').value)
      };
      AppState.addWorkout(item);
      closeModal(document.getElementById('modal-workout'));
      workoutForm.reset();
      renderExerciseSection();
      renderDashboard();
      renderProfilePanel();
      showToast('Workout log saved!', 'success');
    });
  }

  // Meal Form
  const mealForm = document.getElementById('mealForm');
  if (mealForm) {
    mealForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const item = {
        id: 'm_' + Date.now(),
        date: document.getElementById('mealDate').value,
        name: document.getElementById('mealName').value,
        calories: Number(document.getElementById('mealCalories').value),
        protein: Number(document.getElementById('mealProtein').value),
        carbs: Number(document.getElementById('mealCarbs').value),
        fat: Number(document.getElementById('mealFat').value)
      };
      AppState.addMeal(item);
      closeModal(document.getElementById('modal-meal'));
      mealForm.reset();
      renderNutritionSection();
      renderDashboard();
      showToast('Meal logged successfully!', 'success');
    });
  }

  // Reminder Form
  const reminderForm = document.getElementById('reminderForm');
  if (reminderForm) {
    reminderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const item = {
        id: 'r_' + Date.now(),
        title: document.getElementById('reminderTitle').value,
        time: document.getElementById('reminderTime').value,
        repeat: document.getElementById('reminderRepeat').value,
        type: document.getElementById('reminderType').value,
        completed: false
      };
      AppState.addReminder(item);
      closeModal(document.getElementById('modal-reminder'));
      reminderForm.reset();
      renderRemindersSection();
      renderDashboard();
      renderProfilePanel();
      showToast('Health reminder scheduled!', 'success');
    });
  }

  // Add Song via URL Form
  const addSongUrlForm = document.getElementById('addSongUrlForm');
  if (addSongUrlForm) {
    addSongUrlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('songTitleInput').value.trim();
      const artist = document.getElementById('songArtistInput').value.trim() || 'Custom Artist';
      const url = document.getElementById('songUrlInput').value.trim();
      const art = document.getElementById('songArtUrlInput').value.trim() ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';

      const customSong = {
        id: 'custom_url_' + Date.now(),
        title: title,
        artist: artist,
        duration: 'Stream',
        src: url,
        art: art,
        isCustom: true
      };

      AppState.addCustomSong(customSong);
      closeModal(document.getElementById('modal-add-song-url'));
      addSongUrlForm.reset();
      loadTrack(0, true);
      showToast(`Song "${title}" added to your workout library!`, 'success');
    });
  }

  // Timer controls
  const startTimerBtn = document.getElementById('startTimerBtn');
  const pauseTimerBtn = document.getElementById('pauseTimerBtn');
  const finishWorkoutBtn = document.getElementById('finishWorkoutBtn');

  if (startTimerBtn) startTimerBtn.addEventListener('click', startWorkoutTimer);
  if (pauseTimerBtn) pauseTimerBtn.addEventListener('click', pauseWorkoutTimer);
  if (finishWorkoutBtn) finishWorkoutBtn.addEventListener('click', finishAndLogWorkout);

  // CSV Export
  const exportBtn = document.getElementById('exportHealthCsvBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportHealthCSV);

  // Notifications
  const reqPermBtn = document.getElementById('requestPermBtn');
  if (reqPermBtn) reqPermBtn.addEventListener('click', requestNotificationPermission);

  // Initialize Music & Schedulers
  initMusicPlayer();
  startReminderScheduler();

  // Initial Auth Check
  checkAuthAndRenderUI();
});
