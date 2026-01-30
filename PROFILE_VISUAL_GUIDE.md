# 🎨 Profile Page Visual Guide

## Page Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HEADER & NAVIGATION                      │
│  CompliCopilot Logo    [Back to Dashboard]    [User Avatar ▼]   │
│                                               [Profile]          │
│                                               [Settings]         │
│                                               [Billing]          │
│                                               [Sign Out]         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     PROFILE SECTION                             │
│  ┌─────────┐  John Doe                                          │
│  │    J    │  john@example.com                                  │
│  │  (BIG)  │  Acme Corporation                                  │
│  └─────────┘                                                    │
│              [Stat1]      [Stat2]      [Stat3]                  │
│              45 Items     $1,250.50     Jan 2024                │
│              Receipts     Total Amt    Member Since             │
│                                           [Edit Profile]       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  📋 History  │  ⚙️ Settings  │  💳 Billing                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Search: [________Search by vendor________] [Dropdown: Status]│
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [IMG] Vendor Name                        [Status] [View] │  │
│  │       Amount: $15.50 • Date: Jan 10      Completed      │  │
│  │       Category: Food & Dining                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [IMG] Another Vendor                     [Status] [View] │  │
│  │       Amount: $45.00 • Date: Jan 09      Completed      │  │
│  │       Category: Office Supplies                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [More receipts...]                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1️⃣ Profile Header

```
┌─────────────────────────────────────────────┐
│  ┌───────┐                                  │
│  │   J   │  John Doe                        │
│  │ (120) │  john@example.com                │
│  │  px   │  Acme Corporation                │
│  └───────┘                                  │
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │   45    │  │$1,250.50│  │ Jan'24  │    │
│  │ Receipts│  │  Total  │  │ Since   │    │
│  └─────────┘  └─────────┘  └─────────┘    │
│                                [Edit Btn]  │
└─────────────────────────────────────────────┘
```

### 2️⃣ Tab Navigation

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 History (ACTIVE)  ⚙️ Settings  💳 Billing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ▲ Underlined in cyan when active
```

### 3️⃣ History Tab - Search & Filter

```
┌─────────────────────────────────────────────┐
│  [Search by vendor...]    [Status ▼]        │
│  - Coffee Shop            - All Statuses    │
│  - Starbucks              - Completed       │
│  - (Real-time search)     - Pending         │
│  - (Dropdown with history)- Failed          │
└─────────────────────────────────────────────┘
```

### 4️⃣ Receipt History Item

```
┌──────────────────────────────────────────────────┐
│ ┌────────┐  Vendor Name               [✓ Status]│
│ │        │  Amount: $15.50 • Jan 10  [View Btn]│
│ │  [IMG] │  Category: Food & Dining             │
│ │  80px  │                                      │
│ └────────┘                                      │
└──────────────────────────────────────────────────┘

Status colors:
✅ Completed  - Green
⏳ Pending    - Orange
❌ Failed     - Red
```

---

## Interaction Flows

### Flow 1: View Profile on Login

```
User lands on app
    ↓
[If logged in]
    ↓
User clicks avatar
    ↓
Dropdown shows: Profile | Settings | Billing | Sign Out
    ↓
User clicks "Profile"
    ↓
Profile page loads with:
  • User info
  • Stats
  • Receipt history
```

### Flow 2: Search & Filter Receipts

```
User on profile page
    ↓
Sees search box and filter dropdown
    ↓
Clicks search: "coffee"
    ↓
History filters in real-time
    ↓
Shows only receipts with "coffee" vendor
    ↓
User can also:
  • Change status filter
  • Clear search
  • Edit receipt (future feature)
```

### Flow 3: Edit Profile

```
User on profile page
    ↓
Clicks "Edit Profile" button
    ↓
Modal opens with form:
  • Full Name: [________]
  • Company: [________]
  • Phone: [________]
  • Address: [________]
  [Cancel] [Save Changes]
    ↓
User fills and clicks Save
    ↓
Data updates in Firestore
    ↓
Modal closes
    ↓
