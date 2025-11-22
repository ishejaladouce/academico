// Dashboard Application using Managers
class DashboardApp {
  constructor() {
    this.currentUser = null;
    this.currentSection = "searchSection";
    this.messagesManager = null;
    this.connectionsManager = null;
    this.isInitialized = false;
    this.connectionState = {
      accepted: [],
      pendingIncoming: [],
      pendingOutgoing: [],
    };
    this.activeConversationId = null;
    this.activeGroupChatId = null;
    this.groupMessageUnsubscribe = null;
  }

  async init() {
    if (this.isInitialized) return;

    console.log("Dashboard initializing...");
    
    // Apply saved theme immediately
    const savedTheme = localStorage.getItem("academico_theme") || "light";
    this.applyTheme(savedTheme);
    
    await this.checkAuthentication();
    this.initializeManagers();
    this.setupEventListeners();
    this.loadUserData();
    this.setupNavigation();

    // Add small delay to ensure DOM is fully ready
    setTimeout(() => {
      this.loadCountries();
      this.loadUniversities();
      this.loadSuggestions(); // Load dynamic suggestions
    }, 100);

    // Request notification permission for messaging
    await this.requestNotificationPermission();

    this.isInitialized = true;
    console.log("Dashboard initialized");
  }

  // notification permissions
  async requestNotificationPermission() {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        try {
          const permission = await Notification.requestPermission();
          console.log("Notification permission:", permission);
        } catch (error) {
          console.log("Error requesting notification permission:", error);
        }
      }
    }
  }
  initializeManagers() {
    try {
      if (typeof messagesManager !== "undefined") {
        this.messagesManager = messagesManager;
        console.log("Messages manager initialized");
          this.messagesManager.onConversationsUpdate((conversations) => {
          this.displayConversations(conversations);
          // Update study groups count in profile
          const profileStudyGroups = document.getElementById("profileStudyGroups");
          if (profileStudyGroups) {
            profileStudyGroups.textContent = conversations.length.toString();
          }
        });
        this.messagesManager.onMessagesUpdate((messages, conversationId) => {
          console.log(`Messages update received for conversation ${conversationId}, active: ${this.activeConversationId}, count: ${messages.length}`);
          
          // Always display messages if this is the active conversation
          // Don't check for section visibility - just check if it's the active conversation
          if (conversationId === this.activeConversationId) {
            console.log(`Displaying ${messages.length} messages for active conversation ${conversationId}`);
            this.displayMessages(messages);
          } else {
            console.log(`Conversation ${conversationId} is not active (active is ${this.activeConversationId}), skipping display`);
          }
        });
      }
      if (typeof connectionsManager !== "undefined") {
        this.connectionsManager = connectionsManager;
        console.log("Connections manager initialized");
        this.connectionsManager.onChange((grouped) => {
          console.log("Connections updated:", {
            accepted: grouped.accepted.length,
            pendingIncoming: grouped.pendingIncoming.length,
            pendingOutgoing: grouped.pendingOutgoing.length
          });
          this.connectionState = grouped;
          
          // Always update all displays to ensure UI is in sync
          this.displayConnections(grouped.accepted);
          this.displayIncomingRequests(grouped.pendingIncoming);
          this.displaySentRequests(grouped.pendingOutgoing);
          
          // Update notification badge for incoming requests
          this.updateConnectionNotification(grouped.pendingIncoming.length);
        });
      }
    } catch (error) {
      console.log("Managers not available:", error);
    }
  }

  async checkAuthentication() {
    const userData = localStorage.getItem("academico_current_user");
    if (!userData) {
      console.log("No user data, redirecting to index");
      window.location.href = "index.html";
      return;
    }

    this.currentUser = JSON.parse(userData);
    this.updateUserInterface();
    console.log("User authenticated:", this.currentUser.name);
    
    // Re-initialize managers with the new user
    await this.reinitializeManagers();
  }

  async reinitializeManagers() {
    try {
      if (this.messagesManager && typeof this.messagesManager.reinit === "function") {
        await this.messagesManager.reinit();
        console.log("Messages manager re-initialized for new user");
      }
      if (this.connectionsManager && typeof this.connectionsManager.reinit === "function") {
        await this.connectionsManager.reinit();
        console.log("Connections manager re-initialized for new user");
      }
    } catch (error) {
      console.error("Error re-initializing managers:", error);
    }
  }

  updateUserInterface() {
    if (this.currentUser) {
      const userNameElement = document.getElementById("userName");
      if (userNameElement) {
        userNameElement.textContent = this.currentUser.name;
      }
      console.log("UI updated for user:", this.currentUser.name);
    }
  }

  setupEventListeners() {
    console.log("Setting up event listeners...");

    const navLinks = document.querySelectorAll(".nav-link[data-section]");
    console.log("Found nav links:", navLinks.length);

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.getAttribute("data-section");
        console.log("Nav clicked:", section);
        this.showSection(section);
        this.updateActiveNav(link);
      });
    });

    document.getElementById("userMenuBtn").addEventListener("click", () => {
      console.log("User menu clicked");
      this.toggleUserDropdown();
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
      console.log("Logout clicked");
      this.logout();
    });

    document
      .getElementById("studySearchForm")
      .addEventListener("submit", (e) => {
        console.log("Search form submitted");
        this.handleSearch(e);
      });

    // Study Break refresh button
    const studyBreakRefreshBtn = document.getElementById("studyBreakRefreshBtn");
    if (studyBreakRefreshBtn) {
      studyBreakRefreshBtn.addEventListener("click", () => {
        console.log("Study break refresh clicked");
        this.loadStudyBreakContent();
      });
    }

    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        console.log("Tab clicked:", tab);
        this.switchConnectionTab(btn);
      });
    });

    const newChatBtn = document.getElementById("newChatBtn");
    if (newChatBtn) {
      newChatBtn.addEventListener("click", () => {
        console.log("New chat clicked");
        this.startNewChat();
      });
    }

    const adminDashboardBtn = document.getElementById("adminDashboardBtn");
    if (adminDashboardBtn) {
      adminDashboardBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Admin dashboard clicked");
        this.showAdminDashboard();
      });
    }

    // Profile edit button
    const editProfileBtn = document.getElementById("editProfileBtn");
    if (editProfileBtn) {
      editProfileBtn.addEventListener("click", () => {
        console.log("Edit profile clicked");
        this.showEditProfileForm();
      });
    }

    // Country and University change events - ENHANCED
    document.getElementById("countryFilter").addEventListener("change", (e) => {
      console.log("Country filter changed:", e.target.value);
      this.handleCountryChange(e.target.value);
    });

    document
      .getElementById("universityFilter")
      .addEventListener("change", (e) => {
        console.log("University filter changed:", e.target.value);
        this.handleSearchUniversityChange(e.target.value);
      });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".user-menu")) {
        const dropdown = document.getElementById("userDropdown");
        if (dropdown && !dropdown.classList.contains("hidden")) {
          dropdown.classList.add("hidden");
        }
      }
    });

    // Sort functionality
    document.getElementById("sortBy")?.addEventListener("change", (e) => {
      this.sortResults(e.target.value);
    });

    // Explore search button - show search form
    const exploreSearchBtn = document.getElementById("exploreSearchBtn");
    if (exploreSearchBtn) {
      exploreSearchBtn.addEventListener("click", () => {
        this.showSearchForm();
      });
    }


    // Settings section - dark mode toggle
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
      // Load saved theme preference
      const savedTheme = localStorage.getItem("academico_theme") || "light";
      darkModeToggle.checked = savedTheme === "dark";
      this.applyTheme(savedTheme);
      
      darkModeToggle.addEventListener("change", (e) => {
        const theme = e.target.checked ? "dark" : "light";
        localStorage.setItem("academico_theme", theme);
        this.applyTheme(theme);
      });
    }

    // Settings dropdown link
    const settingsDropdown = document.querySelector('a[data-section="settingsSection"]');
    if (settingsDropdown) {
      settingsDropdown.addEventListener("click", (e) => {
        e.preventDefault();
        this.showSection("settingsSection");
      });
    }

    console.log("Event listeners setup complete");
  }

  // Switch between dark and light mode
  applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark-mode", isDark);
    document.body.classList.toggle("dark-mode", isDark);
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
      darkModeToggle.checked = isDark;
    }
  }

  // Show the search form
  showSearchForm() {
    const searchCard = document.getElementById("searchCard");
    const exploreContainer = document.getElementById("exploreSearchContainer");
    
    if (searchCard) {
      searchCard.classList.remove("hidden");
      // Scroll to search form
      setTimeout(() => {
        searchCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    
    if (exploreContainer) {
      exploreContainer.style.display = 'none';
    }
  }

  // Hide the search form
  hideSearchForm() {
    const searchCard = document.getElementById("searchCard");
    const exploreContainer = document.getElementById("exploreSearchContainer");
    
    if (searchCard) {
      searchCard.classList.add("hidden");
    }
    
    if (exploreContainer) {
      exploreContainer.style.display = 'block';
    }
  }

  showSection(sectionId) {
    console.log("Showing section:", sectionId);

    const sections = document.querySelectorAll(".dashboard-section");
    console.log("Hiding", sections.length, "sections");

    sections.forEach((section) => {
      section.classList.remove("active");
      section.classList.add("hidden");
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      console.log("Found target section, making active");
      targetSection.classList.add("active");
      targetSection.classList.remove("hidden");
      this.currentSection = sectionId;

      if (sectionId === "messagesSection") {
        console.log("Loading messages...");
        this.loadConversations();
      } else if (sectionId === "connectionsSection") {
        console.log("Loading connections...");
        this.loadConnections();
      } else if (sectionId === "studyBreakSection") {
        console.log("Loading study break...");
        this.loadStudyBreakContent();
      } else if (sectionId === "profileSection") {
        console.log("Loading profile...");
        this.loadProfileData();
        this.loadEnhancedProfileData();
      } else if (sectionId === "adminSection") {
        console.log("Loading admin dashboard...");
        this.loadAdminDashboard();
      }
    } else {
      console.log("Target section not found:", sectionId);
    }
  }

  updateActiveNav(activeLink) {
    console.log("Updating active nav");
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
    });

    if (activeLink) {
      activeLink.classList.add("active");
      console.log(
        "Active nav updated:",
        activeLink.getAttribute("data-section")
      );
    }
  }

  toggleUserDropdown() {
    const dropdown = document.getElementById("userDropdown");
    dropdown.classList.toggle("hidden");
    console.log("User dropdown toggled");
  }

  logout() {
    localStorage.removeItem("academico_current_user");
    localStorage.removeItem("academico_token");
    window.location.href = "index.html";
  }

  // ==================== COUNTRIES & UNIVERSITIES ====================

  async loadCountries() {
    console.log("Loading countries...");
    try {
      await countriesService.populateCountryDropdown("countryFilter", {
        placeholder: "All Countries",
        includeAllOption: true,
      });
      console.log("Country filter hydrated via API");
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  }

  async loadUniversities() {
    const universityFilter = document.getElementById("universityFilter");
    if (universityFilter) {
      universityFilter.innerHTML =
        '<option value="">Select a country first</option>';
    }
  }

  async handleCountryChange(countryCode) {
    console.log("Country changed to:", countryCode);
    const universityFilter = document.getElementById("universityFilter");

    if (!universityFilter) return;

    if (!countryCode) {
      universityFilter.innerHTML =
        '<option value="">Select a country first</option>';
      this.handleSearchUniversityChange("");
      return;
    }

    universityFilter.innerHTML =
      '<option value="">Loading universities...</option>';

    try {
      const universitiesData = await universitiesService.loadUniversities(
        countryCode
      );
      universitiesService.populateUniversityDropdown(
        "universityFilter",
        universitiesData.universities,
        {
          placeholder: "All Universities",
          includeAllOption: true,
          includeOtherOption: true,
        }
      );
    } catch (error) {
      console.error("Error loading universities for country:", error);
      universityFilter.innerHTML =
        '<option value="">Unable to load universities</option>';
    }
  }

  // Show custom university input when "other" is selected
  handleSearchUniversityChange(value) {
    const customContainer = document.getElementById("searchCustomUniversityContainer");
    const customInput = document.getElementById("searchCustomUniversity");
    
    if (!customContainer || !customInput) return;

    if (value === "other") {
      customContainer.classList.remove("hidden");
      customInput.required = true;
      customInput.focus();
    } else {
      customContainer.classList.add("hidden");
      customInput.required = false;
      customInput.value = "";
    }
  }

  // ==================== ENHANCED SEARCH FUNCTIONALITY ====================

  async handleSearch(e) {
    e.preventDefault();
    console.log("Handling search...");

    // Get university value - use custom input if "other" is selected
    const universityFilter = document.getElementById("universityFilter");
    let university = universityFilter ? universityFilter.value : "";
    
    if (university === "other") {
      const customUniversity = document.getElementById("searchCustomUniversity");
      university = customUniversity ? customUniversity.value.trim() : "";
      if (!university) {
        alert("Please enter your university name");
        return;
      }
    }

    const filters = {
      course: document.getElementById("courseInput").value,
      topic: document.getElementById("topicInput").value,
      availability: document.getElementById("availabilitySelect").value,
      studyType: document.getElementById("studyTypeSelect").value,
      country: document.getElementById("countryFilter").value,
      university: university,
    };

    console.log("Search parameters:", filters);

    if (!filters.course) {
      alert("Please enter a course to search for");
      return;
    }

    this.showLoading("Searching for study partners...");

    try {
      if (typeof authManager === "undefined") {
        throw new Error("Authentication service unavailable");
      }

      const searchResults = await authManager.searchUsers(filters);

      console.log("Search results:", searchResults.length, "partners found");

      // Show results section
      const resultsSection = document.getElementById("resultsSection");
      if (resultsSection) {
        resultsSection.classList.remove("hidden");
        resultsSection.classList.add("active");
      }

      // Update results count
      const resultsCount = document.getElementById("resultsCount");
      if (resultsCount) {
        resultsCount.textContent = `Found ${searchResults.length} partners for "${filters.course}"`;
      }

      // Display results
      this.displaySearchResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      alert("Search failed. Please try again.");
    } finally {
      this.hideLoading();
    }
  }

  displaySearchResults(partners) {
    const resultsContainer = document.getElementById("resultsContainer");
    if (!resultsContainer) return;

    if (partners.length === 0) {
      resultsContainer.innerHTML = `
      <div class="no-connections">
        <i class="fas fa-search"></i>
        <p>No study partners found</p>
        <p class="small">Try adjusting your search criteria</p>
      </div>
    `;
    } else {
      resultsContainer.innerHTML = partners
        .map((user) => {
          const matchScore = Math.floor(Math.random() * 30) + 70;
          const isOnline = Math.random() > 0.5;
          const payload = encodeURIComponent(
            JSON.stringify({
              id: user.id,
              name: user.name,
              university: user.university,
              course: user.course,
              availability: user.availability,
              studyType: user.studyType,
              country: user.country,
              countryCode: user.countryCode,
              topic: user.topic,
              email: user.email,
            })
          );

          return `
        <div class="partner-card">
          <div class="partner-header">
            <div class="partner-avatar ${isOnline ? "online" : "offline"}">
              ${user.name.charAt(0)}${user.name.split(" ")[1]?.charAt(0) || ""}
            </div>
            <div class="partner-info">
              <h3>${user.name}</h3>
              <span class="partner-university">${
                user.university || "Student"
              }</span>
              <span class="partner-course">${
                user.course || "General"
              } • ${matchScore}% match</span>
            </div>
          </div>
          
          <div class="partner-details">
            <div class="detail-item"><strong>Topic:</strong> ${
              user.topic || "General"
            }</div>
            <div class="detail-item"><strong>Available:</strong> ${this.getFormattedAvailability(
              user.availability
            )}</div>
            <div class="detail-item"><strong>Study Style:</strong> ${this.getFormattedStudyType(
              user.studyType
            )}</div>
            <div class="detail-item"><strong>Country:</strong> ${
              user.country || "Not specified"
            }</div>
            <div class="last-active">Last active: Recently</div>
          </div>
          <div class="partner-actions">
            <button class="action-btn chat-btn" onclick="dashboard.startDynamicChat('${payload}')">
              Start Chat
            </button>
            <button class="action-btn connect-btn" onclick="dashboard.sendConnectionRequest('${payload}')">
              Connect
            </button>
          </div>
        </div>
      `;
        })
        .join("");
    }
  }

  async startDynamicChat(encodedPartner) {
    try {
      const partner = JSON.parse(decodeURIComponent(encodedPartner));
      const currentUser = authManager.getCurrentUser();

      if (!currentUser) {
        errorHandler.showUserError("Please log in to start chatting");
        return;
      }

      if (!this.messagesManager) {
        errorHandler.showUserError("Messaging service unavailable");
        return;
      }

      // Ensure manager is initialized with current user
      if (this.messagesManager.currentUser?.id !== currentUser.id) {
        await this.messagesManager.reinit();
      }

      const conversationId = await this.messagesManager.startChat(partner);
      this.activeConversationId = conversationId;
      this.showSection("messagesSection");
      this.openConversation(conversationId, partner.name || "Study Partner");
      errorHandler.showSuccess(`Chat started with ${partner.name || "student"}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      errorHandler.showUserError(
        "Unable to start chat right now. Please try again."
      );
    }
  }

  // Enhanced sorting functionality
  sortResults(sortBy) {
    const resultsContainer = document.getElementById("resultsContainer");
    if (!resultsContainer) return;

    const partnerCards = Array.from(
      resultsContainer.querySelectorAll(".partner-card")
    );

    partnerCards.sort((a, b) => {
      const aMatch = parseInt(
        a.querySelector(".partner-course").textContent.match(/(\d+)%/)?.[1] ||
          "70"
      );
      const bMatch = parseInt(
        b.querySelector(".partner-course").textContent.match(/(\d+)%/)?.[1] ||
          "70"
      );

      const aOnline = a
        .querySelector(".partner-avatar")
        .classList.contains("online");
      const bOnline = b
        .querySelector(".partner-avatar")
        .classList.contains("online");

      switch (sortBy) {
        case "online":
          return (bOnline ? 1 : 0) - (aOnline ? 1 : 0);
        case "matchScore":
        default:
          return bMatch - aMatch;
      }
    });

    // Clear and re-append sorted cards
    resultsContainer.innerHTML = "";
    partnerCards.forEach((card) => resultsContainer.appendChild(card));
  }

  // ==================== MESSAGES FUNCTIONALITY ====================

  // Enhanced conversation loading that uses real matches
  async loadConversations() {
    console.log("Loading conversations...");
    const conversationsList = document.getElementById("conversationsList");

    if (!conversationsList) {
      console.log("conversationsList element not found!");
      return;
    }

    // Show loading
    conversationsList.innerHTML = `
    <div class="no-conversations">
      <i class="fas fa-comments"></i>
      <p>Loading your study conversations...</p>
    </div>
  `;

    try {
      // Ensure messages manager is initialized
      if (!this.messagesManager) {
        console.error("Messages manager not available");
        conversationsList.innerHTML = `
          <div class="no-conversations">
            <i class="fas fa-comments"></i>
            <p>Unable to load conversations. Please refresh the page.</p>
          </div>
        `;
        return;
      }

      // Ensure manager is initialized with current user
      const currentUser = authManager.getCurrentUser();
      if (!currentUser) {
        console.error("No current user found");
        conversationsList.innerHTML = `
          <div class="no-conversations">
            <i class="fas fa-comments"></i>
            <p>Please log in to view conversations.</p>
          </div>
        `;
        return;
      }

      if (this.messagesManager.currentUser?.id !== currentUser.id) {
        console.log("Re-initializing messages manager for current user");
        await this.messagesManager.reinit();
      }

      // Ensure subscription is active - this will trigger conversation loading
      if (this.messagesManager.db && this.messagesManager.currentUser) {
        console.log("Ensuring conversation subscription is active...");
        this.messagesManager.subscribeToConversations();
        console.log("Conversation subscription active, conversations will load automatically");
      } else {
        console.error("Messages manager not properly initialized - db or currentUser missing");
        conversationsList.innerHTML = `
          <div class="no-conversations">
            <i class="fas fa-comments"></i>
            <p>Unable to initialize conversations. Please refresh the page.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      conversationsList.innerHTML = `
        <div class="no-conversations">
          <i class="fas fa-comments"></i>
          <p>Error loading conversations. Please try again.</p>
        </div>
      `;
    }
  }

  displayConversations(conversations = []) {
    const conversationsList = document.getElementById("conversationsList");
    if (!conversationsList) return;

    if (!conversations.length) {
      conversationsList.innerHTML = `
        <div class="no-conversations">
          <i class="fas fa-comments"></i>
          <p>No conversations yet</p>
          <p class="small">Start a chat with your study partners!</p>
        </div>
      `;
      return;
    }

    conversationsList.innerHTML = conversations
      .map((conv) => {
        const partnerId = conv.participants?.find(
          (id) => id !== this.currentUser?.id
        );
        const partnerDetails =
          conv.participantDetails?.[partnerId] || { name: "Study Partner" };
        const partnerName = partnerDetails.name || "Study Partner";
        const partnerUniversity = partnerDetails.university || "Not specified";
        const partnerCourse = partnerDetails.course || "Not specified";
        const lastMessagePreview = conv.lastMessage || "Start a conversation";
        const updatedAt = conv.updatedAt?.toDate
          ? conv.updatedAt.toDate()
          : conv.updatedAt
          ? new Date(conv.updatedAt)
          : null;
        const hasUnread =
          conv.lastSenderId && conv.lastSenderId !== this.currentUser?.id;

        return `
        <div class="conversation-item ${
          this.activeConversationId === conv.id ? "active" : ""
        }" 
             data-conversation-id="${conv.id}" 
             data-partner-id="${partnerId || ""}"
             data-partner-name="${partnerName}">
          <div class="conversation-avatar">
            ${partnerName.charAt(0).toUpperCase()}
          </div>
          <div class="conversation-info">
            <div class="conversation-name">${partnerName}</div>
            <div class="conversation-preview">${lastMessagePreview}</div>
            <div class="conversation-details">
              <span class="conversation-course">${partnerCourse}</span>
              <span class="conversation-university">${partnerUniversity}</span>
            </div>
          </div>
          <div class="conversation-meta">
            <div class="conversation-time">${updatedAt ? this.formatTime(updatedAt) : "Just now"}</div>
            ${hasUnread ? `<div class="unread-badge">1</div>` : ""}
          </div>
        </div>
      `;
      })
      .join("");

    conversationsList
      .querySelectorAll(".conversation-item")
      .forEach((item) => {
        item.addEventListener("click", () => {
          const conversationId = item.getAttribute("data-conversation-id");
          const partnerName = item.getAttribute("data-partner-name");
          this.openConversation(conversationId, partnerName);
        });
      });
  }

  async openGroupChat(groupId, groupName) {
    if (!groupId) {
      console.error("openGroupChat: No group ID provided");
      return;
    }

    console.log(`Opening group chat ${groupId} for ${groupName}`);

    // Set active group chat ID
    this.activeGroupChatId = groupId;
    this.activeConversationId = null; // Clear regular conversation

    const chatPlaceholder = document.getElementById("chatPlaceholder");
    const activeChat = document.getElementById("activeChat");

    if (chatPlaceholder) chatPlaceholder.classList.add("hidden");
    if (activeChat) {
      activeChat.classList.remove("hidden");
      activeChat.classList.add("active");
    }

    // Update chat header for group
    const chatPartnerName = document.getElementById("chatPartnerName");
    const partnerStatus = document.getElementById("partnerStatus");
    if (chatPartnerName) {
      chatPartnerName.innerHTML = `<i class="fas fa-users"></i> ${groupName}`;
    }
    if (partnerStatus) {
      partnerStatus.textContent = "Group Chat";
    }

    // Load and display group messages
    await this.loadGroupMessages(groupId);
    this.setupGroupMessageSending(groupId);
  }

  async loadGroupMessages(groupId) {
    try {
      if (!this.messagesManager || !this.messagesManager.db) {
        console.error("Messages manager not available");
        return;
      }

      const chatMessages = document.getElementById("chatMessages");
      if (!chatMessages) return;

      chatMessages.innerHTML = '<div class="loading-messages"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>';

      // Fetch group messages - try with orderBy first, fallback to without if index doesn't exist
      let messagesSnapshot;
      try {
        messagesSnapshot = await this.messagesManager.db
          .collection("groupMessages")
          .where("groupId", "==", groupId)
          .orderBy("createdAt", "asc")
          .get();
      } catch (indexError) {
        console.warn("Index not found, fetching without orderBy:", indexError);
        // Fallback: fetch without orderBy and sort in memory
        messagesSnapshot = await this.messagesManager.db
          .collection("groupMessages")
          .where("groupId", "==", groupId)
          .get();
      }

      let messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort messages by createdAt if not already sorted
      messages.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return timeA - timeB;
      });

      if (messages.length === 0) {
        chatMessages.innerHTML = `
          <div class="no-messages">
            <i class="fas fa-comments"></i>
            <p>No messages yet. Start the conversation!</p>
          </div>
        `;
      } else {
        this.displayGroupMessages(messages);
      }

      // Set up real-time listener for group messages
      // Try with orderBy first, fallback to without
      let unsubscribe;
      try {
        unsubscribe = this.messagesManager.db
          .collection("groupMessages")
          .where("groupId", "==", groupId)
          .orderBy("createdAt", "asc")
          .onSnapshot((snapshot) => {
            let newMessages = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Sort messages
            newMessages.sort((a, b) => {
              const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
              const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
              return timeA - timeB;
            });
            
            this.displayGroupMessages(newMessages);
          }, (error) => {
            console.warn("Error with ordered listener, trying without orderBy:", error);
            // Fallback: listen without orderBy
            this.messagesManager.db
              .collection("groupMessages")
              .where("groupId", "==", groupId)
              .onSnapshot((snapshot) => {
                let newMessages = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }));
                
                // Sort messages
                newMessages.sort((a, b) => {
                  const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                  const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                  return timeA - timeB;
                });
                
                this.displayGroupMessages(newMessages);
              });
          });
      } catch (error) {
        console.warn("Error setting up listener, using fallback:", error);
        // Fallback: listen without orderBy
        unsubscribe = this.messagesManager.db
          .collection("groupMessages")
          .where("groupId", "==", groupId)
          .onSnapshot((snapshot) => {
            let newMessages = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Sort messages
            newMessages.sort((a, b) => {
              const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
              const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
              return timeA - timeB;
            });
            
            this.displayGroupMessages(newMessages);
          });
      }

      // Store unsubscribe function for cleanup
      if (unsubscribe) {
        this.groupMessageUnsubscribe = unsubscribe;
      }

    } catch (error) {
      console.error("Error loading group messages:", error);
      const chatMessages = document.getElementById("chatMessages");
      if (chatMessages) {
        chatMessages.innerHTML = `<div class="error-message">Unable to load messages. Please try again.</div>`;
      }
    }
  }

  displayGroupMessages(messages = []) {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    const currentUser = authManager.getCurrentUser();
    if (!currentUser) return;

    if (messages.length === 0) {
      chatMessages.innerHTML = `
        <div class="no-messages">
          <i class="fas fa-comments"></i>
          <p>No messages yet. Start the conversation!</p>
        </div>
      `;
      return;
    }

    chatMessages.innerHTML = messages.map(message => {
      const isOwn = message.senderId === currentUser.id;
      const senderName = message.senderName || "Unknown";
      const timestamp = message.createdAt?.toDate ? 
        new Date(message.createdAt.toDate()) : 
        new Date(message.createdAt || Date.now());
      const timeStr = this.formatMessageTime(timestamp);

      return `
        <div class="message ${isOwn ? 'own' : 'other'}">
          ${!isOwn ? `<div class="message-sender">${senderName}</div>` : ''}
          <div class="message-content">${this.escapeHtml(message.text || '')}</div>
          <div class="message-time">${timeStr}</div>
        </div>
      `;
    }).join('');

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async setupGroupMessageSending(groupId) {
    const messageInput = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendMessageBtn");

    if (!messageInput || !sendBtn) {
      console.error("Message input or send button not found", { messageInput, sendBtn });
      return;
    }

    console.log("Setting up group message sending for group:", groupId);

    // Remove existing listeners by cloning
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

    const newMessageInput = messageInput.cloneNode(true);
    messageInput.parentNode.replaceChild(newMessageInput, messageInput);

    // Add new listeners
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      console.error("No current user found");
      return;
    }

    const sendMessage = async () => {
      const text = newMessageInput.value.trim();
      console.log("Sending group message:", text);
      if (!text) {
        console.log("Empty message, not sending");
        return;
      }
      
      try {
        await this.sendGroupMessage(groupId, text);
        newMessageInput.value = "";
        console.log("Message sent successfully");
      } catch (error) {
        console.error("Error in sendMessage handler:", error);
      }
    };

    newSendBtn.addEventListener("click", sendMessage);

    newMessageInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        await sendMessage();
      }
    });

    console.log("Group message sending setup complete");
  }

  async sendGroupMessage(groupId, text) {
    if (!text || !text.trim()) {
      console.log("Empty message, not sending");
      return;
    }

    console.log("sendGroupMessage called:", { groupId, text });

    try {
      const currentUser = authManager.getCurrentUser();
      if (!currentUser) {
        console.error("No current user");
        errorHandler.showUserError("Please log in to send messages.");
        return;
      }

      if (!this.messagesManager || !this.messagesManager.db) {
        console.error("Messages manager or DB not available");
        errorHandler.showUserError("Unable to send message. Please refresh the page.");
        return;
      }

      console.log("Verifying group membership...");
      // Get group to verify membership
      const groupDoc = await this.messagesManager.db.collection("studyGroups").doc(groupId).get();
      if (!groupDoc.exists) {
        console.error("Group not found:", groupId);
        errorHandler.showUserError("Group not found");
        return;
      }

      const groupData = groupDoc.data();
      if (!groupData.members || !groupData.members.includes(currentUser.id)) {
        console.error("User not a member of group:", { userId: currentUser.id, members: groupData.members });
        errorHandler.showUserError("You must be a member of this group to send messages");
        return;
      }

      console.log("Sending message to Firestore...");
      // Send message
      const messageRef = await this.messagesManager.db.collection("groupMessages").add({
        groupId: groupId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: text.trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log("Message sent, ID:", messageRef.id);

      // Update group's last message
      await this.messagesManager.db.collection("studyGroups").doc(groupId).update({
        lastMessage: text.trim(),
        lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log("Group updated with last message");

    } catch (error) {
      console.error("Error sending group message:", error);
      console.error("Error details:", error.message, error.stack);
      errorHandler.showUserError("Failed to send message: " + error.message);
    }
  }

  formatMessageTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return time.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async openConversation(conversationId, partnerName) {
    if (!conversationId) {
      console.error("openConversation: No conversation ID provided");
      return;
    }

    console.log(`Opening conversation ${conversationId} with ${partnerName}`);

    // Set active conversation ID FIRST before any async operations
    this.activeConversationId = conversationId;
    this.activeGroupChatId = null; // Clear group chat

    const chatPlaceholder = document.getElementById("chatPlaceholder");
    const activeChat = document.getElementById("activeChat");

    if (chatPlaceholder) chatPlaceholder.classList.add("hidden");
    if (activeChat) {
      activeChat.classList.remove("hidden");
      activeChat.classList.add("active");
    }

    document.querySelectorAll(".conversation-item").forEach((item) => {
      const id = item.getAttribute("data-conversation-id");
      if (id === conversationId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    const chatPartnerName = document.getElementById("chatPartnerName");
    if (chatPartnerName) chatPartnerName.textContent = partnerName;

    // Ensure messages manager is ready
    if (!this.messagesManager) {
      console.error("Messages manager not available");
      // Show loading state
      const chatMessages = document.getElementById("chatMessages");
      if (chatMessages) {
        chatMessages.innerHTML = `<div class="loading-message">Loading messages...</div>`;
      }
      return;
    }

    // Ensure manager is initialized with current user
    const currentUser = authManager.getCurrentUser();
    if (currentUser && this.messagesManager.currentUser?.id !== currentUser.id) {
      console.log("Re-initializing messages manager for current user");
      await this.messagesManager.reinit();
    }

    // Show loading state while messages load
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages) {
      chatMessages.innerHTML = `<div class="loading-message">Loading messages...</div>`;
    }

    // CRITICAL: Set activeConversationId BEFORE calling watchMessages
    // This ensures the listener will display messages when they arrive
    this.activeConversationId = conversationId;
    console.log(`[openConversation] Active conversation ID set to: ${conversationId}`);

    // Start watching messages (this will trigger displayMessages via the listener)
    try {
      await this.messagesManager.watchMessages(conversationId);
      console.log(`[openConversation] Started watching messages for conversation ${conversationId}`);
      
      // As a fallback, also try to manually load and display messages
      // This ensures messages show even if the listener has timing issues
      setTimeout(async () => {
        try {
          // Directly load messages and display them
          if (this.messagesManager.db && conversationId === this.activeConversationId) {
            const snapshot = await this.messagesManager.db
              .collection("conversations")
              .doc(conversationId)
              .collection("messages")
              .orderBy("createdAt", "asc")
              .get()
              .catch(() => {
                // If orderBy fails, try without it
                return this.messagesManager.db
                  .collection("conversations")
                  .doc(conversationId)
                  .collection("messages")
                  .get();
              });

            const messages = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Sort messages
            if (messages.length > 0) {
              messages.sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return timeA - timeB;
              });
            }

            // Only display if this is still the active conversation
            if (conversationId === this.activeConversationId) {
              console.log(`[openConversation] Fallback: Displaying ${messages.length} messages directly`);
              this.displayMessages(messages);
            }
          }
        } catch (err) {
          console.error("[openConversation] Error in fallback message load:", err);
        }
      }, 300);
    } catch (error) {
      console.error("Error watching messages:", error);
      if (chatMessages) {
        chatMessages.innerHTML = `<div class="error-message">Unable to load messages. Please try again.</div>`;
      }
      errorHandler.showUserError("Unable to load messages. Please try again.");
    }

    this.setupMessageSending(conversationId);
  }

  displayMessages(messages = []) {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) {
      console.error("displayMessages: chatMessages element not found");
      return;
    }

    console.log(`Displaying ${messages.length} messages in chat`);

    if (!messages || messages.length === 0) {
      chatMessages.innerHTML = `
        <div class="empty-chat-message">
          <p>No messages yet. Start the conversation!</p>
        </div>
      `;
      return;
    }

    try {
      chatMessages.innerHTML = messages
        .map((msg) => {
          if (!msg) return "";
          
          const timestamp = msg.createdAt?.toDate
            ? msg.createdAt.toDate()
            : msg.createdAt
            ? new Date(msg.createdAt)
            : new Date();
          const isOwn = msg.senderId === this.currentUser?.id;
          return `
          <div class="message ${isOwn ? "own" : "other"}">
            <div class="message-bubble">
              <div class="message-sender">${msg.senderName || "Partner"}</div>
              <div class="message-text">${msg.text || ""}</div>
              <div class="message-time">${this.formatTime(timestamp)}</div>
            </div>
          </div>
        `;
        })
        .filter(html => html) // Remove empty strings
        .join("");

      // Scroll to bottom after a brief delay to ensure DOM is updated
      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);
    } catch (error) {
      console.error("Error displaying messages:", error);
      chatMessages.innerHTML = `
        <div class="error-message">
          <p>Error loading messages. Please refresh the page.</p>
        </div>
      `;
    }
  }

  setupMessageSending(conversationId) {
    console.log("Setting up message sending for:", conversationId);
    const sendButton = document.getElementById("sendMessageBtn");
    const messageInput = document.getElementById("messageInput");

    if (!sendButton || !messageInput) {
      console.log("Message sending elements not found");
      return;
    }

    const newSendButton = sendButton.cloneNode(true);
    const newMessageInput = messageInput.cloneNode(true);

    sendButton.parentNode.replaceChild(newSendButton, sendButton);
    messageInput.parentNode.replaceChild(newMessageInput, messageInput);

    const sendMessage = async () => {
      const messageText = newMessageInput.value.trim();
      if (!messageText) return;

      try {
        if (!this.messagesManager) {
          throw new Error("Messaging service unavailable");
        }
        await this.messagesManager.sendMessage(conversationId, messageText);
        newMessageInput.value = "";
      } catch (error) {
        console.error("Error sending message:", error);
        errorHandler.showUserError("Unable to send message. Please try again.");
      }
    };

    newSendButton.onclick = sendMessage;
    newMessageInput.onkeypress = (e) => {
      if (e.key === "Enter") sendMessage();
    };
  }

  // ==================== CONNECTIONS FUNCTIONALITY ====================

  async loadConnections() {
    console.log("Loading connections...");
    this.displayConnections(this.connectionState?.accepted || []);
    this.displayIncomingRequests(this.connectionState?.pendingIncoming || []);
    this.displaySentRequests(this.connectionState?.pendingOutgoing || []);
  }

  // Add these methods to your DashboardApp class in dashboard.js

  // Request notification permission
  async requestNotificationPermission() {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        try {
          const permission = await Notification.requestPermission();
          console.log("Notification permission:", permission);
        } catch (error) {
          console.log("Error requesting notification permission:", error);
        }
      }
    }
  }

  displayConnections(connections = []) {
    const connectionsGrid = document.getElementById("connectionsGrid");
    if (!connectionsGrid) return;

    if (!connections.length) {
      connectionsGrid.innerHTML = `
        <div class="no-connections">
          <i class="fas fa-user-friends"></i>
          <p>No connections yet</p>
          <p class="small">Find study partners to build your network!</p>
        </div>
      `;
      return;
    }

    connectionsGrid.innerHTML = connections
      .map((conn) => {
        const partnerId =
          conn.requesterId === this.currentUser?.id
            ? conn.receiverId
            : conn.requesterId;
        const partnerName =
          conn.requesterId === this.currentUser?.id
            ? conn.receiverName
            : conn.requesterName;
        const partnerUniversity =
          conn.requesterId === this.currentUser?.id
            ? conn.receiverUniversity
            : conn.requesterUniversity;
        const partnerCourse =
          conn.requesterId === this.currentUser?.id
            ? conn.receiverCourse
            : conn.requesterCourse;
        const partnerAvailability =
          conn.requesterId === this.currentUser?.id
            ? conn.receiverAvailability
            : conn.requesterAvailability;
        const partnerStudyType =
          conn.requesterId === this.currentUser?.id
            ? conn.receiverStudyType
            : conn.requesterStudyType;
        const partnerCountry =
          conn.requesterId === this.currentUser?.id
            ? conn.receiverCountry
            : conn.requesterCountry;
        const partnerPayload = encodeURIComponent(
          JSON.stringify({
            id: partnerId,
            name: partnerName,
            university: partnerUniversity,
            course: partnerCourse,
            availability: partnerAvailability,
            studyType: partnerStudyType,
            country: partnerCountry,
          })
        );
        const updatedAt = conn.updatedAt?.toDate
          ? conn.updatedAt.toDate()
          : conn.updatedAt
          ? new Date(conn.updatedAt)
          : null;

        return `
          <div class="connection-card">
            <div class="connection-header">
              <div class="connection-avatar">
                ${partnerName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div class="connection-info">
                <h4>${partnerName || "Student"}</h4>
                <p>${partnerCourse || "Not specified"} • ${
          partnerUniversity || "Not specified"
        }</p>
                <div class="connection-details">
                  <span class="detail">Available: ${this.getFormattedAvailability(
                    partnerAvailability
                  )}</span>
                  <span class="detail">Style: ${this.getFormattedStudyType(
                    partnerStudyType
                  )}</span>
                  <span class="detail">Updated: ${
                    updatedAt ? this.formatTime(updatedAt) : "Recently"
                  }</span>
                </div>
              </div>
            </div>
            <div class="connection-actions">
              <button class="action-btn chat-btn" onclick="dashboard.startDynamicChat('${partnerPayload}')">
                <i class="fas fa-comment"></i> Message
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }


  async loadSentRequests() {
    // Use connectionState if available, otherwise empty array
    // This includes both pending and accepted sent requests
    const sentRequests = this.connectionState?.pendingOutgoing || [];
    this.displaySentRequests(sentRequests);
  }

  displayIncomingRequests(requests = []) {
    const incomingList = document.getElementById("incomingRequestsList");
    if (!incomingList) return;

    if (!requests.length) {
      incomingList.innerHTML = `
        <div class="no-requests">
          <i class="fas fa-inbox"></i>
          <p>No pending connection requests</p>
        </div>
      `;
      return;
    }

    incomingList.innerHTML = requests
      .map((conn) => {
        const requesterId = conn.requesterId;
        const requesterName = conn.requesterName || "Student";
        const requesterUniversity = conn.requesterUniversity || "Not specified";
        const requesterCourse = conn.requesterCourse || "Not specified";
        const createdAt = conn.createdAt?.toDate
          ? conn.createdAt.toDate()
          : conn.createdAt
          ? new Date(conn.createdAt)
          : new Date();

        return `
          <div class="request-item">
            <div class="request-info">
              <div class="request-avatar">
                ${requesterName.charAt(0).toUpperCase()}
              </div>
              <div class="request-details">
                <h4>${requesterName}</h4>
                <p>${requesterCourse} • ${requesterUniversity}</p>
                <small>Requested ${this.formatTime(createdAt)}</small>
              </div>
            </div>
            <div class="request-actions">
              <button class="action-btn accept-btn" onclick="dashboard.respondToConnection('${conn.id}', 'accept')">
                <i class="fas fa-check"></i> Accept
              </button>
              <button class="action-btn reject-btn" onclick="dashboard.respondToConnection('${conn.id}', 'decline')">
                <i class="fas fa-times"></i> Decline
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  displaySentRequests(requests = []) {
    const sentList = document.getElementById("sentRequestsList");
    if (!sentList) return;

    if (!requests.length) {
      sentList.innerHTML = `
        <div class="no-requests">
          <i class="fas fa-paper-plane"></i>
          <p>No sent requests</p>
        </div>
      `;
      return;
    }

    sentList.innerHTML = requests
      .map(
        (request) => {
          const isAccepted = request.status === "accepted";
          const isPending = request.status === "pending";
          
          return `
        <div class="request-item">
          <div>
            <strong>${request.receiverName}</strong>
            <p>${request.receiverCourse || "Course"} • ${
          request.receiverUniversity || "University"
        }</p>
          </div>
          <div class="request-status">
            ${isAccepted 
              ? '<span class="status-badge status-accepted"><i class="fas fa-check-circle"></i> Accepted</span>'
              : isPending
              ? '<span class="status-badge status-pending"><i class="fas fa-clock"></i> Pending</span>'
              : '<span class="status-badge status-pending">Pending</span>'
            }
          </div>
        </div>
      `;
        }
      )
      .join("");
  }

  // ==================== PROFILE FUNCTIONALITY ====================

  loadUserData() {
    this.updateNotificationCounts();
    this.loadUserProfile();
  }

  /**
   * Load dynamic suggestions based on current user's profile
   * Fetches users from Firebase that match the current user's preferences
   */
  async loadSuggestions() {
    const suggestionsContent = document.getElementById("suggestionsContent");
    if (!suggestionsContent) return;

    if (!this.currentUser) {
      suggestionsContent.innerHTML = '<div class="no-suggestions"><i class="fas fa-user-slash"></i><p>Please login to see suggestions</p></div>';
      return;
    }

    try {
      suggestionsContent.innerHTML = '<div class="loading-suggestions"><i class="fas fa-spinner fa-spin"></i> Loading suggestions...</div>';

      // Ensure Firebase is available
      if (typeof authManager === "undefined" || !authManager.db) {
        throw new Error("Database not available");
      }

      const db = authManager.db;
      const currentUserId = this.currentUser.id;

      // Get current user's preferences
      const userCourse = (this.currentUser.course || "").toLowerCase();
      const userCourseKeywords = (this.currentUser.courseKeywords || []).map(k => k.toLowerCase());
      const userAvailability = this.currentUser.availability || "";
      const userStudyType = this.currentUser.studyType || "";
      const userUniversity = (this.currentUser.university || "").toLowerCase();
      const userCountry = this.currentUser.countryCode || "";

      // Query all active users (more inclusive)
      let usersQuery = db.collection("users")
        .where("deleted", "==", false)
        .limit(50); // Get more users to find better matches

      const usersSnapshot = await usersQuery.get();
      const suggestions = [];

      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const userId = doc.id;

        // Skip current user
        if (userId === currentUserId) return;

        // Calculate match score - more inclusive algorithm
        let matchScore = 0;
        const otherCourse = (userData.course || "").toLowerCase();
        const otherCourseKeywords = (userData.courseKeywords || []).map(k => k.toLowerCase());
        const otherUniversity = (userData.university || "").toLowerCase();

        // Course match - check for similar courses (more inclusive)
        if (userCourse && otherCourse) {
          // Exact match or contains
          if (otherCourse.includes(userCourse) || userCourse.includes(otherCourse)) {
            matchScore += 50;
          }
          // Check for keyword matches
          else if (userCourseKeywords.length > 0 && otherCourseKeywords.length > 0) {
            const commonKeywords = userCourseKeywords.filter(k => otherCourseKeywords.includes(k));
            if (commonKeywords.length > 0) {
              matchScore += 30 + (commonKeywords.length * 5); // 30 base + 5 per keyword
            }
          }
          // Partial word matches (e.g., "Computer Science" matches "Computer")
          else {
            const userWords = userCourse.split(/\s+/);
            const otherWords = otherCourse.split(/\s+/);
            const commonWords = userWords.filter(w => w.length > 3 && otherWords.some(ow => ow.includes(w) || w.includes(ow)));
            if (commonWords.length > 0) {
              matchScore += 20 + (commonWords.length * 5);
            }
          }
        }

        // University match
        if (userUniversity && otherUniversity && otherUniversity === userUniversity) {
          matchScore += 15;
        }

        // Availability match
        if (userAvailability && userData.availability === userAvailability) {
          matchScore += 15;
        }

        // Study type match
        if (userStudyType && userData.studyType === userStudyType) {
          matchScore += 15;
        }

        // Country match (small bonus)
        if (userCountry && userData.countryCode === userCountry) {
          matchScore += 5;
        }

        // Include ALL users, even with low match scores (more inclusive)
        // But prioritize those with at least some course similarity
        if (matchScore > 0 || otherCourse) {
          suggestions.push({
            id: userId,
            name: userData.name || "Student",
            email: userData.email || "",
            course: userData.course || "",
            university: userData.university || "",
            availability: userData.availability || "",
            studyType: userData.studyType || "",
            country: userData.country || "",
            matchScore: matchScore || 5 // Minimum 5% for visibility
          });
        }
      });

      // Sort by match score (highest first) and take top 8 (more suggestions)
      suggestions.sort((a, b) => b.matchScore - a.matchScore);
      const topSuggestions = suggestions.slice(0, 8);

      // Display suggestions
      this.displaySuggestions(topSuggestions);

      // Setup refresh button
      const refreshBtn = document.getElementById("refreshSuggestionsBtn");
      if (refreshBtn) {
        refreshBtn.onclick = () => this.loadSuggestions();
      }

    } catch (error) {
      console.error("Error loading suggestions:", error);
      suggestionsContent.innerHTML = '<div class="no-suggestions"><i class="fas fa-exclamation-circle"></i><p>Unable to load suggestions</p></div>';
    }
  }

  /**
   * Display suggestions in the suggestions card
   */
  displaySuggestions(suggestions) {
    const suggestionsContent = document.getElementById("suggestionsContent");
    if (!suggestionsContent) return;

    if (!suggestions || suggestions.length === 0) {
      suggestionsContent.innerHTML = '<div class="no-suggestions"><i class="fas fa-users"></i><p>No matching partners found. Try adjusting your search!</p></div>';
      return;
    }

    let html = '';
    suggestions.forEach(suggestion => {
      const initials = suggestion.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      html += `
        <div class="suggestion-item" onclick="dashboardApp.viewSuggestion('${suggestion.id}')">
          <div class="suggestion-header">
            <div class="suggestion-avatar">${initials}</div>
            <div class="suggestion-info">
              <h4>${suggestion.name}</h4>
              <p>${suggestion.university || 'University not specified'}</p>
            </div>
          </div>
          <div class="suggestion-details">
            ${suggestion.course ? `<span class="suggestion-tag"><i class="fas fa-book"></i> ${suggestion.course}</span>` : ''}
            ${suggestion.availability ? `<span class="suggestion-tag"><i class="fas fa-clock"></i> ${suggestion.availability}</span>` : ''}
            ${suggestion.studyType ? `<span class="suggestion-tag"><i class="fas fa-users"></i> ${suggestion.studyType}</span>` : ''}
          </div>
          <div class="suggestion-match-score">
            <i class="fas fa-star"></i> ${suggestion.matchScore}% Match
          </div>
        </div>
      `;
    });

    suggestionsContent.innerHTML = html;
  }

  /**
   * Handle clicking on a suggestion - pre-fill search form or show user details
   */
  viewSuggestion(userId) {
    // For now, just scroll to search form
    // Could be enhanced to pre-fill search or show user modal
    const searchForm = document.getElementById("studySearchForm");
    if (searchForm) {
      searchForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  updateNotificationCounts() {
    const messageNotification = document.getElementById("messageNotification");
    const connectionNotification = document.getElementById(
      "connectionNotification"
    );

    if (messageNotification) messageNotification.classList.add("hidden");
    if (connectionNotification) connectionNotification.classList.add("hidden");
  }

  loadUserProfile() {
    console.log("Loading user profile...");
    if (this.currentUser) {
      const profileUserName = document.getElementById("profileUserName");
      const profileUserEmail = document.getElementById("profileUserEmail");

      if (profileUserName) profileUserName.textContent = this.currentUser.name;
      if (profileUserEmail)
        profileUserEmail.textContent = this.currentUser.email;
    }
  }

  loadProfileData() {
    console.log("Loading profile data...");
    if (this.currentUser) {
      const profileUserName = document.getElementById("profileUserName");
      const profileUserEmail = document.getElementById("profileUserEmail");
      const profileUserUniversity = document.getElementById(
        "profileUserUniversity"
      );
      const profileCourse = document.getElementById("profileCourse");
      const profileAvailability = document.getElementById(
        "profileAvailability"
      );
      const profileStudyType = document.getElementById("profileStudyType");
      const profileJoinDate = document.getElementById("profileJoinDate");
      const profileConnectionsCount = document.getElementById(
        "profileConnectionsCount"
      );
      const profileStudyGroups = document.getElementById("profileStudyGroups");

      // Set ALL user data including university
      if (profileUserName)
        profileUserName.textContent = this.currentUser.name || "Student";
      if (profileUserEmail)
        profileUserEmail.textContent = this.currentUser.email || "No email";
      if (profileUserUniversity)
        profileUserUniversity.textContent =
          this.currentUser.university || "University not specified";
      if (profileCourse)
        profileCourse.textContent =
          this.currentUser.course || "Course not specified";
      if (profileAvailability)
        profileAvailability.textContent = this.getFormattedAvailability(
          this.currentUser.availability
        );
      if (profileStudyType)
        profileStudyType.textContent = this.getFormattedStudyType(
          this.currentUser.studyType
        );
      if (profileJoinDate)
        profileJoinDate.textContent = this.currentUser.createdAt
          ? new Date(this.currentUser.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "Recently";
      // Get dynamic connections count
      if (profileConnectionsCount && this.connectionState) {
        profileConnectionsCount.textContent = (this.connectionState.accepted?.length || 0).toString();
      } else if (profileConnectionsCount) {
        profileConnectionsCount.textContent = "0";
      }
      
      // Get dynamic study groups (conversations count)
      if (profileStudyGroups && this.messagesManager) {
        // This will be updated when conversations load
        profileStudyGroups.textContent = "0";
      } else if (profileStudyGroups) {
        profileStudyGroups.textContent = "0";
      }
    }
  }

  showEditProfileForm() {
    if (!this.currentUser) {
      errorHandler.showUserError("Please log in to edit your profile");
      return;
    }

    // Create or show edit profile modal
    let editModal = document.getElementById("editProfileModal");
    if (!editModal) {
      editModal = document.createElement("div");
      editModal.id = "editProfileModal";
      editModal.className = "modal-overlay";
      editModal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Edit Profile</h3>
            <button class="modal-close" id="closeEditProfileModal">&times;</button>
          </div>
          <form id="editProfileForm" class="modal-body">
            <div class="form-group">
              <label for="editName">Full Name</label>
              <input type="text" id="editName" required>
            </div>
            <div class="form-group">
              <label for="editEmail">Email</label>
              <input type="email" id="editEmail" required>
            </div>
            <div class="form-group">
              <label for="editCourse">Course</label>
              <input type="text" id="editCourse" required>
            </div>
            <div class="form-group">
              <label for="editAvailability">Availability</label>
              <select id="editAvailability" required>
                <option value="morning">Mornings</option>
                <option value="afternoon">Afternoons</option>
                <option value="evening">Evenings</option>
                <option value="weekend">Weekends</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editStudyType">Study Style</label>
              <select id="editStudyType" required>
                <option value="group">Group Study</option>
                <option value="pair">One-on-One</option>
                <option value="project">Project Collaboration</option>
                <option value="any">Any Style</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editCountry">Country</label>
              <select id="editCountry" required></select>
            </div>
            <div class="form-group">
              <label for="editUniversity">University</label>
              <select id="editUniversity" required></select>
              <input type="text" id="editCustomUniversity" class="hidden" placeholder="Enter your university">
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" id="cancelEditProfile">Cancel</button>
              <button type="submit" class="btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(editModal);

      // Setup event listeners for modal
      document.getElementById("closeEditProfileModal").addEventListener("click", () => {
        editModal.classList.remove("active");
      });
      document.getElementById("cancelEditProfile").addEventListener("click", () => {
        editModal.classList.remove("active");
      });
      editModal.addEventListener("click", (e) => {
        if (e.target === editModal) {
          editModal.classList.remove("active");
        }
      });
      document.getElementById("editProfileForm").addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleProfileUpdate();
      });

      // Setup country and university dropdowns
      this.setupEditProfileDropdowns();
    }

    // Populate form with current user data
    document.getElementById("editName").value = this.currentUser.name || "";
    document.getElementById("editEmail").value = this.currentUser.email || "";
    document.getElementById("editCourse").value = this.currentUser.course || "";
    document.getElementById("editAvailability").value = this.currentUser.availability || "flexible";
    document.getElementById("editStudyType").value = this.currentUser.studyType || "group";
    
    // Set country
    if (this.currentUser.countryCode) {
      document.getElementById("editCountry").value = this.currentUser.countryCode;
      this.handleEditCountryChange(this.currentUser.countryCode);
    }

    // Set university
    if (this.currentUser.university) {
      const universitySelect = document.getElementById("editUniversity");
      // Wait for universities to load
      setTimeout(() => {
        if (universitySelect) {
          const option = Array.from(universitySelect.options).find(
            opt => opt.text === this.currentUser.university
          );
          if (option) {
            universitySelect.value = option.value;
          } else {
            // University not in list, show custom input
            universitySelect.value = "other";
            document.getElementById("editCustomUniversity").value = this.currentUser.university;
            document.getElementById("editCustomUniversity").classList.remove("hidden");
          }
        }
      }, 500);
    }

    editModal.classList.add("active");
  }

  setupEditProfileDropdowns() {
    // Load countries
    countriesService.loadCountries().then(() => {
      countriesService.populateCountryDropdown("editCountry", {
        placeholder: "Select your country",
        includeAllOption: false,
      });
      
      // Setup country change handler
      document.getElementById("editCountry").addEventListener("change", (e) => {
        this.handleEditCountryChange(e.target.value);
      });
    });

    // Setup university change handler
    document.getElementById("editUniversity").addEventListener("change", (e) => {
      const customInput = document.getElementById("editCustomUniversity");
      if (e.target.value === "other") {
        customInput.classList.remove("hidden");
        customInput.required = true;
      } else {
        customInput.classList.add("hidden");
        customInput.required = false;
      }
    });
  }

  async handleEditCountryChange(countryCode) {
    if (!countryCode) return;
    try {
      const result = await universitiesService.loadUniversities(countryCode);
      universitiesService.populateUniversityDropdown("editUniversity", result.universities, {
        placeholder: "Select your university",
        includeAllOption: false,
        includeOtherOption: true,
      });
    } catch (error) {
      console.error("Error loading universities:", error);
    }
  }

  async handleProfileUpdate() {
    const editModal = document.getElementById("editProfileModal");
    const submitBtn = editModal.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    try {
      const name = document.getElementById("editName").value.trim();
      const email = document.getElementById("editEmail").value.trim();
      const course = document.getElementById("editCourse").value.trim();
      const availability = document.getElementById("editAvailability").value;
      const studyType = document.getElementById("editStudyType").value;
      const countryCode = document.getElementById("editCountry").value;
      const universitySelect = document.getElementById("editUniversity");
      const customUniversity = document.getElementById("editCustomUniversity").value.trim();
      
      let university = "";
      if (universitySelect.value === "other") {
        university = customUniversity;
      } else {
        university = universitySelect.options[universitySelect.selectedIndex].text;
      }

      if (!name || !email || !course || !countryCode || !university) {
        throw new Error("Please fill in all required fields");
      }

      const countryName = countriesService.getCountryName(countryCode);
      if (!countryName) {
        throw new Error("Invalid country selected");
      }

      const updates = {
        name,
        email,
        course,
        availability,
        studyType,
        country: countryName,
        countryCode,
        university,
        updatedAt: new Date(),
      };

      await authManager.updateUserProfile(this.currentUser.id, updates);
      
      // Update current user in localStorage
      this.currentUser = { ...this.currentUser, ...updates };
      localStorage.setItem("academico_current_user", JSON.stringify(this.currentUser));
      
      // Refresh profile display
      this.loadProfileData();
      
      // Close modal
      editModal.classList.remove("active");
      
      errorHandler.showSuccess("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      errorHandler.showUserError(error.message || "Failed to update profile. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  async loadEnhancedProfileData() {
    if (this.currentUser) {
      try {
        console.log("Loading enhanced profile data with APIs...");
        if (typeof enhancedAPI !== "undefined") {
          const recommendation =
            await enhancedAPI.getStudySessionRecommendation();
          this.displayStudyRecommendation(recommendation);
        }
      } catch (error) {
        console.log("Enhanced profile data unavailable:", error);
      }
    }
  }

  displayStudyRecommendation(recommendation) {
    const profileDetails = document.querySelector(".profile-details");
    if (profileDetails) {
      const existingRecommendation = document.querySelector(
        ".study-recommendation"
      );
      if (existingRecommendation) {
        existingRecommendation.remove();
      }

      const recommendationElement = document.createElement("div");
      recommendationElement.className = "study-recommendation";
      recommendationElement.innerHTML = `
        <h4><i class="fas fa-lightbulb"></i> Smart Study Recommendation</h4>
        <p>${recommendation.recommendation}</p>
        <div class="recommendation-details">
          <small>
            <strong>Weather:</strong> ${recommendation.weather.temperature}°C, ${recommendation.weather.conditions} | 
            <strong>Timezone:</strong> ${recommendation.timezone.timezone}
          </small>
        </div>
      `;
      profileDetails.appendChild(recommendationElement);
    }
  }

  // ==================== HELPER METHODS ====================

  getFormattedAvailability(availability) {
    const availabilityMap = {
      morning: "Mornings",
      afternoon: "Afternoons",
      evening: "Evenings",
      weekend: "Weekends",
      flexible: "Flexible",
    };
    return availabilityMap[availability] || "Flexible";
  }

  getFormattedStudyType(studyType) {
    const studyTypeMap = {
      group: "Group Study",
      pair: "One-on-One",
      project: "Project Collaboration",
      any: "Any Style",
    };
    return studyTypeMap[studyType] || "Group Study";
  }

  setupNavigation() {
    console.log("Setting up navigation");
    this.showSection("searchSection");
    this.updateActiveNav(
      document.querySelector('.nav-link[data-section="searchSection"]')
    );
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

  // ==================== DEMO DATA ====================

  // ==================== OTHER METHODS ====================

  startNewChat() {
    alert(
      "To start a new chat, search for study partners and send them a connection request first."
    );
  }

  startChat(userId, userName) {
    console.log("Starting chat with:", userName);
    this.showSection("messagesSection");
  }

  startVideoCall(userId) {
    alert(
      `Video call would start with user ${userId}. This would integrate with Zoom/Meet.`
    );
  }

  async sendConnectionRequest(encodedPartner) {
    try {
      if (!this.connectionsManager) {
        throw new Error("Connection service unavailable");
      }

      const currentUser = authManager.getCurrentUser();
      if (!currentUser) {
        throw new Error("Please log in to send connection requests");
      }

      // Ensure manager is initialized with current user
      if (this.connectionsManager.currentUser?.id !== currentUser.id) {
        await this.connectionsManager.reinit();
      }

      const partner = JSON.parse(decodeURIComponent(encodedPartner));
      await this.connectionsManager.sendConnectionRequest(partner);
      errorHandler.showSuccess(
        `Connection request sent to ${partner.name || "student"}`
      );
    } catch (error) {
      console.error("Connection request error:", error);
      errorHandler.showUserError(
        error.message || "Failed to send connection request."
      );
    }
  }

  switchConnectionTab(btn) {
    console.log("Switching to tab:", btn.getAttribute("data-tab"));
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((content) => content.classList.remove("active"));

    btn.classList.add("active");
    const tabId = btn.getAttribute("data-tab");
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
      tabContent.classList.add("active");
    }
  }

  async loadStudyBreakContent() {
    try {
      // Get academic quote from enhanced API
      if (typeof enhancedAPI !== "undefined") {
        const quoteData = await enhancedAPI.getStudyQuote();
        const quoteElement = document.getElementById("studyBreakQuote");
        const authorElement = document.getElementById("studyBreakAuthor");
        const titleElement = document.getElementById("studyBreakTitle");
        
        if (quoteElement) {
          quoteElement.innerHTML = `<p>"${quoteData.quote}"</p>`;
        }
        if (authorElement && quoteData.author) {
          authorElement.textContent = `— ${quoteData.author}`;
        }
        if (titleElement) {
          titleElement.textContent = "Study Break Wisdom";
        }
      } else {
        // Fallback to local quotes
        const academicQuotes = [
          {
            quote: "The beautiful thing about learning is that no one can take it away from you.",
            author: "B.B. King"
          },
          {
            quote: "Education is the most powerful weapon which you can use to change the world.",
            author: "Nelson Mandela"
          },
          {
            quote: "The mind is not a vessel to be filled, but a fire to be kindled.",
            author: "Plutarch"
          },
          {
            quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
            author: "Mahatma Gandhi"
          },
          {
            quote: "An investment in knowledge pays the best interest.",
            author: "Benjamin Franklin"
          }
        ];
        
        const randomQuote = academicQuotes[Math.floor(Math.random() * academicQuotes.length)];
        const quoteElement = document.getElementById("studyBreakQuote");
        const authorElement = document.getElementById("studyBreakAuthor");
        
        if (quoteElement) {
          quoteElement.innerHTML = `<p>"${randomQuote.quote}"</p>`;
        }
        if (authorElement) {
          authorElement.textContent = `— ${randomQuote.author}`;
        }
      }
    } catch (error) {
      console.error("Error loading study break content:", error);
      const quoteElement = document.getElementById("studyBreakQuote");
      if (quoteElement) {
        quoteElement.innerHTML = `<p>"The beautiful thing about learning is that no one can take it away from you."</p>`;
      }
      const authorElement = document.getElementById("studyBreakAuthor");
      if (authorElement) {
        authorElement.textContent = "— B.B. King";
      }
    }
  }

  showAdminDashboard() {
    this.showSection("adminSection");
    this.loadAdminDashboard();
  }

  async respondToConnection(connectionId, action) {
    if (!this.connectionsManager) {
      errorHandler.showUserError("Connection service unavailable");
      return;
    }
    try {
      console.log(`Responding to connection ${connectionId} with action: ${action}`);
      await this.connectionsManager.respondToRequest(connectionId, action);
      const message =
        action === "accept"
          ? "Connection accepted! They will appear in your connections."
          : "Connection request declined";
      errorHandler.showSuccess(message);
      
      // Force a refresh of connections after a short delay to ensure Firestore has updated
      setTimeout(() => {
        if (this.connectionState) {
          console.log("Refreshing connections display after response");
          this.displayConnections(this.connectionState.accepted || []);
          this.displaySentRequests(this.connectionState.pendingOutgoing || []);
        }
      }, 500);
    } catch (error) {
      console.error("Connection response error:", error);
      errorHandler.showUserError(
        error.message || "Unable to update connection. Please try again."
      );
    }
  }

  updateConnectionNotification(count) {
    const notification = document.getElementById("connectionNotification");
    if (notification) {
      if (count > 0) {
        notification.textContent = count;
        notification.classList.remove("hidden");
      } else {
        notification.classList.add("hidden");
      }
    }
  }

  async loadAdminDashboard() {
    const adminTotalUsers = document.getElementById("adminTotalUsers");
    const adminTotalMessages = document.getElementById("adminTotalMessages");
    const adminTotalConnections = document.getElementById(
      "adminTotalConnections"
    );
    const usersTableBody = document.getElementById("usersTableBody");

    if (usersTableBody) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="loading-row">
            <i class="fas fa-spinner fa-spin"></i> Loading users...
          </td>
        </tr>
      `;
    }

    try {
      const [users, connectionStats, conversationStats] = await Promise.all([
        authManager.getAllUsers(),
        this.connectionsManager
          ? this.connectionsManager.getConnectionStats()
          : { total: 0 },
        this.messagesManager
          ? this.messagesManager.getConversationStats()
          : { messages: 0 },
      ]);

      if (adminTotalUsers) adminTotalUsers.textContent = users.length;
      if (adminTotalConnections)
        adminTotalConnections.textContent = connectionStats.total || 0;
      if (adminTotalMessages)
        adminTotalMessages.textContent = conversationStats.messages || 0;

      this.renderAdminUsers(users);
    } catch (error) {
      console.error("Error loading admin data:", error);
      if (usersTableBody) {
        usersTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="error-message">
              Unable to load admin data. Please try again later.
            </td>
          </tr>
        `;
      }
    }
  }

  renderAdminUsers(users = []) {
    const usersTableBody = document.getElementById("usersTableBody");
    if (!usersTableBody) return;

    if (!users.length) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="no-data">
            No registered users yet.
          </td>
        </tr>
      `;
      return;
    }

    usersTableBody.innerHTML = users
      .map((user) => {
        const createdAt = user.createdAt?.toDate
          ? user.createdAt.toDate()
          : user.createdAt
          ? new Date(user.createdAt)
          : null;
        return `
        <tr>
          <td>${user.name || "Student"}</td>
          <td>${user.email || "N/A"}</td>
          <td>${user.university || "Not specified"}</td>
          <td>${user.course || "Not specified"}</td>
          <td>${createdAt ? createdAt.toLocaleDateString() : "Recently"}</td>
          <td><span class="status-active">Active</span></td>
        </tr>
      `;
      })
      .join("");
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
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loadingDiv);
  }

  hideLoading() {
    const existingLoader = document.getElementById("globalLoading");
    if (existingLoader) existingLoader.remove();
  }
}

// Initialize dashboard
console.log("Starting dashboard initialization...");
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded, creating dashboard instance...");
  window.dashboard = new DashboardApp();
  window.dashboard.init().catch((error) => {
    console.error("Dashboard initialization failed:", error);
  });
});
