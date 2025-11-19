class DashboardApp {
  constructor() {
    this.currentUser = null;
    this.currentSection = "searchSection";
    this.init();
  }

  init() {
    this.checkAuthentication();
    this.setupEventListeners();
    this.loadUserData();
    this.setupNavigation();
    this.loadCountries();
  }

  checkAuthentication() {
    const userData = localStorage.getItem("academico_current_user");
    if (!userData) {
      window.location.href = "index.html";
      return;
    }

    this.currentUser = JSON.parse(userData);
    this.updateUserInterface();
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-link[data-section]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.getAttribute("data-section");
        this.showSection(section);
        this.updateActiveNav(link);
      });
    });

    // User menu
    document.getElementById("userMenuBtn").addEventListener("click", () => {
      this.toggleUserDropdown();
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.logout();
    });

    // Search form
    document
      .getElementById("studySearchForm")
      .addEventListener("submit", (e) => {
        this.handleSearch(e);
      });

    // Study break
    document.getElementById("studyBreakBtn").addEventListener("click", () => {
      this.getStudyBreakActivity();
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".user-menu")) {
        document.getElementById("userDropdown").classList.add("hidden");
      }
    });

    // Admin dashboard
    document
      .getElementById("adminDashboardBtn")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        this.showSection("adminSection");
        this.updateActiveNav(null);
        this.loadAdminData();
      });

    // Connection tabs
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.switchConnectionTab(btn);
      });
    });
  }

  updateUserInterface() {
    if (this.currentUser) {
      document.getElementById("userName").textContent = this.currentUser.name;
      document.getElementById("profileUserName").textContent =
        this.currentUser.name;
      document.getElementById("profileUserEmail").textContent =
        this.currentUser.email;

      if (this.currentUser.university) {
        document.getElementById("profileUserUniversity").textContent =
          this.currentUser.university;
      }
      if (this.currentUser.course) {
        document.getElementById("profileCourse").textContent =
          this.currentUser.course;
      }
      if (this.currentUser.availability) {
        document.getElementById("profileAvailability").textContent =
          this.formatAvailability(this.currentUser.availability);
      }
      if (this.currentUser.studyType) {
        document.getElementById("profileStudyType").textContent =
          this.formatStudyType(this.currentUser.studyType);
      }

      // Show admin dashboard for specific users
      if (
        this.currentUser.email.includes("admin") ||
        this.currentUser.isAdmin
      ) {
        document.querySelectorAll(".admin-only").forEach((el) => {
          el.classList.remove("hidden");
        });
      }
    }
  }

  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll(".dashboard-section").forEach((section) => {
      section.classList.remove("active");
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add("active");
      this.currentSection = sectionId;
    }

    // Load section-specific data
    if (sectionId === "messagesSection") {
      this.loadConversations();
    } else if (sectionId === "connectionsSection") {
      this.loadConnections();
    }
  }

  updateActiveNav(activeLink) {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
    });

    if (activeLink) {
      activeLink.classList.add("active");
    }
  }

  toggleUserDropdown() {
    const dropdown = document.getElementById("userDropdown");
    dropdown.classList.toggle("hidden");
  }

  logout() {
    localStorage.removeItem("academico_current_user");
    window.location.href = "index.html";
  }

  async handleSearch(e) {
    e.preventDefault();

    const filters = {
      course: document.getElementById("courseInput").value,
      availability: document.getElementById("availabilitySelect").value,
      studyType: document.getElementById("studyTypeSelect").value,
      topic: document.getElementById("topicInput").value,
      country: document.getElementById("countryFilter").value,
      university: document.getElementById("universityFilter").value,
    };

    if (!filters.course) {
      errorHandler.showUserError("Please enter a course to search for");
      return;
    }

    this.showLoading("Searching for study partners...");

    try {
      const timezoneData = await apiService.getUserTimezone();
      const results = await this.searchWithDynamicFeatures(
        filters,
        timezoneData
      );
      this.showDynamicResults(results, filters);
    } catch (error) {
      errorHandler.handleApiError(error, "search");
    } finally {
      this.hideLoading();
    }
  }

  async searchWithDynamicFeatures(filters, timezoneData) {
    const users = await authManager.searchUsers(filters);

    return users.map((user) => ({
      ...user,
      localTime: this.calculateLocalTime(timezoneData.timezone),
      matchScore: this.calculateMatchScore(user, filters),
      isOnline: Math.random() > 0.3,
      lastActive: this.getRandomTime(),
      responseTime: this.getRandomResponseTime(),
    }));
  }

  calculateMatchScore(partner, filters) {
    let score = 50;

    if (
      filters.course &&
      partner.course &&
      partner.course.toLowerCase().includes(filters.course.toLowerCase())
    ) {
      score += 20;
    }
    if (
      filters.topic &&
      partner.topic &&
      partner.topic.toLowerCase().includes(filters.topic.toLowerCase())
    ) {
      score += 15;
    }
    if (filters.availability && partner.availability === filters.availability) {
      score += 10;
    }
    if (filters.studyType && partner.studyType === filters.studyType) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  showDynamicResults(partners, filters) {
    const container = document.getElementById("resultsContainer");
    const countElement = document.getElementById("resultsCount");
    const section = document.getElementById("resultsSection");

    if (!container || !countElement || !section) return;

    countElement.textContent = `Found ${partners.length} partners for "${filters.course}"`;
    partners.sort((a, b) => b.matchScore - a.matchScore);

    if (partners.length === 0) {
      container.innerHTML = `
                <div class="no-results">
                    <h3>No study partners found</h3>
                    <p>Try adjusting your search criteria or check back later.</p>
                </div>
            `;
    } else {
      container.innerHTML = partners
        .map((partner) => {
          const tzCompatibility = this.calculateTimezoneCompatibility(partner);
          const badgeClass = `tz-badge ${tzCompatibility.level}`;

          return `
                    <div class="partner-card">
                        <div class="partner-header">
                            <div class="partner-avatar ${
                              partner.isOnline ? "online" : "offline"
                            }">
                                ${
                                  partner.name
                                    ? partner.name.charAt(0).toUpperCase()
                                    : "U"
                                }
                            </div>
                            <div class="partner-info">
                                <h3>${partner.name || "Unknown User"}</h3>
                                <span class="partner-university">${
                                  partner.university || "Student"
                                }</span>
                                <span class="partner-course">${
                                  partner.course || "General"
                                } • ${partner.matchScore}% match</span>
                            </div>
                        </div>
                        
                        <div class="${badgeClass}">
                            ${tzCompatibility.label} • ${
            tzCompatibility.score
          }% time match
                        </div>
                        
                        <div class="partner-details">
                            <div class="detail-item"><strong>Topic:</strong> ${
                              partner.topic || "General"
                            }</div>
                            <div class="detail-item"><strong>Available:</strong> ${this.formatAvailability(
                              partner.availability
                            )}</div>
                            <div class="detail-item"><strong>Local Time:</strong> ${
                              partner.localTime
                            }</div>
                            <div class="detail-item"><strong>Study Style:</strong> ${this.formatStudyType(
                              partner.studyType
                            )}</div>
                            <div class="detail-item"><strong>${
                              partner.responseTime
                            }</strong></div>
                            <div class="last-active">Last active: ${
                              partner.lastActive
                            }</div>
                        </div>
                        <div class="partner-actions">
                            <button class="action-btn chat-btn" onclick="dashboard.startChat('${
                              partner.id
                            }', '${partner.name}')">
                                Message
                            </button>
                            <button class="action-btn connect-btn" onclick="dashboard.connectPartner('${
                              partner.id
                            }')">
                                Connect
                            </button>
                        </div>
                    </div>
                `;
        })
        .join("");
    }

    section.classList.remove("hidden");
  }

  calculateTimezoneCompatibility(partner) {
    const offsets = [0, 1, 2, 3, -5, -8, 5, 7, -3, -1];
    const partnerOffset = offsets[Math.floor(Math.random() * offsets.length)];
    const userOffset = -new Date().getTimezoneOffset() / 60;
    const diff = Math.abs(userOffset - partnerOffset);

    if (diff <= 2) {
      return { score: 95, level: "excellent", label: "Same Region" };
    } else if (diff <= 4) {
      return { score: 80, level: "good", label: "Nearby" };
    } else if (diff <= 6) {
      return { score: 65, level: "fair", label: "Moderate" };
    } else {
      return { score: 50, level: "challenging", label: "Distant" };
    }
  }

  formatAvailability(availability) {
    const formats = {
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      weekend: "Weekend",
    };
    return formats[availability] || "Flexible";
  }

  formatStudyType(studyType) {
    const formats = {
      group: "Group Study",
      pair: "One-on-One",
      project: "Project Collaboration",
    };
    return formats[studyType] || "Any Style";
  }

  calculateLocalTime() {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getRandomTime() {
    const minutes = Math.floor(Math.random() * 120);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }

  getRandomResponseTime() {
    const times = [
      "Usually responds in 5m",
      "Typically replies in 1h",
      "Responds within 30m",
    ];
    return times[Math.floor(Math.random() * times.length)];
  }

  async getStudyBreakActivity() {
    this.showLoading("Finding a study break activity...");

    try {
      const response = await fetch("https://api.adviceslip.com/advice");

      if (response.ok) {
        const data = await response.json();
        alert(
          `Study Break Wisdom:\n\n"${data.slip.advice}"\n\nTake a moment to reflect!`
        );
      } else {
        this.showFallbackStudyBreak();
      }
    } catch (error) {
      this.showFallbackStudyBreak();
    } finally {
      this.hideLoading();
    }
  }

  showFallbackStudyBreak() {
    const fallbackActivities = [
      "Take a 5-minute walk and stretch",
      "Do 10 deep breathing exercises",
      "Get a glass of water and hydrate",
      "Look away from screen for 2 minutes",
    ];
    const activity =
      fallbackActivities[Math.floor(Math.random() * fallbackActivities.length)];
    alert(
      `Study Break Suggestion:\n\n${activity}\n\nYour eyes and brain will thank you!`
    );
  }

  startChat(userId, userName) {
    console.log(`Starting chat with ${userName}`);
    this.showSection("messagesSection");

    // In a real app, this would initialize the chat
    setTimeout(() => {
      errorHandler.showSuccess(`Chat with ${userName} is ready!`);
    }, 500);
  }

  connectPartner(userId) {
    errorHandler.showSuccess(
      "Connection request sent! The user will be notified."
    );
  }

  loadConversations() {
    const conversationsList = document.getElementById("conversationsList");
    if (conversationsList) {
      conversationsList.innerHTML = `
                <div class="conversation-item">
                    <div class="conversation-avatar">AJ</div>
                    <div class="conversation-info">
                        <div class="conversation-name">Alex Johnson</div>
                        <div class="conversation-preview">Hey, are you available to study Calculus?</div>
                    </div>
                    <div class="conversation-time">2m ago</div>
                </div>
                <div class="conversation-item">
                    <div class="conversation-avatar">SC</div>
                    <div class="conversation-info">
                        <div class="conversation-name">Sarah Chen</div>
                        <div class="conversation-preview">Let's schedule our next study session</div>
                    </div>
                    <div class="conversation-time">1h ago</div>
                </div>
            `;
    }
  }

  loadConnections() {
    this.loadMyConnections();
  }

  loadMyConnections() {
    const connectionsGrid = document.getElementById("connectionsGrid");
    if (connectionsGrid) {
      connectionsGrid.innerHTML = `
                <div class="connection-card">
                    <div class="connection-header">
                        <div class="connection-avatar">AJ</div>
                        <div class="connection-info">
                            <h4>Alex Johnson</h4>
                            <p>Computer Science • University of Rwanda</p>
                        </div>
                    </div>
                    <div class="connection-actions">
                        <button class="action-btn chat-btn" onclick="dashboard.startChat('1', 'Alex Johnson')">
                            Message
                        </button>
                        <button class="action-btn video-call-btn">
                            <i class="fas fa-video"></i> Call
                        </button>
                    </div>
                </div>
            `;
    }
  }

  switchConnectionTab(btn) {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((content) => content.classList.remove("active"));

    btn.classList.add("active");
    const tabId = btn.getAttribute("data-tab");
    document.getElementById(tabId).classList.add("active");
  }

  async loadAdminData() {
    try {
      const users = await authManager.getAllUsers();
      this.displayAdminUsers(users);
      this.updateAdminStats(users);
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  }

  displayAdminUsers(users) {
    const tbody = document.getElementById("usersTableBody");
    if (tbody) {
      tbody.innerHTML = users
        .map(
          (user) => `
                <tr>
                    <td>${user.name || "Unknown"}</td>
                    <td>${user.email || "No email"}</td>
                    <td>${user.university || "Not specified"}</td>
                    <td>${user.course || "General"}</td>
                    <td>${new Date().toLocaleDateString()}</td>
                    <td><span style="color: #48bb78;">Active</span></td>
                </tr>
            `
        )
        .join("");
    }
  }

  updateAdminStats(users) {
    document.getElementById("adminTotalUsers").textContent = users.length;
    document.getElementById("adminTotalMessages").textContent = Math.floor(
      users.length * 3.7
    );
    document.getElementById("adminTotalConnections").textContent = Math.floor(
      users.length * 2.3
    );
  }

  async loadCountries() {
    try {
      await countriesService.loadCountries();
      countriesService.populateCountryDropdown("countryFilter");
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  }

  loadUserData() {
    // Load user-specific data like notifications, messages, etc.
    this.updateNotificationCounts();
  }

  updateNotificationCounts() {
    // Simulate notification counts
    document.getElementById("messageNotification").textContent = "3";
    document.getElementById("messageNotification").classList.remove("hidden");

    document.getElementById("connectionNotification").textContent = "2";
    document
      .getElementById("connectionNotification")
      .classList.remove("hidden");
  }

  showLoading(message) {
    this.hideLoading();

    const loadingDiv = document.createElement("div");
    loadingDiv.id = "globalLoading";
    loadingDiv.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 10000; color: white; font-size: 18px;">
                <div style="text-align: center;">
                    <div class="loading-spinner" style="width: 50px; height: 50px; border: 4px solid #e9ecef; border-top: 4px solid #4a90e2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <p>${message}</p>
                </div>
            </div>
        `;

    document.body.appendChild(loadingDiv);
  }

  hideLoading() {
    const existingLoader = document.getElementById("globalLoading");
    if (existingLoader) {
      existingLoader.remove();
    }
  }

  setupNavigation() {
    // Set initial active section
    this.showSection("searchSection");
    this.updateActiveNav(
      document.querySelector('.nav-link[data-section="searchSection"]')
    );
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new DashboardApp();
});
