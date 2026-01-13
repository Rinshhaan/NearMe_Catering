import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Firebase Configuration ---
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

// --- 1. DATA SYNC (Sorted by Date) ---
// This ensures that the event happening soonest appears first
onSnapshot(query(collection(db, "sites"), orderBy("aDate", "asc")), (snap) => {
    allSites = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateUI();
});

onSnapshot(collection(db, "bookings"), (snap) => {
    allBookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateUI();
});

function updateUI() {
    if (document.getElementById('sitesGrid')) renderClientGrid();
    if (document.getElementById('masterViewContainer')) renderAdminMasterView();
}

// --- 2. CLIENT SIDE: RENDER GRID & DRAWER ---
function renderClientGrid() {
    const grid = document.getElementById('sitesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    allSites.forEach(site => {
        const bookings = allBookings.filter(b => b.siteId === site.id);
        const isFull = bookings.length >= site.aSlots;

        const card = document.createElement('div');
        card.className = 'site-card';
        card.onclick = () => window.openDrawer(site.id);
        card.innerHTML = `
            <div class="site-img-container">
                <img src="${site.aImg || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500'}">
                ${isFull ? '<div class="full-banner">SITE FULL</div>' : ''}
            </div>
            <div class="card-body">
                <span class="wage-badge">₹${site.aWage}</span>
                <h3 style="margin:10px 0 5px 0">${site.aSitename}</h3>
                <p style="color:#636e72; font-size:0.9rem; margin:0;">
                    <i class="fas fa-calendar-alt"></i> ${site.aDate} | 
                    <i class="fas fa-map-marker-alt"></i> ${site.aPlace}
                </p>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.openDrawer = (id) => {
    const s = allSites.find(site => site.id === id);
    const bookings = allBookings.filter(b => b.siteId === id);
    const drawer = document.getElementById('siteDrawer');
    const body = document.getElementById('drawerBody');

    let slotsHTML = '';
    for (let i = 0; i < s.aSlots; i++) {
        const b = bookings[i];
        slotsHTML += `
            <div class="slot-row">
                <span>Slot ${i + 1}</span>
                ${b ? `
                    <div style="text-align:right">
                        <span style="font-weight:700;">${b.uName}</span><br>
                        <small onclick="cancelMyBooking('${b.id}', '${b.uPhone}')" style="color:#d63031; cursor:pointer;">Not interested? Cancel Slot</small>
                    </div>
                ` : `
                    <button onclick="window.openReg('${id}')" style="background:var(--primary); color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer;">Book Now</button>
                `}
            </div>
        `;
    }

    body.innerHTML = `
        <img src="${s.aImg}" style="width:100%; height:180px; object-fit:cover; border-radius:15px; margin-bottom:15px;">
        <h2 style="margin:0">${s.aSitename}</h2>
        <a href="${s.aMap}" target="_blank" style="color:var(--primary); text-decoration:none; display:block; margin:5px 0 20px 0; font-weight:600; font-size:0.9rem;">View Location <i class="fas fa-external-link-alt"></i></a>
        
        <div class="detail-group">
            <span class="detail-label">Wage</span><div class="detail-value">₹${s.aWage}</div>
            <span class="detail-label">Place</span><div class="detail-value">${s.aPlace}</div>
            <span class="detail-label">Report Time</span><div class="detail-value">${s.aTime}</div>
            <span class="detail-label">Requirements</span><div class="detail-value">${s.aReq}</div>
        </div>
        
        <h3 style="margin-top:25px; border-top:1px solid #eee; padding-top:20px;">Staff List</h3>
        ${slotsHTML}
        <div style="height:40px;"></div>
    `;
    drawer.classList.add('active');
};

// --- 3. ADMIN: PUBLISH & EDIT SITES ---
window.publishSite = async () => {
    const editId = document.getElementById('editId').value;
    const siteData = {
        aSitename: document.getElementById('aSitename').value,
        aPlace: document.getElementById('aPlace').value,
        aDate: document.getElementById('aDate').value,
        aMap: document.getElementById('aMap').value,
        aImg: document.getElementById('aImg').value || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500',
        aWage: document.getElementById('aWage').value,
        aSlots: parseInt(document.getElementById('aSlots').value) || 0,
        aTime: document.getElementById('aTime').value,
        aGuests: document.getElementById('aGuests').value,
        aReq: document.getElementById('aReq').value,
        updatedAt: serverTimestamp()
    };

    if (!siteData.aSitename || siteData.aSlots <= 0) return alert("Fill all fields!");

    try {
        if (editId) {
            await updateDoc(doc(db, "sites", editId), siteData);
            alert("Site Updated!");
        } else {
            await addDoc(collection(db, "sites"), { ...siteData, createdAt: serverTimestamp() });
            alert("New Site Published!");
        }
        window.cancelEdit();
    } catch (e) { alert("Error: " + e.message); }
};

// --- 4. ADMIN: MASTER VIEW (Site & Client Management) ---
function renderAdminMasterView() {
    const container = document.getElementById('masterViewContainer');
    if (!container) return;
    container.innerHTML = '';

    allSites.forEach(site => {
        const bookings = allBookings.filter(b => b.siteId === site.id);
        const div = document.createElement('div');
        div.className = 'glass-card';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #eee; padding-bottom:10px; margin-bottom:10px;">
                <h3 style="margin:0">${site.aSitename} (${bookings.length}/${site.aSlots})</h3>
                <div>
                    <button onclick="startEdit('${site.id}')" style="color:var(--primary); background:none; border:none; cursor:pointer;"><i class="fas fa-edit"></i> Edit Site</button>
                    <button onclick="deleteSite('${site.id}')" style="color:red; background:none; border:none; cursor:pointer; margin-left:15px;"><i class="fas fa-trash"></i> Delete Site</button>
                </div>
            </div>
            <table class="responsive-table">
                <thead><tr><th>Staff</th><th>Place</th><th>WhatsApp</th><th>Admin Action</th></tr></thead>
                <tbody>
                    ${bookings.map(b => `<tr>
                        <td data-label="Staff">${b.uName}</td>
                        <td data-label="Place">${b.uPlace}</td>
                        <td data-label="WhatsApp">${b.uPhone}</td>
                        <td>
                            <button onclick="deleteBooking('${b.id}')" style="color:red; border:none; background:none; cursor:pointer;" title="Remove Client">
                                <i class="fas fa-user-minus"></i> Remove
                            </button>
                        </td>
                    </tr>`).join('') || '<tr><td colspan="4" style="text-align:center; padding:20px;">No registrations.</td></tr>'}
                </tbody>
            </table>
        `;
        container.appendChild(div);
    });
}

