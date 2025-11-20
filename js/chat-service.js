// Simple Chat Service using LocalStorage (No Firebase)
class ChatService {
  constructor() {
    this.currentChat = null;
    this.initialized = true; // Always initialized with localStorage
  }

  // Start a chat between two students
  startChat(student1, student2) {
    try {
      const chatId = this.generateChatId(student1.id, student2.id);
      this.currentChat = chatId;

      console.log(`Starting chat: ${chatId}`);

      // Clear chat messages
      const chatMessages = document.getElementById("chatMessages");
      if (chatMessages) chatMessages.innerHTML = "";

      // Load existing messages
      this.loadChatHistory(chatId);
      return chatId;
    } catch (error) {
      console.error("Error starting chat:", error);
      errorHandler.showUserError("Chat service error occurred.");
    }
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
        read: false,
      };

      // Store message in localStorage
      this.storeMessage(this.currentChat, message);

      // Display message
      this.displayMessage(message);

      // Clear input
      const messageInput = document.getElementById("messageInput");
      if (messageInput) messageInput.value = "";

      console.log("Message sent:", message);
    } catch (error) {
      console.error("Error sending message:", error);
      errorHandler.showUserError("Failed to send message. Please try again.");
    }
  }

  // Display message in UI
  displayMessage(message) {
    const chatContainer = document.getElementById("chatMessages");
    if (!chatContainer) return;

    const isCurrentUser =
      message.senderId === (window.app?.currentUser?.id || "demo-user");

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
          message.senderId === (window.app?.currentUser?.id || "demo-user");
        return `
          <div class="message ${
            isCurrentUser ? "own-message" : "partner-message"
          }">
            <div class="message-sender">${message.sender}</div>
            <div class="message-text">${message.text}</div>
            <div class="message-time">${this.formatTime(
              message.timestamp
            )}</div>
          </div>
        `;
      })
      .join("");

    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Format timestamp
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

  // localStorage methods
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

  // Close chat
  closeChat() {
    this.currentChat = null;
  }

  // Check if service is ready
  isReady() {
    return this.initialized;
  }
}

// Global instance
window.chatService = new ChatService();
