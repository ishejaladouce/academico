// Admin Users Management
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
  }

  async loadUsers() {
    try {
      // Show loading
      this.showLoading();

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Demo users data
      this.users = this.getDemoUsers();
      this.displayUsers();
      this.updatePagination();
    } catch (error) {
      console.error("Error loading users:", error);
      this.showError("Failed to load users");
    }
  }

  getDemoUsers() {
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
      // Add more demo users as needed
    ];
  }

  displayUsers() {
    const container = document.getElementById("adminUsersTableBody");
    if (!container) return;

    const filteredUsers = this.applyFilters();
    const paginatedUsers = this.paginateUsers(filteredUsers);

    if (paginatedUsers.length === 0) {
      container.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data">No users found</td>
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
                <td>${user.university}</td>
                <td>${user.course}</td>
                <td>${user.connections}</td>
                <td>${user.reports}</td>
                <td>
                    <span class="status-badge status-${user.status}">
                        ${user.status}
                    </span>
                </td>
                <td>${user.joinDate.toLocaleDateString()}</td>
                <td>${this.formatTime(user.lastActive)}</td>
                <td>
                    <div class="user-actions">
                        <button class="action-btn view-btn" onclick="adminUsersManager.viewUser('${
                          user.id
                        }')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="adminUsersManager.editUser('${
                          user.id
                        }')">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${
                          user.status === "active"
                            ? `<button class="action-btn suspend-btn" onclick="adminUsersManager.suspendUser('${user.id}')">
                                <i class="fas fa-pause"></i>
                            </button>`
                            : `<button class="action-btn activate-btn" onclick="adminUsersManager.activateUser('${user.id}')">
                                <i class="fas fa-play"></i>
                            </button>`
                        }
                        <button class="action-btn delete-btn" onclick="adminUsersManager.deleteUser('${
                          user.id
                        }')">
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
        user.email.toLowerCase().includes(this.filters.search.toLowerCase());

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

    // Simple pagination display
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
                    Previous
                </button>
                <span class="pagination-current">Page ${
                  this.currentPage
                } of ${totalPages}</span>
                <button class="pagination-btn" ${
                  this.currentPage === totalPages ? "disabled" : ""
                } 
                    onclick="adminUsersManager.nextPage()">
                    Next
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

  // User management actions
  viewUser(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      alert(
        `Viewing user: ${user.name}\nEmail: ${user.email}\nUniversity: ${user.university}\nStatus: ${user.status}`
      );
    }
  }

  editUser(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      alert(
        `Edit user: ${user.name}\nThis would open an edit form in a real application.`
      );
    }
  }

  suspendUser(userId) {
    if (confirm("Are you sure you want to suspend this user?")) {
      const user = this.users.find((u) => u.id === userId);
      if (user) {
        user.status = "suspended";
        this.displayUsers();
        alert(`User ${user.name} has been suspended.`);
      }
    }
  }

  activateUser(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.status = "active";
      this.displayUsers();
      alert(`User ${user.name} has been activated.`);
    }
  }

  deleteUser(userId) {
    if (
      confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      this.users = this.users.filter((u) => u.id !== userId);
      this.displayUsers();
      this.updatePagination();
      alert("User has been deleted.");
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
                        <div class="loading-spinner">Loading users...</div>
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
                    <td colspan="9" class="error-message">${message}</td>
                </tr>
            `;
    }
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

// Global admin users manager instance
const adminUsersManager = new AdminUsersManager();
