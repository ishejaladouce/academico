// Messages Management System powered by Firestore
class MessagesManager {
  constructor() {
    this.db = null;
    this.currentUser = null;
    this.conversationUnsubscribe = null;
    this.messageUnsubscribe = null;
    this.conversationListeners = [];
    this.messageListeners = [];
    this.currentConversationId = null;
    this.init();
  }

  async init() {
    await this.ensureFirebase();
    this.currentUser = authManager.getCurrentUser();
    if (this.currentUser && this.db) {
      this.subscribeToConversations();
    }
  }

  // Ensure Firebase is loaded before using it
  async ensureFirebase() {
    if (this.db) return this.db;
    
    // Wait for Firebase to be available
    let attempts = 0;
    while (typeof firebase === "undefined" && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof firebase !== "undefined" && firebase.firestore) {
      this.db = firebase.firestore();
      return this.db;
    }
    
    throw new Error("Firebase Firestore not available");
  }

  // Re-initialize when user changes
  async reinit() {
    if (this.conversationUnsubscribe) {
      this.conversationUnsubscribe();
      this.conversationUnsubscribe = null;
    }
    if (this.messageUnsubscribe) {
      this.messageUnsubscribe();
      this.messageUnsubscribe = null;
    }
    await this.init();
  }

  subscribeToConversations() {
    if (!this.db || !this.currentUser) {
      console.warn("Cannot subscribe to conversations: db or currentUser missing", {
        hasDb: !!this.db,
        hasCurrentUser: !!this.currentUser,
        userId: this.currentUser?.id
      });
      return;
    }
    
    // Clean up old subscription
    if (this.conversationUnsubscribe) {
      this.conversationUnsubscribe();
      this.conversationUnsubscribe = null;
    }

    console.log(`Subscribing to conversations for user: ${this.currentUser.id}`);
    
    this.conversationUnsubscribe = this.db
      .collection("conversations")
      .where("participants", "array-contains", this.currentUser.id)
      .onSnapshot(
        (snapshot) => {
          const conversations = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .sort((a, b) => {
              const timeA = a.updatedAt?.toMillis
                ? a.updatedAt.toMillis()
                : 0;
              const timeB = b.updatedAt?.toMillis
                ? b.updatedAt.toMillis()
                : 0;
              return timeB - timeA;
            });

          console.log(`[subscribeToConversations] Found ${conversations.length} conversations`);
          
          if (this.conversationListeners.length === 0) {
            console.warn("No conversation listeners registered! Conversations loaded but won't be displayed.");
          } else {
            console.log(`Notifying ${this.conversationListeners.length} listener(s) with ${conversations.length} conversations`);
          }

          this.conversationListeners.forEach((listener, index) => {
            try {
              listener(conversations);
            } catch (error) {
              console.error(`Error in conversation listener ${index}:`, error);
            }
          });
          
          this.updateNotificationCounts(conversations);
        },
        (error) => {
          console.error("Error in conversation subscription:", error);
        }
      );
    
    console.log("Conversation subscription established");
  }

  onConversationsUpdate(callback) {
    if (typeof callback === "function") {
      this.conversationListeners.push(callback);
    }
  }

  onMessagesUpdate(callback) {
    if (typeof callback === "function") {
      this.messageListeners.push(callback);
    }
  }

  async startChat(partner) {
    if (!this.currentUser) {
      throw new Error("Please login to start chatting.");
    }
    if (!partner?.id) {
      throw new Error("Partner details missing.");
    }

    // Ensure Firebase is ready
    await this.ensureFirebase();
    if (!this.db) {
      throw new Error("Database not available. Please refresh the page.");
    }

    const conversationId = this.generateConversationId(
      this.currentUser.id,
      partner.id
    );
    const conversationRef = this.db
      .collection("conversations")
      .doc(conversationId);
    const snapshot = await conversationRef.get();

    if (!snapshot.exists) {
      await conversationRef.set({
        id: conversationId,
        participants: [this.currentUser.id, partner.id],
        participantDetails: {
          [this.currentUser.id]: {
            name: this.currentUser.name,
            university: this.currentUser.university || "",
            course: this.currentUser.course || "",
          },
          [partner.id]: {
            name: partner.name,
            university: partner.university || "",
            course: partner.course || "",
          },
        },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessage: "",
        messageCount: 0,
      });
    }

    this.currentConversationId = conversationId;
    return conversationId;
  }

