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
      // Validate required fields
      if (!userData.password) {
        throw new Error("Password is required");
      }

      const userRef = this.db.collection("users").doc();
      const user = {
        id: userRef.id,
        name: userData.name || "",
        email: userData.email || "",
        password: userData.password, // This should now be defined
        country: userData.country || "",
        countryCode: userData.countryCode || "",
        university: userData.university || "",
        course: userData.course || "",
        availability: userData.availability || "flexible",
        studyType: userData.studyType || "group",
        topic: userData.topic || "General",
        createdAt: new Date(),
        isAdmin: userData.email
          ? userData.email.includes("admin@academico.com")
          : false,
      };

      console.log("Registering user:", user); // Debug log

      await userRef.set(user);

      // Store user in localStorage for session management (without password for security)
      const userForStorage = { ...user };
      delete userForStorage.password; // Don't store password in localStorage

      localStorage.setItem(
        "academico_current_user",
        JSON.stringify(userForStorage)
      );
      this.currentUser = userForStorage;

      return userRef.id;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  // User login - FIXED PASSWORD VALIDATION
  async loginUser(email, password) {
    try {
      // For demo purposes, we'll search for the user in Firestore
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

      // FIXED: Validate password
      if (!user.password || user.password !== password) {
        throw new Error("Invalid password");
      }

      // Store user in localStorage for session management
      localStorage.setItem("academico_current_user", JSON.stringify(user));
      this.currentUser = user;

      return user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Search users based on filters - ENHANCED with country/university filtering
  async searchUsers(filters) {
    try {
      let query = this.db.collection("users");

      // Apply filters
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

      // Apply additional filters that couldn't be done in Firestore query
      return this.applyAdditionalFilters(users, filters);
    } catch (error) {
      console.error("Search error:", error);

      // Return demo data if search fails with enhanced filtering
      return this.applyAdditionalFilters(this.getDemoUsers(), filters);
    }
  }

  // Apply country and university filters
  applyAdditionalFilters(users, filters) {
    return users.filter((user) => {
      // Country filter
      if (
        filters.country &&
        filters.country !== "" &&
        user.countryCode !== filters.country
      ) {
        return false;
      }

      // University filter
      if (
        filters.university &&
        filters.university !== "" &&
        user.university !== filters.university
      ) {
        return false;
      }

      // Topic filter (case insensitive partial match)
      if (filters.topic && filters.topic !== "") {
        const userTopic = user.topic || "";
        const filterTopic = filters.topic.toLowerCase();
        if (!userTopic.toLowerCase().includes(filterTopic)) {
          return false;
        }
      }

      return true;
    });
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

  // Demo users for fallback - ENHANCED with more data
  getDemoUsers() {
    const demoUsers = [
      {
        id: "demo-1",
        name: "Alex Johnson",
        email: "alex.johnson@university.edu",
        university: "University of Rwanda",
        country: "Rwanda",
        countryCode: "RW",
        course: "Computer Science",
        availability: "evening",
        studyType: "group",
        topic: "Web Development",
        lastActive: "2 hours ago",
      },
      {
        id: "demo-2",
        name: "Sarah Chen",
        email: "sarah.chen@university.edu",
        university: "University of Nairobi",
        country: "Kenya",
        countryCode: "KE",
        course: "Mathematics",
        availability: "afternoon",
        studyType: "pair",
        topic: "Calculus",
        lastActive: "Online now",
      },
      {
        id: "demo-3",
        name: "Mike Davis",
        email: "mike.davis@university.edu",
        university: "Makerere University",
        country: "Uganda",
        countryCode: "UG",
        course: "Computer Science",
        availability: "morning",
        studyType: "project",
        topic: "Data Structures",
        lastActive: "1 hour ago",
      },
      {
        id: "demo-4",
        name: "Emma Wilson",
        email: "emma.wilson@university.edu",
        university: "University of Dar es Salaam",
        country: "Tanzania",
        countryCode: "TZ",
        course: "Physics",
        availability: "weekend",
        studyType: "group",
        topic: "Quantum Mechanics",
        lastActive: "30 minutes ago",
      },
      {
        id: "demo-5",
        name: "David Kim",
        email: "david.kim@university.edu",
        university: "University of Ghana",
        country: "Ghana",
        countryCode: "GH",
        course: "Computer Science",
        availability: "evening",
        studyType: "pair",
        topic: "Algorithms",
        lastActive: "5 hours ago",
      },
    ];

    return demoUsers;
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
