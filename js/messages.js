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
    this.currentUser = authManager.getCurrentUser();
    if (this.currentUser && typeof firebase !== "undefined") {
      this.db = firebase.firestore();
      this.subscribeToConversations();
    }
  }

  subscribeToConversations() {
    if (!this.db || !this.currentUser) return;
    if (this.conversationUnsubscribe) {
      this.conversationUnsubscribe();
    }

    this.conversationUnsubscribe = this.db
      .collection("conversations")
      .where("participants", "array-contains", this.currentUser.id)
      .onSnapshot((snapshot) => {
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

        this.conversationListeners.forEach((listener) =>
          listener(conversations)
        );
        this.updateNotificationCounts(conversations);
      });
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

  watchMessages(conversationId) {
    if (!this.db || !conversationId) return;
    if (this.messageUnsubscribe) {
      this.messageUnsubscribe();
    }

    this.currentConversationId = conversationId;
    this.messageUnsubscribe = this.db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot((snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        this.messageListeners.forEach((listener) =>
          listener(messages, conversationId)
        );
      });
  }

  async sendMessage(conversationId, messageText) {
    if (!this.db || !conversationId || !messageText.trim()) return;

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
