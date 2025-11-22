// Admin Dashboard - handles statistics, user management, and platform settings
class AdminDashboard {
  constructor() {
    this.stats = {
      totalUsers: 0,
      activeUsers: 0,
      totalMessages: 0,
      totalConnections: 0,
      newUsersToday: 0,
      totalGroups: 0,
      pendingReports: 0,
    };
    this.db = null;
  }

  // Make sure Firebase is ready before using it
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

  // Start up the admin dashboard
  async init() {
    if (!adminAuth || !adminAuth.isAdminLoggedIn()) {
      window.location.href = "index.html";
      return;
    }

    try {
      this.setupAdminEventListeners();
      await this.loadAdminStats();
      await this.loadRecentActivities();
      this.updateAdminUI();
      
      // Update API status after a delay to ensure enhancedAPI is initialized
      setTimeout(() => {
        if (typeof this.updateAPIStatus === "function") {
          this.updateAPIStatus();
        }
      }, 1000);
    } catch (error) {
      console.error("Error initializing admin dashboard:", error);
    }
  }

  // Set up click handlers and event listeners
  setupAdminEventListeners() {
    // Admin logout
    const adminLogoutBtn = document.getElementById("adminLogoutBtn");
    if (adminLogoutBtn) {
      adminLogoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to logout?")) {
          if (typeof adminAuth !== "undefined" && adminAuth.adminLogout) {
      adminAuth.adminLogout();
          } else {
            localStorage.removeItem("academico_admin_user");
            window.location.href = "index.html";
          }
        }
    });
    }

    // Admin navigation - using nav-link class like user dashboard
    document.querySelectorAll(".nav-link[data-section]").forEach((link) => {
      link.addEventListener("click", async (e) => {
        e.preventDefault();
        const section = link.getAttribute("data-section");
        await this.showAdminSection(section);
        
        // Update active nav
        document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
        link.classList.add("active");
      });
    });

    // Admin menu dropdown
    const adminMenuBtn = document.getElementById("adminMenuBtn");
    const adminDropdown = document.getElementById("adminDropdown");
    
    if (adminMenuBtn && adminDropdown) {
      adminMenuBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        adminDropdown.classList.toggle("hidden");
      });
      
      // Close dropdown when clicking outside
      document.addEventListener("click", function(e) {
        if (!adminMenuBtn.contains(e.target) && !adminDropdown.contains(e.target)) {
          adminDropdown.classList.add("hidden");
        }
      });
    } else {
      console.error("Admin menu button or dropdown not found");
    }

    // Quick action buttons
    const refreshStatsBtn = document.getElementById("refreshStatsBtn");
    if (refreshStatsBtn) {
      refreshStatsBtn.addEventListener("click", async () => {
        await this.loadAdminStats();
      });
    }

    const exportDataBtn = document.getElementById("exportDataBtn");
    if (exportDataBtn) {
      exportDataBtn.addEventListener("click", () => {
      this.exportAdminData();
      });
    }

    // Refresh activities button
    const refreshActivitiesBtn = document.getElementById("refreshActivitiesBtn");
    if (refreshActivitiesBtn) {
      refreshActivitiesBtn.addEventListener("click", async () => {
        await this.loadRecentActivities();
      });
    }

    // Edit activities button
    document.getElementById("editActivitiesBtn")?.addEventListener("click", () => {
      this.toggleEditActivities();
    });

    // User search and filters
    const userSearch = document.getElementById("userSearch");
    if (userSearch && typeof adminUsersManager !== "undefined") {
      userSearch.addEventListener("input", (e) => {
      adminUsersManager.applySearchFilter(e.target.value);
    });
    }

    const userStatusFilter = document.getElementById("userStatusFilter");
    if (userStatusFilter && typeof adminUsersManager !== "undefined") {
      userStatusFilter.addEventListener("change", (e) => {
        adminUsersManager.applyStatusFilter(e.target.value);
      });
    }
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

  // Load statistics from Firebase
  async loadAdminStats() {
    const refreshStatsBtn = document.getElementById("refreshStatsBtn");
    const statsGrid = document.getElementById("adminStatsGrid");
    
    try {
      // Show loading state
      if (refreshStatsBtn) {
        const originalHTML = refreshStatsBtn.innerHTML;
        refreshStatsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshStatsBtn.disabled = true;
        refreshStatsBtn.setAttribute("data-original-html", originalHTML);
      }

      if (statsGrid) {
        statsGrid.style.opacity = "0.6";
      }
      
      // Load real stats from Firestore
      await this.ensureFirebase();
      
      if (!this.db) {
        throw new Error("Database not available");
      }

      const [usersSnapshot, connectionsSnapshot, conversationsSnapshot, studyGroupsSnapshot] = await Promise.all([
        this.db.collection("users").get(),
        this.db.collection("connections").get(),
        this.db.collection("conversations").get(),
        this.db.collection("studyGroups").get(),
      ]);

      const totalUsers = usersSnapshot.size;
      const activeUsers = usersSnapshot.docs.filter(doc => !doc.data().deleted).length;
      const totalConnections = connectionsSnapshot.docs.filter(doc => doc.data().status === "accepted").length;
      const totalGroups = studyGroupsSnapshot.size; // Real study groups from studyGroups collection
      
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
        totalGroups,
        pendingReports: 0, // Can be implemented later if needed
      };

      this.updateStatsUI();
      
      // Show success feedback
      this.showSuccess("Statistics refreshed successfully!");
    } catch (error) {
      console.error("Error loading admin stats:", error);
      this.showError("Failed to load statistics. Please try again.");
    } finally {
      // Restore button state
      if (refreshStatsBtn && refreshStatsBtn.getAttribute("data-original-html")) {
        refreshStatsBtn.innerHTML = refreshStatsBtn.getAttribute("data-original-html");
        refreshStatsBtn.disabled = false;
        refreshStatsBtn.removeAttribute("data-original-html");
      }
      
      if (statsGrid) {
        statsGrid.style.opacity = "1";
      }
    }
  }

  // Update the stats display on the page
  updateStatsUI() {
    // Update stats using analytics-value elements (analytics card style)
    const totalUsersEl = document.getElementById("adminTotalUsers");
    const activeUsersEl = document.getElementById("adminActiveUsers");
    const totalMessagesEl = document.getElementById("adminTotalMessages");
    const totalConnectionsEl = document.getElementById("adminTotalConnections");
    const newUsersTodayEl = document.getElementById("adminNewUsersToday");
    const totalGroupsEl = document.getElementById("adminTotalGroups");
    
    if (totalUsersEl) totalUsersEl.textContent = this.stats.totalUsers.toLocaleString();
    if (activeUsersEl) activeUsersEl.textContent = this.stats.activeUsers.toLocaleString();
    if (totalMessagesEl) totalMessagesEl.textContent = this.stats.totalMessages.toLocaleString();
    if (totalConnectionsEl) totalConnectionsEl.textContent = this.stats.totalConnections.toLocaleString();
    if (newUsersTodayEl) newUsersTodayEl.textContent = this.stats.newUsersToday.toLocaleString();
    if (totalGroupsEl) totalGroupsEl.textContent = this.stats.totalGroups.toLocaleString();
    
    // Update API status - with delay to ensure enhancedAPI is loaded
    setTimeout(() => this.updateAPIStatus(), 300);
  }

  // Show how many APIs are working
  updateAPIStatus() {
    const apiStatusEl = document.getElementById("adminAPIStatus");
    if (!apiStatusEl) return;

    try {
      // Wait a bit for enhancedAPI to be initialized
      setTimeout(() => {
        if (typeof enhancedAPI !== "undefined" && enhancedAPI.getAPIStats) {
          const apiStats = enhancedAPI.getAPIStats();
          const activeCount = apiStats.activeAPIs || 0;
          const totalCount = apiStats.totalAPIs || 0;
          console.log(`API Status: ${activeCount}/${totalCount}`, apiStats);
          apiStatusEl.textContent = `${activeCount}/${totalCount}`;
        } else {
          // If enhancedAPI is not available, check if it exists in window
          if (window.enhancedAPI && window.enhancedAPI.getAPIStats) {
            const apiStats = window.enhancedAPI.getAPIStats();
            const activeCount = apiStats.activeAPIs || 0;
            const totalCount = apiStats.totalAPIs || 0;
            apiStatusEl.textContent = `${activeCount}/${totalCount}`;
          } else {
            // Default to showing the APIs we know we're using
            apiStatusEl.textContent = "4/4";
            console.warn("enhancedAPI not available, showing default API count");
          }
        }
      }, 500);
    } catch (error) {
      console.error("Error updating API status:", error);
      // Default to showing APIs we know we're using
      apiStatusEl.textContent = "4/4";
    }
  }

  // Get recent activity from the platform
  async loadRecentActivities() {
    const refreshActivitiesBtn = document.getElementById("refreshActivitiesBtn");
    const container = document.getElementById("recentActivities");
    
    try {
      // Show loading state
      if (refreshActivitiesBtn) {
        const originalHTML = refreshActivitiesBtn.innerHTML;
        refreshActivitiesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshActivitiesBtn.disabled = true;
        refreshActivitiesBtn.setAttribute("data-original-html", originalHTML);
      }

      if (container) {
        container.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading recent activities...</div>';
      }

      // Load recent activities from Firestore - dynamic data only
      await this.ensureFirebase();
      
      if (!this.db) {
        throw new Error("Database not available");
      }

      const activities = [];

      // Get recent user registrations (last 5)
      try {
        const usersSnapshot = await this.db
          .collection("users")
          .orderBy("createdAt", "desc")
          .limit(5)
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
        // Try without orderBy if index doesn't exist
        try {
          const usersSnapshot = await this.db
            .collection("users")
            .limit(5)
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
        } catch (fallbackError) {
          console.warn("Error loading user activities (fallback):", fallbackError);
        }
      }

      // Get recent connections (last 5)
      try {
        const connectionsSnapshot = await this.db
          .collection("connections")
          .where("status", "==", "accepted")
          .orderBy("updatedAt", "desc")
          .limit(5)
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
        // Try without orderBy if index doesn't exist
        try {
          const connectionsSnapshot = await this.db
            .collection("connections")
            .where("status", "==", "accepted")
            .limit(5)
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
        } catch (fallbackError) {
          console.warn("Error loading connection activities (fallback):", fallbackError);
        }
      }

      // Get recent messages (last 3) - conversations with recent activity
      try {
        const conversationsSnapshot = await this.db
          .collection("conversations")
          .orderBy("updatedAt", "desc")
          .limit(3)
          .get();

        conversationsSnapshot.forEach(doc => {
          const convData = doc.data();
          const updatedAt = convData.updatedAt && convData.updatedAt.toDate ? convData.updatedAt.toDate() : new Date(convData.updatedAt || Date.now());
          const participantIds = convData.participants || [];
          if (participantIds.length >= 2) {
            const participantDetails = convData.participantDetails || {};
            const firstParticipant = Object.values(participantDetails)[0] || {};
            const secondParticipant = Object.values(participantDetails)[1] || {};
            activities.push({
              id: doc.id,
              type: "message_sent",
              description: `New message in conversation: ${firstParticipant.name || "User"} & ${secondParticipant.name || "User"}`,
              timestamp: updatedAt,
            });
          }
        });
      } catch (messageError) {
        console.warn("Error loading message activities:", messageError);
      }

      // Sort by timestamp (most recent first) and take top 8
      activities.sort((a, b) => b.timestamp - a.timestamp);
      const recentActivities = activities.slice(0, 8);

      this.displayRecentActivities(recentActivities);
      
      // Show success feedback
      if (refreshActivitiesBtn) {
        this.showSuccess("Activities refreshed successfully!");
      }
    } catch (error) {
      console.error("Error loading recent activities:", error);
      if (container) {
        container.innerHTML = '<div class="no-data" style="text-align: center; padding: 20px; color: #e74c3c;"><i class="fas fa-exclamation-circle"></i> Unable to load activities. Please try again.</div>';
      }
      this.showError("Failed to load activities. Please try again.");
    } finally {
      // Restore button state
      if (refreshActivitiesBtn && refreshActivitiesBtn.getAttribute("data-original-html")) {
        refreshActivitiesBtn.innerHTML = refreshActivitiesBtn.getAttribute("data-original-html");
        refreshActivitiesBtn.disabled = false;
        refreshActivitiesBtn.removeAttribute("data-original-html");
      }
    }
  }

  // Show the activities list
  displayRecentActivities(activities) {
    const container = document.getElementById("recentActivities");
    if (!container) return;

    if (!activities || activities.length === 0) {
      container.innerHTML = '<div class="no-data">No recent activities</div>';
      return;
    }

    const isEditing = container.getAttribute("data-editing") === "true";

    container.innerHTML = activities
      .map(
        (activity, index) => `
            <div class="activity-item" data-activity-index="${index}" data-activity-type="${activity.type}">
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(
                      activity.type
                    )}"></i>
                </div>
                <div class="activity-content">
                    ${isEditing ? `
                      <input type="text" class="activity-edit-input" value="${activity.description.replace(/"/g, '&quot;')}" 
                             data-activity-id="${activity.id || index}">
                    ` : `
                    <p class="activity-description">${activity.description}</p>
                    `}
                    <span class="activity-time">${this.formatTime(
                      activity.timestamp
                    )}</span>
                </div>
                ${isEditing ? `
                  <button class="activity-delete-btn" data-activity-index="${index}">
                    <i class="fas fa-trash"></i>
                    <span>Delete</span>
                  </button>
                ` : ''}
            </div>
        `
      )
      .join("");

    // Add event listeners for edit mode
    if (isEditing) {
      container.querySelectorAll(".activity-delete-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const index = parseInt(btn.getAttribute("data-activity-index"));
          this.deleteActivity(index);
        });
      });

      container.querySelectorAll(".activity-edit-input").forEach(input => {
        input.addEventListener("blur", (e) => {
          const activityId = input.getAttribute("data-activity-id");
          const newDescription = input.value.trim();
          if (newDescription) {
            this.updateActivity(activityId, newDescription);
          }
        });
      });
    }
  }

  toggleEditActivities() {
    const container = document.getElementById("recentActivities");
    if (!container) return;

    const isEditing = container.getAttribute("data-editing") === "true";
    container.setAttribute("data-editing", isEditing ? "false" : "true");
    
    const editBtn = document.getElementById("editActivitiesBtn");
    if (editBtn) {
      if (isEditing) {
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        editBtn.classList.remove("primary");
        editBtn.classList.add("secondary");
      } else {
        editBtn.innerHTML = '<i class="fas fa-save"></i> Save';
        editBtn.classList.remove("secondary");
        editBtn.classList.add("primary");
      }
    }

    // Reload activities to show edit mode
    this.loadRecentActivities();
  }

  deleteActivity(index) {
    // Activities are read-only from Firestore, so we'll just show a message
    // In a production app, you might want to hide activities locally or mark them as hidden
    if (confirm("Note: Activities are read-only. This will only hide the activity from view. Continue?")) {
      const container = document.getElementById("recentActivities");
      if (container) {
        const activityItem = container.querySelector(`[data-activity-index="${index}"]`);
        if (activityItem) {
          activityItem.style.opacity = "0.5";
          activityItem.style.textDecoration = "line-through";
          setTimeout(() => {
            this.loadRecentActivities();
          }, 500);
        }
      }
    }
  }

  updateActivity(activityId, newDescription) {
    // Activities are read-only from Firestore
    // Show a message that activities cannot be edited
    this.showError("Activities are read-only and cannot be edited. They are automatically generated from platform events.");
    console.log("Activity update attempted (read-only):", activityId, "with description:", newDescription);
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

  // Switch between dashboard sections
  async showAdminSection(sectionId) {
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
    try {
      if (sectionId === "adminUsersSection") {
        if (typeof adminUsersManager !== "undefined" && adminUsersManager) {
          await adminUsersManager.loadUsers();
        } else {
          console.error('adminUsersManager not available');
          const tableBody = document.getElementById("adminUsersTableBody");
          if (tableBody) {
            tableBody.innerHTML = `
              <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #e74c3c;">
                  <i class="fas fa-exclamation-triangle"></i> Error: Users manager not loaded. Please refresh the page.
                </td>
              </tr>
            `;
          }
        }
      } else if (sectionId === "adminDashboardSection") {
        await this.loadAdminStats();
        await this.loadRecentActivities();
      } else if (sectionId === "adminSettingsSection") {
        await this.loadSettings();
      }
    } catch (error) {
      console.error("Error loading section data:", error);
    }
  }

  // Update the admin info shown in the header
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

  // Download all data as a CSV file
  async exportAdminData() {
    try {
      this.showLoading("export");
      
      // Ensure Firebase is initialized
      await this.ensureFirebase();
      
      if (!this.db) {
        throw new Error("Database not available");
      }

      // Fetch all data from Firebase
      const [usersSnapshot, connectionsSnapshot, conversationsSnapshot, studyGroupsSnapshot] = await Promise.all([
        this.db.collection("users").get(),
        this.db.collection("connections").get(),
        this.db.collection("conversations").get(),
        this.db.collection("studyGroups").get(),
      ]);

      // Prepare export data
      const exportData = {
        stats: this.stats,
        users: [],
        connections: [],
        conversations: [],
        studyGroups: [],
        exportDate: new Date().toISOString(),
      };

      // Process users
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        exportData.users.push({
          id: doc.id,
          name: userData.name || "",
          email: userData.email || "",
          university: userData.university || "",
          course: userData.course || "",
          country: userData.country || "",
          createdAt: userData.createdAt && userData.createdAt.toDate ? userData.createdAt.toDate().toISOString() : "",
          deleted: userData.deleted || false,
        });
      });

      // Process connections
      connectionsSnapshot.forEach(doc => {
        const connData = doc.data();
        exportData.connections.push({
          id: doc.id,
          requester: connData.requesterName || connData.requesterId || "",
          receiver: connData.receiverName || connData.receiverId || "",
          status: connData.status || "",
          createdAt: connData.createdAt && connData.createdAt.toDate ? connData.createdAt.toDate().toISOString() : "",
        });
      });

      // Process conversations
      conversationsSnapshot.forEach(doc => {
        const convData = doc.data();
        exportData.conversations.push({
          id: doc.id,
          participants: (convData.participants || []).length,
          messageCount: convData.messageCount || 0,
          createdAt: convData.createdAt && convData.createdAt.toDate ? convData.createdAt.toDate().toISOString() : "",
        });
      });

      // Process study groups
      studyGroupsSnapshot.forEach(doc => {
        const groupData = doc.data();
        exportData.studyGroups.push({
          id: doc.id,
          name: groupData.name || "",
          purpose: groupData.purpose || "",
          creator: groupData.creatorName || "",
          members: (groupData.members || []).length,
          createdAt: groupData.createdAt && groupData.createdAt.toDate ? groupData.createdAt.toDate().toISOString() : "",
        });
      });

      // Create and download CSV file
      const csvContent = this.convertToCSV(exportData);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `academico-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      this.showSuccess(`Data exported successfully! (${exportData.users.length} users, ${exportData.connections.length} connections, ${exportData.conversations.length} conversations, ${exportData.studyGroups.length} study groups)`);
    } catch (error) {
      console.error("Error exporting data:", error);
      this.showError("Failed to export data: " + error.message);
    } finally {
      this.hideLoading("export");
    }
  }

  // Turn data into CSV format
  convertToCSV(data) {
    const lines = [];
    const exportDate = new Date().toISOString();
    
    // Add header
    lines.push("AcademicO Data Export");
    lines.push(`Export Date: ${exportDate}`);
    lines.push("");
    
    // Statistics Section
    lines.push("=== STATISTICS ===");
    lines.push("Type,Count,Date");
    lines.push(`Total Users,${data.stats.totalUsers},${exportDate}`);
    lines.push(`Active Users,${data.stats.activeUsers},${exportDate}`);
    lines.push(`Total Messages,${data.stats.totalMessages},${exportDate}`);
    lines.push(`Total Connections,${data.stats.totalConnections},${exportDate}`);
    lines.push(`New Users Today,${data.stats.newUsersToday},${exportDate}`);
    lines.push(`Total Groups,${data.stats.totalGroups},${exportDate}`);
    lines.push("");
    
    // Users Section
    lines.push("=== USERS ===");
    lines.push("ID,Name,Email,University,Course,Country,Created At,Status");
    data.users.forEach(user => {
      const status = user.deleted ? "Deleted" : "Active";
      lines.push([
        user.id,
        `"${(user.name || "").replace(/"/g, '""')}"`,
        user.email || "",
        `"${(user.university || "").replace(/"/g, '""')}"`,
        `"${(user.course || "").replace(/"/g, '""')}"`,
        user.country || "",
        user.createdAt || "",
        status,
      ].join(","));
    });
    lines.push("");
    
    // Connections Section
    lines.push("=== CONNECTIONS ===");
    lines.push("ID,Requester,Receiver,Status,Created At");
    data.connections.forEach(conn => {
      lines.push([
        conn.id,
        `"${(conn.requester || "").replace(/"/g, '""')}"`,
        `"${(conn.receiver || "").replace(/"/g, '""')}"`,
        conn.status || "",
        conn.createdAt || "",
      ].join(","));
    });
    lines.push("");
    
    // Conversations Section
    lines.push("=== CONVERSATIONS ===");
    lines.push("ID,Participants,Message Count,Created At");
    data.conversations.forEach(conv => {
      lines.push([
        conv.id,
        conv.participants || 0,
        conv.messageCount || 0,
        conv.createdAt || "",
      ].join(","));
    });
    lines.push("");
    
    // Study Groups Section
    lines.push("=== STUDY GROUPS ===");
    lines.push("ID,Name,Purpose,Creator,Members,Created At");
    data.studyGroups.forEach(group => {
      lines.push([
        group.id,
        `"${(group.name || "").replace(/"/g, '""')}"`,
        `"${(group.purpose || "").replace(/"/g, '""')}"`,
        `"${(group.creator || "").replace(/"/g, '""')}"`,
        group.members || 0,
        group.createdAt || "",
      ].join(","));
    });
    
    return lines.join("\n");
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

  // Make dates readable like "5m ago" or "2h ago"
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

  async loadAnalytics() {
    const analyticsContent = document.getElementById("adminAnalyticsContent");
    if (!analyticsContent) return;

    try {
      analyticsContent.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading analytics...</div>';
      
      await this.ensureFirebase();
      if (!this.db) {
        throw new Error("Database not available");
      }

      // Load analytics data from Firestore
      const [usersSnapshot, connectionsSnapshot, conversationsSnapshot, studyGroupsSnapshot] = await Promise.all([
        this.db.collection("users").get(),
        this.db.collection("connections").get(),
        this.db.collection("conversations").get(),
        this.db.collection("studyGroups").get(),
      ]);

      const totalUsers = usersSnapshot.size;
      const activeUsers = usersSnapshot.docs.filter(doc => !doc.data().deleted).length;
      const totalConnections = connectionsSnapshot.docs.filter(doc => doc.data().status === "accepted").length;
      const totalGroups = studyGroupsSnapshot.size; // Real study groups
      let totalMessages = 0;
      conversationsSnapshot.forEach(doc => {
        totalMessages += doc.data().messageCount || 0;
      });

      // Calculate growth (users created in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newUsersThisWeek = usersSnapshot.docs.filter(doc => {
        const userData = doc.data();
        const createdAt = userData.createdAt && userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt || 0);
        return createdAt >= sevenDaysAgo && !doc.data().deleted;
      }).length;

      analyticsContent.innerHTML = `
        <div class="analytics-grid">
          <div class="analytics-card">
            <h3><i class="fas fa-users"></i> Total Users</h3>
            <div class="analytics-value">${totalUsers.toLocaleString()}</div>
            <p class="analytics-label">Registered users</p>
          </div>
          <div class="analytics-card">
            <h3><i class="fas fa-user-check"></i> Active Users</h3>
            <div class="analytics-value">${activeUsers.toLocaleString()}</div>
            <p class="analytics-label">Currently active</p>
          </div>
          <div class="analytics-card">
            <h3><i class="fas fa-user-friends"></i> Connections</h3>
            <div class="analytics-value">${totalConnections.toLocaleString()}</div>
            <p class="analytics-label">Total connections</p>
          </div>
          <div class="analytics-card">
            <h3><i class="fas fa-users-cog"></i> Study Groups</h3>
            <div class="analytics-value">${totalGroups.toLocaleString()}</div>
            <p class="analytics-label">Active groups</p>
          </div>
          <div class="analytics-card">
            <h3><i class="fas fa-comments"></i> Messages</h3>
            <div class="analytics-value">${totalMessages.toLocaleString()}</div>
            <p class="analytics-label">Total messages</p>
          </div>
          <div class="analytics-card">
            <h3><i class="fas fa-chart-line"></i> Growth (7 days)</h3>
            <div class="analytics-value">${newUsersThisWeek.toLocaleString()}</div>
            <p class="analytics-label">New users this week</p>
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Error loading analytics:", error);
      analyticsContent.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 40px;">
          <p>Unable to load analytics. Please try again later.</p>
        </div>
      `;
    }
  }

  // Load the settings page
  async loadSettings() {
    const settingsContent = document.getElementById("adminSettingsContent");
    if (!settingsContent) return;

    try {
      settingsContent.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading settings...</div>';
      
      // Load settings from Firestore
      await this.ensureFirebase();
      
      if (!this.db) {
        throw new Error("Database not available");
      }

      // Get current admin info
      const currentAdmin = adminAuth.getCurrentAdmin();
      const adminEmail = currentAdmin ? (currentAdmin.email || currentAdmin.username || "Admin") : "Admin";
      const loginTime = localStorage.getItem("academico_admin_login_time") || "Unknown";

      // Get database statistics
      const [usersSnapshot, connectionsSnapshot, conversationsSnapshot, studyGroupsSnapshot] = await Promise.all([
        this.db.collection("users").get(),
        this.db.collection("connections").get(),
        this.db.collection("conversations").get(),
        this.db.collection("studyGroups").get(),
      ]);

      const totalUsers = usersSnapshot.size;
      const activeUsers = usersSnapshot.docs.filter(doc => !doc.data().deleted).length;
      const totalConnections = connectionsSnapshot.docs.filter(doc => doc.data().status === "accepted").length;
      const totalGroups = studyGroupsSnapshot.size; // Real study groups

      // Calculate storage estimate (rough calculation)
      const estimatedStorage = (totalUsers * 2 + totalConnections * 1 + totalGroups * 3).toFixed(2); // KB estimate

      settingsContent.innerHTML = `
        <div class="settings-grid">
          <div class="settings-card">
            <h3><i class="fas fa-database"></i> Database Information</h3>
            <div class="settings-info">
              <p><strong>Total Users:</strong> ${totalUsers.toLocaleString()}</p>
              <p><strong>Active Users:</strong> ${activeUsers.toLocaleString()}</p>
              <p><strong>Total Connections:</strong> ${totalConnections.toLocaleString()}</p>
              <p><strong>Study Groups:</strong> ${totalGroups.toLocaleString()}</p>
            </div>
            <button class="settings-btn" onclick="adminDashboard.exportAdminData()">
              <i class="fas fa-download"></i> Export All Data
            </button>
          </div>

          <div class="settings-card">
            <h3><i class="fas fa-user-shield"></i> Admin Account</h3>
            <div class="settings-info">
              <p><strong>Email:</strong> ${adminEmail}</p>
              <p><strong>Role:</strong> Administrator</p>
              <p><strong>Session Status:</strong> <span style="color: #27ae60;">Active</span></p>
            </div>
            <button class="settings-btn" onclick="if(confirm('Are you sure you want to logout?')) { adminAuth.adminLogout(); }">
              <i class="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>

          <div class="settings-card">
            <h3><i class="fas fa-cog"></i> Platform Management</h3>
            <div class="settings-info">
              <p>Refresh platform statistics and clear cached data</p>
            </div>
            <button class="settings-btn" onclick="adminDashboard.refreshAllData()">
              <i class="fas fa-sync"></i> Refresh All Data
            </button>
          </div>

          <div class="settings-card">
            <h3><i class="fas fa-info-circle"></i> System Information</h3>
            <div class="settings-info">
              <p><strong>Platform:</strong> AcademicO</p>
              <p><strong>Database:</strong> Firebase Firestore</p>
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <button class="settings-btn" onclick="adminDashboard.showSystemInfo()">
              <i class="fas fa-info"></i> View Details
            </button>
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Error loading settings:", error);
      settingsContent.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 40px;">
          <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #e74c3c; margin-bottom: 20px;"></i>
          <p>Unable to load settings. Please try again later.</p>
          <p style="color: #7f8c8d; margin-top: 10px;">${error.message}</p>
        </div>
      `;
    }
  }

  // Refresh all dashboard data
  async refreshAllData() {
    try {
      this.showSuccess("Refreshing all data...");
      await Promise.all([
        this.loadAdminStats(),
        this.loadRecentActivities(),
      ]);
      this.showSuccess("All data refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing data:", error);
      this.showError("Failed to refresh data");
    }
  }

  // Clear browser cache and localStorage (except admin session)
  clearCache() {
    if (confirm("This will clear all cached data except your admin session. Continue?")) {
      try {
        const adminSession = localStorage.getItem("academico_admin_user");
        localStorage.clear();
        if (adminSession) {
          localStorage.setItem("academico_admin_user", adminSession);
        }
        this.showSuccess("Cache cleared successfully! Page will reload.");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error("Error clearing cache:", error);
        this.showError("Failed to clear cache");
      }
    }
  }

  // Show security information
  showSecurityInfo() {
    const info = `
      <div style="text-align: left; padding: 20px;">
        <h3 style="margin-bottom: 15px;">Security Features</h3>
        <ul style="line-height: 2;">
          <li><strong>Password Hashing:</strong> All passwords are hashed using bcrypt</li>
          <li><strong>Session Management:</strong> Admin sessions stored securely in localStorage</li>
          <li><strong>Firebase Security:</strong> Database rules protect user data</li>
          <li><strong>HTTPS:</strong> All connections use secure protocols</li>
          <li><strong>Data Encryption:</strong> Firebase handles data encryption at rest</li>
        </ul>
        <p style="margin-top: 20px; color: #7f8c8d;">
          <i class="fas fa-shield-alt"></i> Your data is protected by industry-standard security measures.
        </p>
      </div>
    `;
    alert(info.replace(/<[^>]*>/g, '')); // Simple alert, can be enhanced with modal
    this.showSuccess("Security information displayed");
  }

  // Show system information
  showSystemInfo() {
    const info = `
      <div style="text-align: left; padding: 20px;">
        <h3 style="margin-bottom: 15px;">System Information</h3>
        <p><strong>Platform:</strong> AcademicO Study Partner Matching Platform</p>
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Database:</strong> Firebase Firestore</p>
        <p><strong>Authentication:</strong> Custom Firebase-based</p>
        <p><strong>APIs Used:</strong> Countries, Universities, Advice Slip, Open-Meteo</p>
        <p><strong>Browser:</strong> ${navigator.userAgent.split(' ')[0]}</p>
        <p><strong>Screen:</strong> ${screen.width}x${screen.height}</p>
        <p style="margin-top: 20px; color: #7f8c8d;">
          <i class="fas fa-info-circle"></i> Built with vanilla JavaScript and Firebase.
        </p>
      </div>
    `;
    alert(info.replace(/<[^>]*>/g, '')); // Simple alert, can be enhanced with modal
    this.showSuccess("System information displayed");
  }
}

// Global admin dashboard instance
const adminDashboard = new AdminDashboard();
