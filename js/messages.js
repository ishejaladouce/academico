// Messages Management System
class MessagesManager {
  constructor() {
    this.db = null;
    this.currentUser = null;
    this.init();
  }

  async init() {
    this.currentUser = authManager.getCurrentUser();
    if (this.currentUser && typeof firebase !== "undefined") {
      this.db = firebase.firestore();
    }
  }

  // Get user's conversations
  async getConversations() {
    if (!this.currentUser) return [];

    try {
      // For demo - return sample conversations
      return this.getDemoConversations();
    } catch (error) {
      console.error("Error getting conversations:", error);
      return this.getDemoConversations();
    }
  }

  getDemoConversations() {
    return [
      {
        id: "conv-1",
        partnerId: "user-2",
        partnerName: "Alex Johnson",
        partnerAvatar: "AJ",
        lastMessage: "Hey, are you available to study Calculus this weekend?",
        lastMessageTime: new Date(Date.now() - 5 * 60000), // 5 minutes ago
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
        lastMessageTime: new Date(Date.now() - 2 * 3600000), // 2 hours ago
        unreadCount: 0,
        partnerCourse: "Mathematics",
        partnerUniversity: "University of Nairobi",
      },
      {
        id: "conv-3",
        partnerId: "user-4",
        partnerName: "Mike Davis",
        partnerAvatar: "MD",
        lastMessage:
          "Let's schedule our next study session for Data Structures",
        lastMessageTime: new Date(Date.now() - 24 * 3600000), // 1 day ago
        unreadCount: 0,
        partnerCourse: "Computer Science",
        partnerUniversity: "Makerere University",
      },
    ];
  }

  // Get messages for a specific conversation
  async getMessages(conversationId) {
    // For demo - return sample messages
    return this.getDemoMessages();
  }

  getDemoMessages() {
    return [
      {
        id: "msg-1",
        senderId: "user-2",
        senderName: "Alex Johnson",
        text: "Hi there! I saw we're both studying Computer Science. Would you like to form a study group?",
        timestamp: new Date(Date.now() - 30 * 60000),
        isOwn: false,
      },
      {
        id: "msg-2",
        senderId: "current-user",
        senderName: "You",
        text: "Hey Alex! That sounds great. I'm available in the evenings this week.",
        timestamp: new Date(Date.now() - 25 * 60000),
        isOwn: true,
      },
      {
        id: "msg-3",
        senderId: "user-2",
        senderName: "Alex Johnson",
        text: "Perfect! How about Wednesday at 7 PM? We can focus on the web development project.",
        timestamp: new Date(Date.now() - 20 * 60000),
        isOwn: false,
      },
      {
        id: "msg-4",
        senderId: "current-user",
        senderName: "You",
        text: "Wednesday works for me. Should we use Zoom or Google Meet?",
        timestamp: new Date(Date.now() - 15 * 60000),
        isOwn: true,
      },
      {
        id: "msg-5",
        senderId: "user-2",
        senderName: "Alex Johnson",
        text: "Zoom works better for me. I'll send you the link 10 minutes before we start.",
        timestamp: new Date(Date.now() - 10 * 60000),
        isOwn: false,
      },
      {
        id: "msg-6",
        senderId: "current-user",
        senderName: "You",
        text: "Sounds good! Looking forward to studying together.",
        timestamp: new Date(Date.now() - 5 * 60000),
        isOwn: true,
      },
    ];
  }

  // Send a new message
  async sendMessage(conversationId, messageText) {
    if (!this.currentUser) return;

    const message = {
      id: "msg-" + Date.now(),
      senderId: this.currentUser.id,
      senderName: this.currentUser.name,
      text: messageText,
      timestamp: new Date(),
      isOwn: true,
    };

    // In a real app, this would save to Firebase
    console.log("Message sent:", message);
    return message;
  }

  // Update notification counts
  updateNotificationCounts() {
    const messageNotification = document.getElementById("messageNotification");
    if (messageNotification) {
      // Only show notification if there are unread messages
      const hasUnreadMessages = false; // Change this based on actual unread count
      if (hasUnreadMessages) {
        messageNotification.textContent = "1";
        messageNotification.classList.remove("hidden");
      } else {
        messageNotification.classList.add("hidden");
      }
    }
  }
}

// Global instance
const messagesManager = new MessagesManager();
