// Complete AcademicO App - WITH DYNAMIC COUNTRIES & UNIVERSITIES
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
    this.setupDemoAutoResponder();
    this.addDemoChatPartners();
    this.setupDemoUser();
    this.setupNetworkMonitoring();
    
    // Load countries when app starts
    this.loadCountriesOnStart();
    
    console.log("AcademicO Started with Dynamic Countries & Universities!");
  }

  // ==================== DYNAMIC COUNTRIES & UNIVERSITIES ====================

  /**
   * Load countries when app starts
   */
  async loadCountriesOnStart() {
    try {
      console.log('🌍 Loading countries on startup...');
      await countriesService.loadCountries();
      console.log('✅ Countries loaded successfully');
    } catch (error) {
      console.log('❌ Failed to load countries on startup:', error);
    }
  }

  /**
   * Setup country and university events when register modal opens
   */
  setupCountryUniversityEvents() {
    // Country change event
    this.safeAddEventListener('regCountry', 'change', (e) => {
      this.handleCountryChange(e.target.value);
    });

    // University change event for "Other" option
    this.safeAddEventListener('regUniversity', 'change', (e) => {
      universitiesService.handleUniversityChange('regUniversity');
    });
  }

  /**
   * Handle country change - load universities for selected country
   */
  async handleCountryChange(countryCode) {
    if (!countryCode) return;
    
    console.log(`🌍 Country changed to: ${countryCode}`);
    
    // Show loading for universities
    this.showInlineLoading('regUniversity', 'Loading universities...');
    
    try {
      // Load universities for the selected country
      const universitiesData = await universitiesService.loadUniversities(countryCode);
      
      // Populate university dropdown
      universitiesService.populateUniversityDropdown('regUniversity', universitiesData.universities);
      
      console.log(`✅ Loaded ${universitiesData.universities.length} universities for ${countriesService.getCountryName(countryCode)}`);
    } catch (error) {
      console.log('❌ Failed to load universities:', error);
      errorHandler.showUserError('Failed to load universities. Please try again.');
    }
  }

  /**
   * Populate country dropdown when register modal opens
   */
  populateCountryDropdown() {
    const countrySelect = document.getElementById('regCountry');
    if (!countrySelect) {
      console.log('❌ Country select element not found');
      return;
    }

    // Clear loading message
    countrySelect.innerHTML = '<option value="">Select your country</option>';
    
    // Populate with countries
    countriesService.populateCountryDropdown('regCountry');
    
    console.log('✅ Country dropdown populated');
  }

  // ==================== MODAL MANAGEMENT ====================

  /**
   * Open modal with enhanced functionality
   */
  openModal(modalId) {
    this.closeModals();
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";

      // Special handling for register modal
      if (modalId === "registerModal") {
        this.setupCountryUniversityEvents();
        this.populateCountryDropdown();
      }
    }
  }

  // ==================== ENHANCED REGISTRATION ====================

  async handleRegister(e) {
    e.preventDefault();

    // Show loading for registration
    this.showLoading('Creating your account...');

    // Get country and university values
    const countrySelect = document.getElementById('regCountry');
    const universityValue = universitiesService.getUniversityValue('regUniversity', 'customUniversity');
    
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

    // UPDATED: Include new availability and study type fields
    const userData = {
      name: document.getElementById("regFullName").value,
      email: document.getElementById("regEmail").value,
      country: countrySelect.options[countrySelect.selectedIndex].text,
      countryCode: countrySelect.value,
      university: universityValue,
      course: document.getElementById("regCourse").value,
      availability: document.getElementById("regAvailability").value,
      studyType: document.getElementById("regStudyType").value,
      topic: document.getElementById("topicInput").value || "General",
    };

    // Validate passwords
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
        "🎉 Welcome to AcademicO! You are now in our global network."
      );
      this.closeModals();
      this.currentUser = { ...userData, id: userId };

      // Refresh statistics to include new user
      this.animateStatistics();
    } catch (error) {
      errorHandler.handleApiError(error, "registration");
    } finally {
      // Hide loading
      this.hideLoading();
    }
  }

  // ==================== MISSION D: ENHANCED LOADING & ERROR HANDLING ====================

  /**
   * Show loading state
   */
  showLoading(message = "Loading...") {
    this.hideLoading();
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'globalLoading';
    loadingDiv.innerHTML = `
        <div class="loading-overlay">
            <div class="loading-spinner-large"></div>
            <p>${message}</p>
        </div>
    `;
    
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: white;
        font-size: 18px;
    `;
    
    document.body.appendChild(loadingDiv);
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const existingLoader = document.getElementById('globalLoading');
    if (existingLoader) {
      existingLoader.remove();
    }
  }

  /**
   * Show inline loading for specific sections
   */
  showInlineLoading(containerId, message = "Loading...") {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Save original content
    if (!container.dataset.originalContent) {
      container.dataset.originalContent = container.innerHTML;
    }
    
    container.innerHTML = `
        <div class="inline-loading">
            <div class="loading-spinner-small"></div>
            <p style="font-size: 12px; color: #666; margin: 0;">${message}</p>
        </div>
    `;
  }

  /**
   * Hide inline loading
   */
  hideInlineLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !container.dataset.originalContent) return;
    
    container.innerHTML = container.dataset.originalContent;
    delete container.dataset.originalContent;
  }

  /**
   * Enhanced error handling for network failures
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      errorHandler.showSuccess('🌐 Connection restored!');
    });
    
    window.addEventListener('offline', () => {
      errorHandler.showUserError('📡 You appear to be offline. Some features may not work.');
    });
  }

  // ==================== EVENT LISTENERS ====================

  setupEventListeners() {
    // Safe event listener setup
    this.safeAddEventListener("registerForm", "submit", (e) =>
      this.handleRegister(e)
    );
    this.safeAddEventListener("loginForm", "submit", (e) =>
      this.handleLogin(e)
    );
    this.safeAddEventListener("studySearchForm", "submit", (e) =>
      this.handleSearch(e)
    );

    // ADDED: University change event for "Other" option
    this.safeAddEventListener('regUniversity', 'change', (e) => {
      universitiesService.handleUniversityChange('regUniversity');
    });

    // Modal open buttons
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

    // Modal close buttons
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

    // Study break button
    this.safeAddEventListener("studyBreakBtn", "click", () =>
      this.getStudyBreakActivity()
    );

    // ESC key to close modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeModals();
    });
  }

  safeAddEventListener(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(event, handler);
    }
  }

  closeModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.add("hidden");
    });
    document.body.style.overflow = "auto";
  }

  // ==================== EXISTING FUNCTIONALITY ====================

  async handleLogin(e) {
    e.preventDefault();

    // MISSION D: Show loading for login
    this.showLoading('Signing you in...');

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      errorHandler.showUserError("Please fill in all fields");
      this.hideLoading();
      return;
    }

    try {
      // For demo - in real app, verify with Firebase Auth
      this.currentUser = {
        email: email,
        name: email.split("@")[0],
        id: "user-" + Date.now(),
      };

      errorHandler.showSuccess(`👋 Welcome back, ${this.currentUser.name}!`);
      this.closeModals();
    } catch (error) {
      errorHandler.handleApiError(error, "login");
    } finally {
      // MISSION D: Hide loading
      this.hideLoading();
    }
  }

  async handleSearch(e) {
    e.preventDefault();

    const filters = {
      course: document.getElementById("courseInput").value,
      availability: document.getElementById("availabilitySelect").value,
      studyType: document.getElementById("studyTypeSelect").value,
      topic: document.getElementById("topicInput").value,
    };

    // Validate required field
    if (!filters.course) {
      errorHandler.showUserError("Please enter a course to search for");
      return;
    }

    // MISSION D: Enhanced loading with specific message
    this.showLoading('Searching for study partners worldwide...');

    try {
      // Get user's timezone for dynamic matching
      const timezoneData = await apiService.getUserTimezone();

      // Search with dynamic enhancements
      const results = await this.searchWithDynamicFeatures(
        filters,
        timezoneData
      );
      this.showDynamicResults(results, filters);
    } catch (error) {
      errorHandler.handleApiError(error, "search");
    } finally {
      // MISSION D: Hide loading
      this.hideLoading();
    }
  }

  /**
   * DYNAMIC: Enhanced search with real-time data
   */
  async searchWithDynamicFeatures(filters, timezoneData) {
    const users = await authManager.searchUsers(filters);

    // Enhance with dynamic data
    return users.map((user) => ({
      ...user,
      localTime: this.calculateLocalTime(timezoneData.timezone),
      matchScore: this.calculateMatchScore(user, filters),
      isOnline: Math.random() > 0.3, // Simulate online status
      lastActive: this.getRandomTime(),
      responseTime: this.getRandomResponseTime(),
    }));
  }

  /**
   * DYNAMIC: Calculate local time for partner
   */
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

  /**
   * DYNAMIC: Calculate match score
   */
  calculateMatchScore(partner, filters) {
    let score = 50;

    if (
      filters.course &&
      partner.course.toLowerCase().includes(filters.course.toLowerCase())
    ) {
      score += 20;
    }
    if (
      filters.topic &&
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

  /**
   * MISSION C: Calculate timezone compatibility
   */
  calculateTimezoneCompatibility(partner) {
    // Get current user's timezone info
    const userOffset = -new Date().getTimezoneOffset() / 60;
    
    // Generate realistic partner timezone (for demo)
    const offsets = [0, 1, 2, 3, -5, -8, 5, 7, -3, -1];
    const partnerOffset = offsets[Math.floor(Math.random() * offsets.length)];
    
    const diff = Math.abs(userOffset - partnerOffset);
    
    // Calculate compatibility
    if (diff <= 2) {
        return { score: 95, level: 'excellent', label: 'Same Region' };
    } else if (diff <= 4) {
        return { score: 80, level: 'good', label: 'Nearby' };
    } else if (diff <= 6) {
        return { score: 65, level: 'fair', label: 'Moderate' };
    } else {
        return { score: 50, level: 'challenging', label: 'Distant' };
    }
  }

  /**
   * DYNAMIC: Get random "last active" time
   */
  getRandomTime() {
    const minutes = Math.floor(Math.random() * 120);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }

  /**
   * DYNAMIC: Get random response time
   */
  getRandomResponseTime() {
    const times = [
      "Usually responds in 5m",
      "Typically replies in 1h",
      "Responds within 30m",
    ];
    return times[Math.floor(Math.random() * times.length)];
  }

  /**
   * DYNAMIC: Show enhanced results
   */
  showDynamicResults(partners, filters) {
    const container = document.getElementById("resultsContainer");
    const countElement = document.getElementById("resultsCount");
    const section = document.getElementById("resultsSection");

    if (!container || !countElement || !section) return;

    // Update count dynamically
    countElement.textContent = `Found ${partners.length} partners for "${filters.course}"`;

    // Sort by match score
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
        .map(
          (partner) => {
            // Calculate timezone compatibility
            const tzCompatibility = this.calculateTimezoneCompatibility(partner);
            const badgeClass = `tz-badge ${tzCompatibility.level}`;
            
            return `
                <div class="partner-card">
                    <div class="partner-header">
                        <div class="partner-avatar ${partner.isOnline ? "online" : "offline"}">
                            ${partner.name.charAt(0)}
                        </div>
                        <div class="partner-info">
                            <h3>${partner.name} ${partner.isOnline ? "🟢" : "⚫"}</h3>
                            <span class="partner-university">${partner.university || "Student"}</span>
                            <span class="partner-course">${partner.course} • ${partner.matchScore}% match</span>
                        </div>
                    </div>
                    
                    <!-- NEW: Timezone Compatibility Badge -->
                    <div class="${badgeClass}">
                        🌍 ${tzCompatibility.label} • ${tzCompatibility.score}% time match
                    </div>
                    
                    <div class="partner-details">
                        <div class="detail-item">📚 <strong>Topic:</strong> ${partner.topic}</div>
                        <div class="detail-item">⏰ <strong>Available:</strong> ${this.formatAvailability(partner.availability)}</div>
                        <div class="detail-item">🕐 <strong>Local Time:</strong> ${partner.localTime}</div>
                        <div class="detail-item">👥 <strong>Study Style:</strong> ${this.formatStudyType(partner.studyType)}</div>
                        <div class="detail-item">💬 <strong>${partner.responseTime}</strong></div>
                        <div class="last-active">Last active: ${partner.lastActive}</div>
                    </div>
                    <div class="partner-actions">
                        <button class="action-btn chat-btn" onclick="app.startChat('${partner.id}', '${partner.name}')">
                            💬 Message
                        </button>
                        <button class="action-btn connect-btn" onclick="app.connectPartner('${partner.id}')">
                            👥 Connect
                        </button>
                    </div>
                </div>
            `;
          }
        )
        .join("");
    }

    section.classList.remove("hidden");
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

  startChat(userId, userName) {
    console.log(`💬 Starting chat with ${userName} (${userId})`);

    // Safety check - wait for chatService to be ready
    if (typeof chatService === "undefined" || !chatService.isReady()) {
      errorHandler.showUserError(
        "Chat is still loading. Please wait a moment and try again."
      );
      console.log("❌ Chat service not ready yet");
      return;
    }

    // Set up chat modal
    document.getElementById("chatPartnerName").textContent = userName;

    // Initialize chat with chat service
    const currentUser = this.currentUser || {
      id: "demo-user-" + Date.now(),
      name: "You",
    };
    const partner = { id: userId, name: userName };

    chatService.startChat(currentUser, partner);

    // Setup chat event listeners
    this.setupChatEvents(currentUser);

    // Open chat modal
    this.openChatModal();

    errorHandler.showSuccess(
      `Chat opened with ${userName}! Start typing...`
    );
  }

  connectPartner(userId) {
    errorHandler.showSuccess(
      "👥 Connection request sent! The user will be notified."
    );
  }

  /**
   * MISSION A: Enhanced sorting functionality
   */
  setupEnhancedSearch() {
    // Sorting
    this.safeAddEventListener("sortBy", "change", (e) => {
      this.sortResults(e.target.value);
    });

    // Filter toggle
    this.safeAddEventListener("filterToggle", "click", () => {
      this.toggleFilterPanel();
    });

    // Apply filters
    this.safeAddEventListener("applyFilters", "click", () => {
      this.applyFilters();
    });
  }

  /**
   * Sort results based on selected criteria
   */
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

    // Re-append sorted cards
    partnerCards.forEach((card) => container.appendChild(card));
    console.log(`✅ Sorted results by: ${sortBy}`);
  }

  /**
   * Extract partner data from card element
   */
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

  /**
   * Convert response time to sortable value
   */
  getResponseTimeValue(responseTime) {
    if (responseTime.includes("5m")) return 1;
    if (responseTime.includes("30m")) return 2;
    return 3; // 1h or more
  }

  /**
   * Convert last active to sortable value (minutes ago)
   */
  getLastActiveValue(lastActive) {
    if (lastActive.includes("Just now")) return 0;
    if (lastActive.includes("m")) return parseInt(lastActive);
    if (lastActive.includes("h")) return parseInt(lastActive) * 60;
    return 1000; // unknown
  }

  /**
   * Toggle filter panel visibility
   */
  toggleFilterPanel() {
    const panel = document.getElementById("filterPanel");
    panel.classList.toggle("hidden");
  }

  /**
   * Apply selected filters
   */
  applyFilters() {
    const selectedStudyTypes = this.getSelectedCheckboxes("studyType");
    const selectedAvailability = this.getSelectedCheckboxes("availability");

    console.log("Applying filters:", {
      selectedStudyTypes,
      selectedAvailability,
    });

    // For now, just close the panel and show message
    this.toggleFilterPanel();
    errorHandler.showSuccess("Filters applied!");

    // In full implementation, we would re-filter the results
  }

  getSelectedCheckboxes(name) {
    const checkboxes = document.querySelectorAll(
      `input[name="${name}"]:checked`
    );
    return Array.from(checkboxes).map((cb) => cb.value);
  }

  // ==================== CHAT SYSTEM INTEGRATION ====================

  /**
   * Setup chat input events
   */
  setupChatEvents(currentUser) {
    // Send message on button click
    this.safeAddEventListener("sendMessageBtn", "click", () => {
      this.sendChatMessage(currentUser);
    });

    // Send message on Enter key
    this.safeAddEventListener("messageInput", "keypress", (e) => {
      if (e.key === "Enter") {
        this.sendChatMessage(currentUser);
      }
    });

    // Video call button (demo functionality)
    this.safeAddEventListener("startVideoCall", "click", () => {
      errorHandler.showSuccess(
        "📹 Video call would start here! (Integration with WebRTC)"
      );
    });
  }

  /**
   * Send chat message
   */
  sendChatMessage(currentUser) {
    const messageInput = document.getElementById("messageInput");
    const messageText = messageInput.value.trim();

    if (!messageText) {
      errorHandler.showUserError("Please enter a message");
      return;
    }

    if (!chatService.currentChat) {
      errorHandler.showUserError("Chat not properly initialized");
      return;
    }

    chatService.sendMessage(currentUser, messageText);
  }

  /**
   * Open chat modal
   */
  openChatModal() {
    this.closeModals(); // Close other modals first

    const chatModal = document.getElementById("chatModal");
    const chatOverlay = document.getElementById("chatOverlay");

    if (chatModal && chatOverlay) {
      chatModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";

      // Focus on message input
      setTimeout(() => {
        const messageInput = document.getElementById("messageInput");
        if (messageInput) messageInput.focus();
      }, 100);

      // Setup close events
      this.safeAddEventListener("closeChat", "click", () =>
        this.closeChatModal()
      );
      if (chatOverlay) {
        chatOverlay.onclick = () => this.closeChatModal();
      }
    }
  }

  /**
   * Close chat modal
   */
  closeChatModal() {
    const chatModal = document.getElementById("chatModal");
    if (chatModal) {
      chatModal.classList.add("hidden");
      document.body.style.overflow = "auto";
      chatService.closeChat();

      // Clear chat messages for next time
      const chatMessages = document.getElementById("chatMessages");
      if (chatMessages) chatMessages.innerHTML = "";
    }
  }

  // ==================== DEMO CHAT FUNCTIONALITY ====================

  /**
   * Demo: Auto-respond to messages (for testing)
   */
  setupDemoAutoResponder() {
    // Listen for new messages and auto-respond
    if (typeof firebase !== "undefined" && firebase.database) {
      // This would be where we set up auto-responder for demo
      console.log("🤖 Demo auto-responder ready");
    }
  }

  /**
   * Add demo chat partners for testing
   */
  addDemoChatPartners() {
    // This ensures there are users to chat with for demo
    const demoPartners = [
      {
        id: "demo-partner-1",
        name: "Alex Johnson",
        university: "University of Rwanda",
        country: "Rwanda",
        course: "Web Development",
        availability: "evening",
        studyType: "group",
        topic: "JavaScript Frameworks",
        isOnline: true,
        matchScore: 95,
      },
      {
        id: "demo-partner-2",
        name: "Sarah Chen",
        university: "University of Nairobi",
        country: "Kenya",
        course: "Data Structures",
        availability: "afternoon",
        studyType: "pair",
        topic: "Algorithms",
        isOnline: false,
        matchScore: 88,
      },
    ];

    // Store for chat access
    this.demoPartners = demoPartners;
  }

  setupDemoUser() {
    // Create a demo user if none exists
    if (!this.currentUser) {
      this.currentUser = {
        id: "demo-user-" + Date.now(),
        name: "Demo User",
        email: "demo@academico.com",
        country: "Rwanda",
        university: "University of Rwanda"
      };
      console.log("👤 Demo user created:", this.currentUser.id);
    }
  }

  // ==================== DYNAMIC FEATURES ====================

  /**
   * DYNAMIC: Get live statistics from Firebase (not hardcoded)
   */
  async getLiveStatistics() {
    try {
      // If Firebase is available, get real data
      if (typeof firebase !== "undefined" && firebase.firestore) {
        const db = firebase.firestore();
        const usersSnapshot = await db.collection("users").get();
        const userCount = usersSnapshot.size;

        // Calculate active courses
        const courses = new Set();
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.course) courses.add(userData.course);
        });

        return {
          students: userCount,
          groups: Math.max(1, Math.floor(userCount / 3)), // Dynamic calculation
          courses: Math.max(1, courses.size),
        };
      }
    } catch (error) {
      console.log("Firebase not available, using dynamic fallback");
    }

    // Fallback: Still dynamic but based on time/random
    const baseCount = Math.floor(Math.random() * 100) + 50; // Random but realistic
    return {
      students: baseCount,
      groups: Math.max(1, Math.floor(baseCount / 4)),
      courses: Math.max(1, Math.floor(baseCount / 10)),
    };
  }

  /**
   * DYNAMIC: Animate statistics counters with real data
   */
  async animateStatistics() {
    const stats = await this.getLiveStatistics();

    Object.keys(stats).forEach((stat, index) => {
      const element = document.getElementById(stat + "Count");
      if (element) {
        this.animateCount(element, 0, stats[stat], 2000 + index * 500);
      }
    });
  }

  /**
   * DYNAMIC: Animate number counting
   */
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

  /**
   * DYNAMIC: Update content based on time of day
   */
  updateDynamicContent() {
    // Dynamic greeting
    const greeting = this.getDynamicGreeting();
    const subtitleElement = document.querySelector(".welcome-subtitle");
    if (subtitleElement) {
      subtitleElement.textContent = greeting;
    }

    // Dynamic study tip
    const tips = this.getDynamicStudyTips();
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    // Add study tip to page if tip element exists, or create it
    this.displayStudyTip(randomTip);
  }

  /**
   * DYNAMIC: Get greeting based on current time
   */
  getDynamicGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! Ready to study? 🌅";
    if (hour < 18) return "Good afternoon! Let's learn! ☀️";
    return "Good evening! Time to focus! 🌙";
  }

  /**
   * DYNAMIC: Get study tips based on time of day
   */
  getDynamicStudyTips() {
    const hour = new Date().getHours();
    const currentPeriod = this.getDynamicAvailability();

    const tips = {
      morning: [
        "🌅 Mornings are great for learning new concepts!",
        "📚 Start your day with focused reading sessions",
        "💡 Fresh mind = Better retention in the morning",
      ],
      afternoon: [
        "☀️ Afternoons are perfect for group discussions!",
        "👥 Ideal time for collaborative problem solving",
        "📝 Great for practicing and applying knowledge",
      ],
      evening: [
        "🌙 Evenings are best for review sessions!",
        "🔄 Perfect time to recap what you learned",
        "📖 Good for flashcards and memory reinforcement",
      ],
    };

    return tips[currentPeriod] || ["Study smart, not just hard! 💪"];
  }

  /**
   * DYNAMIC: Display study tip on page
   */
  displayStudyTip(tip) {
    // Create or update study tip element
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

      // Insert after welcome description
      const welcomeDesc = document.querySelector(".welcome-description");
      if (welcomeDesc && welcomeDesc.parentNode) {
        welcomeDesc.parentNode.insertBefore(
          tipElement,
          welcomeDesc.nextSibling
        );
      }
    }

    tipElement.innerHTML = `💡 <strong>Study Tip:</strong> ${tip}`;
  }

  /**
   * DYNAMIC: Get current availability period
   */
  getDynamicAvailability() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    return "evening";
  }

  /**
   * DYNAMIC: Get study break activity from API
   */
  async getStudyBreakActivity() {
    console.log("🎯 Getting study break...");

    // MISSION D: Show loading for API call
    this.showLoading('Finding a study break activity...');

    try {
      // Use the proven working API
      const response = await fetch("https://api.adviceslip.com/advice");

      if (response.ok) {
        const data = await response.json();
        alert(
          `💡 Study Break Wisdom:\n\n"${data.slip.advice}"\n\nTake a moment to reflect! 🧠`
        );
      } else {
        // Fallback if API has temporary issues
        this.showFallbackStudyBreak();
      }
    } catch (error) {
      console.log("API failed, using fallback");
      this.showFallbackStudyBreak();
    } finally {
      // MISSION D: Hide loading
      this.hideLoading();
    }
  }

  // MISSION D: Fallback for study break
  showFallbackStudyBreak() {
    const fallbackActivities = [
      "Take a 5-minute walk and stretch",
      "Do 10 deep breathing exercises",
      "Get a glass of water and hydrate",
      "Look away from screen for 2 minutes"
    ];
    const activity = fallbackActivities[Math.floor(Math.random() * fallbackActivities.length)];
    alert(`💡 Study Break Suggestion:\n\n${activity}\n\nYour eyes and brain will thank you! 🧠`);
  }
}

// Initialize the app
const app = new AcademicOApp();