  async watchMessages(conversationId) {
    if (!conversationId) {
      console.error("watchMessages: No conversation ID provided");
      return;
    }

    // Ensure Firebase is ready
    await this.ensureFirebase();
    if (!this.db) {
      console.error("watchMessages: Database not available");
      return;
    }

    // Clean up old subscription
    if (this.messageUnsubscribe) {
      this.messageUnsubscribe();
      this.messageUnsubscribe = null;
    }

    this.currentConversationId = conversationId;
    
    try {
      // Load initial messages first
      await this.loadInitialMessages(conversationId);
      
      // Then set up real-time listener for new messages
      // Try with orderBy first, fallback to unordered if index is missing
      let messagesQuery = this.db
        .collection("conversations")
        .doc(conversationId)
        .collection("messages")
        .orderBy("createdAt", "asc");

      this.messageUnsubscribe = messagesQuery.onSnapshot(
        (snapshot) => {
          const messages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Sort client-side to ensure proper order (in case of timestamp issues)
          if (messages.length > 0) {
            messages.sort((a, b) => {
              const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
              const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
              return timeA - timeB;
            });
          }

          console.log(`Received ${messages.length} messages for conversation ${conversationId}`);
          
          if (this.messageListeners.length === 0) {
            console.warn("No message listeners registered for real-time updates!");
          }
          
          this.messageListeners.forEach((listener) => {
            try {
              listener(messages, conversationId);
            } catch (error) {
              console.error("Error in message listener:", error);
            }
          });
        },
        (error) => {
          console.error("Error watching messages:", error);
          // If orderBy fails, try without it
          if (error.code === 'failed-precondition') {
            console.warn("orderBy failed, trying without order for real-time updates");
            this.messageUnsubscribe = this.db
              .collection("conversations")
              .doc(conversationId)
              .collection("messages")
              .onSnapshot(
                (snapshot) => {
                  const messages = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  }));
                  
                  // Sort client-side
                  messages.sort((a, b) => {
                    const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                    const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                    return timeA - timeB;
                  });
                  
                  console.log(`Received ${messages.length} messages (unordered) for conversation ${conversationId}`);
                  this.messageListeners.forEach((listener) => {
                    try {
                      listener(messages, conversationId);
                    } catch (err) {
                      console.error("Error in message listener (fallback):", err);
                    }
                  });
                },
                (fallbackError) => {
                  console.error("Error in fallback message watcher:", fallbackError);
                }
              );
          }
        }
      );
      console.log(`Started watching messages for conversation ${conversationId}`);
    } catch (error) {
      console.error("Failed to set up message watcher:", error);
    }
  }

  // Load initial messages when opening a conversation
  async loadInitialMessages(conversationId) {
    try {
      let snapshot;
      try {
        // Try with orderBy first (requires index)
        snapshot = await this.db
          .collection("conversations")
          .doc(conversationId)
          .collection("messages")
          .orderBy("createdAt", "asc")
          .get();
      } catch (orderError) {
        // If orderBy fails (e.g., missing index), try without ordering
        console.warn("orderBy failed, loading without order:", orderError);
        snapshot = await this.db
          .collection("conversations")
          .doc(conversationId)
          .collection("messages")
          .get();
      }

      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort client-side if we didn't use orderBy
      if (messages.length > 0 && messages[0].createdAt) {
        messages.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return timeA - timeB;
        });
      }

      console.log(`Loaded ${messages.length} initial messages for conversation ${conversationId}`);
      
      // Notify listeners with initial messages
      if (this.messageListeners.length === 0) {
        console.warn("No message listeners registered! Messages loaded but no one to display them.");
      } else {
        console.log(`Notifying ${this.messageListeners.length} listener(s) with ${messages.length} messages`);
      }
      
      this.messageListeners.forEach((listener, index) => {
        try {
          console.log(`Calling listener ${index} with ${messages.length} messages for conversation ${conversationId}`);
          listener(messages, conversationId);
        } catch (error) {
          console.error(`Error in message listener ${index} (initial load):`, error);
        }
      });
    } catch (error) {
      console.error("Error loading initial messages:", error);
      // Still notify listeners with empty array so UI can show error state
      this.messageListeners.forEach((listener) => {
        try {
          listener([], conversationId);
        } catch (err) {
          console.error("Error in message listener (error case):", err);
        }
      });
    }
  }

  async sendMessage(conversationId, messageText) {
    if (!conversationId || !messageText.trim()) return;

    // Ensure Firebase is ready
    await this.ensureFirebase();
    if (!this.db) {
      throw new Error("Database not available. Please refresh the page.");
    }

    const message = {
      senderId: this.currentUser.id,
      senderName: this.currentUser.name,
      text: messageText.trim(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const conversationRef = this.db
      .collection("conversations")
      .doc(conversationId);

    await conversationRef.collection("messages").add(message);
    await conversationRef.set(
      {
        lastMessage: message.text,
        lastSenderId: message.senderId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        messageCount: firebase.firestore.FieldValue.increment(1),
      },
      { merge: true }
    );
  }

  updateNotificationCounts(conversations = []) {
    const unread = conversations.filter(
      (conv) =>
        conv.lastSenderId &&
        conv.lastSenderId !== this.currentUser.id
    ).length;

    const messageNotification = document.getElementById(
      "messageNotification"
    );
    if (!messageNotification) return;

    if (unread > 0) {
      messageNotification.textContent = String(unread);
      messageNotification.classList.remove("hidden");
    } else {
      messageNotification.classList.add("hidden");
    }
  }

  generateConversationId(idA, idB) {
    return [idA, idB].sort().join("_");
  }

  async getConversationStats() {
    if (!this.db) {
      return { conversations: 0, messages: 0 };
    }

    const snapshot = await this.db.collection("conversations").get();
    let totalMessages = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      totalMessages += data.messageCount || 0;
    });

    return { conversations: snapshot.size, messages: totalMessages };
  }

  stop() {
    if (this.conversationUnsubscribe) this.conversationUnsubscribe();
    if (this.messageUnsubscribe) this.messageUnsubscribe();
  }
}

// Global instance
const messagesManager = new MessagesManager();
