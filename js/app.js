// Complete AcademicO App - WITH DYNAMIC FEATURES
class AcademicOApp {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.animateStatistics(); // Start dynamic counters
    this.updateDynamicContent(); // Update time-based content
    this.setupEnhancedSearch();
    this.setupDemoAutoResponder();
    this.addDemoChatPartners();
    this.setupDemoUser();
    console.log("AcademicO Started with Dynamic Features!");
  }

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

    // Study break button (new dynamic feature)
    this.safeAddEventListener("studyBreakBtn", "click", () =>
      this.getStudyBreakActivity()
    );

    // ESC key to close modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeModals();
    });
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
    }
  }

  // ==================== EXISTING FUNCTIONS (UPDATED) ====================

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
    }
  }

  closeModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.add("hidden");
    });
    document.body.style.overflow = "auto";
  }

  async handleRegister(e) {
    e.preventDefault();

    const userData = {
      name: document.getElementById("regFullName").value,
      email: document.getElementById("regEmail").value,
      course:
        document.getElementById("courseInput").value || "Computer Science",
      university: "University of Rwanda",
      availability: this.getDynamicAvailability(), // DYNAMIC availability
      studyType: document.getElementById("studyTypeSelect").value,
      topic: document.getElementById("topicInput").value || "General",
    };

    // Validate passwords
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;

    if (password !== confirmPassword) {
      errorHandler.showUserError("Passwords do not match!");
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
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      errorHandler.showUserError("Please fill in all fields");
      return;
    }

    // For demo - in real app, verify with Firebase Auth
    this.currentUser = {
      email: email,
      name: email.split("@")[0],
      id: "user-" + Date.now(),
    };

    errorHandler.showSuccess(`👋 Welcome back, ${this.currentUser.name}!`);
    this.closeModals();
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

    // Show loading
    document.getElementById("loadingSection").classList.remove("hidden");

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
      document.getElementById("loadingSection").classList.add("hidden");
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
          (partner) => `
                <div class="partner-card">
                    <div class="partner-header">
                        <div class="partner-avatar ${
                          partner.isOnline ? "online" : "offline"
                        }">
                            ${partner.name.charAt(0)}
                        </div>
                        <div class="partner-info">
                            <h3>${partner.name} ${
            partner.isOnline ? "🟢" : "⚫"
          }</h3>
                            <span class="partner-university">${
                              partner.university || "Student"
                            }</span>
                            <span class="partner-course">${partner.course} • ${
            partner.matchScore
          }% match</span>
                        </div>
                    </div>
                    <div class="partner-details">
                        <div class="detail-item">📚 <strong>Topic:</strong> ${
                          partner.topic
                        }</div>
                        <div class="detail-item">⏰ <strong>Available:</strong> ${this.formatAvailability(
                          partner.availability
                        )}</div>
                        <div class="detail-item">🕐 <strong>Local Time:</strong> ${
                          partner.localTime
                        }</div>
                        <div class="detail-item">👥 <strong>Study Style:</strong> ${this.formatStudyType(
                          partner.studyType
                        )}</div>
                        <div class="detail-item">💬 <strong>${
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
                            💬 Message
                        </button>
                        <button class="action-btn connect-btn" onclick="app.connectPartner('${
                          partner.id
                        }')">
                            👥 Connect
                        </button>
                    </div>
                </div>
            `
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
    errorHandler.showSuccess(
      `💬 Chat feature would open with ${userName}!\n\nThis would connect to our real-time chat system.`
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
   * Start chat with a partner
   */
  /**
   * Start chat with a partner
   */
  startChat(partnerId, partnerName) {
    console.log(`💬 Starting chat with ${partnerName} (${partnerId})`);

    // Safety check - wait for chatService to be ready
    if (typeof chatService === "undefined" || !chatService.isReady()) {
      errorHandler.showUserError(
        "Chat is still loading. Please wait a moment and try again."
      );
      console.log("❌ Chat service not ready yet");
      return;
    }

    // Set up chat modal
    document.getElementById("chatPartnerName").textContent = partnerName;

    // Initialize chat with chat service
    const currentUser = this.currentUser || {
      id: "demo-user-" + Date.now(),
      name: "You",
    };
    const partner = { id: partnerId, name: partnerName };

    chatService.startChat(currentUser, partner);

    // Setup chat event listeners
    this.setupChatEvents(currentUser);

    // Open chat modal
    this.openChatModal();

    errorHandler.showSuccess(
      `Chat opened with ${partnerName}! Start typing...`
    );
  }

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

  /**
   * Enhanced safeAddEventListener to handle multiple elements with same ID
   */
  safeAddEventListener(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      // Remove existing listener to avoid duplicates
      element.removeEventListener(event, handler);
      element.addEventListener(event, handler);
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
        university: "Computer Science Major",
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
        university: "Mathematics Department",
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
      };
      console.log("👤 Demo user created:", this.currentUser.id);
    }
  }
}

// Initialize the app
const app = new AcademicOApp();
