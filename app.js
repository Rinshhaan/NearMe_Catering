import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCeEYZ52ETdr4WlbBHrANVWMGeunfbS1aw",
    authDomain: "nearmecatering.firebaseapp.com",
    projectId: "nearmecatering",
    storageBucket: "nearmecatering.firebasestorage.app",
    messagingSenderId: "1089531792392",
    appId: "1:1089531792392:web:62937c0026adbfcccf15bd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allSites = [];
let allBookings = [];
let currentOpenSiteId = null;

// --- GEO-BLOCKING ---
fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(data => {
        if (!data.error && data.country_code) {
            if (data.country_code !== 'IN' || (data.region !== 'Kerala' && data.region !== 'KL')) {
                document.body.innerHTML = `
                    <div style="display:flex; height:100vh; width:100vw; justify-content:center; align-items:center; background:#1a1b1e; color:white; font-family:'Plus Jakarta Sans', sans-serif; text-align:center; padding:20px;">
                        <div>
                            <h1 style="color:#e74c3c;">Access Restricted 📍</h1>
                            <p style="color:#a0a0a0; margin-top:10px;">NearMe is currently only available for users in Kerala, India.</p>
                        </div>
                    </div>`;
            }
        }
    })
    .catch(e => console.log('Location check skipped'));

// --- UTILITIES ---
const getToday = () => new Date().toISOString().split('T')[0];

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
};

const getCategorizedLabel = (dateStr) => {
    const today = new Date(getToday());
    const target = new Date(dateStr);
    const diff = Math.round((today - target) / (1000 * 3600 * 24));
    if (diff === 0) return "Today";
    if (diff === -1) return "<span class='neon-text' style='color:#e74c3c; text-shadow:0 0 5px #e74c3c, 0 0 10px #e74c3c;'>Tomorrow</span>";
    if (diff === -2) return "<span class='neon-text' style='color:#e74c3c; text-shadow:0 0 5px #e74c3c, 0 0 10px #e74c3c;'>Day after Tomorrow</span>";
    if (diff < -2) return "Upcoming";
    if (diff === 1) return "Yesterday";
    return formatDisplayDate(dateStr);
};

const isValidPhone = (p) => {
    const digits = p.replace(/\D/g, "");
    return digits.length >= 10 && /^[6-9]\d{9}$/.test(digits.slice(-10));
};

const renderMedia = (url) => {
    // Relying on style.css (.media-container img { max-width: 100%, max-height: 100%, object-fit: contain })
    if (!url) return `<img src="https://via.placeholder.com/400x200?text=NearMe" style="display:block;">`;
    if (url.includes("maps.google.com") || url.includes("<iframe")) {
        let src = url;
        if (url.includes("<iframe")) {
            const match = url.match(/src="([^"]+)"/);
            src = match ? match[1] : '';
        }
        return `<iframe src="${src}" style="border:0; width:100%; height:100%;" overflow="hidden" scrolling="no" allowfullscreen="" loading="lazy"></iframe>`;
    }
    return `<img src="${url}" style="display:block;">`;
};

// --- DATA SYNC ---
onSnapshot(query(collection(db, "sites"), orderBy("aDate", "desc")), (snap) => {
    allSites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateUI();
});

onSnapshot(collection(db, "bookings"), (snap) => {
    allBookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateUI();
    if (currentOpenSiteId) window.openDrawer(currentOpenSiteId);
});

function updateUI() {
    if (document.getElementById('sitesGrid')) renderClient();
    if (document.getElementById('masterViewContainer')) renderAdmin();
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('btnConfirm');
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            const name = document.getElementById('uName').value.trim();
            const phone = document.getElementById('uPhone').value.trim();
            const phone2Element = document.getElementById('uPhone2');
            const phone2 = phone2Element ? phone2Element.value.trim() : "";
            const place = document.getElementById('uPlace').value.trim();

            if (!name || !phone || !place) return alert("All fields are required!");
            if (!isValidPhone(phone)) return alert("Invalid WhatsApp number! Please enter a valid number.");
            if (phone2 && !isValidPhone(phone2)) return alert("Invalid 2nd WhatsApp number!");

            await addDoc(collection(db, "bookings"), {
                siteId: window.currentSiteId, uName: name, uPhone: phone, uPhone2: phone2, uPlace: place, paid: false, notes: ""
            });

            document.getElementById('regPopup').style.display = 'none';
            document.querySelectorAll('#regPopup input').forEach(i => i.value = "");
            alert("Slot booked successfully!");
        };
    }
});

