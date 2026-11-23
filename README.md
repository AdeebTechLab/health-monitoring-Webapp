# HealthHub - Personal Health and Wellness Tracker

A comprehensive personal health and wellness tracker single-page web application built with **pure HTML5, CSS3, and JavaScript**. Designed to accompany the user's daily health routine with vital statistics tracking, workout routines and timers, macro meal logging, background workout audio playback, and scheduled wellness alerts.

---

## 🌟 Key Features

### 1. Dashboard / Home
- **Daily Wellness Cards**: Instant status widgets for Today's Vitals, Active Workout status, Daily Calories consumed vs. 2,000 kcal target, and the Next Upcoming Scheduled Reminder.
- **Quick-Add Actions**: Rapid modal shortcuts to log a health record, add a workout, log a meal, or schedule a reminder in one click.
- **Actionable Health Insight**: Daily motivational and wellness guidance.

### 2. Health & Vitals Tracking
- **Vitals Tracked**: Date, Blood Pressure (Systolic and Diastolic in mmHg), Resting Heart Rate (bpm), Blood Sugar (mg/dL), and Weight (kg).
- **Interactive Visualizations (Chart.js)**:
  - *Weight Trend Line Chart*: Visualizes weight fluctuations chronologically.
  - *Blood Pressure Dual-Curve Chart*: Plots Systolic vs. Diastolic pressure.
- **Clinical Normal Range Indicators**:
  - Normal blood pressure (<120/80 mmHg) highlighted with green status badges.
  - Elevated and Stage 1-2 hypertension ranges (≥130/80 mmHg) flagged with amber/red status pills.
  - Fasting blood sugar indicators (70-99 mg/dL optimal, ≥126 mg/dL elevated).
- **History Table & Deletion**: Tabular view sorted by date, with instant row removal.
- **CSV Data Export**: One-click download of health records formatted as `HealthHub_Health_Vitals_YYYY-MM-DD.csv`.

### 3. Exercise & Fitness
- **4 Pre-Made Workout Plans**:
  - *Full Body Sculpt* (40 mins, ~320 kcal): Goblet squats, push-ups, dumbbell rows, plank.
  - *High-Intensity Cardio Blast* (30 mins, ~280 kcal): Jumping jacks, high knees, mountain climbers, burpees.
  - *Upper Body Strength* (45 mins, ~350 kcal): Overhead press, curls, tricep dips, lateral raises.
  - *Mindful Flow & Core Yoga* (35 mins, ~160 kcal): Sun salutations, warrior poses, cobra flow, savasana.
- **Live Workout Session Timer**: Interactive stopwatch with Start, Pause/Resume, and Finish & Log capability with auto-calculated calorie expenditure.
- **Weekly Progress Strip**: Aggregates total active workout minutes, burned calories, and completed sessions for the trailing 7 days.
- **Workout History**: Dedicated table with exercise name, category, duration, and calories burned.

### 4. Nutrition & Meal Planning
- **Daily Macronutrient Goals**:
  - Target: **2,000 kcal**, **140g Protein**, **250g Carbohydrates**, **70g Healthy Fat**.
  - Animated progress bars reflecting real-time percentages and remaining/surplus calorie counts.
- **6 Nutritionist-Suggested Meals**: Quick-add cards for balanced breakfasts, power lunches, and lean dinners (e.g., *Greek Yogurt Berry Crunch Bowl*, *Grilled Salmon Quinoa Bowl*, *Lean Beef Stir-Fry*, *Tofu Buddha Bowl*).
- **Meal Log History**: Chronological table with detailed macro breakdowns and deletion controls.

### 5. Workout Music Player
- **Library of 5 High-Energy Audio Tracks**: Royalty-free SoundHelix audio selections with high-definition album art.
- **Persistent Floating Music Dock**: Plays uninterrupted across all sections, tabs, and modals while you time your workouts.
- **Full Player & Mini Bar**: Play/pause, track skip (next/previous), scrubbing timeline slider, and volume adjustments.

### 6. Scheduled Health Reminders
- **Customizable Schedules**: Title, time (HH:MM), frequency (Daily or Once), and categorized as **Medicine**, **Water**, **Workout**, or **Checkup**.
- **Dual Notification Engine**:
  - *Browser Notification API*: Native OS/browser desktop alerts (with user permission).
  - *In-App Toast Alerts*: Instant top-level visual notifications with audio cue readiness.
- **Status Management**: Mark done or pending, and delete obsolete reminders.

### 7. Clean Modern Design & Theming
- **Calm Wellness Theme**: Teal/emerald green accents (`#0d9488`, `#10b981`) paired with clean surfaces.
- **Dark Mode / Light Mode**: Instant toggle saved in `localStorage`.
- **Responsive Breakpoints**: Tailored layouts for Mobile (360px+), Tablet (768px+), and Desktop (1200px+).

---

## 💾 LocalStorage Data Schema

All modules persist independently using dedicated keys in the browser's `window.localStorage`:

| Module | LocalStorage Key | Data Structure |
|---|---|---|
| **Health Vitals** | `healthhub_health_records` | Array of `{ id, date, bpSystolic, bpDiastolic, heartRate, bloodSugar, weight }` |
| **Workouts** | `healthhub_workout_records` | Array of `{ id, date, exercise, type, duration, calories }` |
| **Nutrition** | `healthhub_meals_records` | Array of `{ id, date, name, calories, protein, carbs, fat }` |
| **Reminders** | `healthhub_reminders_list` | Array of `{ id, title, time, repeat, type, completed }` |
| **Theme** | `healthhub_theme_preference` | String: `'light'` or `'dark'` |

---

## 🚀 How to Run Locally

Because HealthHub is built with pure standard web technologies, no build tools, node packages, or compilers are required:

1. **Direct Browser Execution**:
   - Double-click `index.html` or drag it into any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
2. **Local HTTP Server (Optional)**:
   - If using VS Code: Right-click `index.html` and click **"Open with Live Server"**.
   - If using Python: Run `python -m http.server 8000` in the directory, then navigate to `http://localhost:8000`.

---

## 🌐 Deployment to GitHub Pages

1. Push this project folder to a GitHub repository.
2. In the repository settings, navigate to **Pages** (under Code and automation).
3. Under **Branch**, select `main` (or `master`) and folder `/ (root)`, then click **Save**.
4. GitHub will deploy the static site to `https://<your-username>.github.io/<repo-name>/`.
