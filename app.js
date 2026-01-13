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
    if (diff <= 0) return "Upcoming & Today";
    if (diff === 1) return "Yesterday";
    return formatDisplayDate(dateStr); 
};

const isValidPhone = (p) => /^(?:\+91|91)?[6-9]\d{9}$/.test(p.replace(/\s/g, ""));

const renderMedia = (url) => {
    if (!url) return `<img src="https://via.placeholder.com/400x200?text=NearMe">`;
    if (url.includes("googleusercontent.com") || url.includes("maps.google.com") || url.includes("<iframe")) {
        let src = url;
        if (url.includes("<iframe")) {
            const match = url.match(/src="([^"]+)"/);
            src = match ? match[1] : '';
        }
        return `<iframe src="${src}" style="border:0; width:100%; height:100%;" allowfullscreen="" loading="lazy"></iframe>`;
    }
    return `<img src="${url}" style="width:100%; height:100%; object-fit:cover;">`;
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
            const place = document.getElementById('uPlace').value.trim();

            if(!name || !phone || !place) return alert("All fields are required!");
            if(!isValidPhone(phone)) return alert("Invalid WhatsApp number! Enter 10 digits.");

            await addDoc(collection(db, "bookings"), { 
                siteId: window.currentSiteId, uName: name, uPhone: phone, uPlace: place, paid: false, notes: "" 
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
    for (let i = 0; i < s.aSlots; i++) {
        const b = bookings[i];
        let actionContent = b ? 
            `<div style="text-align:right">
                <small>${b.uPhone.slice(0,4)}***${b.uPhone.slice(-2)}</small><br>
                ${!isClosed ? `<span style="color:red; cursor:pointer; font-size:0.7rem;" onclick="cancelBooking('${b.id}','${b.uPhone}')">Cancel</span>` : ''}
            </div>` :
            (isClosed ? `<span style="color:gray; font-size:0.8rem;">Closed</span>` : 
            `<button onclick="window.openReg('${id}')" style="background:var(--primary); color:white; border:none; padding:6px 15px; border-radius:6px; cursor:pointer;">Book</button>`);

        slotsHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee;">
                <div><strong>#${i+1}</strong> ${b ? b.uName : 'Available'}</div>
                ${actionContent}
            </div>`;
    }

    const drawerBody = document.getElementById('drawerBody');
    if(drawerBody) {
        drawerBody.innerHTML = `
            <div class="media-container" style="border-radius:15px; margin-bottom:15px; height:180px;">${renderMedia(s.aImg)}</div>
            
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <h2 style="margin:0; font-size:1.4rem;">${s.aSitename}</h2>
                ${s.aMapLink ? `<a href="${s.aMapLink}" target="_blank" style="text-decoration:none; background:#4285F4; color:white; padding:6px 12px; border-radius:8px; font-size:0.8rem; display:flex; align-items:center; gap:5px;">📍 Directions</a>` : ''}
            </div>

            <p style="color:var(--primary); font-weight:700; margin:8px 0;">📍 ${s.aPlaceName}</p>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:15px 0;">
                <div style="background:#f8f9fa; padding:10px; border-radius:10px;"><small style="color:#666">Wage</small><div style="font-weight:700">₹${s.aWage}</div></div>
                <div style="background:#f8f9fa; padding:10px; border-radius:10px;"><small style="color:#666">Time</small><div style="font-weight:700">${s.aTime}</div></div>
                ${s.aGuests ? `<div style="background:#f8f9fa; padding:10px; border-radius:10px;"><small style="color:#666">Guest Count</small><div style="font-weight:700">👥 ${s.aGuests}</div></div>` : ''}
                <div style="background:#f8f9fa; padding:10px; border-radius:10px;"><small style="color:#666">Status</small><div style="font-weight:700">${isClosed ? 'CLOSED' : `${bookings.length}/${s.aSlots} Slots`}</div></div>
            </div>
            
            <div style="background:#fff9e6; border-left:4px solid #ffcc00; padding:10px; margin-bottom:15px; border-radius:4px;">
                <strong style="font-size:0.85rem;">Requirements:</strong><br>
                <span style="font-size:0.9rem;">${s.aReq || 'Standard uniform required.'}</span>
            </div>

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
function renderClient() {
    const grid = document.getElementById('sitesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const grouped = {};
    const todayStr = getToday();

    allSites.forEach(s => {
        const cat = getCategorizedLabel(s.aDate);
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(s);
    });

    Object.keys(grouped).forEach(cat => {
        const header = document.createElement('div');
        header.className = 'date-section-header';
        header.innerText = cat;
        grid.appendChild(header);

        const wrap = document.createElement('div');
        wrap.className = 'sites-grid';
        
        grouped[cat].forEach(site => {
            const bookings = allBookings.filter(b => b.siteId === site.id);
            const isFull = bookings.length >= site.aSlots;
            const isClosed = site.aDate < todayStr;
            let banner = isClosed ? '<div class="full-banner" style="background:#000">CLOSED</div>' : (isFull ? '<div class="full-banner">FULL</div>' : '');

            const card = document.createElement('div');
            card.className = 'site-card';
            card.innerHTML = `
                <div class="media-container">${renderMedia(site.aImg)}${banner}</div>
                <div class="card-body">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:1.1rem;">${site.aSitename}</h3>
                        <span class="wage-badge" style="background:var(--primary); color:white; padding:4px 8px; border-radius:6px; font-size:0.8rem;">₹${site.aWage}</span>
                    </div>
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
}

// --- ADMIN RENDERING ---
function renderAdmin() {
    const container = document.getElementById('masterViewContainer');
    if (!container) return;
    container.innerHTML = '';
    
    const grouped = {};
    const todayStr = getToday();

    allSites.forEach(s => {
        const cat = getCategorizedLabel(s.aDate);
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(s);
    });

    Object.keys(grouped).forEach(cat => {
        const header = document.createElement('div');
        header.className = 'date-section-header';
        header.style.margin = "25px 0 10px 0";
        header.innerText = cat;
        container.appendChild(header);

        grouped[cat].forEach(s => {
            const bookings = allBookings.filter(b => b.siteId === s.id);
            const card = document.createElement('div');
            card.className = 'glass-card admin-card';
            card.style.marginBottom = "20px";
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap;">
                    <div>
                        <h3 style="margin:0;">${s.aSitename} (${bookings.length}/${s.aSlots})</h3>
                        <small>📅 ${formatDisplayDate(s.aDate)}</small>
                    </div>
                    <div>
                        <button onclick="startEdit('${s.id}')">Edit</button>
                        <button onclick="deleteSite('${s.id}')" style="color:red">Del</button>
                    </div>
                </div>
                <div style="overflow-x:auto; border:1px solid #eee; border-radius:8px;">
                    <table style="width:100%; min-width:600px; border-collapse:collapse;">
                        <thead style="background:#f4f4f4;">
                            <tr>
                                <th style="padding:10px; text-align:left;">Staff</th>
                                <th style="padding:10px; text-align:center;">Paid</th>
                                <th style="padding:10px;">Notes/Fines</th>
                                <th style="padding:10px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bookings.map(b => `
                                <tr style="border-bottom:1px solid #eee;">
                                    <td style="padding:10px;">${b.uName}<br><small>${b.uPhone}</small></td>
                                    <td style="padding:10px; text-align:center;">
                                        <input type="checkbox" ${b.paid ? 'checked' : ''} onchange="window.updateBooking('${b.id}', {paid: this.checked})">
                                    </td>
                                    <td style="padding:10px;">
                                        <input type="text" value="${b.notes || ''}" placeholder="Fine/Note" onchange="window.updateBooking('${b.id}', {notes: this.value})" style="width:100%;">
                                    </td>
                                    <td style="padding:10px; color:red; cursor:pointer; text-align:center;" onclick="deleteBooking('${b.id}')">Remove</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>`;
            container.appendChild(card);
        });
    });
}

// --- GLOBAL ACCESSORS ---
window.checkPin = () => { 
    const pin = document.getElementById('pinInput').value;
    if(pin === "rinshan2026") { 
        document.getElementById('authOverlay').style.display = 'none'; 
        document.getElementById('adminMain').style.display = 'block'; 
        renderAdmin();
    } else { alert("Wrong PIN"); }
};

window.openReg = (id) => { window.currentSiteId = id; document.getElementById('regPopup').style.display = 'flex'; };
window.updateBooking = async (id, data) => await updateDoc(doc(db, "bookings", id), data);
window.deleteBooking = async (id) => { if(confirm("Remove?")) await deleteDoc(doc(db, "bookings", id)); };
window.deleteSite = async (id) => { if(confirm("Delete Site?")) await deleteDoc(doc(db, "sites", id)); };
window.cancelBooking = async (id, phone) => { if(prompt("Enter WhatsApp number to confirm:") === phone) await deleteDoc(doc(db, "bookings", id)); };

window.publishSite = async () => {
    const data = {
        aSitename: document.getElementById('aSitename').value,
        aDate: document.getElementById('aDate').value,
        aPlaceName: document.getElementById('aPlaceName').value,
        aWage: document.getElementById('aWage').value,
        aSlots: parseInt(document.getElementById('aSlots').value),
        aTime: document.getElementById('aTime').value,
        aGuests: document.getElementById('aGuests').value,
        aMapLink: document.getElementById('aMapLink').value,
        aImg: document.getElementById('aImg').value,
        aReq: document.getElementById('aReq').value
    };
    const id = document.getElementById('editId').value;
    if(id) await updateDoc(doc(db, "sites", id), data);
    else await addDoc(collection(db, "sites"), data);
    
    // Clear form without reload
    document.getElementById('editId').value = "";
    document.querySelectorAll('.admin-input-group input, .admin-input-group textarea').forEach(i => i.value = "");
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
    document.getElementById('aReq').value = s.aReq;
    document.getElementById('submitBtn').innerText = "Update Site";
    window.scrollTo(0,0);
};