// --- DRAWER LOGIC ---
window.openDrawer = (id) => {
    currentOpenSiteId = id;
    const s = allSites.find(x => x.id === id);
    if (!s) return;
    const bookings = allBookings.filter(b => b.siteId === id);
    const isClosed = s.aDate < getToday();

    // Create the Slots HTML
    let slotsHTML = '';
    const totalSlots = s.aSlots || null; // null = unlimited
    const slotCount = totalSlots !== null ? totalSlots : bookings.length + 1; // show existing + 1 open if unlimited
    for (let i = 0; i < slotCount; i++) {
        const b = bookings[i];
        let actionContent = b ?
            `<div style="text-align:right">
                <small>${b.uPhone.slice(0, 4)}***${b.uPhone.slice(-2)}</small><br>
                ${!isClosed ? `<span style="color:red; cursor:pointer; font-size:0.7rem;" onclick="cancelBooking('${b.id}','${b.uPhone}')">Cancel</span>` : ''}
            </div>` :
            (isClosed ? `<span style="color:gray; font-size:0.8rem;">Closed</span>` :
                `<button onclick="window.openReg('${id}')" style="background:var(--primary); color:white; border:none; padding:6px 15px; border-radius:6px; cursor:pointer;">Book</button>`);

        slotsHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee;">
                <div><strong>#${i + 1}</strong> ${b ? b.uName : 'Available'}</div>
                ${actionContent}
            </div>`;
    }
    // If unlimited, add one more open slot at the bottom if last slot is filled
    if (totalSlots === null && bookings.length > 0 && bookings[slotCount - 1]) {
        slotsHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee;">
                <div><strong>#${slotCount + 1}</strong> Available</div>
                <button onclick="window.openReg('${id}')" style="background:var(--primary); color:white; border:none; padding:6px 15px; border-radius:6px; cursor:pointer;">Book</button>
            </div>`;
    }

    const drawerBody = document.getElementById('drawerBody');
    if (drawerBody) {
        // Build media for drawer: if aImg exists show it (clickable if map link), else embed map iframe
        let drawerMediaInner;
        if (s.aImg) {
            drawerMediaInner = renderMedia(s.aImg);
        } else if (s.aMapLink) {
            // Convert share link to embed URL
            let embedUrl = s.aMapLink;
            if (!embedUrl.includes('/embed')) {
                embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(s.aPlaceName || '')}&output=embed&z=15`;
            }
            drawerMediaInner = `<iframe src="${embedUrl}" style="border:0; width:100%; height:100%;" allowfullscreen loading="lazy"></iframe>`;
        } else {
            drawerMediaInner = renderMedia('');
        }

        const drawerMedia = s.aMapLink && s.aImg
            ? `<a href="${s.aMapLink}" target="_blank" style="display:block;width:100%;height:100%; position:relative;">
                   ${drawerMediaInner}
                   <div class="glass-arrow-icon">
                       <i class="fas fa-location-arrow"></i>
                   </div>
               </a>`
            : drawerMediaInner;

        drawerBody.innerHTML = `
            <div class="media-container" style="border-radius:15px; margin-bottom:15px; height:200px; pointer-events:auto;">${drawerMedia}</div>
            
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <h2 style="margin:0; font-size:1.4rem;">${s.aSitename}</h2>
            </div>

            <p style="color:var(--primary); font-weight:700; margin:8px 0;">📍 ${s.aPlaceName}</p>
            ${s.aTeamName ? `<div style="margin-bottom:10px;"><span style="background:#f1f2f6; color:#333; padding:4px 10px; border-radius:6px; font-size:0.85rem; font-weight:600;">Team ${s.aTeamName}</span></div>` : ''}
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:15px 0;">
                <div style="background:#f8f9fa; padding:10px; border-radius:10px;"><small style="color:#666">Wage</small><div style="font-weight:700">₹${s.aWage}</div></div>
                <div style="background:#f8f9fa; padding:10px; border-radius:10px;"><small style="color:#666">Time</small><div style="font-weight:700">${s.aTime}</div></div>
                ${s.aGuests ? `<div style="background:#f8f9fa; padding:10px; border-radius:10px;"><small style="color:#666">Guest Count</small><div style="font-weight:700">👥 ${s.aGuests}</div></div>` : ''}
                <div style="background:#f8f9fa; padding:10px; border-radius:10px;"><small style="color:#666">Status</small><div style="font-weight:700">${isClosed ? 'CLOSED' : (totalSlots ? `${bookings.length}/${totalSlots} Slots` : `${bookings.length} Booked (Open)`)}</div></div>
            </div>
            
            <div style="background:#fff9e6; border-left:4px solid #ffcc00; padding:10px; margin-bottom:15px; border-radius:4px;">
                <strong style="font-size:0.85rem;">Requirements:</strong><br>
                <span style="font-size:0.9rem;">${s.aReq || 'Standard uniform required.'}</span>
            </div>
            ${s.aNotes ? `<div style="background:#f8f9fa; padding:15px; border-radius:10px; margin-bottom:15px;">
                <h4 style="margin:0 0 10px 0;">📌 Notes</h4>
                <ul style="margin:0; padding-left:20px; font-size:0.9rem; color:#444;">
                    ${s.aNotes.split(/[,\n]+/).map(n => n.trim()).filter(n => n).map(n => `<li style="margin-bottom:6px;">${n}</li>`).join('')}
                </ul>
            </div>` : ''}

            <h3 style="margin-top:20px; border-top:1px solid #eee; padding-top:15px; font-size:1.1rem;">Staff Selection</h3>
            <div style="background:white; border-radius:10px; border:1px solid #eee; overflow:hidden;">
                ${slotsHTML}
            </div>
        `;
    }
    document.getElementById('siteDrawer').classList.add('active');
    document.getElementById('drawerOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeDrawer = () => {
    currentOpenSiteId = null;
    document.getElementById('siteDrawer').classList.remove('active');
    document.getElementById('drawerOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
};

// --- CLIENT RENDERING ---
window.filterSites = () => renderClient();
window.renderClient = renderClient; // expose for onkeyup in HTML

function renderClient() {
    const grid = document.getElementById('sitesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const todayStr = getToday();
    const todayDate = new Date(todayStr);
    const searchVal = document.getElementById('searchBar') ? document.getElementById('searchBar').value.toLowerCase().trim() : '';

    const limitState = window.clientDisplayLimit || 'last_week';
    let filteredSites = [];

    allSites.forEach(s => {
        // Search filter: null-safe field access — also searches bookings (name, phone)
        if (searchVal) {
            const m1 = (s.aSitename || '').toLowerCase().includes(searchVal);
            const m2 = (s.aPlaceName || '').toLowerCase().includes(searchVal);
            const m3 = (s.aTeamName || '').toLowerCase().includes(searchVal);
            const siteBookings = allBookings.filter(b => b.siteId === s.id);
            const m4 = siteBookings.some(b =>
                (b.uName || '').toLowerCase().includes(searchVal) ||
                (b.uPhone || '').includes(searchVal) ||
                (b.uPhone2 || '').includes(searchVal)
            );
            if (!m1 && !m2 && !m3 && !m4) return; // skip non-matching
        }
        const siteDate = new Date(s.aDate);
        const daysDiff = Math.floor((todayDate - siteDate) / (1000 * 3600 * 24));

        // When searching, bypass date-limit — show ALL matching events
        if (searchVal) {
            filteredSites.push(s);
            return;
        }

        if (daysDiff <= 0) {
            filteredSites.push(s);
        } else {
            if (limitState === 'last_week' && daysDiff <= 7) filteredSites.push(s);
            else if (limitState === 'current_month' && daysDiff <= 31) filteredSites.push(s);
            else if (limitState === 'all') filteredSites.push(s);
        }
    });

    const grouped = {};
    filteredSites.forEach(s => {
        const cat = getCategorizedLabel(s.aDate);
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(s);
    });

    Object.keys(grouped).forEach(cat => {
        const header = document.createElement('div');
        header.className = 'date-section-header';
        header.innerHTML = cat;
        grid.appendChild(header);

        const wrap = document.createElement('div');
        wrap.className = 'sites-grid';

        grouped[cat].forEach(site => {
            const bookings = allBookings.filter(b => b.siteId === site.id);
            const isFull = site.aSlots ? bookings.length >= site.aSlots : false; // unlimited = never full
            const isClosed = site.aDate < todayStr;
            let banner = isClosed ? '<div class="full-banner" style="background:#000">CLOSED</div>' : (isFull ? '<div class="full-banner">FULL</div>' : '');
            const teamBadge = site.aTeamName ? `<div style="margin-top:6px;"><span style="background:#f1f2f6; color:#333; padding:3px 8px; border-radius:4px; font-size:0.75rem; display:inline-block; font-weight:600;">Team: ${site.aTeamName}</span></div>` : '';
            // Site-card: just show image, no map link (clicking card opens drawer)
            const mediaHTML = renderMedia(site.aImg);

            const card = document.createElement('div');
            card.className = 'site-card';
            card.innerHTML = `
                <div class="media-container">${mediaHTML}${banner}</div>
                <div class="card-body">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:1.1rem;">${site.aSitename}</h3>
                        <span class="wage-badge" style="background:var(--primary); color:white; padding:4px 8px; border-radius:6px; font-size:0.8rem;">₹${site.aWage}</span>
                    </div>
                    ${teamBadge}
                    <div style="margin-top:10px; font-size:0.85rem; color:#666; display:flex; flex-direction:column; gap:4px;">
                        <div>📍 <strong>${site.aPlaceName}</strong></div>
                        <div>🗓️ ${formatDisplayDate(site.aDate)} | ⏰ ${site.aTime}</div>
                    </div>
                </div>`;
            card.onclick = () => window.openDrawer(site.id);
            wrap.appendChild(card);
        });
        grid.appendChild(wrap);
    });

    const hasMoreBeyondLastWeek = allSites.some(s => Math.floor((todayDate - new Date(s.aDate)) / (1000 * 3600 * 24)) > 7);
    const hasMoreBeyondMonth = allSites.some(s => Math.floor((todayDate - new Date(s.aDate)) / (1000 * 3600 * 24)) > 31);

    if (limitState === 'last_week' && hasMoreBeyondLastWeek) {
        const btn = document.createElement('button');
        btn.innerText = "Show More (Current Month)";
        btn.onclick = () => { window.clientDisplayLimit = 'current_month'; renderClient(); };
        btn.style.cssText = "display:block; width:100%; max-width:300px; margin:30px auto; padding:12px; background:#fff; color:var(--primary); border:1px solid var(--primary); border-radius:50px; font-weight:bold; cursor:pointer;";
        grid.appendChild(btn);
    } else if (limitState === 'current_month' && hasMoreBeyondMonth) {
        const btn = document.createElement('button');
        btn.innerText = "Load More (All Past Events)";
        btn.onclick = () => { window.clientDisplayLimit = 'all'; renderClient(); };
        btn.style.cssText = "display:block; width:100%; max-width:300px; margin:30px auto; padding:12px; background:#fff; color:var(--primary); border:1px solid var(--primary); border-radius:50px; font-weight:bold; cursor:pointer;";
        grid.appendChild(btn);
    }
}

// --- ADMIN RENDERING ---
window.filterAdminSites = () => renderAdmin();

function renderAdmin() {
    const container = document.getElementById('masterViewContainer');
    if (!container) return;
    container.innerHTML = '';

    const searchVal = document.getElementById('adminSearchBar') ? document.getElementById('adminSearchBar').value.toLowerCase().trim() : '';

    const grouped = {};
    const todayStr = getToday();

    allSites.forEach(s => {
        const bookings = allBookings.filter(b => b.siteId === s.id);
        if (searchVal) {
            const mSite = (s.aSitename || '').toLowerCase().includes(searchVal)
                || (s.aPlaceName || '').toLowerCase().includes(searchVal)
                || (s.aTeamName || '').toLowerCase().includes(searchVal);
            const mBooking = bookings.some(b =>
                (b.uName || '').toLowerCase().includes(searchVal) ||
                (b.uPhone || '').includes(searchVal) ||
                (b.uPhone2 || '').includes(searchVal) ||
                (b.uPlace || '').toLowerCase().includes(searchVal)
            );
            if (!mSite && !mBooking) return; // skip
        }

        const cat = getCategorizedLabel(s.aDate);
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(s);
    });

    Object.keys(grouped).forEach(cat => {
        const header = document.createElement('div');
        header.className = 'date-section-header';
        header.style.margin = "25px 0 10px 0";
        header.innerHTML = cat;
        container.appendChild(header);

        grouped[cat].forEach(s => {
            const bookings = allBookings.filter(b => b.siteId === s.id);
            const card = document.createElement('div');
            card.className = 'glass-card admin-card';
            card.style.marginBottom = "20px";
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap;">
                    <div>
                        <h3 style="margin:0;">${s.aSitename} (${bookings.length}/${s.aSlots ? s.aSlots : '∞'})</h3>
                        <small>📅 ${formatDisplayDate(s.aDate)}</small>
                    </div>
                    <div>
                        <button onclick="window.manualAddUser('${s.id}')" style="background:var(--success); color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; margin-right:5px; font-weight:bold;">+ Add User</button>
                        <button onclick="startEdit('${s.id}')">Edit</button>
                        <button onclick="deleteSite('${s.id}')" style="color:red">Del</button>
                    </div>
                </div>
                <div style="overflow-x:auto; border:1px solid #eee; border-radius:8px;">
                    <table style="width:100%; min-width:680px; border-collapse:collapse;">
                        <thead style="background:#f4f4f4;">
                            <tr>
                                <th style="padding:10px; text-align:left;">Staff</th>
                                <th style="padding:10px; text-align:left;">Place</th>
                                <th style="padding:10px; text-align:center;">Att.</th>
                                <th style="padding:10px; text-align:center;">Paid</th>
                                <th style="padding:10px;">Notes/Fines</th>
                                <th style="padding:10px; text-align:center;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bookings.map(b => {
                const isEditing = window.editingRowId === b.id;
                if (isEditing) {
                    const draft = window.editDraft;
                    return `
                                    <tr style="border-bottom:1px solid #eee; background:#f9fbfe;">
                                        <td style="padding:8px; min-width:160px;">
                                            <input type="text" value="${draft.uName || ''}" placeholder="Name" oninput="window.editDraft.uName=this.value" style="width:100%; border:1px solid #0984e3; border-radius:4px; padding:4px 6px; font-size:0.85rem; margin-bottom:4px;">
                                            <input type="tel" value="${draft.uPhone || ''}" placeholder="Phone" oninput="window.editDraft.uPhone=this.value" style="width:100%; border:1px solid #0984e3; border-radius:4px; padding:4px 6px; font-size:0.8rem; margin-bottom:2px;">
                                            <input type="tel" value="${draft.uPhone2 || ''}" placeholder="Alt No" oninput="window.editDraft.uPhone2=this.value" style="width:100%; border:1px solid #0984e3; border-radius:4px; padding:4px 6px; font-size:0.78rem;">
                                        </td>
                                        <td style="padding:8px; min-width:110px;">
                                            <input type="text" value="${draft.uPlace || ''}" placeholder="Place" oninput="window.editDraft.uPlace=this.value" style="width:100%; border:1px solid #0984e3; border-radius:4px; padding:4px 6px; font-size:0.85rem;">
                                        </td>
                                        <td style="padding:8px; text-align:center;">
                                            <input type="checkbox" ${draft.attendance ? 'checked' : ''} onchange="window.editDraft.attendance=this.checked" style="transform:scale(1.2);">
                                        </td>
                                        <td style="padding:8px; text-align:center;">
                                            <input type="checkbox" ${draft.paid ? 'checked' : ''} onchange="window.editDraft.paid=this.checked" style="transform:scale(1.2);">
                                        </td>
                                        <td style="padding:8px; min-width:130px;">
                                            <input type="text" value="${draft.notes || ''}" placeholder="Fine/Note" oninput="window.editDraft.notes=this.value" style="width:100%; border:1px solid #0984e3; border-radius:4px; padding:4px 6px; font-size:0.85rem;">
                                        </td>
                                        <td style="padding:8px; text-align:center; min-width:80px;">
                                            <button onclick="window.saveRowEdit()" style="background:#00b894; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-weight:bold; margin-bottom:6px; width:100%; font-size:0.8rem;">Save</button>
                                            <button onclick="window.cancelRowEdit()" style="background:#eee; color:#333; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; width:100%; font-size:0.8rem;">Cancel</button>
                                        </td>
                                    </tr>`;
                } else {
                    return `
                                    <tr style="border-bottom:1px solid #eee;">
                                        <td style="padding:10px;">
                                            <strong style="color:var(--text);">${b.uName || 'Unknown'}</strong><br>
                                            <small style="color:#555;">${b.uPhone || '-'}</small>
                                            ${b.uPhone2 ? `<br><small style="color:gray;">Alt: ${b.uPhone2}</small>` : ''}
                                        </td>
                                        <td style="padding:10px; font-size:0.9rem;">${b.uPlace || '-'}</td>
                                        <td style="padding:10px; text-align:center;">
                                            <input type="checkbox" disabled ${b.attendance ? 'checked' : ''}>
                                        </td>
                                        <td style="padding:10px; text-align:center;">
                                            <input type="checkbox" disabled ${b.paid ? 'checked' : ''}>
                                        </td>
                                        <td style="padding:10px; font-size:0.85rem; color:#444;">${b.notes ? b.notes : '<span style="color:#ccc;">-</span>'}</td>
                                        <td style="padding:8px; text-align:center; min-width:80px;">
                                            <button onclick="window.startRowEdit('${b.id}')" style="background:var(--primary); color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; margin-bottom:8px; font-size:0.8rem; width:100%;">Edit</button>
                                            <span style="color:red; cursor:pointer; font-size:0.8rem; font-weight:600; display:block;" onclick="deleteBooking('${b.id}')">Remove</span>
                                        </td>
                                    </tr>`;
                }
            }).join('')}
                        </tbody>
                    </table>
                </div>
                <button onclick="window.copyStaffList('${s.id}', '${(s.aSitename || '').replace(/'/g, "\\'")}')"
                    style="margin-top:12px; background:#f1f2f6; color:#333; border:1px solid #ddd; padding:8px 18px; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.85rem; display:flex; align-items:center; gap:6px;">
                    📋 Copy Staff List
                </button>`;
            container.appendChild(card);
        });
    });
}

