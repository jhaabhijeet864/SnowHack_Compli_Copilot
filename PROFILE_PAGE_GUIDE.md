# 🎯 Profile Page Implementation Guide

## Overview

This guide explains how to create and integrate a **Profile Page with Receipt History** into your CompliCopilot application. The profile page allows users to:
- ✅ View their profile information (name, email, company)
- ✅ See receipt statistics (total receipts, total amount spent, member since date)
- ✅ Browse their complete receipt history with filtering
- ✅ Edit their profile information
- ✅ Manage account settings
- ✅ View billing information

---

## 📁 Files Created

### 1. **Frontend Files**

#### `frontend/public/profile.html` - Profile Page HTML
- Main profile page structure
- Contains tabs for History, Settings, and Billing
- Edit profile modal
- Statistics display section

#### `frontend/public/js/profile.js` - Profile JavaScript Logic
- Authentication check
- Load user profile from Firestore
- Display receipt history with filters
- Handle profile edits
- Tab navigation

#### `frontend/public/assets/css/style.css` - Added Profile Styles
- Profile page styling
- Tab navigation styles
- History list styling
- Settings panel styles
- Modal styling

### 2. **Backend Files**

#### `backend/setup_firestore.py` - Firebase Setup Script
- Initialize Firestore collections
- Create sample categories
- Display security rules for manual setup

---

## 🔌 Integration Steps

### **Step 1: Verify Firebase Setup**

Make sure your Firebase project has:
1. **Authentication** enabled (Email/Google sign-in)
2. **Firestore Database** created in production mode
3. **Storage** enabled for receipt images

### **Step 2: Update Auth.html to Save User on Signup**

Add this to your `auth.html` JavaScript to save user data to Firestore:

```javascript
// After successful signup, save user to Firestore
async function saveUserToFirestore(user, fullName, company) {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
        name: fullName,
        email: user.email,
        company: company,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
}
```

### **Step 3: Update Receipt Upload to Store User ID**

When uploading receipts, include the user ID:

```javascript
// In your upload handler
const receiptData = {
    userId: auth.currentUser.uid,
    vendor: vendorName,
    date: receiptDate,
    amount: receiptAmount,
    category: category,
    imageUrl: imageUrl,
    status: 'completed',
    createdAt: new Date(),
};

// Save to Firestore
await addDoc(collection(db, 'receipts'), receiptData);
```

### **Step 4: Setup Firestore Collections**

Run the setup script to initialize your database:

```bash
cd backend
python setup_firestore.py
```

Then manually set up security rules in Firebase Console:

1. Go to **Firebase Console** → **Firestore Database** → **Rules**
2. Copy the rules from `setup_firestore.py` output
3. Publish the rules

### **Step 5: Link Profile Page from Dashboard**

Update your `dashboard.html` user menu to link to the profile page (already done in the integration).

---

## 📊 Firestore Collection Structure

