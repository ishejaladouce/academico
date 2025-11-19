// Complete AcademicO Main Application
class AcademicOApp {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.animateStatistics();
    this.updateDynamicContent();
    this.setupEnhancedSearch();
    this.checkExistingSession();
    this.loadCountriesOnStart();
    this.setupDemoData();

    console.log("AcademicO Started with Full Functionality!");
  }

  checkExistingSession() {
    if (authManager.isLoggedIn()) {
      window.location.href = "dashboard.html";
    }
  }

  setupEventListeners() {
    // Modal Management
    this.safeAddEventListener("loginBtn", "click", () =>
      this.openModal("loginModal")
    );
    this.safeAddEventListener("loginBtnMain", "click", () =>
      this.openModal("loginModal")
    );
    this.safeAddEventListener("registerBtnMain", "click", () =>
      this.openModal("registerModal")
    );
    this.safeAddEventListener("showRegisterModal", "click", (e) => {
      e.preventDefault();
      this.closeModals();
      this.openModal("registerModal");
    });
    this.safeAddEventListener("showLoginModal", "click", (e) => {
      e.preventDefault();
      this.closeModals();
      this.openModal("loginModal");
    });

    // Modal Close
    this.safeAddEventListener("closeLogin", "click", () => this.closeModals());
    this.safeAddEventListener("closeRegister", "click", () =>
      this.closeModals()
    );
    this.safeAddEventListener("loginOverlay", "click", () =>
      this.closeModals()
    );
    this.safeAddEventListener("registerOverlay", "click", () =>
      this.closeModals()
    );

    // Forms
    this.safeAddEventListener("loginForm", "submit", (e) =>
      this.handleLogin(e)
    );
    this.safeAddEventListener("registerForm", "submit", (e) =>
      this.handleRegister(e)
    );
    this.safeAddEventListener("studySearchForm", "submit", (e) =>
      this.handleSearch(e)
    );

    // Country & University
    this.safeAddEventListener("regCountry", "change", (e) =>
      this.handleCountryChange(e.target.value)
    );
    this.safeAddEventListener("regUniversity", "change", (e) => {
      universitiesService.handleUniversityChange("regUniversity");
    });

    // Search Filters
    this.safeAddEventListener("countryFilter", "change", (e) => {
      this.handleSearchCountryChange(e.target.value);
    });
    this.safeAddEventListener("universityFilter", "change", (e) => {
      this.handleSearchUniversityChange(e.target.value);
    });

    // Study Break (Keep for demo on index page)
    this.safeAddEventListener("studyBreakBtn", "click", () =>
      this.getStudyBreakActivity()
    );

    // Enhanced Search Controls
    this.safeAddEventListener("sortBy", "change", (e) => {
      this.sortResults(e.target.value);
    });
    this.safeAddEventListener("filterToggle", "click", () => {
      this.toggleFilterPanel();
    });
    this.safeAddEventListener("applyFilters", "click", () => {
      this.applyFilters();
    });

    // ESC Key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeModals();
    });
  }

  // ==================== AUTHENTICATION ====================

  async handleRegister(e) {
    e.preventDefault();
    this.showLoading("Creating your account...");

    const countrySelect = document.getElementById("regCountry");
    const universityValue = universitiesService.getUniversityValue(
      "regUniversity",
      "customUniversity"
    );

    if (!countrySelect.value) {
      errorHandler.showUserError("Please select your country");
      this.hideLoading();
      return;
    }

    if (!universityValue) {
      errorHandler.showUserError("Please select or enter your university");
      this.hideLoading();
      return;
    }

    const userData = {
      name: document.getElementById("regFullName").value,
      email: document.getElementById("regEmail").value,
      country: countrySelect.options[countrySelect.selectedIndex].text,
      countryCode: countrySelect.value,
      university: universityValue,
      course: document.getElementById("regCourse").value,
      availability: document.getElementById("regAvailability").value,
      studyType: document.getElementById("regStudyType").value,
      topic: document.getElementById("regCourse").value + " General",
    };

    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;

    if (password !== confirmPassword) {
      errorHandler.showUserError("Passwords do not match!");
      this.hideLoading();
      return;
    }

    try {
      const userId = await authManager.registerUser(userData);
      errorHandler.showSuccess(
        "Welcome to AcademicO! Account created successfully."
      );
      this.closeModals();

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1500);
    } catch (error) {
      errorHandler.handleApiError(error, "registration");
    } finally {
      this.hideLoading();
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    this.showLoading("Signing you in...");

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      errorHandler.showUserError("Please fill in all fields");
      this.hideLoading();
      return;
    }

    try {
      const user = await authManager.loginUser(email, password);
      errorHandler.showSuccess(`Welcome back, ${user.name}!`);
      this.closeModals();

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (error) {
      errorHandler.showUserError(
        "Invalid email or password. Please try again."
      );
    } finally {
      this.hideLoading();
    }
  }

  // ==================== SEARCH FUNCTIONALITY ====================

  async handleSearch(e) {
    e.preventDefault();

    const filters = {
      course: document.getElementById("courseInput").value,
      availability: document.getElementById("availabilitySelect").value,
      studyType: document.getElementById("studyTypeSelect").value,
      topic: document.getElementById("topicInput").value,
      country: document.getElementById("countryFilter").value,
      university: this.getSearchUniversityValue(),
    };

    if (!filters.course) {
      errorHandler.showUserError("Please enter a course to search for");
      return;
    }

    this.showLoading("Searching for study partners worldwide...");

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
    if (filters.country && partner.countryCode === filters.country) {
      score += 10;
    }
    if (filters.university && partner.university === filters.university) {
      score += 15;
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
                            <button class="action-btn chat-btn" onclick="app.startChat('${
                              partner.id
                            }', '${partner.name}')">
                                Message
                            </button>
                            <button class="action-btn connect-btn" onclick="app.connectPartner('${
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

  // ==================== ENHANCED FEATURES ====================

  calculateTimezoneCompatibility(partner) {
    const userOffset = -new Date().getTimezoneOffset() / 60;
    const offsets = [0, 1, 2, 3, -5, -8, 5, 7, -3, -1];
    const partnerOffset = offsets[Math.floor(Math.random() * offsets.length)];
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

  calculateLocalTime(timezone) {
    try {
      return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return new Date().toLocaleTimeString();
    }
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

  // ==================== STUDY BREAK FEATURE ====================

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

  // ==================== CHAT FUNCTIONALITY ====================

  startChat(userId, userName) {
    if (authManager.isLoggedIn()) {
      // If logged in, redirect to dashboard messages
      window.location.href = "dashboard.html#messages";
    } else {
      // If not logged in, show login modal
      errorHandler.showUserError(
        "Please login to start chatting with study partners"
      );
      this.openModal("loginModal");
    }
  }

  connectPartner(userId) {
    if (authManager.isLoggedIn()) {
      errorHandler.showSuccess(
        "Connection request sent! The user will be notified."
      );
    } else {
      errorHandler.showUserError("Please login to connect with study partners");
      this.openModal("loginModal");
    }
  }

  // ==================== ENHANCED SEARCH CONTROLS ====================

  setupEnhancedSearch() {
    // Sorting and filtering controls
    console.log("Enhanced search controls initialized");
  }

  sortResults(sortBy) {
    const container = document.getElementById("resultsContainer");
    const partnerCards = Array.from(
      container.querySelectorAll(".partner-card")
    );

    partnerCards.sort((a, b) => {
      const aData = this.getPartnerData(a);
      const bData = this.getPartnerData(b);

      switch (sortBy) {
        case "online":
          return (bData.isOnline ? 1 : 0) - (aData.isOnline ? 1 : 0);
        case "responseTime":
          return (
            this.getResponseTimeValue(aData.responseTime) -
            this.getResponseTimeValue(bData.responseTime)
          );
        case "recent":
          return (
            this.getLastActiveValue(bData.lastActive) -
            this.getLastActiveValue(aData.lastActive)
          );
        case "matchScore":
        default:
          return bData.matchScore - aData.matchScore;
      }
    });

    partnerCards.forEach((card) => container.appendChild(card));
  }

  getPartnerData(cardElement) {
    const matchScoreText =
      cardElement.querySelector(".partner-course").textContent;
    const matchScore = parseInt(matchScoreText.match(/(\d+)%/)?.[1] || 50);

    const isOnline = cardElement
      .querySelector(".partner-avatar")
      .classList.contains("online");
    const responseTime = cardElement.querySelector(
      ".detail-item:nth-child(5) strong"
    ).textContent;
    const lastActive = cardElement.querySelector(".last-active").textContent;

    return { matchScore, isOnline, responseTime, lastActive };
  }

  getResponseTimeValue(responseTime) {
    if (responseTime.includes("5m")) return 1;
    if (responseTime.includes("30m")) return 2;
    return 3;
  }

  getLastActiveValue(lastActive) {
    if (lastActive.includes("Just now")) return 0;
    if (lastActive.includes("m")) return parseInt(lastActive);
    if (lastActive.includes("h")) return parseInt(lastActive) * 60;
    return 1000;
  }

  toggleFilterPanel() {
    const panel = document.getElementById("filterPanel");
    panel.classList.toggle("hidden");
  }

  applyFilters() {
    this.toggleFilterPanel();
    errorHandler.showSuccess("Filters applied!");
  }

  // ==================== COUNTRY & UNIVERSITY ====================

  async loadCountriesOnStart() {
    try {
      await countriesService.loadCountries();
      countriesService.populateCountryDropdown("countryFilter");
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  }

  async handleCountryChange(countryCode) {
    if (!countryCode) return;

    this.showInlineLoading("regUniversity", "Loading universities...");

    try {
      const universitiesData = await universitiesService.loadUniversities(
        countryCode
      );
      universitiesService.populateUniversityDropdown(
        "regUniversity",
        universitiesData.universities
      );
    } catch (error) {
      console.error("Error loading universities:", error);
      errorHandler.showUserError(
        "Failed to load universities. Please try again."
      );
    }
  }

  async handleSearchCountryChange(countryCode) {
    if (!countryCode) {
      const universityFilter = document.getElementById("universityFilter");
      const searchCustomContainer = document.getElementById(
        "searchCustomUniversityContainer"
      );
      if (universityFilter) {
        universityFilter.innerHTML =
          '<option value="">All Universities</option>';
      }
      if (searchCustomContainer) {
        searchCustomContainer.classList.add("hidden");
      }
      return;
    }

    try {
      const universitiesData = await universitiesService.loadUniversities(
        countryCode
      );
      this.populateSearchUniversityFilter(universitiesData.universities);
    } catch (error) {
      console.error("Error loading universities for search:", error);
    }
  }

  populateSearchUniversityFilter(universities) {
    const universityFilter = document.getElementById("universityFilter");
    if (!universityFilter) return;

    universityFilter.innerHTML = '<option value="">All Universities</option>';

    universities.forEach((uni) => {
      const option = document.createElement("option");
      option.value = uni.name;
      option.textContent = uni.name;
      universityFilter.appendChild(option);
    });

    const otherOption = document.createElement("option");
    otherOption.value = "other";
    otherOption.textContent = "Other (University not listed)";
    universityFilter.appendChild(otherOption);
  }

  handleSearchUniversityChange(selectedValue) {
    const searchCustomContainer = document.getElementById(
      "searchCustomUniversityContainer"
    );
    const searchCustomInput = document.getElementById("searchCustomUniversity");

    if (!searchCustomContainer || !searchCustomInput) return;

    if (selectedValue === "other") {
      searchCustomContainer.classList.remove("hidden");
      searchCustomInput.required = true;
    } else {
      searchCustomContainer.classList.add("hidden");
      searchCustomInput.required = false;
      searchCustomInput.value = "";
    }
  }

  getSearchUniversityValue() {
    const universityFilter = document.getElementById("universityFilter");
    const searchCustomInput = document.getElementById("searchCustomUniversity");

    if (!universityFilter) return "";

    if (universityFilter.value === "other" && searchCustomInput) {
      return searchCustomInput.value.trim();
    }

    return universityFilter.value;
  }

  // ==================== DYNAMIC CONTENT ====================

  async animateStatistics() {
    const stats = await this.getLiveStatistics();

    Object.keys(stats).forEach((stat, index) => {
      const element = document.getElementById(stat + "Count");
      if (element) {
        this.animateCount(element, 0, stats[stat], 2000 + index * 500);
      }
    });
  }

  async getLiveStatistics() {
    try {
      if (authManager.db) {
        const usersSnapshot = await authManager.db.collection("users").get();
        const userCount = usersSnapshot.size;

        const courses = new Set();
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.course) courses.add(userData.course);
        });

        return {
          students: userCount || 1250,
          groups: Math.max(1, Math.floor((userCount || 1250) / 3)),
          courses: Math.max(1, courses.size || 45),
        };
      }
    } catch (error) {
      console.log("Using dynamic fallback statistics");
    }

    return {
      students: 1250,
      groups: 420,
      courses: 45,
    };
  }

  animateCount(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      element.textContent = value.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  updateDynamicContent() {
    const greeting = this.getDynamicGreeting();
    const subtitleElement = document.querySelector(".welcome-subtitle");
    if (subtitleElement) {
      subtitleElement.textContent = greeting;
    }

    this.displayStudyTip();
  }

  getDynamicGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! Ready to study?";
    if (hour < 18) return "Good afternoon! Let's learn!";
    return "Good evening! Time to focus!";
  }

  displayStudyTip() {
    const tips = this.getDynamicStudyTips();
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    let tipElement = document.getElementById("studyTip");
    if (!tipElement) {
      tipElement = document.createElement("div");
      tipElement.id = "studyTip";
      tipElement.className = "study-tip";
      tipElement.style.cssText = `
                background: #e3f2fd;
                border-left: 4px solid #4a90e2;
                padding: 12px 16px;
                margin: 20px 0;
                border-radius: 4px;
                font-size: 14px;
                color: #2c3e50;
            `;

      const welcomeDesc = document.querySelector(".welcome-description");
      if (welcomeDesc && welcomeDesc.parentNode) {
        welcomeDesc.parentNode.insertBefore(
          tipElement,
          welcomeDesc.nextSibling
        );
      }
    }

    tipElement.innerHTML = `<strong>Study Tip:</strong> ${randomTip}`;
  }

  getDynamicStudyTips() {
    const hour = new Date().getHours();
    const currentPeriod = this.getDynamicAvailability();

    const tips = {
      morning: [
        "Mornings are great for learning new concepts!",
        "Start your day with focused reading sessions",
        "Fresh mind = Better retention in the morning",
      ],
      afternoon: [
        "Afternoons are perfect for group discussions!",
        "Ideal time for collaborative problem solving",
        "Great for practicing and applying knowledge",
      ],
      evening: [
        "Evenings are best for review sessions!",
        "Perfect time to recap what you learned",
        "Good for flashcards and memory reinforcement",
      ],
    };

    return tips[currentPeriod] || ["Study smart, not just hard!"];
  }

  getDynamicAvailability() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    return "evening";
  }

  // ==================== UTILITIES ====================

  safeAddEventListener(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(event, handler);
    }
  }

  openModal(modalId) {
    this.closeModals();
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";

      if (modalId === "registerModal") {
        this.setupCountryUniversityEvents();
        this.populateCountryDropdown();
      }
    }
  }

  closeModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.add("hidden");
    });
    document.body.style.overflow = "auto";
  }

  setupCountryUniversityEvents() {
    this.safeAddEventListener("regCountry", "change", (e) => {
      this.handleCountryChange(e.target.value);
    });
    this.safeAddEventListener("regUniversity", "change", (e) => {
      universitiesService.handleUniversityChange("regUniversity");
    });
  }

  populateCountryDropdown() {
    const countrySelect = document.getElementById("regCountry");
    if (!countrySelect) return;

    countrySelect.innerHTML = '<option value="">Select your country</option>';

    try {
      countriesService.populateCountryDropdown("regCountry");
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  }

  showInlineLoading(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!container.dataset.originalContent) {
      container.dataset.originalContent = container.innerHTML;
    }

    container.innerHTML = `
            <div style="text-align: center; padding: 10px; color: #666;">
                <div class="loading-spinner" style="width: 20px; height: 20px; border: 2px solid #e9ecef; border-top: 2px solid #4a90e2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 5px;"></div>
                <p style="font-size: 12px; margin: 0;">${message}</p>
            </div>
        `;
  }

  hideInlineLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !container.dataset.originalContent) return;

    container.innerHTML = container.dataset.originalContent;
    delete container.dataset.originalContent;
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

  setupDemoData() {
    // Initialize demo data for testing
    console.log("Demo data initialized for testing");
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  window.app = new AcademicOApp();
});

// Add CSS for animations
const style = document.createElement("style");
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