// --- GLOBAL ACCESSORS ---
window.startRowEdit = (id) => {
    const b = allBookings.find(x => x.id === id);
    if (!b) return;
    window.editingRowId = id;
    window.editDraft = { uName: b.uName, uPhone: b.uPhone, uPhone2: b.uPhone2, uPlace: b.uPlace, paid: !!b.paid, notes: b.notes, attendance: !!b.attendance };
    renderAdmin();
};

window.cancelRowEdit = () => {
    window.editingRowId = null;
    window.editDraft = null;
    renderAdmin();
};

window.saveRowEdit = async () => {
    if (!window.editingRowId) return;
    const id = window.editingRowId;
    const data = window.editDraft;
    window.editingRowId = null;
    window.editDraft = null;
    await window.updateBooking(id, data);
};

window.copyStaffList = (siteId, siteName) => {
    const bookings = allBookings.filter(b => b.siteId === siteId);
    if (!bookings.length) { alert('No staff booked yet.'); return; }
    const col1 = 'Name';
    const col2 = 'WhatsApp No';
    const col3 = 'Alt No';
    const sep = ' | ';
    const divider = '-'.repeat(60);
    const header = `${col1.padEnd(20)}${sep}${col2.padEnd(15)}${sep}${col3}`;
    const rows = bookings.map((b, i) => {
        const name = (b.uName || 'Unknown').padEnd(20);
        const phone = (b.uPhone || '-').padEnd(15);
        const phone2 = b.uPhone2 || '-';
        return `${i + 1}. ${name}${sep}${phone}${sep}${phone2}`;
    }).join('\n');
    const text = `📋 Staff List — ${siteName}\n${divider}\n${header}\n${divider}\n${rows}\n${divider}\nTotal: ${bookings.length} staff`;
    navigator.clipboard.writeText(text).then(() => alert('✅ Staff list copied!')).catch(() => {
        // fallback for older browsers
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alert('✅ Staff list copied!');
    });
};

