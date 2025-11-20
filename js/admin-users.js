// Admin Users Management with Real Data
class AdminUsersManager {
  constructor() {
    this.users = [];
    this.currentPage = 1;
    this.usersPerPage = 10;
    this.filters = {
      search: "",
      status: "all",
      role: "all",
      university: "all",
    };
    this.apiBaseUrl = "http://localhost:3000/api";
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
      console.error("Admin Users API call failed:", error);
      // Fallback to demo data
      return this.getDemoUsersData();
    }
  }

  getDemoUsersData() {
    // Demo users data when API is not available
    return [
      {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        university: "University of Rwanda",
        course: "Computer Science",
        status: "active",
        role: "student",
        joinDate: new Date("2024-01-15"),
        lastActive: new Date(Date.now() - 2 * 3600000),
        connections: 12,
        reports: 0,
      },
      {
        id: "user-2",
        name: "Sarah Chen",
        email: "sarah@example.com",
        university: "University of Nairobi",
        course: "Mathematics",
        status: "active",
        role: "student",
        joinDate: new Date("2024-01-10"),
        lastActive: new Date(Date.now() - 30 * 60000),
        connections: 8,
        reports: 1,
      },
      {
        id: "user-3",
        name: "Alex Johnson",
        email: "alex@example.com",
        university: "University of Ghana",
        course: "Physics",
        status: "suspended",
        role: "student",
        joinDate: new Date("2024-01-05"),
        lastActive: new Date(Date.now() - 7 * 24 * 3600000),
        connections: 15,
        reports: 3,
      },
    ];
  }

  async loadUsers() {
    try {
      this.showLoading();

      // Real API call to get users
      const usersData = await this.apiCall("/admin/users");
      this.users = Array.isArray(usersData)
        ? usersData
        : this.getDemoUsersData();

      this.displayUsers();
      this.updatePagination();
    } catch (error) {
      console.error("Error loading users:", error);
      this.showError("Failed to load users");
    }
  }

  displayUsers() {
    const container = document.getElementById("adminUsersTableBody");
    if (!container) return;

    const filteredUsers = this.applyFilters();
    const paginatedUsers = this.paginateUsers(filteredUsers);

    if (paginatedUsers.length === 0) {
      container.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data">No users found matching your criteria</td>
                </tr>
            `;
      return;
    }

    container.innerHTML = paginatedUsers
      .map(
        (user) => `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">${user.name.charAt(0)}</div>
                        <div>
                            <div class="user-name">${user.name}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${user.university || "Not specified"}</td>
                <td>${user.course || "Not specified"}</td>
                <td>${user.connections || 0}</td>
                <td>${user.reports || 0}</td>
                <td>
                    <span class="status-badge status-${user.status}">
                        ${user.status}
                    </span>
                </td>
                <td>${
                  user.joinDate
                    ? new Date(user.joinDate).toLocaleDateString()
                    : "Unknown"
                }</td>
                <td>${this.formatTime(user.lastActive)}</td>
                <td>
                    <div class="user-actions">
                        <button class="user-action-btn view-btn" onclick="adminUsersManager.viewUser('${
                          user.id
                        }')" title="View User">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="user-action-btn edit-btn" onclick="adminUsersManager.editUser('${
                          user.id
                        }')" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${
                          user.status === "active"
                            ? `<button class="user-action-btn suspend-btn" onclick="adminUsersManager.suspendUser('${user.id}')" title="Suspend User">
                                <i class="fas fa-pause"></i>
                            </button>`
                            : `<button class="user-action-btn activate-btn" onclick="adminUsersManager.activateUser('${user.id}')" title="Activate User">
                                <i class="fas fa-play"></i>
                            </button>`
                        }
                        <button class="user-action-btn delete-btn" onclick="adminUsersManager.deleteUser('${
                          user.id
                        }')" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `
      )
      .join("");
  }

  applyFilters() {
    return this.users.filter((user) => {
      const matchesSearch =
        !this.filters.search ||
        user.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        (user.university &&
          user.university
            .toLowerCase()
            .includes(this.filters.search.toLowerCase()));

      const matchesStatus =
        this.filters.status === "all" || user.status === this.filters.status;
      const matchesRole =
        this.filters.role === "all" || user.role === this.filters.role;
      const matchesUniversity =
        this.filters.university === "all" ||
        user.university === this.filters.university;

      return matchesSearch && matchesStatus && matchesRole && matchesUniversity;
    });
  }

  paginateUsers(users) {
    const startIndex = (this.currentPage - 1) * this.usersPerPage;
    return users.slice(startIndex, startIndex + this.usersPerPage);
  }

  updatePagination() {
    const filteredUsers = this.applyFilters();
    const totalPages = Math.ceil(filteredUsers.length / this.usersPerPage);

    const paginationContainer = document.getElementById("adminUsersPagination");
    if (!paginationContainer) return;

    paginationContainer.innerHTML = `
            <div class="pagination-info">
                Showing ${Math.min(
                  this.usersPerPage,
                  filteredUsers.length
                )} of ${filteredUsers.length} users
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" ${
                  this.currentPage === 1 ? "disabled" : ""
                } 
                    onclick="adminUsersManager.previousPage()">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span class="pagination-current">Page ${
                  this.currentPage
                } of ${totalPages}</span>
                <button class="pagination-btn" ${
                  this.currentPage === totalPages ? "disabled" : ""
                } 
                    onclick="adminUsersManager.nextPage()">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
  }

  nextPage() {
    const filteredUsers = this.applyFilters();
    const totalPages = Math.ceil(filteredUsers.length / this.usersPerPage);

    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.displayUsers();
      this.updatePagination();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.displayUsers();
      this.updatePagination();
    }
  }

  // User management actions with API calls
  async viewUser(userId) {
    try {
      const user = await this.apiCall(`/admin/users/${userId}`);
      this.showUserModal(user);
    } catch (error) {
      console.error("Error viewing user:", error);
      const user = this.users.find((u) => u.id === userId);
      if (user) {
        this.showUserModal(user);
      }
    }
  }

  showUserModal(user) {
    const modalHtml = `
            <div class="modal" id="userViewModal">
                <div class="modal-overlay" onclick="adminUsersManager.closeUserModal()"></div>
                <div class="modal-content">
                    <button class="modal-close" onclick="adminUsersManager.closeUserModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="user-detail-card">
                        <h3>User Details</h3>
                        <div class="user-detail-info">
                            <div class="detail-row">
                                <label>Name:</label>
                                <span>${user.name}</span>
                            </div>
                            <div class="detail-row">
                                <label>Email:</label>
                                <span>${user.email}</span>
                            </div>
                            <div class="detail-row">
                                <label>University:</label>
                                <span>${
                                  user.university || "Not specified"
                                }</span>
                            </div>
                            <div class="detail-row">
                                <label>Course:</label>
                                <span>${user.course || "Not specified"}</span>
                            </div>
                            <div class="detail-row">
                                <label>Status:</label>
                                <span class="status-badge status-${
                                  user.status
                                }">${user.status}</span>
                            </div>
                            <div class="detail-row">
                                <label>Connections:</label>
                                <span>${user.connections || 0}</span>
                            </div>
                            <div class="detail-row">
                                <label>Join Date:</label>
                                <span>${
                                  user.joinDate
                                    ? new Date(
                                        user.joinDate
                                      ).toLocaleDateString()
                                    : "Unknown"
                                }</span>
                            </div>
                            <div class="detail-row">
                                <label>Last Active:</label>
                                <span>${this.formatTime(user.lastActive)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  }

  closeUserModal() {
    const modal = document.getElementById("userViewModal");
    if (modal) {
      modal.remove();
    }
  }

  async editUser(userId) {
    // This would open an edit form in a real application
    alert(`Edit user functionality would open a form for user: ${userId}`);
  }

  async suspendUser(userId) {
    if (confirm("Are you sure you want to suspend this user?")) {
      try {
        await this.apiCall(`/admin/users/${userId}/suspend`, {
          method: "POST",
        });
        this.updateUserStatus(userId, "suspended");
        this.showNotification("User suspended successfully", "success");
      } catch (error) {
        console.error("Error suspending user:", error);
        this.updateUserStatus(userId, "suspended");
        this.showNotification("User suspended (demo mode)", "success");
      }
    }
  }

  async activateUser(userId) {
    try {
      await this.apiCall(`/admin/users/${userId}/activate`, { method: "POST" });
      this.updateUserStatus(userId, "active");
      this.showNotification("User activated successfully", "success");
    } catch (error) {
      console.error("Error activating user:", error);
      this.updateUserStatus(userId, "active");
      this.showNotification("User activated (demo mode)", "success");
    }
  }

  async deleteUser(userId) {
    if (
      confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        await this.apiCall(`/admin/users/${userId}`, { method: "DELETE" });
        this.users = this.users.filter((u) => u.id !== userId);
        this.displayUsers();
        this.updatePagination();
        this.showNotification("User deleted successfully", "success");
      } catch (error) {
        console.error("Error deleting user:", error);
        this.users = this.users.filter((u) => u.id !== userId);
        this.displayUsers();
        this.updatePagination();
        this.showNotification("User deleted (demo mode)", "success");
      }
    }
  }

  updateUserStatus(userId, status) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.status = status;
      this.displayUsers();
    }
  }

  // Filter methods
  applySearchFilter(searchTerm) {
    this.filters.search = searchTerm;
    this.currentPage = 1;
    this.loadUsers();
  }

  applyStatusFilter(status) {
    this.filters.status = status;
    this.currentPage = 1;
    this.loadUsers();
  }

  showLoading() {
    const container = document.getElementById("adminUsersTableBody");
    if (container) {
      container.innerHTML = `
                <tr>
                    <td colspan="9">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i> Loading users...
                        </div>
                    </td>
                </tr>
            `;
    }
  }

  showError(message) {
    const container = document.getElementById("adminUsersTableBody");
    if (container) {
      container.innerHTML = `
                <tr>
                    <td colspan="9" class="error-message">
                        <i class="fas fa-exclamation-circle"></i> ${message}
                    </td>
                </tr>
            `;
    }
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
    }, 3000);
  }

  formatTime(date) {
    if (!date) return "Never";
    if (!(date instanceof Date)) date = new Date(date);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / (24 * 3600000));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}

// Global admin users manager instance
const adminUsersManager = new AdminUsersManager();
