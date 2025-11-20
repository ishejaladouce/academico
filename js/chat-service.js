// Dynamic Chat Service with Real-time Features
class ChatService {
  constructor() {
    this.currentChat = null;
    this.conversations = [];
    this.unreadCount = 0;
    this.messageListeners = [];
    this.init();
  }

  init() {
    console.log("Dynamic Chat Service Started");
    this.loadConversationsFromStorage();
    this.startPollingForNewMessages();

    // Add message listener to update UI when new messages arrive
    this.addMessageListener((chatId, message) => {
      if (this.currentChat === chatId) {
        this.displayMessage(message);
      }
    });
  }

  // Start polling for new messages
  startPollingForNewMessages() {
    setInterval(() => {
      this.checkForNewMessages();
    }, 5000);
  }

  // Check for new messages from other users
  async checkForNewMessages() {
    if (!authManager.getCurrentUser()) return;

    try {
      if (Math.random() > 0.7) {
        this.simulateIncomingMessage();
      }
    } catch (error) {
      console.log("Error checking messages:", error);
    }
  }

  // Simulate receiving a message from a study partner
  simulateIncomingMessage() {
    const demoPartners = [
      { id: "partner-1", name: "Alex Johnson", course: "Computer Science" },
      { id: "partner-2", name: "Sarah Chen", course: "Mathematics" },
      { id: "partner-3", name: "Mike Davis", course: "Physics" },
    ];

    const randomPartner =
      demoPartners[Math.floor(Math.random() * demoPartners.length)];
    const studyMessages = [
      "Hey! Are you available to study this weekend?",
      "I found some great resources for our project",
      "Can we schedule a study session for tomorrow?",
      "I'm stuck on the calculus problem, can you help?",
      "The study notes you shared were really helpful!",
      "Are you working on the web development project too?",
    ];

    const randomMessage =
      studyMessages[Math.floor(Math.random() * studyMessages.length)];

    this.receiveMessage(randomPartner.id, randomPartner.name, randomMessage);
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

  // Start a chat between two students
  startChat(student1, student2) {
    try {
      const chatId = this.generateChatId(student1.id, student2.id);
      this.currentChat = chatId;

      console.log(`Starting chat: ${chatId}`);

      this.markConversationAsRead(chatId);
      this.loadChatHistory(chatId);
      return chatId;
    } catch (error) {
      console.error("Error starting chat:", error);
      errorHandler.showUserError("Chat service error occurred.");
    }
  }

  // Mark all messages in conversation as read
  markConversationAsRead(chatId) {
    const messages = this.getStoredMessages(chatId);
    const updatedMessages = messages.map((msg) => ({ ...msg, read: true }));
    localStorage.setItem(
      `academico_chat_${chatId}`,
      JSON.stringify(updatedMessages)
    );

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

      setTimeout(() => {
        this.simulatePartnerResponse(sender);
      }, 2000 + Math.random() * 3000);
    } catch (error) {
      console.error("Error sending message:", error);
      errorHandler.showUserError("Failed to send message. Please try again.");
    }
  }

  // Simulate a partner responding to your message
  simulatePartnerResponse(sender) {
    if (!this.currentChat) return;

    const responses = [
      "That's a great point! I was thinking the same thing.",
      "I can help with that. Let me share my notes.",
      "What time works best for you to study?",
      "I found this resource that might help us...",
      "Can you explain that concept again?",
      "I'm available tomorrow afternoon if that works?",
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    const chatParts = this.currentChat.split("_");
    const partnerId = chatParts[0] === sender.id ? chatParts[1] : chatParts[0];
    const partnerName = this.getPartnerName(partnerId);

    this.receiveMessage(partnerId, partnerName, randomResponse);
  }

  // Get partner name from ID
  getPartnerName(partnerId) {
    const partners = {
      "partner-1": "Alex Johnson",
      "partner-2": "Sarah Chen",
      "partner-3": "Mike Davis",
      "user-2": "Alex Johnson",
      "user-3": "Sarah Chen",
      "user-4": "Mike Davis",
    };
    return partners[partnerId] || "Study Partner";
  }

  // Update conversation in the sidebar
  updateConversation(chatId, partnerName, lastMessage, timestamp) {
    const existingConvIndex = this.conversations.findIndex(
      (conv) => conv.id === chatId
    );

    if (existingConvIndex >= 0) {
      this.conversations[existingConvIndex].lastMessage = lastMessage;
      this.conversations[existingConvIndex].lastMessageTime = timestamp;
      this.conversations[existingConvIndex].unreadCount =
        this.currentChat === chatId
          ? 0
          : (this.conversations[existingConvIndex].unreadCount || 0) + 1;
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
          <p class="small">Start a chat with your study partners!</p>
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
