/* style.css */
:root {
    --primary: #0984e3;
    --success: #00b894;
    --danger: #d63031;
    --bg: #f4f7f6;
    --card-bg: #ffffff;
    --text: #2d3436;
    --text-muted: #636e72;
    --border: #dfe6e9;
}

* {
    box-sizing: border-box;
    font-family: 'Plus Jakarta Sans', sans-serif;
    -webkit-tap-highlight-color: transparent;
}

body {
    background: var(--bg);
    color: var(--text);
    margin: 0;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

header {
    background: #fff;
    padding: 15px 5%;
    position: sticky;
    top: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-bottom: 1px solid var(--border);
    border-radius: 0 0 30px 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

@media (min-width: 768px) {
    header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        border-radius: 0;
        box-shadow: none;
    }
}

.search-pill {
    background: #f1f2f6;
    border-radius: 50px;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 400px;
}

.search-pill input {
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
    margin-left: 10px;
    font-size: 0.95rem;
}

.desktop-search-pill {
    display: none;
}

.mobile-search-container {
    display: block;
    padding: 15px 5% 5px 5%;
    background: transparent;
}

.mobile-search-container .search-pill {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255,255,255,0.6);
}

@media (min-width: 768px) {
    .desktop-search-pill {
        display: flex;
    }
    .mobile-search-container {
        display: none;
    }
}

.container {
    padding: 20px 5%;
    flex: 1;
    position: relative;
    z-index: 1;
}

.date-section-header {
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--primary);
    margin: 35px 0 15px;
    border-bottom: 2px solid var(--border);
    padding-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.sites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

/* Fixed Site Card Click Area */
.site-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid var(--border);
    overflow: hidden;
    transition: 0.3s;
    cursor: pointer;
    position: relative;
    user-select: none;
    display: block;
}

.site-card:active {
    transform: scale(0.98);
}

.media-container {
    width: 100%;
    height: 190px;
    background: #1a1b1e;
    overflow: hidden;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.media-container iframe,
.media-container img {
    width: 100%;
    height: 100%;
    border: none;
    object-fit: cover;
    display: block;
}

.media-container a {
    display: block;
    width: 100%;
    height: 100%;
    position: relative;
}

.glass-arrow-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 1.5rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    pointer-events: none;
    z-index: 5;
}

.media-container a:hover .glass-arrow-icon {
    background: rgba(255, 255, 255, 0.25);
    transform: translate(-50%, -50%) scale(1.15);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.full-banner {
    position: absolute;
    bottom: 0;
    width: 100%;
    background: rgba(214, 48, 49, 0.9);
    color: white;
    text-align: center;
    padding: 6px;
    font-weight: 800;
    font-size: 0.75rem;
    pointer-events: none;
}

.card-body {
    padding: 15px;
}

.wage-badge {
    background: #e1f0ff;
    color: var(--primary);
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
}

/* Drawer & Popups - Higher Z-Index */
.drawer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 2000;
    display: none;
    backdrop-filter: blur(4px);
}

.drawer-overlay.active {
    display: block;
}

.drawer {
    position: fixed;
    bottom: -100%;
    left: 0;
    width: 100%;
    height: 85vh;
    background: white;
    border-radius: 24px 24px 0 0;
    transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    z-index: 2100;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
}

.drawer.active {
    bottom: 0;
}

@media (min-width: 768px) {
    .drawer {
        width: 500px;
        left: 50%;
        transform: translateX(-50%);
    }
}

#drawerBody {
    padding: 20px;
    overflow-y: auto;
    height: 100%;
    padding-bottom: 80px;
}

.close-btn {
    position: absolute;
    top: 15px;
    right: 20px;
    width: 35px;
    height: 35px;
    background: #f1f2f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2200;
}

.glass-card {
    background: #fff;
    padding: 20px;
    border-radius: 20px;
    border: 1px solid var(--border);
    margin-bottom: 25px;
}

.stunning-input {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    background: #f9fbfd;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    outline: none;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
}

.stunning-input:focus {
    border-color: var(--primary);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(9, 132, 227, 0.15);
}

.stunning-textarea {
    min-height: 80px;
    resize: vertical;
    margin-top: 15px;
}

.table-scroll-container {
    width: 100%;
    overflow-x: auto;
    margin-top: 15px;
}

.admin-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
}

.admin-table th,
.admin-table td {
    padding: 12px;
    border-bottom: 1px solid var(--border);
    text-align: left;
}

footer {
    background: #1a1b1e;
    color: #fff;
    padding: 40px 5%;
    text-align: center;
    margin-top: auto;
}

.wa-link {
    background: #25d366;
    color: #fff;
    padding: 12px 25px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 700;
    display: inline-block;
    margin-top: 15px;
}

.admin-table th {
    font-size: 0.85rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.admin-table td input[type="text"] {
    font-family: inherit;
    font-size: 0.9rem;
    transition: border 0.2s;
}

.admin-table td input[type="text"]:focus {
    border-color: var(--primary);
    outline: none;
}

/* --- Countdown Timer Styles --- */
.countdown-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 14px;
    margin: 15px 0;
    font-weight: 600;
}

.countdown-active {
    background: linear-gradient(135deg, #dfe6e9, #b2bec3);
    color: #2d3436;
    animation: countdownPulse 2s ease-in-out infinite;
}

.countdown-expired {
    background: linear-gradient(135deg, #ffeaa7, #fab1a0);
    color: #d63031;
}

.countdown-urgent {
    background: linear-gradient(135deg, #ff7675, #d63031) !important;
    color: #fff !important;
    animation: countdownUrgent 0.8s ease-in-out infinite;
}

.countdown-icon {
    font-size: 1.6rem;
    flex-shrink: 0;
}

.countdown-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.countdown-label {
    font-size: 0.78rem;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.countdown-value {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: 1px;
    font-variant-numeric: tabular-nums;
}

.card-countdown-badge {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: linear-gradient(135deg, rgba(9,132,227,0.85), rgba(0,184,148,0.85));
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: #fff;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.78rem;
    font-weight: 700;
    z-index: 5;
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 4px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.25);
    animation: countdownPulse 2.5s ease-in-out infinite;
}

.timer-icon-spin {
    display: inline-block;
    animation: timerSpin 2s ease-in-out infinite;
    font-size: 0.9rem;
}

@keyframes timerSpin {
    0% { transform: rotate(0deg); }
    25% { transform: rotate(180deg); }
    50% { transform: rotate(180deg); }
    75% { transform: rotate(360deg); }
    100% { transform: rotate(360deg); }
}

@keyframes countdownPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
}

@keyframes countdownUrgent {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.01); box-shadow: 0 0 20px rgba(214, 48, 49, 0.3); }
}