### **users** Collection
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Corp",
    "phone": "+1-555-123-4567",
    "address": "123 Main St, City, State",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
}
```

### **receipts** Collection
```json
{
    "userId": "user-id-here",
    "vendor": "Coffee Shop",
    "date": "2024-01-10",
    "amount": 15.50,
    "currency": "USD",
    "category": "Food & Dining",
    "gstin": "27ABCDE1234F1Z5",
    "tax_amount": 2.15,
    "status": "completed",
    "imageUrl": "https://storage.googleapis.com/...",
    "createdAt": "2024-01-10T14:30:00Z"
}
```

### **categories** Collection
```json
{
    "name": "Food & Dining",
    "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## 🔐 Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Receipts collection - users can read/write their own receipts
    match /receipts/{receiptId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    // Categories collection - read-only for all authenticated users
    match /categories/{categoryId} {
      allow read: if request.auth.uid != null;
      allow write: if false;
    }
  }
}
```

---

## 🎨 How It Works

### **User Flow**

1. **User logs in** → Redirected to dashboard
2. **Clicks profile icon** → Dropdown menu shows
3. **Clicks "Profile"** → Navigated to `profile.html`
4. **Profile page loads:**
   - Checks if user is authenticated
   - Fetches user profile from Firestore
   - Displays profile information
   - Loads receipt history (latest 50 receipts)
   - Shows statistics (count, total amount, member since)

### **Receipt History Features**

- **Search**: Filter receipts by vendor name
- **Status Filter**: Filter by completed/pending/failed status
- **Sorting**: Sorted by most recent first
- **Quick View**: Click "View" to see receipt details
- **Pagination**: Currently shows 50 most recent (can be extended)

### **Profile Editing**

- Click "Edit Profile" button
- Modal opens with editable fields
- Save changes to Firestore
- Changes reflected immediately

### **Settings Panel**

- Email notifications toggle
- Two-factor authentication setup
- Data export functionality
- All hooks ready for implementation

---

## 📱 Responsive Design

The profile page is fully responsive:
- **Desktop**: Multi-column layout with full details
- **Tablet**: Flexible grid layout
- **Mobile**: Stacked layout with touch-friendly buttons

---

## 🚀 Making the Profile Page the Landing Page

To make the profile page appear when users enter the website after login:

### **Option 1: Update auth.html redirect**

```javascript
// In your auth.html, after successful login
if (signupSuccess) {
    // Save user to Firestore first
    await saveUserToFirestore(user, fullName, company);
    // Then redirect to profile instead of dashboard
    window.location.href = 'profile.html';
}
```

### **Option 2: Create a root redirect page**

Create `frontend/public/app.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>CompliCopilot</title>
    <script type="module">
        import { app } from './js/firebase.js';
        import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
        
        const auth = getAuth(app);
        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is logged in, go to profile
                window.location.href = 'profile.html';
            } else {
                // User is not logged in, go to home page
                window.location.href = 'index.html';
            }
        });
    </script>
</head>
<body>
    Loading...
</body>
</html>
```

Then update your `package.json` start script:
```json
{
    "scripts": {
        "start": "npx http-server public -p 3000 -c-1 --default-extension app.html"
    }
}
```

---

## 🔗 Connecting to Your Backend

### **Example: Fetch receipts from backend API**

```javascript
// Instead of querying Firestore directly
async function loadReceiptHistory(userId) {
    try {
        const response = await fetch(`/api/v1/receipts?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${await user.getIdToken()}`
            }
        });
        const receipts = await response.json();
        displayReceiptHistory(receipts);
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### **Backend endpoint example (Python FastAPI)**

```python
@router.get("/api/v1/receipts")
async def list_user_receipts(
    current_user = Depends(get_current_firebase_user),
    db: Session = Depends(get_db)
):
    receipts = db.query(Receipt).filter(
        Receipt.user_id == current_user['uid']
    ).order_by(Receipt.created_at.desc()).all()
    return receipts
```

---

## 🧪 Testing

### **Test the Profile Page:**

1. Start your frontend:
   ```bash
   npm start
   ```

2. Log in with a test user account

3. Navigate to the profile page

4. Verify:
   - ✅ Profile info displays correctly
   - ✅ Statistics are calculated
   - ✅ Receipt history loads
   - ✅ Filters work
   - ✅ Edit profile modal opens and saves
   - ✅ Tab navigation works

---

## 🐛 Troubleshooting

### **"No receipts found" message**

- Ensure receipts exist in Firestore with the correct `userId`
- Check security rules allow read access

### **Profile info not loading**

- Verify user document exists in `users` collection
- Check browser console for errors

### **Edit profile not saving**

- Ensure Firestore security rules allow write
- Check that user is authenticated

### **History search not working**

- Verify data structure matches the expected format
- Check browser console for JavaScript errors

---

## 📚 Next Steps

1. **Integrate backend API** - Replace Firestore calls with your FastAPI endpoints
2. **Add receipt detail page** - Show full receipt info when clicking "View"
3. **Implement 2FA** - Add two-factor authentication
4. **Add data export** - Export user data as JSON/CSV
5. **Add notifications** - Email notifications for pending receipts
6. **Analytics** - Track spending by category

---

## 💡 Features Ready to Implement

- [ ] Receipt detail modal
- [ ] Batch receipt management
- [ ] Custom date range filtering
- [ ] Export to Excel/PDF
- [ ] Receipt categories management
- [ ] Recurring expenses tracking
- [ ] Monthly reports
- [ ] Team collaboration features
