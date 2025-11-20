// Dashboard Application using Managers
class DashboardApp {
  constructor() {
    this.currentUser = null;
    this.currentSection = "searchSection";
    this.messagesManager = null;
    this.connectionsManager = null;
    this.isInitialized = false;
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
      }
      if (typeof connectionsManager !== "undefined") {
        this.connectionsManager = connectionsManager;
        console.log("Connections manager initialized");
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
      const countryFilter = document.getElementById("countryFilter");
      if (countryFilter) {
        // Clear existing options
        countryFilter.innerHTML = '<option value="">All Countries</option>';

        // Use the countries from your countries.js service
        if (window.countriesService && window.countriesService.countries) {
          window.countriesService.countries.forEach((country) => {
            const option = document.createElement("option");
            option.value = country.code;
            option.textContent = country.name;
            countryFilter.appendChild(option);
          });
          console.log("Countries loaded from countriesService");
        } else {
          // Fallback countries
          const fallbackCountries = [
            { code: "RW", name: "Rwanda" },
            { code: "KE", name: "Kenya" },
            { code: "UG", name: "Uganda" },
            { code: "TZ", name: "Tanzania" },
            { code: "US", name: "United States" },
            { code: "GB", name: "United Kingdom" },
            { code: "CA", name: "Canada" },
            { code: "ZA", name: "South Africa" },
            { code: "NG", name: "Nigeria" },
            { code: "GH", name: "Ghana" },
          ];

          fallbackCountries.forEach((country) => {
            const option = document.createElement("option");
            option.value = country.code;
            option.textContent = country.name;
            countryFilter.appendChild(option);
          });
          console.log("Countries loaded from fallback data");
        }
      }
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  }

  async loadUniversities() {
    console.log("Loading universities...");
    try {
      const universityFilter = document.getElementById("universityFilter");
      if (universityFilter) {
        // Start with default option
        universityFilter.innerHTML =
          '<option value="">All Universities</option>';

        // Add some common universities
        const commonUniversities = [
          "University of Rwanda",
          "University of Nairobi",
          "Makerere University",
          "University of Dar es Salaam",
          "University of Ghana",
          "University of Cape Town",
          "Stanford University",
          "Harvard University",
          "Massachusetts Institute of Technology",
          "University of Lagos",
          "University of Ibadan",
        ];

        commonUniversities.forEach((uni) => {
          const option = document.createElement("option");
          option.value = uni;
          option.textContent = uni;
          universityFilter.appendChild(option);
        });

        console.log("Universities loaded successfully");
      }
    } catch (error) {
      console.error("Error loading universities:", error);
    }
  }

  async handleCountryChange(countryCode) {
    console.log("Country changed to:", countryCode);
    if (!countryCode) {
      this.loadUniversities(); // Reset to all universities
      return;
    }

    try {
      const universityFilter = document.getElementById("universityFilter");
      if (universityFilter) {
        universityFilter.innerHTML =
          '<option value="">Loading universities...</option>';

        // Get country name
        const countryName = this.getCountryName(countryCode);

        // Simulate API call with timeout
        setTimeout(() => {
          this.populateUniversitiesByCountry(countryName);
        }, 500);
      }
    } catch (error) {
      console.error("Error handling country change:", error);
      this.loadUniversities(); // Reset on error
    }
  }

  populateUniversitiesByCountry(countryName) {
    const universityFilter = document.getElementById("universityFilter");
    if (!universityFilter) return;

    // University data by country
    const universitiesByCountry = {
      Rwanda: [
        "University of Rwanda",
        "Kigali Independent University",
        "Adventist University of Central Africa",
        "University of Kigali",
        "Institut d'Enseignement Supérieur de Ruhengeri",
      ],
      Kenya: [
        "University of Nairobi",
        "Kenyatta University",
        "Strathmore University",
        "Moi University",
        "Jomo Kenyatta University of Agriculture and Technology",
      ],
      Uganda: [
        "Makerere University",
        "Kyambogo University",
        "Uganda Christian University",
        "Kampala International University",
        "Uganda Martyrs University",
      ],
      Tanzania: [
        "University of Dar es Salaam",
        "Nelson Mandela African Institution of Science and Technology",
        "University of Dodoma",
        "Sokoine University of Agriculture",
        "Ardhi University",
      ],
      Ghana: [
        "University of Ghana",
        "Kwame Nkrumah University of Science and Technology",
        "University of Cape Coast",
        "University of Education, Winneba",
      ],
      Nigeria: [
        "University of Lagos",
        "University of Ibadan",
        "University of Nigeria",
        "Obafemi Awolowo University",
      ],
      "South Africa": [
        "University of Cape Town",
        "University of Witwatersrand",
        "University of Pretoria",
        "Stellenbosch University",
      ],
    };

    universityFilter.innerHTML = '<option value="">All Universities</option>';

    const universities = universitiesByCountry[countryName] || [
      "Local University",
      "Community College",
      "Technical Institute",
    ];

    universities.forEach((uni) => {
      const option = document.createElement("option");
      option.value = uni;
      option.textContent = uni;
      universityFilter.appendChild(option);
    });

    console.log(
      `Loaded ${universities.length} universities for ${countryName}`
    );
  }

