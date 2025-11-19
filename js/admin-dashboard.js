// Admin Dashboard Management
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
  }

  async init() {
    if (!adminAuth.isAdminLoggedIn()) {
      window.location.href = "admin-login.html";
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
  }

  async loadAdminStats() {
    try {
      // Simulate API call for stats
      this.stats = {
        totalUsers: 156,
        activeUsers: 89,
        totalMessages: 1247,
        totalConnections: 423,
        newUsersToday: 12,
        pendingReports: 5,
      };

      this.updateStatsUI();
    } catch (error) {
      console.error("Error loading admin stats:", error);
    }
  }

  updateStatsUI() {
    document.getElementById("adminTotalUsers").textContent =
      this.stats.totalUsers;
    document.getElementById("adminActiveUsers").textContent =
      this.stats.activeUsers;
    document.getElementById("adminTotalMessages").textContent =
      this.stats.totalMessages;
    document.getElementById("adminTotalConnections").textContent =
      this.stats.totalConnections;
    document.getElementById("adminNewUsersToday").textContent =
      this.stats.newUsersToday;
    document.getElementById("adminPendingReports").textContent =
      this.stats.pendingReports;
  }

  async loadRecentActivities() {
    try {
      const activities = [
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
      ];

      this.displayRecentActivities(activities);
    } catch (error) {
      console.error("Error loading recent activities:", error);
    }
  }

  displayRecentActivities(activities) {
    const container = document.getElementById("recentActivities");
    if (!container) return;

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
    // Hide all admin sections
    document.querySelectorAll(".admin-section").forEach((section) => {
      section.classList.add("hidden");
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.remove("hidden");
    }

    // Update active nav
    document.querySelectorAll(".admin-nav-link").forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("data-section") === sectionId) {
        link.classList.add("active");
      }
    });

    // Load section-specific data
    if (sectionId === "adminUsersSection") {
      adminUsersManager.loadUsers();
    } else if (sectionId === "adminReportsSection") {
      this.loadReports();
    } else if (sectionId === "adminAnalyticsSection") {
      this.loadAnalytics();
    }
  }

  updateAdminUI() {
    const currentAdmin = adminAuth.getCurrentAdmin();
    if (currentAdmin) {
      const adminNameElement = document.getElementById("adminUserName");
      if (adminNameElement) {
        adminNameElement.textContent = currentAdmin.username;
      }

      const adminRoleElement = document.getElementById("adminUserRole");
      if (adminRoleElement) {
        adminRoleElement.textContent = currentAdmin.role;
      }
    }
  }

  async exportAdminData() {
    // Simulate data export
    alert(
      "Exporting admin data... This would generate a CSV/Excel file in a real application."
    );
  }

  formatTime(date) {
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
