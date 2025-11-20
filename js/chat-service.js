// Dynamic Chat Service Connected to Real User Matches
class ChatService {
  constructor() {
    this.currentChat = null;
    this.conversations = [];
    this.unreadCount = 0;
    this.messageListeners = [];
    this.userMatches = []; // Store actual matched users
    this.init();
  }

  init() {
    console.log("Dynamic Chat Service Started");
    this.loadConversationsFromStorage();
    this.startPollingForNewMessages();

    // Load user matches from search results
    this.loadUserMatches();

    this.addMessageListener((chatId, message) => {
      if (this.currentChat === chatId) {
        this.displayMessage(message);
      }
    });
  }

  // Load actual user matches from search results
  async loadUserMatches() {
    try {
      if (typeof authManager !== "undefined") {
        // Get demo users that would be your actual matches
        const demoUsers = authManager.getDemoUsers();
        this.userMatches = demoUsers.filter(
          (user) => user.id !== authManager.getCurrentUser()?.id
        );
        console.log("Loaded user matches:", this.userMatches.length);
      }
    } catch (error) {
      console.log("Error loading user matches:", error);
    }
  }

  // Get actual matched users for incoming messages
  getMatchedPartners() {
    if (this.userMatches.length > 0) {
      return this.userMatches;
    }

    // Fallback to demo partners if no matches found
    return [
      {
        id: "demo-1",
        name: "Alex Johnson",
        course: "Computer Science",
        university: "University of Rwanda",
      },
      {
        id: "demo-2",
        name: "Sarah Chen",
        course: "Mathematics",
        university: "University of Nairobi",
      },
      {
        id: "demo-3",
        name: "Mike Davis",
        course: "Physics",
        university: "Makerere University",
      },
      {
        id: "demo-4",
        name: "Emma Wilson",
        course: "Biology",
        university: "University of Dar es Salaam",
      },
      {
        id: "demo-5",
        name: "David Kim",
        course: "Computer Science",
        university: "University of Ghana",
      },
    ];
  }

  // Start polling for new messages
  startPollingForNewMessages() {
    setInterval(() => {
      this.checkForNewMessages();
    }, 5000);
  }

  // Check for new messages from actual matches
  async checkForNewMessages() {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) return;

