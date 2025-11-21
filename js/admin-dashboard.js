// Admin Dashboard Management with Real Data from Firebase
class AdminDashboard {
  constructor() {
    this.stats = {
      totalUsers: 0,
      activeUsers: 0,
      totalMessages: 0,
      totalConnections: 0,
      newUsersToday: 0,
      pendingReports: 0,
    };
    this.db = null;
  }

  async ensureFirebase() {
    if (this.db) return this.db;

    // Wait for Firebase to be available
    let attempts = 0;
    while (typeof firebase === "undefined" && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (typeof firebase !== "undefined" && firebase.firestore) {
      const firebaseConfig = window.__ACADEMICO_CONFIG && window.__ACADEMICO_CONFIG.firebase;
      if (!firebaseConfig) {
        throw new Error("Firebase configuration is missing!");
      }
      
      // Initialize Firebase if not already initialized
      try {
        firebase.initializeApp(firebaseConfig);
      } catch (error) {
        // Firebase might already be initialized
        if (!error.code || error.code !== 'app/duplicate-app') {
          console.warn("Firebase initialization warning:", error);
        }
      }
      
      this.db = firebase.firestore();
      return this.db;
    }

    throw new Error("Firebase Firestore not available");
  }

  async init() {
    if (!adminAuth.isAdminLoggedIn()) {
      window.location.href = "index.html";
      return;
    }

    this.setupAdminEventListeners();
    await this.loadAdminStats();
    await this.loadRecentActivities();
    this.updateAdminUI();
  }

  setupAdminEventListeners() {
    // Admin logout
    document.getElementById("adminLogoutBtn")?.addEventListener("click", () => {
      adminAuth.adminLogout();
    });

    // Admin navigation
    document.querySelectorAll(".admin-nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.getAttribute("data-section");
        this.showAdminSection(section);
      });
    });

    // Quick action buttons
    document
      .getElementById("refreshStatsBtn")
      ?.addEventListener("click", () => {
        this.loadAdminStats();
      });

    document.getElementById("exportDataBtn")?.addEventListener("click", () => {
      this.exportAdminData();
    });

    // User search and filters
    document.getElementById("userSearch")?.addEventListener("input", (e) => {
      adminUsersManager.applySearchFilter(e.target.value);
    });

    document
      .getElementById("userStatusFilter")
      ?.addEventListener("change", (e) => {
        adminUsersManager.applyStatusFilter(e.target.value);
      });
  }

  async apiCall(endpoint, options = {}) {
    const token = localStorage.getItem("academico_admin_user");
    const adminData = token ? JSON.parse(token) : null;

    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        Authorization: adminData ? `Bearer ${adminData.token}` : "",
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, config);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Admin API call failed:", error);
      // Fallback to demo data
      return this.getDemoData(endpoint);
    }
  }

  getDemoData(endpoint) {
    // Demo data fallback when API is not available
    const demoData = {
      "/admin/stats": {
        totalUsers: 156,
        activeUsers: 89,
        totalMessages: 1247,
        totalConnections: 423,
        newUsersToday: 12,
        pendingReports: 5,
      },
      "/admin/activities": [
        {
          id: 1,
          type: "user_signup",
          description: "New user registered: Sarah Johnson",
          timestamp: new Date(Date.now() - 30 * 60000),
          user: { name: "Sarah Johnson", id: "user-123" },
        },
        {
          id: 2,
          type: "connection_made",
          description: "Alex Chen connected with Maria Garcia",
          timestamp: new Date(Date.now() - 45 * 60000),
          users: [{ name: "Alex Chen" }, { name: "Maria Garcia" }],
        },
        {
          id: 3,
          type: "message_sent",
          description: "Study group formed for Calculus",
          timestamp: new Date(Date.now() - 2 * 3600000),
          group: "Calculus Study Group",
        },
      ],
    };

    return demoData[endpoint] || null;
  }

  async loadAdminStats() {
    try {
      this.showLoading("stats");
      
      // Load real stats from Firestore
      await this.ensureFirebase();
      
      if (!this.db) {
        throw new Error("Database not available");
      }

      const [usersSnapshot, connectionsSnapshot, conversationsSnapshot] = await Promise.all([
        this.db.collection("users").get(),
        this.db.collection("connections").get(),
        this.db.collection("conversations").get(),
      ]);

      const totalUsers = usersSnapshot.size;
      const activeUsers = usersSnapshot.docs.filter(doc => !doc.data().deleted).length;
      const totalConnections = connectionsSnapshot.docs.filter(doc => doc.data().status === "accepted").length;
      
      let totalMessages = 0;
      conversationsSnapshot.forEach(doc => {
        totalMessages += doc.data().messageCount || 0;
      });

      // Count new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = usersSnapshot.docs.filter(doc => {
        const userData = doc.data();
        const createdAt = userData.createdAt && userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt || 0);
        return createdAt >= today && !doc.data().deleted;
      }).length;

      this.stats = {
        totalUsers,
        activeUsers,
        totalMessages,
        totalConnections,
        newUsersToday,
        pendingReports: 0, // Can be implemented later if needed
      };

      this.updateStatsUI();
    } catch (error) {
      console.error("Error loading admin stats:", error);
      this.showError("Failed to load statistics");
    } finally {
      this.hideLoading("stats");
    }
  }

  updateStatsUI() {
    // Update stats using h3 elements like user dashboard stat cards
    const totalUsersEl = document.getElementById("adminTotalUsers");
    const activeUsersEl = document.getElementById("adminActiveUsers");
    const totalMessagesEl = document.getElementById("adminTotalMessages");
    const totalConnectionsEl = document.getElementById("adminTotalConnections");
    const newUsersTodayEl = document.getElementById("adminNewUsersToday");
    
    if (totalUsersEl) totalUsersEl.textContent = this.stats.totalUsers.toLocaleString();
    if (activeUsersEl) activeUsersEl.textContent = this.stats.activeUsers.toLocaleString();
    if (totalMessagesEl) totalMessagesEl.textContent = this.stats.totalMessages.toLocaleString();
    if (totalConnectionsEl) totalConnectionsEl.textContent = this.stats.totalConnections.toLocaleString();
    if (newUsersTodayEl) newUsersTodayEl.textContent = this.stats.newUsersToday.toLocaleString();
  }

  async loadRecentActivities() {
    try {
      // Load recent activities from Firestore - dynamic data only
      await this.ensureFirebase();
      
      if (!this.db) {
        console.warn("Database not available for activities");
        const container = document.getElementById("recentActivities");
        if (container) {
          container.innerHTML = '<div class="no-data">Unable to load activities</div>';
        }
        return;
      }

      const activities = [];

      // Get recent user registrations (last 3)
      try {
        const usersSnapshot = await this.db
          .collection("users")
          .orderBy("createdAt", "desc")
          .limit(3)
          .get();

        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          if (!userData.deleted) {
            const createdAt = userData.createdAt && userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt || Date.now());
            activities.push({
              id: doc.id,
              type: "user_signup",
              description: `New user registered: ${userData.name || "Student"}`,
              timestamp: createdAt,
              user: { name: userData.name, id: doc.id },
            });
          }
        });
      } catch (userError) {
        console.warn("Error loading user activities:", userError);
      }

      // Get recent connections (last 2)
      try {
        const connectionsSnapshot = await this.db
          .collection("connections")
          .where("status", "==", "accepted")
          .orderBy("updatedAt", "desc")
          .limit(2)
          .get();

        connectionsSnapshot.forEach(doc => {
          const connData = doc.data();
          const updatedAt = connData.updatedAt && connData.updatedAt.toDate ? connData.updatedAt.toDate() : new Date(connData.updatedAt || Date.now());
          activities.push({
            id: doc.id,
            type: "connection_made",
            description: `${connData.requesterName || "User"} connected with ${connData.receiverName || "User"}`,
            timestamp: updatedAt,
          });
        });
      } catch (connError) {
        console.warn("Error loading connection activities:", connError);
      }

      // Sort by timestamp (most recent first) and take top 5
      activities.sort((a, b) => b.timestamp - a.timestamp);
      const recentActivities = activities.slice(0, 5);

      this.displayRecentActivities(recentActivities);
    } catch (error) {
      console.error("Error loading recent activities:", error);
      const container = document.getElementById("recentActivities");
      if (container) {
        container.innerHTML = '<div class="no-data">Unable to load activities</div>';
      }
    }
  }

  displayRecentActivities(activities) {
    const container = document.getElementById("recentActivities");
    if (!container) return;

    if (!activities || activities.length === 0) {
      container.innerHTML = '<div class="no-data">No recent activities</div>';
      return;
    }

    container.innerHTML = activities
      .map(
        (activity) => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(
                      activity.type
                    )}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-description">${activity.description}</p>
                    <span class="activity-time">${this.formatTime(
                      activity.timestamp
                    )}</span>
                </div>
            </div>
        `
      )
      .join("");
  }

  getActivityIcon(type) {
    const icons = {
      user_signup: "user-plus",
      connection_made: "user-friends",
      message_sent: "comments",
      report_submitted: "flag",
      study_group_created: "users",
    };
    return icons[type] || "circle";
  }

  showAdminSection(sectionId) {
    // Hide all dashboard sections - using dashboard-section class like user dashboard
    document.querySelectorAll(".dashboard-section").forEach((section) => {
      section.classList.remove("active");
      section.classList.add("hidden");
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add("active");
      targetSection.classList.remove("hidden");
    }

    // Update active nav - using nav-link class like user dashboard
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("data-section") === sectionId) {
        link.classList.add("active");
      }
    });

    // Load section-specific data
    if (sectionId === "adminUsersSection") {
      if (typeof adminUsersManager !== "undefined") {
        adminUsersManager.loadUsers();
      } else {
        console.error('adminUsersManager not available');
      }
    } else if (sectionId === "adminDashboardSection") {
      this.loadAdminStats();
      this.loadRecentActivities();
    } else if (sectionId === "adminAnalyticsSection") {
      // Analytics section - can add functionality here
      console.log('Analytics section loaded');
    } else if (sectionId === "adminSettingsSection") {
      // Settings section - can add functionality here
      console.log('Settings section loaded');
    }
  }

  updateAdminUI() {
    const currentAdmin = adminAuth.getCurrentAdmin();
    if (currentAdmin) {
      const adminNameElement = document.getElementById("adminUserName");
      if (adminNameElement) {
        adminNameElement.textContent =
          currentAdmin.username || currentAdmin.name;
      }

      const adminRoleElement = document.getElementById("adminUserRole");
      if (adminRoleElement) {
        adminRoleElement.textContent = currentAdmin.role || "Administrator";
      }
    }
  }

  async exportAdminData() {
    try {
      this.showLoading("export");
      const exportData = await this.apiCall("/admin/export");

      // Create and download CSV file
      const csvContent = this.convertToCSV(exportData);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `academico-data-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      this.showSuccess("Data exported successfully!");
    } catch (error) {
      console.error("Error exporting data:", error);
      this.showError("Failed to export data");
    } finally {
      this.hideLoading("export");
    }
  }

  convertToCSV(data) {
    // Simple CSV conversion - you can enhance this based on your data structure
    const headers = ["Type", "Count", "Date"];
    const rows = [
      ["Total Users", this.stats.totalUsers, new Date().toISOString()],
      ["Active Users", this.stats.activeUsers, new Date().toISOString()],
      ["Total Messages", this.stats.totalMessages, new Date().toISOString()],
      [
        "Total Connections",
        this.stats.totalConnections,
        new Date().toISOString(),
      ],
    ];

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  showLoading(type) {
    const elements = {
      stats: document.getElementById("refreshStatsBtn"),
      export: document.getElementById("exportDataBtn"),
    };

    const element = elements[type];
    if (element) {
      const originalText = element.innerHTML;
      element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      element.disabled = true;
      element.setAttribute("data-original-text", originalText);
    }
  }

  hideLoading(type) {
    const elements = {
      stats: document.getElementById("refreshStatsBtn"),
      export: document.getElementById("exportDataBtn"),
    };

    const element = elements[type];
    if (element && element.getAttribute("data-original-text")) {
      element.innerHTML = element.getAttribute("data-original-text");
      element.disabled = false;
    }
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
            <i class="fas fa-${
              type === "error" ? "exclamation-circle" : "check-circle"
            }"></i>
            ${message}
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  formatTime(date) {
    if (!date) return "Unknown";
    if (!(date instanceof Date)) date = new Date(date);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }
}

// Global admin dashboard instance
const adminDashboard = new AdminDashboard();
