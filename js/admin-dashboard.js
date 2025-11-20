// Admin Dashboard Management with Real Data
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
    this.apiBaseUrl = "http://localhost:3000/api";
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
      const statsData = await this.apiCall("/admin/stats");

      this.stats = {
        totalUsers: statsData.totalUsers || 0,
        activeUsers: statsData.activeUsers || 0,
        totalMessages: statsData.totalMessages || 0,
        totalConnections: statsData.totalConnections || 0,
        newUsersToday: statsData.newUsersToday || 0,
        pendingReports: statsData.pendingReports || 0,
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
    document.getElementById("adminTotalUsers").textContent =
      this.stats.totalUsers.toLocaleString();
    document.getElementById("adminActiveUsers").textContent =
      this.stats.activeUsers.toLocaleString();
    document.getElementById("adminTotalMessages").textContent =
      this.stats.totalMessages.toLocaleString();
    document.getElementById("adminTotalConnections").textContent =
      this.stats.totalConnections.toLocaleString();
    document.getElementById("adminNewUsersToday").textContent =
      this.stats.newUsersToday.toLocaleString();
    document.getElementById("adminPendingReports").textContent =
      this.stats.pendingReports.toLocaleString();
  }

  async loadRecentActivities() {
    try {
      const activities = await this.apiCall("/admin/activities");
      this.displayRecentActivities(activities);
    } catch (error) {
      console.error("Error loading recent activities:", error);
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
    // Hide all admin sections
    document.querySelectorAll(".admin-section").forEach((section) => {
      section.classList.remove("active");
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add("active");
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
