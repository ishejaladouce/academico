// Admin Login Functionality for Index Page
class AdminLogin {
  constructor() {
    this.init();
  }

  init() {
    console.log("AdminLogin initialized");
    this.setupEventListeners();
  }

  setupEventListeners() {
    console.log("Setting up admin event listeners...");

    // Admin login button
    const adminLoginBtn = document.getElementById("adminLoginBtn");
    console.log("Admin login button:", adminLoginBtn);

    if (adminLoginBtn) {
      adminLoginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Admin login button clicked");
        this.showAdminLoginModal();
      });
    } else {
      console.error("Admin login button not found!");
    }

    // Close admin modal
    const closeAdminModal = document.getElementById("closeAdminModal");
    if (closeAdminModal) {
      closeAdminModal.addEventListener("click", () => {
        this.hideAdminLoginModal();
      });
    }

    // Admin overlay click
    const adminOverlay = document.getElementById("adminOverlay");
    if (adminOverlay) {
      adminOverlay.addEventListener("click", () => {
        this.hideAdminLoginModal();
      });
    }

    // Admin login form
    const adminLoginForm = document.getElementById("adminLoginForm");
    if (adminLoginForm) {
      adminLoginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("Admin login form submitted");
        this.handleAdminLogin();
      });
    }
  }

  showAdminLoginModal() {
    console.log("Showing admin login modal");
    const modal = document.getElementById("adminLoginModal");
    if (modal) {
      modal.classList.remove("hidden");
      console.log("Admin modal should be visible now");
    } else {
      console.error("Admin login modal not found!");
    }
  }

  hideAdminLoginModal() {
    const modal = document.getElementById("adminLoginModal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  async handleAdminLogin() {
    console.log("Handling admin login...");
    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    console.log("Credentials:", { email, password });

    if (!email || !password) {
      this.showError("Please fill in all fields");
      return;
    }

    this.showAdminLoading();

    try {
      console.log("Attempting admin login...");
      await adminAuth.adminLogin(email, password);
      this.showAdminSuccess("Admin login successful! Redirecting...");

      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 1000);
    } catch (error) {
      console.error("Admin login error:", error);
      this.showError(error.message);
    } finally {
      this.hideAdminLoading();
    }
  }

  showAdminLoading() {
    const submitBtn = document.querySelector(
      "#adminLoginForm .auth-submit-btn"
    );
    if (submitBtn) {
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      submitBtn.disabled = true;
    }
  }

  hideAdminLoading() {
    const submitBtn = document.querySelector(
      "#adminLoginForm .auth-submit-btn"
    );
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login as Admin';
      submitBtn.disabled = false;
    }
  }

  showError(message) {
    this.removeAdminMessages();

    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-error";
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

    const form = document.getElementById("adminLoginForm");
    if (form) {
      form.insertBefore(errorDiv, form.firstChild);
    }
  }

  showAdminSuccess(message) {
    this.removeAdminMessages();

    const successDiv = document.createElement("div");
    successDiv.className = "alert alert-success";
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

    const form = document.getElementById("adminLoginForm");
    if (form) {
      form.insertBefore(successDiv, form.firstChild);
    }
  }

  removeAdminMessages() {
    const form = document.getElementById("adminLoginForm");
    if (form) {
      const alerts = form.querySelectorAll(".alert");
      alerts.forEach((alert) => alert.remove());
    }
  }
}

// Initialize admin login when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing admin login...");
  window.adminLogin = new AdminLogin();
});
