// Profile Page JavaScript
import { app } from './firebase.js';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("User authenticated:", user.email);
            await loadUserProfile(user);
            await loadReceiptHistory(user.uid);
            initializeTabNavigation();
            initializeEventListeners();
        } else {
            console.log("No user logged in, redirecting to auth page");
            window.location.href = 'auth.html';
        }
    });
});

/**
 * Load user profile from Firestore
 */
async function loadUserProfile(user) {
    try {
        // Get user data from Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        let userData = {
            name: user.displayName || 'User',
            email: user.email,
            company: '',
            createdAt: user.createdAt || new Date(),
        };

        if (userSnap.exists()) {
            userData = { ...userData, ...userSnap.data() };
        }

        // Update UI with user data
        const nameParts = userData.name.split(' ');
        const initial = nameParts[0]?.charAt(0).toUpperCase() || 'U';
        
        document.getElementById('profile-name').textContent = userData.name;
        document.getElementById('profile-email').textContent = userData.email;
        document.getElementById('profile-company').textContent = userData.company || 'Not specified';
        document.getElementById('avatar-initial').textContent = initial;
        document.getElementById('avatar-large').textContent = initial;

        // Calculate stats
        await calculateUserStats(user.uid);

        // Format member since date
        if (userData.createdAt) {
            const date = new Date(userData.createdAt);
            document.getElementById('stat-member-since').textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }

        // Populate edit form
        document.getElementById('edit-name').value = userData.name;
        document.getElementById('edit-company').value = userData.company || '';
        document.getElementById('edit-phone').value = userData.phone || '';
        document.getElementById('edit-address').value = userData.address || '';

    } catch (error) {
        console.error('Error loading user profile:', error);
        alert('Error loading profile. Please try again.');
    }
}

/**
 * Calculate and display user statistics
 */
async function calculateUserStats(userId) {
    try {
        // Get receipts collection for this user
        const receiptsRef = collection(db, 'receipts');
        const q = query(receiptsRef, where('userId', '==', userId));
        const receiptsSnap = await getDocs(q);

        let totalAmount = 0;
        receiptsSnap.forEach((doc) => {
            const data = doc.data();
            if (data.amount) {
                totalAmount += parseFloat(data.amount) || 0;
            }
        });

        document.getElementById('stat-receipts').textContent = receiptsSnap.size;
        document.getElementById('stat-total-amount').textContent = `$${totalAmount.toFixed(2)}`;

    } catch (error) {
        console.error('Error calculating stats:', error);
    }
}

/**
 * Load receipt history
 */
async function loadReceiptHistory(userId) {
    try {
        const receiptsRef = collection(db, 'receipts');
        const q = query(
            receiptsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const receiptsSnap = await getDocs(q);
        const receipts = [];

        receiptsSnap.forEach((doc) => {
            receipts.push({
                id: doc.id,
                ...doc.data()
            });
        });

        displayReceiptHistory(receipts);
    } catch (error) {
        console.error('Error loading receipt history:', error);
        document.getElementById('history-list').innerHTML = `
            <div class="error-message">
                <p>Error loading history. Please try again.</p>
            </div>
        `;
    }
}

/**
 * Display receipt history in the UI
 */
function displayReceiptHistory(receipts) {
    const historyList = document.getElementById('history-list');

    if (receipts.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <p>📭 No receipts found</p>
                <p>Start by <a href="upload.html">uploading a receipt</a></p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = receipts.map(receipt => `
        <div class="history-item ${receipt.status || 'completed'}">
            <div class="history-item-left">
                <div class="receipt-thumbnail">
                    ${receipt.imageUrl ? `<img src="${receipt.imageUrl}" alt="Receipt">` : '<span>📄</span>'}
                </div>
                <div class="receipt-info">
                    <h4>${receipt.vendor || 'Unknown Vendor'}</h4>
                    <p class="receipt-meta">
                        Amount: <strong>$${(receipt.amount || 0).toFixed(2)}</strong> • 
                        Date: <strong>${formatDate(receipt.date || receipt.createdAt)}</strong>
                    </p>
                    <p class="receipt-category">${receipt.category || 'Uncategorized'}</p>
                </div>
            </div>
            <div class="history-item-right">
                <span class="status-badge ${receipt.status || 'completed'}">${receipt.status || 'Completed'}</span>
                <button class="btn-icon" onclick="viewReceiptDetails('${receipt.id}')">View</button>
            </div>
        </div>
    `).join('');

    // Add event listeners for filtering
    setupHistoryFilters(receipts);
}

/**
 * Setup history filters
 */
function setupHistoryFilters(receipts) {
    const searchInput = document.getElementById('history-search');
    const filterSelect = document.getElementById('history-filter');

    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const statusFilter = filterSelect.value;

        const filtered = receipts.filter(receipt => {
            const matchesSearch = !searchTerm || (receipt.vendor?.toLowerCase() || '').includes(searchTerm);
            const matchesStatus = !statusFilter || (receipt.status || 'completed') === statusFilter;
            return matchesSearch && matchesStatus;
        });

        displayReceiptHistory(filtered);
    };

    searchInput.addEventListener('input', applyFilters);
    filterSelect.addEventListener('change', applyFilters);
}

/**
 * Format date for display
 */
function formatDate(dateInput) {
    if (!dateInput) return 'N/A';
    
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

/**
 * Initialize tab navigation
 */
function initializeTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    const editForm = document.getElementById('edit-profile-form');
    if (editForm) {
        editForm.addEventListener('submit', handleSaveProfile);
    }
}

/**
 * Edit profile modal functions
 */
function editProfile() {
    document.getElementById('edit-profile-modal').style.display = 'block';
}

function closeEditProfile() {
    document.getElementById('edit-profile-modal').style.display = 'none';
}

/**
 * Save profile changes
 */
async function handleSaveProfile(e) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return;

    try {
        const updatedData = {
            name: document.getElementById('edit-name').value,
            company: document.getElementById('edit-company').value,
            phone: document.getElementById('edit-phone').value,
            address: document.getElementById('edit-address').value,
            updatedAt: new Date(),
        };

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, updatedData);

        alert('Profile updated successfully!');
        closeEditProfile();
        await loadUserProfile(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile. Please try again.');
    }
}

/**
 * View receipt details
 */
function viewReceiptDetails(receiptId) {
    console.log('Viewing receipt:', receiptId);
    // This will redirect to a detail page or open a modal
    // For now, just log it
    alert(`Receipt details for ${receiptId} (to be implemented)`);
}

/**
 * Toggle user menu dropdown
 */
window.toggleUserMenu = function() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
};

/**
 * Settings functions
 */
window.enable2FA = function() {
    alert('Two-factor authentication setup coming soon!');
};

window.downloadData = function() {
    alert('Data download feature coming soon!');
};

window.upgradePlan = function() {
    alert('Upgrade plan feature coming soon!');
};

window.addPaymentMethod = function() {
    alert('Add payment method coming soon!');
};

/**
 * Sign out function
 */
window.signOut = async function() {
    try {
        await firebaseSignOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('user-dropdown');
    const userMenu = document.querySelector('.user-menu');
    if (!userMenu?.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});