// --- 5. GLOBAL HELPERS (Delete/Cancel/Security) ---

// Client self-cancellation with verification
window.cancelMyBooking = async (bookingId, originalPhone) => {
    const verify = prompt("To cancel, please enter the WhatsApp number used for this booking:");
    if (verify === originalPhone) {
        if (confirm("Confirm cancellation? This will free up the slot for others.")) {
            await deleteDoc(doc(db, "bookings", bookingId));
            alert("Slot freed successfully.");
            window.closeDrawer();
        }
    } else if (verify !== null) {
        alert("Verification failed. Number does not match.");
    }
};

window.checkPin = () => {
    const pin = document.getElementById('pinInput').value;
    if(pin === "rinshan2026") { 
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('adminMain').classList.add('unlocked');
    } else { alert("Unauthorized PIN."); }
};

window.startEdit = (id) => {
    const s = allSites.find(site => site.id === id);
    document.getElementById('editId').value = s.id;
    document.getElementById('aSitename').value = s.aSitename;
    document.getElementById('aPlace').value = s.aPlace;
    document.getElementById('aDate').value = s.aDate;
    document.getElementById('aWage').value = s.aWage;
    document.getElementById('aTime').value = s.aTime;
    document.getElementById('aSlots').value = s.aSlots;
    document.getElementById('aMap').value = s.aMap;
    document.getElementById('aImg').value = s.aImg;
    document.getElementById('aReq').value = s.aReq;
    document.getElementById('aGuests').value = s.aGuests;

    document.getElementById('submitBtn').innerText = "Update Site";
    document.getElementById('formTitle').innerText = "Edit Site: " + s.aSitename;
    document.getElementById('cancelBtn').style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.cancelEdit = () => {
    document.getElementById('editId').value = "";
    document.getElementById('submitBtn').innerText = "Publish Now";
    document.getElementById('cancelBtn').style.display = "none";
    document.getElementById('formTitle').innerText = "Create Site Opening";
    document.querySelectorAll('input, textarea').forEach(i => i.value = "");
};

window.deleteSite = async (id) => { if(confirm("Delete this site and all data?")) await deleteDoc(doc(db, "sites", id)); };
window.deleteBooking = async (id) => { if(confirm("Remove this client from the list?")) await deleteDoc(doc(db, "bookings", id)); };

window.openReg = (id) => {
    document.getElementById('regPopup').style.display = 'flex';
    document.getElementById('btnConfirm').onclick = async () => {
        const uName = document.getElementById('uName').value;
        const uPhone = document.getElementById('uPhone').value;
        const uPlace = document.getElementById('uPlace').value;

        if (!uName || !uPhone) return alert("Fill Name and Phone!");
        await addDoc(collection(db, "bookings"), { siteId: id, uName, uPhone, uPlace, bookedAt: serverTimestamp() });
        window.closeReg();
        alert("Booking Confirmed!");
    };
};

window.closeDrawer = () => document.getElementById('siteDrawer').classList.remove('active');
window.closeReg = () => document.getElementById('regPopup').style.display = 'none';

window.filterSites = () => {
    const val = document.getElementById('searchBar').value.toLowerCase();
    document.querySelectorAll('.site-card').forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(val) ? 'block' : 'none';
    });
};