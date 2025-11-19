// Dashboard Application using Managers
class DashboardApp {
  constructor() {
    this.currentUser = null;
    this.currentSection = "searchSection";
    this.messagesManager = null;
    this.connectionsManager = null;
    this.isInitialized = false;
    this.apiBaseUrl = 'http://localhost:3000/api'; // Update with your backend URL
    this.backendAvailable = true; // We'll check this on first API call
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log("Dashboard initializing...");
    await this.checkAuthentication();
    this.initializeManagers();
    this.setupEventListeners();
    this.loadUserData();
    this.setupNavigation();
    this.loadCountries();
    
    this.isInitialized = true;
    console.log("Dashboard initialized");
  }

  initializeManagers() {
    // Initialize managers
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

    // Navigation
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

    // User menu
    document.getElementById("userMenuBtn").addEventListener("click", () => {
      console.log("User menu clicked");
      this.toggleUserDropdown();
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
      console.log("Logout clicked");
      this.logout();
    });

    // Search form
    document
      .getElementById("studySearchForm")
      .addEventListener("submit", (e) => {
        console.log("Search form submitted");
        this.handleSearch(e);
      });

    // Study break
    document.getElementById("studyBreakBtn").addEventListener("click", () => {
      console.log("Study break clicked");
      this.getStudyBreakActivity();
    });

    // Connection tabs
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        console.log("Tab clicked:", tab);
        this.switchConnectionTab(btn);
      });
    });

    // New chat button
    const newChatBtn = document.getElementById("newChatBtn");
    if (newChatBtn) {
      newChatBtn.addEventListener("click", () => {
        console.log("New chat clicked");
        this.startNewChat();
      });
    }

    // Admin dashboard button
    const adminDashboardBtn = document.getElementById("adminDashboardBtn");
    if (adminDashboardBtn) {
      adminDashboardBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Admin dashboard clicked");
        this.showAdminDashboard();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".user-menu")) {
        const dropdown = document.getElementById("userDropdown");
        if (dropdown && !dropdown.classList.contains("hidden")) {
          dropdown.classList.add("hidden");
        }
      }
    });

    console.log("Event listeners setup complete");
  }

  showSection(sectionId) {
    console.log("Showing section:", sectionId);

    // Hide all sections
    const sections = document.querySelectorAll(".dashboard-section");
    console.log("Hiding", sections.length, "sections");

    sections.forEach((section) => {
      section.classList.remove("active");
      section.classList.add("hidden");
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      console.log("Found target section, making active");
      targetSection.classList.add("active");
      targetSection.classList.remove("hidden");
      this.currentSection = sectionId;

      // Load section-specific data
      if (sectionId === "messagesSection") {
        console.log("Loading messages...");
        this.loadConversations();
      } else if (sectionId === "connectionsSection") {
        console.log("Loading connections...");
        this.loadConnections();
      } else if (sectionId === "profileSection") {
        console.log("Loading profile...");
        this.loadProfileData();
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

  // API Helper Methods
  async apiCall(endpoint, options = {}) {
    // If backend is not available, throw error to trigger fallback
    if (!this.backendAvailable) {
      throw new Error('Backend not available');
    }

    const token = localStorage.getItem('academico_token');
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    };

    const config = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      // Mark backend as unavailable on first connection error
      if (this.backendAvailable) {
        console.log('Backend appears to be unavailable, switching to demo mode');
        this.backendAvailable = false;
        this.showBackendStatusMessage();
      }
      throw error;
    }
  }

  showBackendStatusMessage() {
    // Show a subtle notification that we're in demo mode
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #ffa726;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    notification.innerHTML = `
      <i class="fas fa-info-circle"></i> 
      Using demo data - Backend server not available
    `;
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // MESSAGES FUNCTIONALITY WITH REAL DATA + FALLBACK
  async loadConversations() {
    console.log("loadConversations() called");
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
      // Try to fetch real conversations from API
      const conversations = await this.apiCall('/conversations');
      console.log("Real conversations loaded:", conversations);
      this.displayConversations(conversations);
    } catch (error) {
      console.log("Falling back to demo conversations data");
      // Use demo data as fallback
      const conversations = this.getDemoConversations();
      this.displayConversations(conversations);
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
      const conversationsHTML = conversations.map(conv => `
        <div class="conversation-item" data-conversation-id="${conv.id}" data-partner-id="${conv.partnerId}">
          <div class="conversation-avatar">${conv.partnerAvatar || (conv.partnerName ? conv.partnerName.charAt(0) : 'U')}</div>
          <div class="conversation-info">
            <div class="conversation-name">${conv.partnerName}</div>
            <div class="conversation-preview">${conv.lastMessage || 'Start a conversation'}</div>
            <div class="conversation-details">
              <span class="conversation-course">${conv.partnerCourse || 'Not specified'}</span>
              <span class="conversation-university">${conv.partnerUniversity || 'Not specified'}</span>
            </div>
          </div>
          <div class="conversation-meta">
            <div class="conversation-time">${this.formatTime(conv.lastMessageTime)}</div>
            ${conv.unreadCount > 0 ? `<div class="unread-badge">${conv.unreadCount}</div>` : ''}
          </div>
        </div>
      `).join('');

      conversationsList.innerHTML = conversationsHTML;

      // Add click listeners
      const conversationItems = conversationsList.querySelectorAll('.conversation-item');
      console.log("Number of conversation items in DOM:", conversationItems.length);
      
      conversationItems.forEach(item => {
        item.addEventListener('click', () => {
          const conversationId = item.getAttribute('data-conversation-id');
          const partnerName = item.querySelector('.conversation-name').textContent;
          console.log("Conversation clicked:", conversationId, partnerName);
          this.openConversation(conversationId, partnerName);
        });
      });
    }
  }

  async openConversation(conversationId, partnerName) {
    console.log("Opening conversation:", conversationId, "with", partnerName);

    // Hide placeholder and show active chat
    const chatPlaceholder = document.getElementById("chatPlaceholder");
    const activeChat = document.getElementById("activeChat");
    
    if (chatPlaceholder) chatPlaceholder.classList.add("hidden");
    if (activeChat) {
      activeChat.classList.remove("hidden");
      activeChat.classList.add("active");
    }

    // Update chat header
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
      // Try to fetch real messages from API
      const messages = await this.apiCall(`/conversations/${conversationId}/messages`);
      console.log("Real messages loaded:", messages);
      this.displayMessages(messages);
    } catch (error) {
      console.log("Falling back to demo messages");
      // Use demo data as fallback
      const messages = this.getDemoMessages();
      this.displayMessages(messages);
    }
  }

  displayMessages(messages) {
    const chatMessages = document.getElementById("chatMessages");
    
    chatMessages.innerHTML = messages
      .map(
        (msg) => `
        <div class="message ${msg.isOwn || msg.senderId === this.currentUser?.id ? "own" : "other"}">
          <div class="message-bubble">
            <div class="message-sender">${msg.senderName}</div>
            <div class="message-text">${msg.content || msg.text}</div>
            <div class="message-time">${this.formatTime(msg.timestamp)}</div>
          </div>
        </div>
      `
      )
      .join("");

    // Scroll to bottom
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
        if (this.backendAvailable) {
          // Send real message via API
          await this.apiCall(`/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content: messageText })
          });
        }

        // Add to UI (works in both real and demo mode)
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

        // Clear input and scroll to bottom
        messageInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Update conversations list to show new last message
        this.loadConversations();
      } catch (error) {
        console.error("Error sending message:", error);
        // Even in demo mode, we can still show the message locally
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
      }
    };

    // Remove existing event listeners and reattach
    const newSendButton = sendButton.cloneNode(true);
    const newMessageInput = messageInput.cloneNode(true);
    
    sendButton.parentNode.replaceChild(newSendButton, sendButton);
    messageInput.parentNode.replaceChild(newMessageInput, messageInput);

    newSendButton.onclick = sendMessage;
    newMessageInput.onkeypress = (e) => {
      if (e.key === "Enter") sendMessage();
    };
  }

  // CONNECTIONS FUNCTIONALITY WITH REAL DATA + FALLBACK
  async loadConnections() {
    console.log("loadConnections() called");
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

    // Show loading
    connectionsGrid.innerHTML = `
      <div class="no-connections">
        <i class="fas fa-user-friends"></i>
        <p>Loading connections...</p>
      </div>
    `;

    try {
      // Try to fetch real connections from API
      const connections = await this.apiCall('/connections');
      console.log("Real connections loaded:", connections);
      this.displayConnections(connections);
    } catch (error) {
      console.log("Falling back to demo connections");
      // Use demo data as fallback
      const connections = this.getDemoConnections();
      this.displayConnections(connections);
    }
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
              <div class="connection-avatar">${conn.avatar || (conn.name ? conn.name.charAt(0) : 'U')}</div>
              <div class="connection-info">
                <h4>${conn.name}</h4>
                <p>${conn.course || 'Not specified'} • ${conn.university || 'Not specified'}</p>
                <div class="connection-details">
                  <span class="detail">Available: ${conn.availability || 'Not specified'}</span>
                  <span class="detail">Style: ${conn.studyType || 'Not specified'}</span>
                  <span class="detail">Last active: ${conn.lastActive || this.formatTime(conn.lastActiveDate)}</span>
                </div>
              </div>
            </div>
            <div class="connection-actions">
              <button class="action-btn chat-btn" onclick="dashboard.startChat('${conn.userId || conn.id}', '${conn.name}')">
                <i class="fas fa-comment"></i> Message
              </button>
              <button class="action-btn video-call-btn" onclick="dashboard.startVideoCall('${conn.userId || conn.id}')">
                <i class="fas fa-video"></i> Call
              </button>
            </div>
          </div>
        `
        )
        .join("");

      console.log("Connections grid updated with", connections.length, "connections");
    }
  }

  async loadPendingRequests() {
    console.log("Loading pending requests...");
    const pendingList = document.getElementById("pendingRequestsList");
    if (pendingList) {
      try {
        // Try to fetch real pending requests from API
        const requests = await this.apiCall('/connections/requests/pending');
        console.log("Real pending requests:", requests);
        this.displayPendingRequests(requests);
      } catch (error) {
        console.log("Falling back to empty pending requests");
        this.displayPendingRequests([]);
      }
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
    } else {
      pendingList.innerHTML = requests.map(req => `
        <div class="request-item">
          <div class="request-info">
            <div class="request-avatar">${req.sender?.name?.charAt(0) || 'U'}</div>
            <div class="request-details">
              <h4>${req.sender?.name || 'Unknown User'}</h4>
              <p>${req.sender?.course || 'Not specified'} • ${req.sender?.university || 'Not specified'}</p>
            </div>
          </div>
          <div class="request-actions">
            <button class="action-btn chat-btn" onclick="dashboard.acceptRequest('${req.id}')">
              Accept
            </button>
            <button class="action-btn" onclick="dashboard.declineRequest('${req.id}')">
              Decline
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  async loadSentRequests() {
    console.log("Loading sent requests...");
    const sentList = document.getElementById("sentRequestsList");
    if (sentList) {
      try {
        // Try to fetch real sent requests from API
        const requests = await this.apiCall('/connections/requests/sent');
        console.log("Real sent requests:", requests);
        this.displaySentRequests(requests);
      } catch (error) {
        console.log("Falling back to empty sent requests");
        this.displaySentRequests([]);
      }
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
    } else {
      sentList.innerHTML = requests.map(req => `
        <div class="request-item">
          <div class="request-info">
            <div class="request-avatar">${req.receiver?.name?.charAt(0) || 'U'}</div>
            <div class="request-details">
              <h4>${req.receiver?.name || 'Unknown User'}</h4>
              <p>${req.receiver?.course || 'Not specified'} • ${req.receiver?.university || 'Not specified'}</p>
              <p class="request-status">Pending</p>
            </div>
          </div>
          <button class="action-btn" onclick="dashboard.cancelRequest('${req.id}')">
            Cancel
          </button>
        </div>
      `).join('');
    }
  }

  // FALLBACK DEMO DATA
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
      {
        id: "conv-3",
        partnerId: "user-4",
        partnerName: "David Kim",
        partnerAvatar: "DK",
        lastMessage: "Let's meet at the library tomorrow at 2 PM",
        lastMessageTime: new Date(Date.now() - 24 * 3600000),
        unreadCount: 1,
        partnerCourse: "Physics",
        partnerUniversity: "University of Ghana",
      },
    ];
  }

  getDemoMessages() {
    return [
      {
        id: "msg-1",
        senderName: "Alex Johnson",
        senderId: "user-2",
        content: "Hi there! I saw we're both studying Computer Science. Would you like to form a study group?",
        timestamp: new Date(Date.now() - 30 * 60000),
        isOwn: false,
      },
      {
        id: "msg-2",
        senderName: "You",
        senderId: "user-1", 
        content: "Hey Alex! That sounds great. I'm available in the evenings this week.",
        timestamp: new Date(Date.now() - 25 * 60000),
        isOwn: true,
      },
      {
        id: "msg-3",
        senderName: "Alex Johnson",
        senderId: "user-2",
        content: "Perfect! How about we start with Calculus on Wednesday evening?",
        timestamp: new Date(Date.now() - 20 * 60000),
        isOwn: false,
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
        course: "Computer Science",
        availability: "Evenings",
        studyType: "Group Study",
        lastActive: "2 hours ago",
        lastActiveDate: new Date(Date.now() - 2 * 3600000)
      },
      {
        id: "conn-2",
        userId: "user-3",
        name: "Sarah Chen",
        avatar: "SC",
        university: "University of Nairobi",
        course: "Mathematics",
        availability: "Afternoons",
        studyType: "One-on-One",
        lastActive: "Online now",
        lastActiveDate: new Date()
      },
    ];
  }

  // CONNECTION ACTIONS
  async sendConnectionRequest(userId) {
    try {
      console.log("Sending connection request to:", userId);
      if (this.backendAvailable) {
        await this.apiCall('/connections/requests', {
          method: 'POST',
          body: JSON.stringify({ receiverId: userId })
        });
      }
      alert("Connection request sent!");
      this.loadConnections(); // Refresh connections
    } catch (error) {
      console.error("Error sending connection request:", error);
      alert("Failed to send connection request.");
    }
  }

  async acceptRequest(requestId) {
    try {
      console.log("Accepting request:", requestId);
      if (this.backendAvailable) {
        await this.apiCall(`/connections/requests/${requestId}/accept`, {
          method: 'POST'
        });
      }
      alert("Connection request accepted!");
      this.loadConnections(); // Refresh connections
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept connection request.");
    }
  }

  async declineRequest(requestId) {
    try {
      console.log("Declining request:", requestId);
      if (this.backendAvailable) {
        await this.apiCall(`/connections/requests/${requestId}/decline`, {
          method: 'POST'
        });
      }
      alert("Connection request declined!");
      this.loadConnections(); // Refresh connections
    } catch (error) {
      console.error("Error declining request:", error);
      alert("Failed to decline connection request.");
    }
  }

  async cancelRequest(requestId) {
    try {
      console.log("Canceling request:", requestId);
      if (this.backendAvailable) {
        await this.apiCall(`/connections/requests/${requestId}`, {
          method: 'DELETE'
        });
      }
      alert("Connection request canceled!");
      this.loadConnections(); // Refresh connections
    } catch (error) {
      console.error("Error canceling request:", error);
      alert("Failed to cancel connection request.");
    }
  }

  // OTHER METHODS
  startNewChat() {
    alert("To start a new chat, search for study partners and send them a connection request first.");
  }

  startChat(userId, userName) {
    console.log("Starting chat with:", userName);
    this.showSection("messagesSection");
  }

  startVideoCall(userId) {
    alert(`Video call would start with user ${userId}. This would integrate with Zoom/Meet.`);
  }

  switchConnectionTab(btn) {
    console.log("Switching to tab:", btn.getAttribute("data-tab"));
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));

    btn.classList.add("active");
    const tabId = btn.getAttribute("data-tab");
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
      tabContent.classList.add("active");
    }
  }

  loadUserData() {
    this.updateNotificationCounts();
    this.loadUserProfile();
  }

  updateNotificationCounts() {
    // In demo mode, we'll just hide notifications
    const messageNotification = document.getElementById("messageNotification");
    const connectionNotification = document.getElementById("connectionNotification");
    
    if (messageNotification) messageNotification.classList.add("hidden");
    if (connectionNotification) connectionNotification.classList.add("hidden");
  }

  loadUserProfile() {
    console.log("Loading user profile...");
    if (this.currentUser) {
      const profileUserName = document.getElementById("profileUserName");
      const profileUserEmail = document.getElementById("profileUserEmail");
      
      if (profileUserName) profileUserName.textContent = this.currentUser.name;
      if (profileUserEmail) profileUserEmail.textContent = this.currentUser.email;
    }
  }

  loadProfileData() {
    console.log("Loading profile data...");
    if (this.currentUser) {
      const profileCourse = document.getElementById("profileCourse");
      const profileAvailability = document.getElementById("profileAvailability");
      const profileStudyType = document.getElementById("profileStudyType");
      const profileJoinDate = document.getElementById("profileJoinDate");
      const profileConnectionsCount = document.getElementById("profileConnectionsCount");
      const profileStudyGroups = document.getElementById("profileStudyGroups");

      // Set demo data for profile
      if (profileCourse) profileCourse.textContent = this.currentUser.course || "Computer Science";
      if (profileAvailability) profileAvailability.textContent = this.currentUser.availability || "Evenings";
      if (profileStudyType) profileStudyType.textContent = this.currentUser.studyType || "Group Study";
      if (profileJoinDate) profileJoinDate.textContent = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (profileConnectionsCount) profileConnectionsCount.textContent = "2";
      if (profileStudyGroups) profileStudyGroups.textContent = "1";
    }
  }

  async loadCountries() {
    console.log("Loading countries...");
    try {
      const countryFilter = document.getElementById("countryFilter");
      if (countryFilter && window.countries) {
        window.countries.forEach(country => {
          const option = document.createElement("option");
          option.value = country.code;
          option.textContent = country.name;
          countryFilter.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Error loading countries:", error);
    }
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

  async handleSearch(e) {
    e.preventDefault();
    console.log("Handling search...");
    
    const course = document.getElementById("courseInput").value;
    const topic = document.getElementById("topicInput").value;
    const availability = document.getElementById("availabilitySelect").value;
    const studyType = document.getElementById("studyTypeSelect").value;
    const country = document.getElementById("countryFilter").value;
    const university = document.getElementById("universityFilter").value;

    console.log("Search parameters:", {
      course, topic, availability, studyType, country, university
    });

    // Show loading state
    this.showLoading("Searching for study partners...");

    try {
      let searchResults = [];
      
      if (this.backendAvailable) {
        // Real search API call
        searchResults = await this.apiCall('/users/search', {
          method: 'POST',
          body: JSON.stringify({
            course,
            topic,
            availability,
            studyType,
            country,
            university
          })
        });
      } else {
        // Demo search results
        searchResults = this.getDemoConnections().filter(conn => 
          (!course || conn.course?.toLowerCase().includes(course.toLowerCase())) &&
          (!topic || conn.course?.toLowerCase().includes(topic.toLowerCase())) &&
          (!availability || conn.availability === availability) &&
          (!studyType || conn.studyType === studyType)
        );
      }

      console.log("Search results:", searchResults);

      // Show results section
      const resultsSection = document.getElementById("resultsSection");
      if (resultsSection) {
        resultsSection.classList.remove("hidden");
        resultsSection.classList.add("active");
      }

      // Update results count
      const resultsCount = document.getElementById("resultsCount");
      if (resultsCount) {
        resultsCount.textContent = `Found ${searchResults.length} partners`;
      }

      // Display results
      const resultsContainer = document.getElementById("resultsContainer");
      if (resultsContainer) {
        if (searchResults.length === 0) {
          resultsContainer.innerHTML = `
            <div class="no-connections">
              <i class="fas fa-search"></i>
              <p>No study partners found</p>
              <p class="small">Try adjusting your search criteria</p>
            </div>
          `;
        } else {
          resultsContainer.innerHTML = searchResults.map(user => `
            <div class="result-card">
              <div class="result-header">
                <div class="result-avatar">${user.name.charAt(0)}${user.name.split(' ')[1]?.charAt(0) || ''}</div>
                <div class="result-info">
                  <h4>${user.name}</h4>
                  <p>${user.course || 'Not specified'} • ${user.university || 'Not specified'}</p>
                  <div class="result-details">
                    <span class="detail">Available: ${user.availability || 'Not specified'}</span>
                    <span class="detail">Style: ${user.studyType || 'Not specified'}</span>
                    <span class="detail">Match: ${user.matchScore || 'N/A'}%</span>
                  </div>
                </div>
              </div>
              <div class="result-actions">
                <button class="action-btn chat-btn" onclick="dashboard.startChat('${user.userId || user.id}', '${user.name}')">
                  <i class="fas fa-comment"></i> Message
                </button>
                <button class="action-btn connect-btn" onclick="dashboard.sendConnectionRequest('${user.userId || user.id}')">
                  <i class="fas fa-user-plus"></i> Connect
                </button>
              </div>
            </div>
          `).join('');
        }
      }

    } catch (error) {
      console.error("Search error:", error);
      alert("Search failed. Please try again.");
    } finally {
      this.hideLoading();
    }
  }

  getStudyBreakActivity() {
    const activities = [
      "Take a 5-minute walk and stretch",
      "Listen to your favorite music",
      "Do some quick breathing exercises",
      "Have a healthy snack",
      "Watch a funny short video",
      "Do 10 minutes of light exercise"
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    alert(`Study Break Suggestion: ${randomActivity}`);
  }

  showAdminDashboard() {
    this.showSection("adminSection");
  }

  async loadAdminDashboard() {
    try {
      if (this.backendAvailable) {
        // Fetch real admin data
        const adminData = await this.apiCall('/admin/stats');
        const users = await this.apiCall('/admin/users');

        const adminTotalUsers = document.getElementById("adminTotalUsers");
        const adminTotalMessages = document.getElementById("adminTotalMessages");
        const adminTotalConnections = document.getElementById("adminTotalConnections");
        const usersTableBody = document.getElementById("usersTableBody");

        if (adminTotalUsers) adminTotalUsers.textContent = adminData.totalUsers || "0";
        if (adminTotalMessages) adminTotalMessages.textContent = adminData.totalMessages || "0";
        if (adminTotalConnections) adminTotalConnections.textContent = adminData.totalConnections || "0";

        if (usersTableBody) {
          usersTableBody.innerHTML = users.map(user => `
            <tr>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${user.university || 'Not specified'}</td>
              <td>${user.course || 'Not specified'}</td>
              <td>${new Date(user.joinDate).toLocaleDateString()}</td>
              <td><span class="status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
            </tr>
          `).join('');
        }
      } else {
        this.loadAdminDemoData();
      }
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
      this.loadAdminDemoData();
    }
  }

  loadAdminDemoData() {
    // Fallback demo data for admin dashboard
    const adminTotalUsers = document.getElementById("adminTotalUsers");
    const adminTotalMessages = document.getElementById("adminTotalMessages");
    const adminTotalConnections = document.getElementById("adminTotalConnections");
    const usersTableBody = document.getElementById("usersTableBody");

    if (adminTotalUsers) adminTotalUsers.textContent = "127";
    if (adminTotalMessages) adminTotalMessages.textContent = "2,458";
    if (adminTotalConnections) adminTotalConnections.textContent = "89";

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

// Initialize dashboard with proper DOM readiness
console.log("Starting dashboard initialization...");
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded, creating dashboard instance...");
  window.dashboard = new DashboardApp();
  window.dashboard.init().catch(error => {
    console.error("Dashboard initialization failed:", error);
  });
});