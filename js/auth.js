// User Authentication and Management
class AuthManager {
  constructor() {
    this.db = null;
    this.currentUser = null;
    this.init();
  }

  async init() {
    await this.loadFirebase();

    const firebaseConfig = {
      apiKey: "AIzaSyAuAmhkTWhWWUmJvdBYBydE8Wly0ZNHTBY",
      authDomain: "academico-chat.firebaseapp.com",
      projectId: "academico-chat",
      storageBucket: "academico-chat.firebasestorage.app",
      messagingSenderId: "786614809148",
      appId: "1:786614809148:web:31eada9340cb351f6b8939",
    };

    firebase.initializeApp(firebaseConfig);
    this.db = firebase.firestore();
    console.log("AcademicO Auth Ready");
  }

  loadFirebase() {
    return new Promise((resolve) => {
      if (typeof firebase !== "undefined" && firebase.apps.length > 0) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js";
      script.onload = () => {
        const script2 = document.createElement("script");
        script2.src =
          "https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js";
        script2.onload = resolve;
        document.head.appendChild(script2);
      };
      document.head.appendChild(script);
    });
  }

  // User registration
  async registerUser(userData) {
    try {
      const userRef = this.db.collection("users").doc();
      const user = {
        id: userRef.id,
        name: userData.name,
        email: userData.email,
        country: userData.country,
        countryCode: userData.countryCode,
        university: userData.university,
        course: userData.course,
        availability: userData.availability,
        studyType: userData.studyType,
        topic: userData.topic,
        createdAt: new Date(),
        isAdmin: userData.email.includes("admin@academico.com"),
      };

      await userRef.set(user);

      // Store user in localStorage for session management
      localStorage.setItem("academico_current_user", JSON.stringify(user));
      this.currentUser = user;

      return userRef.id;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  // User login
  async loginUser(email, password) {
    try {
      // For demo purposes, we'll search for the user in Firestore
      // In a real app, this would use Firebase Authentication
      const snapshot = await this.db
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error("No user found with this email");
      }

      const userDoc = snapshot.docs[0];
      const user = userDoc.data();

      // Store user in localStorage for session management
      localStorage.setItem("academico_current_user", JSON.stringify(user));
      this.currentUser = user;

      return user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Search users based on filters
  async searchUsers(filters) {
    try {
      let query = this.db.collection("users");

      if (filters.course) {
        query = query.where("course", "==", filters.course);
      }
      if (filters.availability && filters.availability !== "") {
        query = query.where("availability", "==", filters.availability);
      }
      if (filters.studyType && filters.studyType !== "") {
        query = query.where("studyType", "==", filters.studyType);
      }

      const snapshot = await query.limit(20).get();
      const users = [];

      snapshot.forEach((doc) => {
        const userData = doc.data();
        // Don't include current user in results
        if (!this.currentUser || userData.id !== this.currentUser.id) {
          users.push(userData);
        }
      });

      return users;
    } catch (error) {
      console.error("Search error:", error);

      // Return demo data if search fails
      return this.getDemoUsers(filters);
    }
  }

  // Get all users for admin dashboard
  async getAllUsers() {
    try {
      const snapshot = await this.db.collection("users").get();
      const users = [];

      snapshot.forEach((doc) => {
        users.push(doc.data());
      });

      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      return this.getDemoUsers();
    }
  }

  // Demo users for fallback
  getDemoUsers(filters = {}) {
    const demoUsers = [
      {
        id: "demo-1",
        name: "Alex Johnson",
        email: "alex.johnson@university.edu",
        university: "University of Rwanda",
        country: "Rwanda",
        course: "Computer Science",
        availability: "evening",
        studyType: "group",
        topic: "Web Development",
      },
      {
        id: "demo-2",
        name: "Sarah Chen",
        email: "sarah.chen@university.edu",
        university: "University of Nairobi",
        country: "Kenya",
        course: "Mathematics",
        availability: "afternoon",
        studyType: "pair",
        topic: "Calculus",
      },
      {
        id: "demo-3",
        name: "Mike Davis",
        email: "mike.davis@university.edu",
        university: "Makerere University",
        country: "Uganda",
        course: "Computer Science",
        availability: "morning",
        studyType: "project",
        topic: "Data Structures",
      },
      {
        id: "demo-4",
        name: "Emma Wilson",
        email: "emma.wilson@university.edu",
        university: "University of Dar es Salaam",
        country: "Tanzania",
        course: "Physics",
        availability: "weekend",
        studyType: "group",
        topic: "Quantum Mechanics",
      },
    ];

    // Filter demo users based on search criteria
    return demoUsers.filter((user) => {
      if (
        filters.course &&
        !user.course.toLowerCase().includes(filters.course.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.availability &&
        filters.availability !== "" &&
        user.availability !== filters.availability
      ) {
        return false;
      }
      if (
        filters.studyType &&
        filters.studyType !== "" &&
        user.studyType !== filters.studyType
      ) {
        return false;
      }
      return true;
    });
  }

  // Get current user
  getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser;
    }

    const storedUser = localStorage.getItem("academico_current_user");
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      return this.currentUser;
    }

    return null;
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  // Logout user
  logout() {
    this.currentUser = null;
    localStorage.removeItem("academico_current_user");
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      await this.db.collection("users").doc(userId).update(updates);

      // Update current user data
      if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser = { ...this.currentUser, ...updates };
        localStorage.setItem(
          "academico_current_user",
          JSON.stringify(this.currentUser)
        );
      }

      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  }
}

// Global instance
const authManager = new AuthManager();
