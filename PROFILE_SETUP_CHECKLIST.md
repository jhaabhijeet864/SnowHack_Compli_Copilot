# ✅ Profile Page Setup Checklist

## 🎯 Quick Start (5 minutes)

- [ ] **Profile page files created:**
  - `frontend/public/profile.html` ✓
  - `frontend/public/js/profile.js` ✓
  - CSS styles added to `style.css` ✓

- [ ] **Firebase/Firestore Ready:**
  - [ ] Firestore Database created in Firebase Console
  - [ ] Cloud Storage enabled
  - [ ] Authentication (Email/Google) enabled

- [ ] **Update your auth signup to save user to Firestore:**
  ```javascript
  // Add this after successful signup
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
      name: fullName,
      email: user.email,
      company: company,
      createdAt: new Date(),
  });
  ```

- [ ] **Update receipt upload to include userId:**
  ```javascript
  const receiptData = {
      userId: auth.currentUser.uid,  // Add this line
      vendor: vendorName,
      date: receiptDate,
      amount: receiptAmount,
      category: category,
      createdAt: new Date(),
  };
  ```

---

## 🔐 Firebase Security Rules Setup

1. Go to **Firebase Console** → **Firestore Database** → **Rules**
2. Replace with these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /receipts/{receiptId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    match /categories/{categoryId} {
      allow read: if request.auth.uid != null;
    }
  }
}
```

3. Click **Publish**

---

## 🚀 Run the Application

### **Start Frontend:**
```bash
cd frontend
npm install
npm start
```

### **Start Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### **Access:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

---

## 🧪 Test the Profile Page

1. **Sign up** → Creates user in Firestore
2. **Upload receipts** → Each receipt gets userId
3. **Go to Dashboard** → Click user avatar
4. **Click "Profile"** → See profile page with history
5. **Try filtering** → Search and filter receipts
6. **Edit profile** → Click "Edit Profile" button

---

## 📊 Expected Results

### **Profile Page Should Show:**
- ✅ User name, email, company
- ✅ Statistics (receipt count, total amount, member since)
- ✅ Receipt history with vendor, date, amount
- ✅ Search and filter functionality
- ✅ Tabs for History, Settings, Billing
- ✅ Edit profile modal

### **Click on Receipt:**
- ✅ "View" button ready (logs receipt ID)

### **Settings Tab:**
- ✅ Email notifications toggle
- ✅ 2FA button ready
- ✅ Data download button ready

---

## 🔗 Navigation Paths

| Page | URL | When to Visit |
|------|-----|---------------|
| Home | `/index.html` | Landing page |
| Sign In/Up | `/auth.html` | Before login |
| Dashboard | `/dashboard.html` | After login |
| **Profile** | **`/profile.html`** | **View profile & history** |
| Upload | `/upload.html` | Upload receipts |

---

## 💾 Database Structure

### **users** collection
```
/users/{userId}
├── name: "John Doe"
├── email: "john@example.com"
├── company: "Acme Corp"
├── phone: "+1-555-1234"
├── address: "123 Main St"
├── createdAt: timestamp
└── updatedAt: timestamp
```

### **receipts** collection
```
/receipts/{receiptId}
├── userId: "user-123"
├── vendor: "Coffee Shop"
├── date: "2024-01-10"
├── amount: 15.50
├── category: "Food & Dining"
├── imageUrl: "storage-url"
├── status: "completed"
└── createdAt: timestamp
```

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "No receipts found" | Ensure receipts have `userId` field matching logged-in user |
| Profile not loading | Check user exists in Firestore with correct user ID |
| Redirect to auth page | User not authenticated - need to log in first |
| Edit profile not saving | Check Firestore security rules allow write access |
| Can't see other users' data | Security rules working correctly (privacy preserved) |

---

## 🎓 How It Works

```
User Login
    ↓
Check Authentication (profile.js)
    ↓
Fetch User Profile from Firestore
    ↓
Load Receipt History (Query by userId)
    ↓
Display Profile Page
    ↓
User can Filter/Search/Edit
```

---

## 📱 Features Included

### ✅ Implemented:
- User profile display
- Receipt history with filters
- Search by vendor
- Status filtering
- Edit profile modal
- Statistics calculation
- Responsive design
- Settings panel UI
- Billing panel UI

### 🔄 Ready to Connect to Backend:
- Receipt list endpoint
- User profile endpoint
- Receipt detail endpoint
- Statistics calculation

---

## 🚀 Next Steps

1. **Run setup** → Follow "Run the Application" section
2. **Test login** → Create account and login
3. **Upload receipt** → Add a receipt to see in history
4. **Visit profile** → Click user avatar → Profile
5. **Verify** → All information displays correctly

---

## 📞 Need Help?

Check `PROFILE_PAGE_GUIDE.md` for:
- Detailed integration steps
- Backend connection examples
- Firestore collection structure
- Troubleshooting guide
- Feature roadmap

---

**Status: ✅ Ready to Use**

All files are created and integrated. Just follow the checklist above!
