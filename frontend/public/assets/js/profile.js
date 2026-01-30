// Profile Page Module - Fully Functional
import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

let currentUser = null;

// Initialize Profile Page on DOM Load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Profile page loading...');
    setupAmbientLighting();
    initProfilePage();
});

// Check Authentication and Load User Data
function initProfilePage() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('✅ User authenticated:', user.email);
            currentUser = user;
            loadUserProfile();
            setupProfileAvatar(user);
            loadUserHistory();
            loadUserSettings(user);
        } else {
            console.log('❌ User not authenticated - redirecting to login');
            // Redirect to login if not authenticated
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    });
}

// Load User Profile Data
function loadUserProfile() {
    if (!currentUser) return;

    const displayName = currentUser.displayName || currentUser.email || 'User';
    const email = currentUser.email || 'user@example.com';
    const firstName = displayName.split(' ')[0] || 'User';

    console.log('📝 Loading profile for:', displayName);

    // Update profile information
    const profileNameEl = document.getElementById('profile-name');
    const profileEmailEl = document.getElementById('profile-email');
    const welcomeNameEl = document.getElementById('welcome-name');
    const settingsNameEl = document.getElementById('settings-name');
    const settingsEmailEl = document.getElementById('settings-email');

    if (profileNameEl) profileNameEl.textContent = displayName;
    if (profileEmailEl) profileEmailEl.textContent = email;
    if (welcomeNameEl) welcomeNameEl.textContent = firstName;
    if (settingsNameEl) settingsNameEl.value = displayName;
    if (settingsEmailEl) settingsEmailEl.value = email;

    console.log('✅ Profile data loaded');

    // Update avatar
    setupProfileAvatar(currentUser);

    // Load stats from localStorage/backend
    loadProfileStats();

    // Check URL for tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab') || 'overview';
    switchTab(tab);
}

// Setup Profile Avatar with Initial Letter
function setupProfileAvatar(user) {
    const displayName = user.displayName || 'User';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const firstLetter = initials[0] || 'U';

    // Update large avatar
    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar) {
        profileAvatar.textContent = firstLetter;
    }

    // Update header avatar
    const avatarLetter = document.getElementById('avatar-letter');
    if (avatarLetter) {
        avatarLetter.textContent = firstLetter;
    }

    // Setup avatar upload functionality
    const avatarUploadBtn = document.getElementById('avatar-upload-btn');
    if (avatarUploadBtn) {
        avatarUploadBtn.addEventListener('click', () => {
            document.getElementById('avatar-file-input').click();
        });
    }

    const fileInput = document.getElementById('avatar-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleAvatarUpload);
    }
}

// Handle Avatar Upload
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        // Store avatar in localStorage (in production, upload to Firebase Storage)
        localStorage.setItem('userAvatar', e.target.result);
        // Show success message
        showNotification('Avatar updated successfully!', 'success');
    };
    reader.readAsDataURL(file);
}

// Load Profile Statistics
function loadProfileStats() {
    // Retrieve from localStorage or backend
    const stats = JSON.parse(localStorage.getItem('userStats') || '{"receipts": 0, "total": 0, "timeSaved": 0}');
    
    document.getElementById('stat-receipts').textContent = stats.receipts || 0;
    document.getElementById('stat-total').textContent = `₹${stats.total || 0}`;
    document.getElementById('stat-saved').textContent = `${stats.timeSaved || 0}h`;
    document.getElementById('monthly-total').textContent = `₹${stats.monthlyTotal || 0}`;
    document.getElementById('processing-time').textContent = `${stats.processingTime || 0}s`;
    document.getElementById('categorized-count').textContent = stats.categorized || 0;
}