    try {
      // Only simulate messages if we have actual matches
      const matches = this.getMatchedPartners();
      if (matches.length > 0 && Math.random() > 0.7) {
        this.simulateIncomingMessageFromMatch(matches);
      }
    } catch (error) {
      console.log("Error checking messages:", error);
    }
  }

  // Simulate receiving a message from an actual match
  simulateIncomingMessageFromMatch(matches) {
    const randomMatch = matches[Math.floor(Math.random() * matches.length)];

    const studyMessages = [
      `Hey! I see we're both studying ${randomMatch.course}. Want to form a study group?`,
      `I found some great resources for ${randomMatch.course}, want me to share?`,
      `Are you available to study ${randomMatch.course} this weekend?`,
      `I'm working on the ${randomMatch.course} project too. Want to collaborate?`,
      `The ${randomMatch.course} material is challenging. Want to study together?`,
      `I see you're from ${randomMatch.university}. I'm studying ${randomMatch.course} too!`,
    ];

    const randomMessage =
      studyMessages[Math.floor(Math.random() * studyMessages.length)];

    this.receiveMessage(randomMatch.id, randomMatch.name, randomMessage);
  }

  // Receive a message from another user
  receiveMessage(senderId, senderName, messageText) {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) return;

    const chatId = this.generateChatId(currentUser.id, senderId);

    const message = {
      id: Date.now(),
      sender: senderName,
      senderId: senderId,
      text: messageText,
      timestamp: new Date(),
      read: false,
    };

    this.storeMessage(chatId, message);
    this.updateConversation(chatId, senderName, messageText, message.timestamp);

    if (this.currentChat !== chatId) {
      this.unreadCount++;
      this.showNotification(senderName, messageText);
      this.updateNotificationBadges();
    }

    this.notifyMessageListeners(chatId, message);
  }

  // Show browser notification
  showNotification(senderName, messageText) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`New message from ${senderName}`, {
        body: messageText,
      });
    }
  }

  // Update notification badges in UI
  updateNotificationBadges() {
    const messageNotification = document.getElementById("messageNotification");
    if (messageNotification) {
      messageNotification.textContent = this.unreadCount;
      messageNotification.classList.remove("hidden");
    }
  }

  // Start a chat with an actual match
  startChat(student1, student2) {
    try {
      const chatId = this.generateChatId(student1.id, student2.id);
      this.currentChat = chatId;

      console.log(
        `Starting chat between ${student1.name} and ${student2.name}`
      );

      // Ensure this match is in our conversations
      this.ensureConversationExists(chatId, student2.name, student2.id);

      this.markConversationAsRead(chatId);
      this.loadChatHistory(chatId);

      // Update UI to show active chat
      this.updateActiveChatUI(student2.name);

      return chatId;
    } catch (error) {
      console.error("Error starting chat:", error);
      errorHandler.showUserError("Chat service error occurred.");
    }
  }

  // Ensure conversation exists in the list
  ensureConversationExists(chatId, partnerName, partnerId) {
    const existingConv = this.conversations.find((conv) => conv.id === chatId);
    if (!existingConv) {
      this.conversations.unshift({
        id: chatId,
        partnerId: partnerId,
        partnerName: partnerName,
        lastMessage: "Start a conversation...",
        lastMessageTime: new Date(),
        unreadCount: 0,
      });
      this.saveConversationsToStorage();
      this.updateConversationsUI();
    }
  }

  // Update UI to show active chat
  updateActiveChatUI(partnerName) {
    const chatPlaceholder = document.getElementById("chatPlaceholder");
    const activeChat = document.getElementById("activeChat");
    const chatPartnerName = document.getElementById("chatPartnerName");

    if (chatPlaceholder) chatPlaceholder.classList.add("hidden");
    if (activeChat) {
      activeChat.classList.remove("hidden");
      activeChat.classList.add("active");
    }
    if (chatPartnerName) chatPartnerName.textContent = partnerName;
  }

  // Mark all messages in conversation as read
  markConversationAsRead(chatId) {
    const messages = this.getStoredMessages(chatId);
    const updatedMessages = messages.map((msg) => ({ ...msg, read: true }));
    localStorage.setItem(
      `academico_chat_${chatId}`,
      JSON.stringify(updatedMessages)
    );

    // Update conversation unread count
    const conversation = this.conversations.find((conv) => conv.id === chatId);
    if (conversation) {
      conversation.unreadCount = 0;
      this.saveConversationsToStorage();
    }

    this.unreadCount = Math.max(0, this.unreadCount - 1);
    this.updateNotificationBadges();
  }

  // Load existing messages
  async loadChatHistory(chatId) {
    try {
      const messages = this.getStoredMessages(chatId);
      this.displayMessages(messages);
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }

  // Send a message
  async sendMessage(sender, messageText) {
    if (!this.currentChat || !messageText.trim()) return;

    try {
      const message = {
        id: Date.now(),
        sender: sender.name,
        senderId: sender.id,
        text: messageText.trim(),
        timestamp: new Date(),
        read: true,
      };

      this.storeMessage(this.currentChat, message);
      this.displayMessage(message);
      this.updateConversation(
        this.currentChat,
        sender.name,
        messageText,
        message.timestamp
      );

      const messageInput = document.getElementById("messageInput");
      if (messageInput) messageInput.value = "";

      console.log("Message sent:", message);

      // Simulate response from the actual match you're chatting with
      setTimeout(() => {
        this.simulateMatchResponse(sender);
      }, 2000 + Math.random() * 3000);
    } catch (error) {
      console.error("Error sending message:", error);
      errorHandler.showUserError("Failed to send message. Please try again.");
    }
  }

  // Simulate a response from the actual match
  simulateMatchResponse(sender) {
    if (!this.currentChat) return;

    const chatParts = this.currentChat.split("_");
    const partnerId = chatParts[0] === sender.id ? chatParts[1] : chatParts[0];

    // Find the actual match details
    const matches = this.getMatchedPartners();
    const match = matches.find((m) => m.id === partnerId);

    if (match) {
      const responses = [
        `That's a great point about ${match.course}! I was thinking the same thing.`,
        `I can help with ${match.course}. Let me share my notes from ${match.university}.`,
        `What time works best for you to study ${match.course}?`,
        `I found this ${match.course} resource that might help us...`,
        `Can you explain that ${match.course} concept again?`,
        `I'm available tomorrow afternoon for ${match.course} study session.`,
        `As a ${match.course} student at ${match.university}, I think we should focus on...`,
      ];

      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];
      this.receiveMessage(partnerId, match.name, randomResponse);
    }
  }

  // Update conversation in the sidebar
  updateConversation(chatId, partnerName, lastMessage, timestamp) {
    const existingConvIndex = this.conversations.findIndex(
      (conv) => conv.id === chatId
    );

    if (existingConvIndex >= 0) {
      this.conversations[existingConvIndex].lastMessage = lastMessage;
      this.conversations[existingConvIndex].lastMessageTime = timestamp;
      if (this.currentChat !== chatId) {
        this.conversations[existingConvIndex].unreadCount =
          (this.conversations[existingConvIndex].unreadCount || 0) + 1;
      }
    } else {
      this.conversations.unshift({
        id: chatId,
        partnerId: this.getPartnerIdFromChat(chatId),
        partnerName: partnerName,
        lastMessage: lastMessage,
        lastMessageTime: timestamp,
        unreadCount: this.currentChat === chatId ? 0 : 1,
      });
    }

    this.saveConversationsToStorage();
    this.updateConversationsUI();
  }

  // Update conversations list in UI
  updateConversationsUI() {
    const conversationsList = document.getElementById("conversationsList");
    if (!conversationsList) return;

    if (this.conversations.length === 0) {
      conversationsList.innerHTML = `
        <div class="no-conversations">
          <i class="fas fa-comments"></i>
          <p>No conversations yet</p>
          <p class="small">Find study partners and start chatting!</p>
        </div>
      `;
    } else {
      conversationsList.innerHTML = this.conversations
        .map(
          (conv) => `
        <div class="conversation-item" data-conversation-id="${
          conv.id
        }" data-partner-id="${conv.partnerId}">
          <div class="conversation-avatar">${conv.partnerName.charAt(0)}</div>
          <div class="conversation-info">
            <div class="conversation-name">${conv.partnerName}</div>
            <div class="conversation-preview">${conv.lastMessage}</div>
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

      this.attachConversationClickHandlers();
    }
  }

  // Load conversations from storage
  loadConversationsFromStorage() {
    const stored = localStorage.getItem("academico_conversations");
    if (stored) {
      this.conversations = JSON.parse(stored);
      this.updateConversationsUI();
    }
  }

  // Save conversations to storage
  saveConversationsToStorage() {
    localStorage.setItem(
      "academico_conversations",
      JSON.stringify(this.conversations)
    );
  }

  // Display a single message
  displayMessage(message) {
    const chatContainer = document.getElementById("chatMessages");
    if (!chatContainer) return;

    const isCurrentUser =
      message.senderId === (authManager.getCurrentUser()?.id || "demo-user");

    const messageElement = document.createElement("div");
    messageElement.className = `message ${
      isCurrentUser ? "own-message" : "partner-message"
    }`;
    messageElement.innerHTML = `
      <div class="message-sender">${message.sender}</div>
      <div class="message-text">${message.text}</div>
      <div class="message-time">${this.formatTime(message.timestamp)}</div>
    `;

    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Display multiple messages
  displayMessages(messages) {
    const chatContainer = document.getElementById("chatMessages");
    if (!chatContainer) return;

    chatContainer.innerHTML = messages
      .map((message) => {
        const isCurrentUser =
          message.senderId ===
          (authManager.getCurrentUser()?.id || "demo-user");
        return `
        <div class="message ${
          isCurrentUser ? "own-message" : "partner-message"
        }">
          <div class="message-sender">${message.sender}</div>
          <div class="message-text">${message.text}</div>
          <div class="message-time">${this.formatTime(message.timestamp)}</div>
        </div>
      `;
      })
      .join("");

    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  formatTime(timestamp) {
    if (!timestamp) return "Just now";
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Just now";
    }
  }

  generateChatId(id1, id2) {
    return [id1, id2].sort().join("_");
  }

  storeMessage(chatId, message) {
    const key = `academico_chat_${chatId}`;
    const existingMessages = this.getStoredMessages(chatId);
    existingMessages.push(message);
    localStorage.setItem(key, JSON.stringify(existingMessages));
  }

  getStoredMessages(chatId) {
    const key = `academico_chat_${chatId}`;
    const messages = localStorage.getItem(key);
    return messages ? JSON.parse(messages) : [];
  }

  getPartnerIdFromChat(chatId) {
    const currentUserId = authManager.getCurrentUser()?.id;
    const parts = chatId.split("_");
    return parts[0] === currentUserId ? parts[1] : parts[0];
  }

  attachConversationClickHandlers() {
    const conversationItems = document.querySelectorAll(".conversation-item");
    conversationItems.forEach((item) => {
      item.addEventListener("click", () => {
        const conversationId = item.getAttribute("data-conversation-id");
        const partnerName =
          item.querySelector(".conversation-name").textContent;

        const currentUser = authManager.getCurrentUser();
        const partnerId = this.getPartnerIdFromChat(conversationId);

        this.startChat(currentUser, { id: partnerId, name: partnerName });
        this.markConversationAsRead(conversationId);
        item.querySelector(".unread-badge")?.remove();
      });
    });
  }

  notifyMessageListeners(chatId, message) {
    this.messageListeners.forEach((listener) => {
      if (typeof listener === "function") {
        listener(chatId, message);
      }
    });
  }

  addMessageListener(listener) {
    this.messageListeners.push(listener);
  }

  closeChat() {
    this.currentChat = null;
  }

  isReady() {
    return true;
  }
}

// Global instance
window.chatService = new ChatService();
