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
  }

  async init() {
    if (this.isInitialized) return;

    console.log("Dashboard initializing...");
    await this.checkAuthentication();
    this.initializeManagers();
    this.setupEventListeners();
    this.loadUserData();
    this.setupNavigation();

    // Add small delay to ensure DOM is fully ready
    setTimeout(() => {
      this.loadCountries();
      this.loadUniversities();
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
        });
        this.messagesManager.onMessagesUpdate((messages, conversationId) => {
          if (conversationId === this.activeConversationId) {
            this.displayMessages(messages);
          }
        });
      }
      if (typeof connectionsManager !== "undefined") {
        this.connectionsManager = connectionsManager;
        console.log("Connections manager initialized");
        this.connectionsManager.onChange((grouped) => {
          this.connectionState = grouped;
          this.displayConnections(grouped.accepted);
          this.displayPendingRequests(grouped.pendingIncoming);
          this.displaySentRequests(grouped.pendingOutgoing);
        });
      }
    } catch (error) {
      console.log("Managers not available:", error);
    }
  }

  checkAuthentication() {
    const userData = localStorage.getItem("academico_current_user");
    if (!userData) {
      console.log("No user data, redirecting to index");
      window.location.href = "index.html";
      return;
    }

    this.currentUser = JSON.parse(userData);
    this.updateUserInterface();
    console.log("User authenticated:", this.currentUser.name);
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

    document.getElementById("studyBreakBtn").addEventListener("click", () => {
      console.log("Study break clicked");
      this.getStudyBreakActivity();
    });

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

    // Country and University change events - ENHANCED
    document.getElementById("countryFilter").addEventListener("change", (e) => {
      console.log("Country filter changed:", e.target.value);
      this.handleCountryChange(e.target.value);
    });

    document
      .getElementById("universityFilter")
      .addEventListener("change", (e) => {
        console.log("University filter changed:", e.target.value);
        // No special handling needed - value will be used in search
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

    console.log("Event listeners setup complete");
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

  // ==================== ENHANCED SEARCH FUNCTIONALITY ====================

  async handleSearch(e) {
    e.preventDefault();
    console.log("Handling search...");

    const filters = {
      course: document.getElementById("courseInput").value,
      topic: document.getElementById("topicInput").value,
      availability: document.getElementById("availabilitySelect").value,
      studyType: document.getElementById("studyTypeSelect").value,
      country: document.getElementById("countryFilter").value,
      university: document.getElementById("universityFilter").value,
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
      // The chat service now handles conversations with real matches
      console.log("Chat service managing conversations with actual matches");
    } catch (error) {
      console.log("Error loading conversations:", error);
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

  async openConversation(conversationId, partnerName) {
    if (!conversationId) return;

    this.activeConversationId = conversationId;

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

    if (this.messagesManager) {
      this.messagesManager.watchMessages(conversationId);
    }
    this.setupMessageSending(conversationId);
  }

  displayMessages(messages = []) {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    chatMessages.innerHTML = messages
      .map((msg) => {
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
      .join("");

    chatMessages.scrollTop = chatMessages.scrollHeight;
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
    this.displayPendingRequests(this.connectionState?.pendingIncoming || []);
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
              <button class="action-btn video-call-btn" onclick="dashboard.startVideoCall('${partnerId}')">
                <i class="fas fa-video"></i> Call
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  async loadPendingRequests() {
    this.displayPendingRequests([]);
  }

  displayPendingRequests(requests = []) {
    const pendingList = document.getElementById("pendingRequestsList");
    if (!pendingList) return;

    if (!requests.length) {
      pendingList.innerHTML = `
        <div class="no-requests">
          <i class="fas fa-clock"></i>
          <p>No pending requests</p>
        </div>
      `;
      return;
    }

    pendingList.innerHTML = requests
      .map((request) => {
        return `
        <div class="request-item">
          <div>
            <strong>${request.requesterName}</strong>
            <p>${request.requesterCourse || "Course"} • ${
          request.requesterUniversity || "University"
        }</p>
          </div>
          <div class="request-actions">
            <button class="action-btn connect-btn" onclick="dashboard.respondToConnection('${
              request.id
            }','accept')">
              <i class="fas fa-check"></i> Accept
            </button>
            <button class="action-btn chat-btn" onclick="dashboard.respondToConnection('${
              request.id
            }','decline')">
              <i class="fas fa-times"></i> Decline
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  }

  async loadSentRequests() {
    this.displaySentRequests([]);
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
        (request) => `
        <div class="request-item">
          <div>
            <strong>${request.receiverName}</strong>
            <p>${request.receiverCourse || "Course"} • ${
          request.receiverUniversity || "University"
        }</p>
          </div>
          <div class="request-status">
            <span class="status-badge status-pending">Pending</span>
          </div>
        </div>
      `
      )
      .join("");
  }

  // ==================== PROFILE FUNCTIONALITY ====================

  loadUserData() {
    this.updateNotificationCounts();
    this.loadUserProfile();
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
      if (profileConnectionsCount) profileConnectionsCount.textContent = "2";
      if (profileStudyGroups) profileStudyGroups.textContent = "1";
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

  getStudyBreakActivity() {
    const activities = [
      "Take a 5-minute walk and stretch",
      "Listen to your favorite music",
      "Do some quick breathing exercises",
      "Have a healthy snack",
      "Watch a funny short video",
      "Do 10 minutes of light exercise",
    ];

    const randomActivity =
      activities[Math.floor(Math.random() * activities.length)];
    alert(`Study Break Suggestion: ${randomActivity}`);
  }

  showAdminDashboard() {
    this.showSection("adminSection");
    this.loadAdminDashboard();
  }

  async respondToConnection(connectionId, action) {
    if (!this.connectionsManager) return;
    try {
      await this.connectionsManager.respondToRequest(connectionId, action);
      const message =
        action === "accept"
          ? "Connection accepted"
          : "Connection request declined";
      errorHandler.showSuccess(message);
    } catch (error) {
      console.error("Connection response error:", error);
      errorHandler.showUserError(
        "Unable to update connection. Please try again."
      );
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
