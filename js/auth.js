// Simple User Registration & Search
class AuthManager {
    constructor() {
        this.db = null;
        this.init();
    }

    async init() {
        // Load Firebase
        await this.loadFirebase();
        
        // Your Firebase config
        const firebaseConfig = {
            apiKey: "AIzaSyAuAmhkTWhWWUmJvdBYBydE8Wly0ZNHTBY",
            authDomain: "academico-chat.firebaseapp.com",
            projectId: "academico-chat",
            storageBucket: "academico-chat.firebasestorage.app",
            messagingSenderId: "786614809148",
            appId: "1:786614809148:web:31eada9340cb351f6b8939"
        };

        firebase.initializeApp(firebaseConfig);
        this.db = firebase.firestore();
        console.log('AcademicO Auth Ready!');
    }

    loadFirebase() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js';
            script.onload = () => {
                const script2 = document.createElement('script');
                script2.src = 'https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js';
                script2.onload = resolve;
                document.head.appendChild(script2);
            };
            document.head.appendChild(script);
        });
    }

    // Simple user registration
    async registerUser(userData) {
        try {
            const userRef = this.db.collection('users').doc();
            await userRef.set({
                id: userRef.id,
                name: userData.name,
                email: userData.email,
                course: userData.course,
                university: userData.university || 'Student',
                availability: userData.availability,
                studyType: userData.studyType,
                topic: userData.topic,
                createdAt: new Date()
            });
            return userRef.id;
        } catch (error) {
            throw error;
        }
    }

    // Simple user search
    async searchUsers(filters) {
        try {
            let query = this.db.collection('users');
            
            if (filters.course) {
                query = query.where('course', '==', filters.course);
            }
            if (filters.availability) {
                query = query.where('availability', '==', filters.availability);
            }

            const snapshot = await query.limit(10).get();
            const users = [];
            
            snapshot.forEach(doc => {
                users.push(doc.data());
            });

            return users;
        } catch (error) {
            throw error;
        }
    }
}

const authManager = new AuthManager();