Profile info refreshes with new data
```

---

## Settings & Billing Tabs (UI Preview)

### Settings Tab

```
┌─────────────────────────────────────┐
│ 📧 Email Notifications              │
│ Receive notifications about...  [🔘] │
├─────────────────────────────────────┤
│ 🔐 Two-Factor Authentication        │
│ Add extra security...  [Enable 2FA] │
├─────────────────────────────────────┤
│ 💾 Download Your Data               │
│ Export all data...     [Download]   │
└─────────────────────────────────────┘
```

### Billing Tab

```
┌──────────────────┐  ┌──────────────────┐
│ 💳 Current Plan  │  │ 💳 Payment Info  │
│                  │  │                  │
│ Free Trial       │  │ No payment on    │
│ Unlimited • 30d  │  │ file             │
│ [Upgrade Plan]   │  │ [Add Payment]    │
└──────────────────┘  └──────────────────┘
```

---

## Responsive Breakpoints

### 📱 Mobile (< 768px)

```
Profile header:
┌─────────────┐
│ ┌─────────┐ │
│ │    J    │ │
│ │ Avatar  │ │
│ └─────────┘ │
│ John Doe    │
│ john@ex...  │
│ Acme Corp   │
│             │
│ 45    $1.2k │
│ Items Total │
│             │
│ Member      │
│ Jan 2024    │
│ [Edit]      │
└─────────────┘

History items stacked vertically
Search/Filter full width
```

### 💻 Desktop (> 768px)

```
Profile header in row:
John's Avatar | Name, Email, Company | Stats | [Edit]

History items in cards with thumbnails
Search and filter side by side
Tabs spread horizontally
```

---

## Color Scheme

```
Theme: Dark Mode (Cyan/Blue accent)

Primary Colors:
  Background: #121212 (Dark)
  Secondary: #1a1a1a
  Tertiary: #242424
  
Text:
  Primary: #ffffff (White)
  Secondary: #b3b3b3 (Gray)
  
Accent:
  Primary: #00d4ff (Cyan)
  Secondary: #0099cc (Blue)
  
Status:
  Success: #00ff88 (Green)
  Warning: #ffaa00 (Orange)
  Error: #ff4757 (Red)
```

---

## Animations & Transitions

```
Fade In when loading:
  opacity: 0 → 1 over 0.3s

Tab switching:
  Content fades in
  Previous content fades out
  Smooth transition

Hover effects:
  - Buttons: Glow effect
  - Cards: Border color change
  - Links: Color transition

Search:
  Real-time filtering
  No page refresh
  Instant results
```

---

## Loading States

```
Initial Load:
┌─────────────────────────────────┐
│ Loading profile...               │
│ ⟳ (Spinner animation)            │
└─────────────────────────────────┘

Empty State:
┌─────────────────────────────────┐
│ 📭 No receipts found             │
│ Start by uploading a receipt     │
│ [Go to Upload Page]              │
└─────────────────────────────────┘

Error State:
┌─────────────────────────────────┐
│ ❌ Error loading history          │
│ Please try again                 │
│ [Retry]                          │
└─────────────────────────────────┘
```

---

## Accessibility Features

✅ Implemented:
- Color contrast: 4.5:1 or higher
- Keyboard navigation: Tab through elements
- ARIA labels: For screen readers
- Focus indicators: Visible focus states
- Semantic HTML: `<button>`, `<input>`, etc.

---

## Screen Capture Description

### Profile Page Main View
```
User avatar (initial) + Name + Email + Company
Three stats showing: Receipt count, Total amount, Member since
Three tabs: History, Settings, Billing
Search box + Status filter dropdown
List of receipts with:
  - Receipt image thumbnail
  - Vendor name
  - Amount and date
  - Category badge
  - Status badge (color-coded)
  - View button
```

---

## Dark Mode Integration

The entire profile page uses your existing dark theme:
- ✅ Matches your dashboard styling
- ✅ Uses same color variables (CSS custom properties)
- ✅ Consistent with your design system
- ✅ No additional theme switching needed

---

## Size Reference

```
Avatar: 120px (desktop), 80px (mobile)
Receipt thumbnail: 80px × 80px
Cards: Full width with padding
Modal: 500px max width
Sidebar: N/A (Full width layout)
```

---

## Next UI Components (Ready to Build)

- [ ] Receipt detail modal
- [ ] Category picker modal
- [ ] Date range selector
- [ ] Export dialog
- [ ] Confirmation dialogs
- [ ] Toast notifications
- [ ] Loading skeletons

---

## Navigation Map

```
                     ┌─────────────┐
                     │ Index.html  │ (Landing)
                     └──────┬──────┘
                            ↓
                     ┌─────────────┐
                     │  auth.html  │ (Sign in/up)
                     └──────┬──────┘
                            ↓
                     ┌─────────────┐
                  ┌→ │ Dashboard   │ ←─┐
                  │  └──────┬──────┘   │
                  │         ↓          │
        [Upload] │  ┌─────────────┐   │ [Profile]
                  │  │   Upload    │   │
                  │  └─────────────┘   │
                  │                    │
                  │  ┌─────────────┐   │
                  └→ │   Profile   │ ←─┘
                     └──────┬──────┘
                            ↓
                     ┌─────────────┐
                     │  Settings   │
                     └─────────────┘
```

---

This visual guide helps you understand the layout, interactions, and design of the profile page system!