window.checkPin = () => {
    const pin = document.getElementById('pinInput').value;
    if (pin === "rinshan2026") {
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('adminMain').style.display = 'block';
        renderAdmin();
    } else { alert("Wrong PIN"); }
};

window.openReg = (id) => { window.currentSiteId = id; document.getElementById('regPopup').style.display = 'flex'; };
window.updateBooking = async (id, data) => await updateDoc(doc(db, "bookings", id), data);
window.deleteBooking = async (id) => { if (confirm("Remove?")) await deleteDoc(doc(db, "bookings", id)); };
window.deleteSite = async (id) => { if (confirm("Delete Site?")) await deleteDoc(doc(db, "sites", id)); };
window.cancelBooking = async (id, phone) => { if (prompt("Enter WhatsApp number to confirm:") === phone) await deleteDoc(doc(db, "bookings", id)); };

window.manualAddUser = async (siteId) => {
    const name = prompt("Enter Staff Name:");
    if (!name) return;
    const phone = prompt("Enter Contact Number:");
    if (!phone) return;
    const place = prompt("Enter Place/Location:");
    if (!place) return;
    await addDoc(collection(db, "bookings"), {
        siteId: siteId, uName: name, uPhone: phone, uPhone2: "", uPlace: place, paid: false, notes: "Added by Admin"
    });
};

