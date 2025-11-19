// Index Page Functionality
class IndexApp {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkExistingLogin();
  }

  setupEventListeners() {
    // Your existing event listeners for user login/registration

    // Admin login button
    document.getElementById("adminLoginBtn")?.addEventListener("click", () => {
      this.showAdminLoginModal();
    });

    // Close admin modal
    document
      .getElementById("closeAdminModal")
      ?.addEventListener("click", () => {
        this.hideAdminLoginModal();
      });

    // Admin login form
    document
      .getElementById("adminLoginForm")
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleAdminLogin();
      });

    // Close modal when clicking outside
    document
      .getElementById("adminLoginModal")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "adminLoginModal") {
          this.hideAdminLoginModal();
        }
      });
  }

  showAdminLoginModal() {
    const modal = document.getElementById("adminLoginModal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  hideAdminLoginModal() {
    const modal = document.getElementById("adminLoginModal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  async handleAdminLogin() {
    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    if (!email || !password) {
      this.showError("Please fill in all fields");
      return;
    }

    this.showAdminLoading();

    try {
      await adminAuth.adminLogin(email, password);
      this.showAdminSuccess("Admin login successful! Redirecting...");

      // Redirect to admin dashboard
      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 1000);
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideAdminLoading();
    }
  }

  showAdminLoading() {
    const submitBtn = document.querySelector(
      '#adminLoginForm button[type="submit"]'
    );
    if (submitBtn) {
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      submitBtn.disabled = true;
    }
  }

  hideAdminLoading() {
    const submitBtn = document.querySelector(
      '#adminLoginForm button[type="submit"]'
    );
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login as Admin';
      submitBtn.disabled = false;
    }
  }

  showError(message) {
    // Remove existing messages
    this.removeAdminMessages();

    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-error";
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

    const form = document.getElementById("adminLoginForm");
    form.insertBefore(errorDiv, form.firstChild);
  }

  showAdminSuccess(message) {
    this.removeAdminMessages();

    const successDiv = document.createElement("div");
    successDiv.className = "alert alert-success";
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

    const form = document.getElementById("adminLoginForm");
    form.insertBefore(successDiv, form.firstChild);
  }

  removeAdminMessages() {
    const form = document.getElementById("adminLoginForm");
    const alerts = form.querySelectorAll(".alert");
    alerts.forEach((alert) => alert.remove());
  }

  checkExistingLogin() {
    // If admin is already logged in, redirect to admin dashboard
    if (adminAuth.isAdminLoggedIn()) {
      window.location.href = "admin-dashboard.html";
    }

    // If regular user is logged in, redirect to dashboard
    const userData = localStorage.getItem("academico_current_user");
    if (userData) {
      window.location.href = "dashboard.html";
    }
  }
}

// Initialize index app
document.addEventListener("DOMContentLoaded", () => {
  new IndexApp();
});
