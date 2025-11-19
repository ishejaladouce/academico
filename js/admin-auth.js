// Admin Authentication System
class AdminAuth {
  constructor() {
    this.adminUsers = [
      {
        id: 1,
        username: "admin",
        email: "admin@academico.com",
        password: "admin123",
        role: "superadmin",
        createdAt: new Date("2024-01-01"),
      },
    ];
    this.currentAdmin = null;
  }

  // Admin login
  async adminLogin(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const admin = this.adminUsers.find(
          (a) =>
            (a.email === email || a.username === email) &&
            a.password === password
        );

        if (admin) {
          this.currentAdmin = admin;
          localStorage.setItem("academico_admin_user", JSON.stringify(admin));
          resolve(admin);
        } else {
          reject(new Error("Invalid admin credentials"));
        }
      }, 1000);
    });
  }

  // Check if admin is logged in
  isAdminLoggedIn() {
    const adminData = localStorage.getItem("academico_admin_user");
    if (adminData) {
      this.currentAdmin = JSON.parse(adminData);
      return true;
    }
    return false;
  }

  // Admin logout
  adminLogout() {
    this.currentAdmin = null;
    localStorage.removeItem("academico_admin_user");
    window.location.href = "index.html";
  }

  // Get current admin
  getCurrentAdmin() {
    return this.currentAdmin;
  }

  // Verify admin permissions
  hasPermission(permission) {
    if (!this.currentAdmin) return false;

    const permissions = {
      superadmin: ["all"],
      admin: ["view_users", "manage_users", "view_stats", "moderate_content"],
      moderator: ["view_users", "moderate_content"],
    };

    return (
      permissions[this.currentAdmin.role]?.includes("all") ||
      permissions[this.currentAdmin.role]?.includes(permission)
    );
  }
}

// Global admin auth instance
const adminAuth = new AdminAuth();