window.publishSite = async () => {
    const data = {
        aSitename: document.getElementById('aSitename').value,
        aDate: document.getElementById('aDate').value,
        aPlaceName: document.getElementById('aPlaceName').value,
        aWage: document.getElementById('aWage').value,
        aSlots: document.getElementById('aSlots').value ? parseInt(document.getElementById('aSlots').value) : null,
        aTime: document.getElementById('aTime').value,
        aGuests: document.getElementById('aGuests').value || '',
        aMapLink: document.getElementById('aMapLink').value,
        aImg: document.getElementById('aImg').value,
        aTeamName: document.getElementById('aTeamName') ? document.getElementById('aTeamName').value : '',
        aReq: document.getElementById('aReq') ? document.getElementById('aReq').value : '',
        aNotes: document.getElementById('aNotes') ? document.getElementById('aNotes').value : ''
    };
    const id = document.getElementById('editId').value;
    if (id) await updateDoc(doc(db, "sites", id), data);
    else await addDoc(collection(db, "sites"), data);

    // Clear form without reload
    document.getElementById('editId').value = "";
    document.querySelectorAll('.stunning-input').forEach(i => i.value = "");
    if (document.getElementById('aReq')) document.getElementById('aReq').value = "";
    if (document.getElementById('aNotes')) document.getElementById('aNotes').value = "";
    document.getElementById('submitBtn').innerText = "Publish Site";
    alert("Saved Successfully!");
};

window.startEdit = (id) => {
    const s = allSites.find(x => x.id === id);
    document.getElementById('editId').value = s.id;
    document.getElementById('aSitename').value = s.aSitename;
    document.getElementById('aDate').value = s.aDate;
    document.getElementById('aPlaceName').value = s.aPlaceName;
    document.getElementById('aWage').value = s.aWage;
    document.getElementById('aSlots').value = s.aSlots;
    document.getElementById('aTime').value = s.aTime;
    document.getElementById('aGuests').value = s.aGuests;
    document.getElementById('aMapLink').value = s.aMapLink;
    document.getElementById('aImg').value = s.aImg;
    if (document.getElementById('aTeamName')) document.getElementById('aTeamName').value = s.aTeamName || '';
    if (document.getElementById('aReq')) document.getElementById('aReq').value = s.aReq || '';
    if (document.getElementById('aNotes')) document.getElementById('aNotes').value = s.aNotes || '';
    document.getElementById('submitBtn').innerText = "Update Site";
    window.scrollTo(0, 0);
};
