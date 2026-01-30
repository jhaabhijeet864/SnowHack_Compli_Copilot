"""
Database initialization script for CompliCopilot
This script sets up the necessary Firestore collections and security rules
Run this once to set up your Firebase Firestore database
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth

# Initialize Firebase (make sure you have your service account key)
# Download from Firebase Console > Project Settings > Service Accounts > Generate New Private Key
try:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
    print("✅ Firebase initialized successfully")
except Exception as e:
    print(f"❌ Error initializing Firebase: {e}")
    print("Make sure you have 'serviceAccountKey.json' in the same directory")
    exit(1)

db = firestore.client()

def setup_firestore_collections():
    """Initialize Firestore collections and sample documents"""
    
    try:
        # Create users collection (if it doesn't exist)
        users_ref = db.collection('users')
        
        # Create receipts collection (if it doesn't exist)
        receipts_ref = db.collection('receipts')
        
        # Create categories collection
        categories_ref = db.collection('categories')
        
        print("✅ Collections created/verified")
        
        # Add sample categories
        sample_categories = [
            'Food & Dining',
            'Transportation',
            'Office Supplies',
            'Travel',
            'Utilities',
            'Software & Subscriptions',
            'Professional Services',
            'Marketing & Advertising',
            'Equipment',
            'Other'
        ]
        
        for category in sample_categories:
            categories_ref.add({'name': category, 'createdAt': firestore.SERVER_TIMESTAMP})
        
        print("✅ Sample categories added")
        
    except Exception as e:
        print(f"❌ Error setting up collections: {e}")

def create_firestore_security_rules():
    """Print the security rules to set in Firebase Console"""
    
    rules = """
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
    """
    
    print("\n📋 FIRESTORE SECURITY RULES:")
    print("=" * 60)
    print(rules)
    print("=" * 60)
    print("\n⚠️  Please copy the above rules to Firebase Console:")
    print("1. Go to Firebase Console > Firestore Database > Rules")
    print("2. Replace the default rules with the above rules")
    print("3. Click 'Publish'")

if __name__ == "__main__":
    print("🔧 Setting up CompliCopilot Firestore Database...\n")
    
    setup_firestore_collections()
    create_firestore_security_rules()
    
    print("\n✅ Database setup complete!")
    print("\nNext steps:")
    print("1. Update security rules in Firebase Console")
    print("2. Test user login in the application")
    print("3. Start uploading receipts!")
