// Admin Users Management with Real Firebase Data
class AdminUsersManager {
  constructor() {
    this.users = [];
    this.currentPage = 1;
    this.usersPerPage = 10;
    this.filters = {
      search: "",
      status: "all",
      role: "all",
    };
    this.db = null;
  }

  async ensureFirebase() {
    if (this.db) return this.db;

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

  async loadUsers() {
    try {
      this.showLoading();

      await this.ensureFirebase();
      
      if (!this.db) {
        throw new Error("Database not available");
      }

      // Fetch all users from Firestore
      const usersSnapshot = await this.db.collection("users").get();
      
      // Fetch connections to count user connections
      const connectionsSnapshot = await this.db.collection("connections").get();
      
      // Build connection count map
      const connectionCounts = {};
      connectionsSnapshot.forEach(doc => {
        const connData = doc.data();
        if (connData.status === "accepted" && connData.participantIds) {
          connData.participantIds.forEach(userId => {
            connectionCounts[userId] = (connectionCounts[userId] || 0) + 1;
          });
        }
      });

      // Transform Firestore data to user objects
      this.users = usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        const createdAt = userData.createdAt && userData.createdAt.toDate 
          ? userData.createdAt.toDate() 
          : userData.createdAt 
          ? new Date(userData.createdAt) 
          : new Date();
        
        return {
          id: doc.id,
          name: userData.name || "Unknown",
          email: userData.email || "No email",
          university: userData.university || "Not specified",
          course: userData.course || "Not specified",
          country: userData.country || "Not specified",
          status: userData.deleted ? "deleted" : (userData.status || "active"),
          role: userData.isAdmin ? "admin" : "student",
          joinDate: createdAt,
          lastActive: userData.lastActive && userData.lastActive.toDate 
            ? userData.lastActive.toDate() 
            : userData.lastActive 
            ? new Date(userData.lastActive) 
            : createdAt,
          connections: connectionCounts[doc.id] || 0,
          reports: 0, // Reports feature not implemented yet
          deleted: userData.deleted || false,
        };
      });

      // Sort by join date (newest first)
      this.users.sort((a, b) => b.joinDate - a.joinDate);

      this.displayUsers();
      this.updatePagination();
    } catch (error) {
      console.error("Error loading users:", error);
      this.showError("Failed to load users. Please refresh the page.");
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
          <td colspan="9" class="no-data">
            <div style="text-align: center; padding: 40px;">
              <i class="fas fa-users" style="font-size: 48px; color: #95a5a6; margin-bottom: 15px; opacity: 0.5;"></i>
              <p style="color: #6c757d; font-size: 16px;">No users found matching your criteria</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = paginatedUsers
      .map(
        (user) => `
          <tr class="user-row">
            <td>
              <div class="user-info">
                <div class="user-avatar">${(user.name || "U").charAt(0).toUpperCase()}</div>
                <div>
                  <div class="user-name">${user.name || "Unknown"}</div>
                  <div class="user-email">${user.email || "No email"}</div>
                </div>
              </div>
            </td>
            <td>${user.university || "Not specified"}</td>
            <td>${user.course || "Not specified"}</td>
            <td>
              <span class="connections-badge">${user.connections || 0}</span>
            </td>
            <td>
              <span class="reports-badge">${user.reports || 0}</span>
            </td>
            <td>
              <span class="status-badge status-${user.status}">
                ${user.status === "deleted" ? "Deleted" : user.status === "active" ? "Active" : user.status === "suspended" ? "Suspended" : "Inactive"}
              </span>
            </td>
            <td>${this.formatDate(user.joinDate)}</td>
            <td>${this.formatTime(user.lastActive)}</td>
            <td>
              <div class="user-actions">
                <button class="user-action-btn view-btn" onclick="adminUsersManager.viewUser('${user.id}')" title="View User">
                  <i class="fas fa-eye"></i>
                </button>
                ${!user.deleted ? `
                  <button class="user-action-btn edit-btn" onclick="adminUsersManager.editUser('${user.id}')" title="Edit User">
                    <i class="fas fa-edit"></i>
                  </button>
                  ${user.status === "active"
                    ? `<button class="user-action-btn suspend-btn" onclick="adminUsersManager.suspendUser('${user.id}')" title="Suspend User">
                        <i class="fas fa-pause"></i>
                      </button>`
                    : `<button class="user-action-btn activate-btn" onclick="adminUsersManager.activateUser('${user.id}')" title="Activate User">
                        <i class="fas fa-play"></i>
                      </button>`
                  }
                  <button class="user-action-btn delete-btn" onclick="adminUsersManager.deleteUser('${user.id}')" title="Delete User">
                    <i class="fas fa-trash"></i>
                  </button>
                ` : `
                  <button class="user-action-btn restore-btn" onclick="adminUsersManager.restoreUser('${user.id}')" title="Restore User">
                    <i class="fas fa-undo"></i>
                  </button>
                  <button class="user-action-btn permanent-delete-btn" onclick="adminUsersManager.permanentDeleteUser('${user.id}')" title="Permanently Delete">
                    <i class="fas fa-user-slash"></i>
                  </button>
                `}
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
        (user.name && user.name.toLowerCase().includes(this.filters.search.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(this.filters.search.toLowerCase())) ||
        (user.university && user.university.toLowerCase().includes(this.filters.search.toLowerCase())) ||
        (user.course && user.course.toLowerCase().includes(this.filters.search.toLowerCase()));

      const matchesStatus =
        this.filters.status === "all" || 
        (this.filters.status === "active" && user.status === "active" && !user.deleted) ||
        (this.filters.status === "suspended" && user.status === "suspended") ||
        (this.filters.status === "inactive" && user.status === "inactive");

      const matchesRole =
        this.filters.role === "all" || user.role === this.filters.role;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }

  paginateUsers(users) {
    const startIndex = (this.currentPage - 1) * this.usersPerPage;
    return users.slice(startIndex, startIndex + this.usersPerPage);
  }

  updatePagination() {
    const filteredUsers = this.applyFilters();
    const totalPages = Math.ceil(filteredUsers.length / this.usersPerPage) || 1;

    const paginationContainer = document.getElementById("adminUsersPagination");
    if (!paginationContainer) return;

    const startIndex = (this.currentPage - 1) * this.usersPerPage;
    const endIndex = Math.min(startIndex + this.usersPerPage, filteredUsers.length);

    paginationContainer.innerHTML = `
      <div class="pagination-info">
        Showing ${startIndex + 1} to ${endIndex} of ${filteredUsers.length} users
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn" ${this.currentPage === 1 ? "disabled" : ""} 
          onclick="adminUsersManager.previousPage()">
          <i class="fas fa-chevron-left"></i> Previous
        </button>
        <span class="pagination-current">Page ${this.currentPage} of ${totalPages}</span>
        <button class="pagination-btn" ${this.currentPage === totalPages ? "disabled" : ""} 
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

  // User management actions with Firebase
  async viewUser(userId) {
    try {
      await this.ensureFirebase();
      if (!this.db) {
        throw new Error("Database not available");
      }

      const userDoc = await this.db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const createdAt = userData.createdAt && userData.createdAt.toDate 
        ? userData.createdAt.toDate() 
        : userData.createdAt 
        ? new Date(userData.createdAt) 
        : new Date();

      // Get connection count
      const connectionsSnapshot = await this.db
        .collection("connections")
        .where("participantIds", "array-contains", userId)
        .where("status", "==", "accepted")
        .get();

      const user = {
        id: userDoc.id,
        name: userData.name || "Unknown",
        email: userData.email || "No email",
        university: userData.university || "Not specified",
        course: userData.course || "Not specified",
        country: userData.country || "Not specified",
        availability: userData.availability || "Not specified",
        studyType: userData.studyType || "Not specified",
        status: userData.deleted ? "deleted" : (userData.status || "active"),
        role: userData.isAdmin ? "admin" : "student",
        joinDate: createdAt,
        lastActive: userData.lastActive && userData.lastActive.toDate 
          ? userData.lastActive.toDate() 
          : userData.lastActive 
          ? new Date(userData.lastActive) 
          : createdAt,
        connections: connectionsSnapshot.size,
        reports: 0,
      };

      this.showUserModal(user);
    } catch (error) {
      console.error("Error viewing user:", error);
      const user = this.users.find((u) => u.id === userId);
      if (user) {
        this.showUserModal(user);
      } else {
        this.showNotification("User not found", "error");
      }
    }
  }

  showUserModal(user) {
    const modalHtml = `
      <div class="modal" id="userViewModal">
        <div class="modal-overlay" onclick="adminUsersManager.closeUserModal()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>User Details</h3>
            <button class="modal-close" onclick="adminUsersManager.closeUserModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="user-detail-card">
              <div class="user-detail-header">
                <div class="user-detail-avatar">${(user.name || "U").charAt(0).toUpperCase()}</div>
                <div>
                  <h4>${user.name || "Unknown"}</h4>
                  <p class="user-detail-email">${user.email || "No email"}</p>
                </div>
              </div>
              <div class="user-detail-info">
                <div class="detail-row">
                  <label><i class="fas fa-university"></i> University:</label>
                  <span>${user.university || "Not specified"}</span>
                </div>
                <div class="detail-row">
                  <label><i class="fas fa-book"></i> Course:</label>
                  <span>${user.course || "Not specified"}</span>
                </div>
                <div class="detail-row">
                  <label><i class="fas fa-globe"></i> Country:</label>
                  <span>${user.country || "Not specified"}</span>
                </div>
                <div class="detail-row">
                  <label><i class="fas fa-clock"></i> Availability:</label>
                  <span>${user.availability || "Not specified"}</span>
                </div>
                <div class="detail-row">
                  <label><i class="fas fa-users"></i> Study Type:</label>
                  <span>${user.studyType || "Not specified"}</span>
                </div>
                <div class="detail-row">
                  <label><i class="fas fa-info-circle"></i> Status:</label>
                  <span class="status-badge status-${user.status}">${user.status === "deleted" ? "Deleted" : user.status === "active" ? "Active" : user.status === "suspended" ? "Suspended" : "Inactive"}</span>
                </div>
                <div class="detail-row">
                  <label><i class="fas fa-user-tag"></i> Role:</label>
                  <span>${user.role === "admin" ? "Admin" : "Student"}</span>
                </div>
                <div class="detail-row">
                  <label><i class="fas fa-user-friends"></i> Connections:</label>
                  <span>${user.connections || 0}</span>
                </div>
                <div class="detail-row">
                  <label><i class="fas fa-calendar"></i> Join Date:</label>
                  <span>${this.formatDate(user.joinDate)}</span>
                </div>
                <div class="detail-row">
                  <label><i class="fas fa-clock"></i> Last Active:</label>
                  <span>${this.formatTime(user.lastActive)}</span>
                </div>
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
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      this.showNotification("User not found", "error");
      return;
    }

    const newName = prompt("Enter new name:", user.name);
    if (newName === null || newName.trim() === "") return;

    const newUniversity = prompt("Enter new university:", user.university);
    if (newUniversity === null) return;

    const newCourse = prompt("Enter new course:", user.course);
    if (newCourse === null) return;

    try {
      await this.ensureFirebase();
      if (!this.db) {
        throw new Error("Database not available");
      }

      await this.db.collection("users").doc(userId).update({
        name: newName.trim(),
        university: newUniversity.trim(),
        course: newCourse.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      this.showNotification("User updated successfully", "success");
      await this.loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      this.showNotification("Failed to update user", "error");
    }
  }

  async suspendUser(userId) {
    if (!confirm("Are you sure you want to suspend this user?")) {
      return;
    }

    try {
      await this.ensureFirebase();
      if (!this.db) {
        throw new Error("Database not available");
      }

      await this.db.collection("users").doc(userId).update({
        status: "suspended",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      this.showNotification("User suspended successfully", "success");
      await this.loadUsers();
    } catch (error) {
      console.error("Error suspending user:", error);
      this.showNotification("Failed to suspend user", "error");
    }
  }

  async activateUser(userId) {
    try {
      await this.ensureFirebase();
      if (!this.db) {
        throw new Error("Database not available");
      }

      await this.db.collection("users").doc(userId).update({
        status: "active",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      this.showNotification("User activated successfully", "success");
      await this.loadUsers();
    } catch (error) {
      console.error("Error activating user:", error);
      this.showNotification("Failed to activate user", "error");
    }
  }

  async deleteUser(userId) {
    if (!confirm("Are you sure you want to move this user to trash? They can be restored later.")) {
      return;
    }

    try {
      await this.ensureFirebase();
      if (!this.db) {
        throw new Error("Database not available");
      }

      await this.db.collection("users").doc(userId).update({
        deleted: true,
        status: "deleted",
        deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      this.showNotification("User moved to trash successfully", "success");
      await this.loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      this.showNotification("Failed to delete user", "error");
    }
  }

  async restoreUser(userId) {
    if (!confirm("Are you sure you want to restore this user from trash?")) {
      return;
    }

    try {
      await this.ensureFirebase();
      if (!this.db) {
        throw new Error("Database not available");
      }

      await this.db.collection("users").doc(userId).update({
        deleted: firebase.firestore.FieldValue.delete(),
        deletedAt: firebase.firestore.FieldValue.delete(),
        status: "active",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      this.showNotification("User restored successfully", "success");
      await this.loadUsers();
    } catch (error) {
      console.error("Error restoring user:", error);
      this.showNotification("Failed to restore user", "error");
    }
  }

  async permanentDeleteUser(userId) {
    if (!confirm("WARNING: Are you absolutely sure you want to permanently delete this user? This action cannot be undone.")) {
      return;
    }
    if (!confirm("FINAL CONFIRMATION: This will permanently delete the user and all associated data. There is NO UNDO. Proceed?")) {
      return;
    }

    try {
      await this.ensureFirebase();
      if (!this.db) {
        throw new Error("Database not available");
      }

      await this.db.collection("users").doc(userId).delete();

      this.showNotification("User permanently deleted", "success");
      await this.loadUsers();
    } catch (error) {
      console.error("Error permanently deleting user:", error);
      this.showNotification("Failed to permanently delete user", "error");
    }
  }

  // Filter methods
  applySearchFilter(searchTerm) {
    this.filters.search = searchTerm;
    this.currentPage = 1;
    this.displayUsers();
    this.updatePagination();
  }

  applyStatusFilter(status) {
    this.filters.status = status;
    this.currentPage = 1;
    this.displayUsers();
    this.updatePagination();
  }

  showLoading() {
    const container = document.getElementById("adminUsersTableBody");
    if (container) {
      container.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="loading-spinner" style="text-align: center; padding: 40px;">
              <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #2c5aa0;"></i>
              <p style="margin-top: 15px; color: #6c757d;">Loading users...</p>
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
          <td colspan="9" class="error-message" style="text-align: center; padding: 40px;">
            <i class="fas fa-exclamation-circle" style="font-size: 32px; color: #e74c3c; margin-bottom: 15px;"></i>
            <p style="color: #e74c3c; font-size: 16px;">${message}</p>
          </td>
        </tr>
      `;
    }
  }

  showNotification(message, type) {
    if (typeof errorHandler !== "undefined") {
      if (type === "success") {
        errorHandler.showSuccess(message);
      } else {
        errorHandler.showUserError(message);
      }
    } else {
      // Fallback notification
      const notification = document.createElement("div");
      notification.className = `notification notification-${type}`;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === "success" ? "#27ae60" : "#e74c3c"};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
      `;
      notification.innerHTML = `
        <i class="fas fa-${type === "error" ? "exclamation-circle" : "check-circle"}"></i>
        ${message}
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
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

  formatDate(date) {
    if (!date) return "Unknown";
    if (!(date instanceof Date)) date = new Date(date);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// Global admin users manager instance
const adminUsersManager = new AdminUsersManager();