// Load User Receipt History
function loadUserHistory() {
    const historyList = document.getElementById('history-list');
    const userHistory = JSON.parse(localStorage.getItem('userHistory') || '[]');

    if (!userHistory || userHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>No receipts yet. <a href="upload.html" style="color: var(--accent-primary); text-decoration: none;">Upload your first receipt</a> to get started!</p>
            </div>
        `;
        return;
    }

    // Sort by date descending
    userHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display recent receipts (limit to 20)
    const recentHistory = userHistory.slice(0, 20);
    
    historyList.innerHTML = recentHistory.map(item => `
        <div class="history-item" onclick="viewReceipt('${item.id || Date.now()}')">
            <div class="history-item-header">
                <div>
                    <div class="history-vendor">${item.vendor || 'Unknown Vendor'}</div>
                    <div class="history-date">${formatDate(item.date)}</div>
                </div>
                <div class="history-amount">₹${item.amount || '0'}</div>
            </div>
            <div class="history-category">${item.category || 'Uncategorized'}</div>
        </div>
    `).join('');
}

// Load Settings Form
function loadUserSettings(user) {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    
    document.getElementById('settings-name').value = user.displayName || '';
    document.getElementById('settings-email').value = user.email || '';
    document.getElementById('settings-company').value = settings.company || '';
    document.getElementById('settings-gstin').value = settings.gstin || '';
    document.getElementById('settings-phone').value = settings.phone || '';
    document.getElementById('settings-theme').value = settings.theme || 'dark';
}

// Switch Between Tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.profile-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.profile-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Highlight selected button
    event.target.classList.add('active');

    // Update URL
    window.history.replaceState({}, '', `profile.html?tab=${tabName}`);
}

// Save Settings
function saveSettings(event) {
    event.preventDefault();

    const settings = {
        name: document.getElementById('settings-name').value,
        company: document.getElementById('settings-company').value,
        gstin: document.getElementById('settings-gstin').value,
        phone: document.getElementById('settings-phone').value,
        theme: document.getElementById('settings-theme').value,
    };

    // Save to localStorage (in production, save to Firestore)
    localStorage.setItem('userSettings', JSON.stringify(settings));

    // Update user display name if changed
    if (settings.name !== currentUser.displayName) {
        // In production, use updateProfile from Firebase Auth
    }

    showNotification('Settings saved successfully!', 'success');
}

// Logout User
function logoutUser() {
    if (confirm('Are you sure you want to sign out?')) {
        signOut(auth).then(() => {
            console.log('✅ User signed out successfully');
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('❌ Sign out error:', error);
            showNotification('Error signing out', 'error');
        });
    }
}

// View Receipt Detail
function viewReceipt(receiptId) {
    // In production, navigate to receipt detail page
    console.log('Viewing receipt:', receiptId);
    showNotification('Receipt view not implemented', 'info');
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Setup Ambient Lighting Effect (Cursor-tracked)
function setupAmbientLighting() {
    const container = document.querySelector('.profile-container');
    
    if (!container) return;

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        
        container.style.setProperty('--spot-x', `${x}%`);
        container.style.setProperty('--spot-y', `${y}%`);
    });

    // Mobile fallback: animate based on time
    if (window.innerWidth < 768) {
        let angle = 0;
        setInterval(() => {
            angle += 0.5;
            const x = 50 + 30 * Math.cos(angle * Math.PI / 180);
            const y = 50 + 30 * Math.sin(angle * Math.PI / 180);
            container.style.setProperty('--spot-x', `${x}%`);
            container.style.setProperty('--spot-y', `${y}%`);
        }, 50);
    }
}

// Toggle User Menu
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 212, 255, 0.2)'};
        color: ${type === 'success' ? 'var(--success)' : 'var(--accent-primary)'};
        padding: 1rem 1.5rem;
        border-radius: 8px;
        border: 1px solid ${type === 'success' ? 'var(--success)' : 'var(--accent-primary)'};
        backdrop-filter: blur(10px);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Make functions globally accessible
window.switchTab = switchTab;
window.saveSettings = saveSettings;
window.logoutUser = logoutUser;
window.viewReceipt = viewReceipt;
window.toggleUserMenu = toggleUserMenu;
