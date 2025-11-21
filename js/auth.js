// User Authentication and Management
class AuthManager {
  constructor() {
    this.db = null;
    this.currentUser = null;
    this.firebaseConfig = window.__ACADEMICO_CONFIG?.firebase;
    if (!this.firebaseConfig) {
      console.error(
        "Firebase configuration missing. Please update config.js with your credentials."
      );
    }
    this.init();
  }

  async init() {
    await this.loadFirebase();

    if (!firebase.apps.length) {
      firebase.initializeApp(this.firebaseConfig);
    }
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

      const passwordHash = await this.hashPassword(userData.password);
      const userRef = this.db.collection("users").doc();
      const user = {
        id: userRef.id,
        name: userData.name || "",
        email: userData.email || "",
        passwordHash,
        country: userData.country || "",
        countryCode: userData.countryCode || "",
        university: userData.university || "",
        course: userData.course || "",
        courseKeywords: this.buildKeywords(userData.course),
        availability: userData.availability || "flexible",
        studyType: userData.studyType || "group",
        topic: userData.topic || "General",
        topicKeywords: this.buildKeywords(userData.topic),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isAdmin: userData.email
          ? userData.email.includes("admin@academico.com")
          : false,
      };

      console.log("Registering user:", user); // Debug log

      await userRef.set(user);

      // Store user in localStorage for session management (without password for security)
      const userForStorage = { ...user };
      userForStorage.createdAt = new Date().toISOString();
      delete userForStorage.passwordHash;

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

      const hashedInput = await this.hashPassword(password);

      if (!user.passwordHash || user.passwordHash !== hashedInput) {
        throw new Error("Invalid password");
      }

      // Store user in localStorage for session management
      const sanitizedUser = this.sanitizeUser(user);
      localStorage.setItem(
        "academico_current_user",
        JSON.stringify(sanitizedUser)
      );
      this.currentUser = sanitizedUser;

      return sanitizedUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Search users based on filters - ENHANCED with country/university filtering
  async searchUsers(filters) {
    try {
      let query = this.db.collection("users");
      const normalizedCourse = filters.course
        ? filters.course.trim().toLowerCase()
        : "";

      if (normalizedCourse) {
        query = query.where("courseKeywords", "array-contains", normalizedCourse);
      } else {
        query = query.orderBy("createdAt", "desc");
      }

      const snapshot = await query.limit(50).get();
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
      throw error;
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
      const snapshot = await this.db.collection("users").limit(200).get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
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
      const normalizedUpdates = {
        ...updates,
      };

      if (updates.course) {
        normalizedUpdates.courseKeywords = this.buildKeywords(updates.course);
      }
      if (updates.topic) {
        normalizedUpdates.topicKeywords = this.buildKeywords(updates.topic);
      }

      await this.db.collection("users").doc(userId).update(normalizedUpdates);

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

  async hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) {
      return password;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  buildKeywords(value = "") {
    if (!value) return [];
    const base = value.trim().toLowerCase();
    const parts = base.split(/[^\w]+/).filter(Boolean);
    return Array.from(new Set([base, ...parts]));
  }

  sanitizeUser(user) {
    const sanitized = { ...user };
    delete sanitized.passwordHash;
    return sanitized;
  }
}

// Global instance
const authManager = new AuthManager();
