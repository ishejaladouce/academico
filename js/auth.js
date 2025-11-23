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

    // Check if Firebase is already initialized to avoid duplicate initialization
    if (typeof firebase !== "undefined") {
      if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(this.firebaseConfig);
      } else {
        // Firebase already initialized, just get the existing app
        console.log("Firebase already initialized, using existing instance");
      }
      
      // Make sure firestore is available before using it
      if (typeof firebase.firestore === "function") {
        this.db = firebase.firestore();
        console.log("AcademicO Auth Ready");
      } else {
        console.error("Firestore not loaded yet, waiting...");
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 500));
        if (typeof firebase.firestore === "function") {
          this.db = firebase.firestore();
          console.log("AcademicO Auth Ready");
        } else {
          console.error("Firestore failed to load");
        }
      }
    } else {
      console.error("Firebase failed to load");
    }
  }

  loadFirebase() {
    return new Promise((resolve) => {
      // Check if Firebase and Firestore are already loaded
      if (typeof firebase !== "undefined" && typeof firebase.firestore === "function") {
        resolve();
        return;
      }

      // Check if scripts are already being loaded
      const existingAppScript = document.querySelector('script[src*="firebase-app.js"]');
      if (existingAppScript) {
        // Wait for both scripts to load
        const checkFirestore = () => {
          if (typeof firebase !== "undefined" && typeof firebase.firestore === "function") {
            resolve();
          } else {
            const existingFirestoreScript = document.querySelector('script[src*="firebase-firestore.js"]');
            if (existingFirestoreScript) {
              existingFirestoreScript.onload = resolve;
            } else {
              setTimeout(checkFirestore, 100);
            }
          }
        };
        existingAppScript.onload = checkFirestore;
        checkFirestore();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js";
      script.onload = () => {
        const script2 = document.createElement("script");
        script2.src = "https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js";
        script2.onload = () => {
          // Make sure firestore is actually available
          if (typeof firebase !== "undefined" && typeof firebase.firestore === "function") {
            resolve();
          } else {
            console.error("Firestore script loaded but firestore function not available");
            resolve(); // Resolve anyway to prevent hanging
          }
        };
        document.head.appendChild(script2);
      };
      document.head.appendChild(script);
    });
  }

  // Ensure Firebase is ready before using it
  async ensureFirebase() {
    if (this.db) return this.db;

    // First, make sure Firebase scripts are loaded
    await this.loadFirebase();

    // Wait for Firebase to be available
    let attempts = 0;
    while ((typeof firebase === "undefined" || !firebase.firestore) && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (typeof firebase === "undefined" || !firebase.firestore) {
      console.error("Firebase Firestore failed to load after waiting");
      throw new Error("Firebase Firestore not available. Please refresh the page.");
    }

    const firebaseConfig = window.__ACADEMICO_CONFIG?.firebase;
    if (!firebaseConfig) {
      throw new Error("Firebase configuration is missing!");
    }
    
    // Initialize Firebase if not already initialized
    try {
      if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
      }
    } catch (error) {
      // Ignore duplicate app errors
      if (error.code !== 'app/duplicate-app') {
        console.error("Firebase initialization error:", error);
        throw error;
      }
    }
    
    this.db = firebase.firestore();
    if (!this.db) {
      throw new Error("Failed to initialize Firestore database");
    }
    
    return this.db;
  }

  // User registration
 
  async registerUser(userData) {
    try {
      // Ensure Firebase is ready
      await this.ensureFirebase();

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

  // User login
  async loginUser(email, password) {
    try {
      // Ensure Firebase is ready
      await this.ensureFirebase();
      
      // Search for the user in Firestore
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

      // Trim the password input to ensure consistency
      const trimmedPassword = String(password || "").trim();
      
      // Log the exact password being entered (for debugging - remove in production)
      console.log(`Login attempt for ${email}`);
      console.log(`Password entered (char codes): [${trimmedPassword.split('').map(c => c.charCodeAt(0)).join(', ')}]`);
      console.log(`Password entered (length): ${trimmedPassword.length}`);
      console.log(`Password entered (quoted): "${trimmedPassword}"`);
      
      const hashedInput = await this.hashPassword(trimmedPassword);
      
      console.log(`Stored hash length: ${user.passwordHash ? user.passwordHash.length : 0}`);
      console.log(`Input hash length: ${hashedInput.length}`);
      console.log(`Stored hash (first 40): ${user.passwordHash ? user.passwordHash.substring(0, 40) : 'NOT FOUND'}`);
      console.log(`Input hash (first 40): ${hashedInput.substring(0, 40)}`);
      console.log(`Hashes match: ${user.passwordHash === hashedInput}`);

      if (!user.passwordHash) {
        console.error("User has no password hash stored");
        throw new Error("Invalid password");
      }
      
      if (user.passwordHash !== hashedInput) {
        console.error("Password hash mismatch - Full comparison:");
        console.error(`Stored: ${user.passwordHash}`);
        console.error(`Input:  ${hashedInput}`);
        
        // Try to help debug - check if there's a stored temp password
        const storedTempPassword = localStorage.getItem(`temp_password_${email}`);
        if (storedTempPassword) {
          console.log(`Found stored temp password: "${storedTempPassword}"`);
          const storedHash = await this.hashPassword(storedTempPassword);
          console.log(`Stored temp password hash: ${storedHash}`);
          console.log(`Does stored temp password match? ${storedHash === user.passwordHash}`);
        }
        
        throw new Error("Invalid password");
      }
      
      console.log("Password verified successfully");

      // Clear the temporary password from localStorage after successful login
      localStorage.removeItem(`temp_password_${email}`);

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
      // Ensure Firebase is ready
      await this.ensureFirebase();
      
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
      // Ensure Firebase is ready
      await this.ensureFirebase();
      
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
      // Ensure Firebase is ready
      await this.ensureFirebase();
      
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
    // Ensure password is a string and trim whitespace
    const cleanPassword = String(password || "").trim();
    
    if (!cleanPassword) {
      throw new Error("Password cannot be empty");
    }
    
    if (!window.crypto || !window.crypto.subtle) {
      console.warn("Crypto API not available, using plain password (not secure)");
      return cleanPassword;
    }
    
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(cleanPassword);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      return hash;
    } catch (error) {
      console.error("Error hashing password:", error);
      throw new Error("Failed to hash password");
    }
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

  // Generate a temporary password for password reset
  async resetPassword(email) {
    try {
      if (!this.db) {
        await this.init();
      }

      // Find user by email
      const snapshot = await this.db
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error("No account found with this email address");
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // Generate a temporary password (longer and more secure)
      // Use only alphanumeric characters to avoid encoding issues
      const tempPassword = Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(-10) + 
                          Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(-10);
      const hashedPassword = await this.hashPassword(tempPassword);

      console.log(`Resetting password for ${email}`);
      console.log(`Temporary password (plain): "${tempPassword}"`);
      console.log(`Temporary password length: ${tempPassword.length}`);
      console.log(`Hashed password length: ${hashedPassword.length}`);
      console.log(`Hashed password (first 40): ${hashedPassword.substring(0, 40)}...`);

      // Update password in Firestore
      await userDoc.ref.update({
        passwordHash: hashedPassword,
        passwordResetAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Verify the password was saved by reading it back (with retry for eventual consistency)
      let savedHash = null;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Delay for Firestore consistency
        const verifyDoc = await userDoc.ref.get();
        const verifyData = verifyDoc.data();
        savedHash = verifyData.passwordHash;
        
        console.log(`Verification attempt ${attempts + 1}/${maxAttempts}:`);
        console.log(`  Saved hash: ${savedHash ? savedHash.substring(0, 40) + '...' : 'NOT FOUND'}`);
        console.log(`  Expected:   ${hashedPassword.substring(0, 40)}...`);
        console.log(`  Match: ${savedHash === hashedPassword}`);
        
        if (savedHash === hashedPassword) {
          console.log("✓ Password hash verified successfully!");
          break;
        }
        
        attempts++;
      }
      
      if (savedHash !== hashedPassword) {
        console.error(`✗ Password hash mismatch after ${maxAttempts} attempts!`);
        console.error(`  This might be a Firestore consistency issue.`);
        console.error(`  Full stored hash: ${savedHash}`);
        console.error(`  Full expected hash: ${hashedPassword}`);
        // Still return the password - user can try logging in after waiting
        console.warn("Returning temporary password anyway - please wait 3-5 seconds before logging in");
      }

      console.log(`Password reset completed for ${email}`);
      console.log(`Temporary password: "${tempPassword}"`);
      console.log(`Password length: ${tempPassword.length} characters`);
      
      // Store the temp password in localStorage temporarily for verification
      // This will be cleared after successful login
      localStorage.setItem(`temp_password_${email}`, tempPassword);
      console.log(`Temporary password stored in localStorage for verification`);
      
      return { success: true, tempPassword, email };
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  }
}

// Global instance
const authManager = new AuthManager();