  getCountryName(countryCode) {
    const countryMap = {
      RW: "Rwanda",
      KE: "Kenya",
      UG: "Uganda",
      TZ: "Tanzania",
      US: "United States",
      GB: "United Kingdom",
      CA: "Canada",
      ZA: "South Africa",
      NG: "Nigeria",
      GH: "Ghana",
    };
    return countryMap[countryCode] || "Unknown Country";
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
      let searchResults = [];

      // Use authManager for search (it has the enhanced filtering)
      if (typeof authManager !== "undefined") {
        searchResults = await authManager.searchUsers(filters);
      } else {
        // Enhanced demo filtering
        searchResults = this.getDemoConnections().filter((conn) => {
          const matchesCourse =
            !filters.course ||
            (conn.course &&
              conn.course.toLowerCase().includes(filters.course.toLowerCase()));
          const matchesTopic =
            !filters.topic ||
            (conn.topic &&
              conn.topic.toLowerCase().includes(filters.topic.toLowerCase()));
          const matchesCountry =
            !filters.country || conn.countryCode === filters.country;
          const matchesUniversity =
            !filters.university || conn.university === filters.university;
          const matchesAvailability =
            !filters.availability || conn.availability === filters.availability;
          const matchesStudyType =
            !filters.studyType || conn.studyType === filters.studyType;

          return (
            matchesCourse &&
            matchesTopic &&
            matchesCountry &&
            matchesUniversity &&
            matchesAvailability &&
            matchesStudyType
          );
        });
      }

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
            <div class="last-active">Last active: ${
              user.lastActive || "Recently"
            }</div>
          </div>
          <div class="partner-actions">
            <button class="action-btn chat-btn" onclick="dashboard.startDynamicChat('${
              user.id
            }', '${user.name}')">
              Start Chat
            </button>
            <button class="action-btn connect-btn" onclick="dashboard.sendConnectionRequest('${
              user.id
            }')">
              Connect
            </button>
          </div>
        </div>
      `;
        })
        .join("");
    }
  }

  // Add this new method for dynamic chat starting
  startDynamicChat(userId, userName) {
    console.log("Starting dynamic chat with:", userName);

    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      alert("Please log in to start chatting");
      return;
    }

    if (window.chatService) {
      // Start chat using the enhanced service
      window.chatService.startChat(currentUser, { id: userId, name: userName });

      // Switch to messages section
      this.showSection("messagesSection");

      // Show success message
      errorHandler.showSuccess(
        `Chat started with ${userName}! They will receive a notification.`
      );
    } else {
      // Fallback
      this.startChat(userId, userName);
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
        <p>Loading conversations...</p>
      </div>
    `;

    try {
      // Use demo conversations (no API calls)
      const conversations = this.getDemoConversations();
      this.displayConversations(conversations);
    } catch (error) {
      console.log("Error loading conversations:", error);
      this.displayConversations([]);
    }
  }

  displayConversations(conversations) {
    const conversationsList = document.getElementById("conversationsList");

    if (conversations.length === 0) {
      conversationsList.innerHTML = `
        <div class="no-conversations">
          <i class="fas fa-comments"></i>
          <p>No conversations yet</p>
          <p class="small">Start a chat with your study partners!</p>
        </div>
      `;
    } else {
      const conversationsHTML = conversations
        .map(
          (conv) => `
        <div class="conversation-item" data-conversation-id="${
          conv.id
        }" data-partner-id="${conv.partnerId}">
          <div class="conversation-avatar">${
            conv.partnerAvatar ||
            (conv.partnerName ? conv.partnerName.charAt(0) : "U")
          }</div>
          <div class="conversation-info">
            <div class="conversation-name">${conv.partnerName}</div>
            <div class="conversation-preview">${
              conv.lastMessage || "Start a conversation"
            }</div>
            <div class="conversation-details">
              <span class="conversation-course">${
                conv.partnerCourse || "Not specified"
              }</span>
              <span class="conversation-university">${
                conv.partnerUniversity || "Not specified"
              }</span>
            </div>
          </div>
          <div class="conversation-meta">
            <div class="conversation-time">${this.formatTime(
              conv.lastMessageTime
            )}</div>
            ${
              conv.unreadCount > 0
                ? `<div class="unread-badge">${conv.unreadCount}</div>`
                : ""
            }
          </div>
        </div>
      `
        )
        .join("");

      conversationsList.innerHTML = conversationsHTML;

      const conversationItems =
        conversationsList.querySelectorAll(".conversation-item");
      console.log(
        "Number of conversation items in DOM:",
        conversationItems.length
      );

      conversationItems.forEach((item) => {
        item.addEventListener("click", () => {
          const conversationId = item.getAttribute("data-conversation-id");
          const partnerName =
            item.querySelector(".conversation-name").textContent;
          console.log("Conversation clicked:", conversationId, partnerName);
          this.openConversation(conversationId, partnerName);
        });
      });
    }
  }

  async openConversation(conversationId, partnerName) {
    console.log("Opening conversation:", conversationId, "with", partnerName);

    const chatPlaceholder = document.getElementById("chatPlaceholder");
    const activeChat = document.getElementById("activeChat");

    if (chatPlaceholder) chatPlaceholder.classList.add("hidden");
    if (activeChat) {
      activeChat.classList.remove("hidden");
      activeChat.classList.add("active");
    }

    const chatPartnerName = document.getElementById("chatPartnerName");
    if (chatPartnerName) chatPartnerName.textContent = partnerName;

    await this.loadMessages(conversationId);
    this.setupMessageSending(conversationId);
  }

  async loadMessages(conversationId) {
    console.log("Loading messages for conversation:", conversationId);
    const chatMessages = document.getElementById("chatMessages");

    if (!chatMessages) {
      console.log("chatMessages element not found!");
      return;
    }

    try {
      const messages = this.getDemoMessages();
      this.displayMessages(messages);
    } catch (error) {
      console.log("Error loading messages:", error);
      this.displayMessages([]);
    }
  }

  displayMessages(messages) {
    const chatMessages = document.getElementById("chatMessages");

    chatMessages.innerHTML = messages
      .map(
        (msg) => `
        <div class="message ${msg.isOwn ? "own" : "other"}">
          <div class="message-bubble">
            <div class="message-sender">${msg.senderName}</div>
            <div class="message-text">${msg.content || msg.text}</div>
            <div class="message-time">${this.formatTime(msg.timestamp)}</div>
          </div>
        </div>
      `
      )
      .join("");

    chatMessages.scrollTop = chatMessages.scrollHeight;
    console.log("Messages loaded:", messages.length);
  }

  setupMessageSending(conversationId) {
    console.log("Setting up message sending for:", conversationId);
    const sendButton = document.getElementById("sendMessageBtn");
    const messageInput = document.getElementById("messageInput");

    if (!sendButton || !messageInput) {
      console.log("Message sending elements not found");
      return;
    }

    const sendMessage = async () => {
      const messageText = messageInput.value.trim();
      if (!messageText) return;

      console.log("Sending message:", messageText);

      try {
        const chatMessages = document.getElementById("chatMessages");
        const messageElement = document.createElement("div");
        messageElement.className = "message own";
        messageElement.innerHTML = `
          <div class="message-bubble">
            <div class="message-sender">You</div>
            <div class="message-text">${messageText}</div>
            <div class="message-time">${this.formatTime(new Date())}</div>
          </div>
        `;
        chatMessages.appendChild(messageElement);

        messageInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;

        this.loadConversations();
      } catch (error) {
        console.error("Error sending message:", error);
      }
    };

    const newSendButton = sendButton.cloneNode(true);
    const newMessageInput = messageInput.cloneNode(true);

    sendButton.parentNode.replaceChild(newSendButton, sendButton);
    messageInput.parentNode.replaceChild(newMessageInput, messageInput);

    newSendButton.onclick = sendMessage;
    newMessageInput.onkeypress = (e) => {
      if (e.key === "Enter") sendMessage();
    };
  }

  // ==================== CONNECTIONS FUNCTIONALITY ====================

  async loadConnections() {
    console.log("Loading connections...");
    await this.loadMyConnections();
    await this.loadPendingRequests();
    await this.loadSentRequests();
  }

  async loadMyConnections() {
    console.log("Loading my connections...");
    const connectionsGrid = document.getElementById("connectionsGrid");

    if (!connectionsGrid) {
      console.log("connectionsGrid element not found!");
      return;
    }

    connectionsGrid.innerHTML = `
      <div class="no-connections">
        <i class="fas fa-user-friends"></i>
        <p>Loading connections...</p>
      </div>
    `;

    try {
      const connections = this.getDemoConnections();
      this.displayConnections(connections);
    } catch (error) {
      console.log("Error loading connections:", error);
      this.displayConnections([]);
    }
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

  // Start dynamic chat with enhanced features
  startDynamicChat(userId, userName) {
    console.log("Starting dynamic chat with:", userName);

    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      alert("Please log in to start chatting");
      return;
    }

    if (window.chatService) {
      window.chatService.startChat(currentUser, { id: userId, name: userName });
      this.showSection("messagesSection");
      errorHandler.showSuccess(
        `Chat started with ${userName}! They will receive a notification.`
      );
    } else {
      this.startChat(userId, userName);
    }
  }

  // Enhanced message sending setup
  setupMessageSending(conversationId) {
    console.log("Setting up message sending for:", conversationId);
    const sendButton = document.getElementById("sendMessageBtn");
    const messageInput = document.getElementById("messageInput");

    if (!sendButton || !messageInput) {
      console.log("Message sending elements not found");
      return;
    }

    const sendMessage = async () => {
      const messageText = messageInput.value.trim();
      if (!messageText) return;

      console.log("Sending message:", messageText);

      try {
        const currentUser = authManager.getCurrentUser();
        if (currentUser && window.chatService) {
          await window.chatService.sendMessage(currentUser, messageText);
        } else {
          this.displayBasicMessage(messageText);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    };

    const newSendButton = sendButton.cloneNode(true);
    const newMessageInput = messageInput.cloneNode(true);

    sendButton.parentNode.replaceChild(newSendButton, sendButton);
    messageInput.parentNode.replaceChild(newMessageInput, messageInput);

    newSendButton.onclick = sendMessage;
    newMessageInput.onkeypress = (e) => {
      if (e.key === "Enter") sendMessage();
    };
  }

  // Basic message display fallback
  displayBasicMessage(messageText) {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    const messageElement = document.createElement("div");
    messageElement.className = "message own";
    messageElement.innerHTML = `
    <div class="message-bubble">
      <div class="message-sender">You</div>
      <div class="message-text">${messageText}</div>
      <div class="message-time">${new Date().toLocaleTimeString()}</div>
    </div>
  `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  displayConnections(connections) {
    const connectionsGrid = document.getElementById("connectionsGrid");

    if (connections.length === 0) {
      connectionsGrid.innerHTML = `
        <div class="no-connections">
          <i class="fas fa-user-friends"></i>
          <p>No connections yet</p>
          <p class="small">Find study partners to build your network!</p>
        </div>
      `;
    } else {
      connectionsGrid.innerHTML = connections
        .map(
          (conn) => `
          <div class="connection-card">
            <div class="connection-header">
              <div class="connection-avatar">${
                conn.avatar || (conn.name ? conn.name.charAt(0) : "U")
              }</div>
              <div class="connection-info">
                <h4>${conn.name}</h4>
                <p>${conn.course || "Not specified"} • ${
            conn.university || "Not specified"
          }</p>
                <div class="connection-details">
                  <span class="detail">Available: ${this.getFormattedAvailability(
                    conn.availability
                  )}</span>
                  <span class="detail">Style: ${this.getFormattedStudyType(
                    conn.studyType
                  )}</span>
                  <span class="detail">Last active: ${
                    conn.lastActive || this.formatTime(conn.lastActiveDate)
                  }</span>
                </div>
              </div>
            </div>
            <div class="connection-actions">
              <button class="action-btn chat-btn" onclick="dashboard.startChat('${
                conn.userId || conn.id
              }', '${conn.name}')">
                <i class="fas fa-comment"></i> Message
              </button>
              <button class="action-btn video-call-btn" onclick="dashboard.startVideoCall('${
                conn.userId || conn.id
              }')">
                <i class="fas fa-video"></i> Call
              </button>
            </div>
          </div>
        `
        )
        .join("");

      console.log(
        "Connections grid updated with",
        connections.length,
        "connections"
      );
    }
  }

  async loadPendingRequests() {
    console.log("Loading pending requests...");
    const pendingList = document.getElementById("pendingRequestsList");
    if (pendingList) {
      this.displayPendingRequests([]);
    }
  }

  displayPendingRequests(requests) {
    const pendingList = document.getElementById("pendingRequestsList");
    if (requests.length === 0) {
      pendingList.innerHTML = `
        <div class="no-requests">
          <i class="fas fa-clock"></i>
          <p>No pending requests</p>
        </div>
      `;
    }
  }

  async loadSentRequests() {
    console.log("Loading sent requests...");
    const sentList = document.getElementById("sentRequestsList");
    if (sentList) {
      this.displaySentRequests([]);
    }
  }

  displaySentRequests(requests) {
    const sentList = document.getElementById("sentRequestsList");
    if (requests.length === 0) {
      sentList.innerHTML = `
        <div class="no-requests">
          <i class="fas fa-paper-plane"></i>
          <p>No sent requests</p>
        </div>
      `;
    }
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

  getDemoConversations() {
    return [
      {
        id: "conv-1",
        partnerId: "user-2",
        partnerName: "Alex Johnson",
        partnerAvatar: "AJ",
        lastMessage: "Hey, are you available to study Calculus this weekend?",
        lastMessageTime: new Date(Date.now() - 5 * 60000),
        unreadCount: 0,
        partnerCourse: "Computer Science",
        partnerUniversity: "University of Rwanda",
      },
      {
        id: "conv-2",
        partnerId: "user-3",
        partnerName: "Sarah Chen",
        partnerAvatar: "SC",
        lastMessage: "Thanks for the study notes! They were really helpful.",
        lastMessageTime: new Date(Date.now() - 2 * 3600000),
        unreadCount: 0,
        partnerCourse: "Mathematics",
        partnerUniversity: "University of Nairobi",
      },
    ];
  }

  getDemoMessages() {
    return [
      {
        id: "msg-1",
        senderName: "Alex Johnson",
        senderId: "user-2",
        content:
          "Hi there! I saw we're both studying Computer Science. Would you like to form a study group?",
        timestamp: new Date(Date.now() - 30 * 60000),
        isOwn: false,
      },
      {
        id: "msg-2",
        senderName: "You",
        senderId: "user-1",
        content:
          "Hey Alex! That sounds great. I'm available in the evenings this week.",
        timestamp: new Date(Date.now() - 25 * 60000),
        isOwn: true,
      },
    ];
  }

  getDemoConnections() {
    return [
      {
        id: "conn-1",
        userId: "user-2",
        name: "Alex Johnson",
        avatar: "AJ",
        university: "University of Rwanda",
        country: "Rwanda",
        countryCode: "RW",
        course: "Computer Science",
        availability: "evening",
        studyType: "group",
        lastActive: "2 hours ago",
        lastActiveDate: new Date(Date.now() - 2 * 3600000),
        isOnline: false,
      },
      {
        id: "conn-2",
        userId: "user-3",
        name: "Sarah Chen",
        avatar: "SC",
        university: "University of Nairobi",
        country: "Kenya",
        countryCode: "KE",
        course: "Mathematics",
        availability: "afternoon",
        studyType: "pair",
        lastActive: "Online now",
        lastActiveDate: new Date(),
        isOnline: true,
      },
      {
        id: "conn-3",
        userId: "user-4",
        name: "Mike Davis",
        avatar: "MD",
        university: "Makerere University",
        country: "Uganda",
        countryCode: "UG",
        course: "Physics",
        availability: "morning",
        studyType: "project",
        lastActive: "1 hour ago",
        lastActiveDate: new Date(Date.now() - 1 * 3600000),
        isOnline: true,
      },
    ];
  }

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

  sendConnectionRequest(userId) {
    alert("Connection request sent! The user will be notified.");
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
  }

  loadAdminDashboard() {
    const adminTotalUsers = document.getElementById("adminTotalUsers");
    const adminTotalMessages = document.getElementById("adminTotalMessages");
    const adminTotalConnections = document.getElementById(
      "adminTotalConnections"
    );
    const usersTableBody = document.getElementById("usersTableBody");

    if (adminTotalUsers) adminTotalUsers.textContent = "156";
    if (adminTotalMessages) adminTotalMessages.textContent = "1,247";
    if (adminTotalConnections) adminTotalConnections.textContent = "423";

    if (usersTableBody) {
      usersTableBody.innerHTML = `
        <tr>
          <td>Alex Johnson</td>
          <td>alex@example.com</td>
          <td>University of Rwanda</td>
          <td>Computer Science</td>
          <td>2024-01-15</td>
          <td><span class="status-active">Active</span></td>
        </tr>
        <tr>
          <td>Sarah Chen</td>
          <td>sarah@example.com</td>
          <td>University of Nairobi</td>
          <td>Mathematics</td>
          <td>2024-01-10</td>
          <td><span class="status-active">Active</span></td>
        </tr>
        <tr>
          <td>Mike Davis</td>
          <td>mike@example.com</td>
          <td>Makerere University</td>
          <td>Physics</td>
          <td>2024-01-08</td>
          <td><span class="status-inactive">Inactive</span></td>
        </tr>
      `;
    }
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
