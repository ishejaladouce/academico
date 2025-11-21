// Connections Management System - backed by Firestore
class ConnectionsManager {
  constructor() {
    this.currentUser = null;
    this.db = null;
    this.unsubscribe = null;
    this.listeners = [];
    this.init();
  }

  async init() {
    await this.ensureFirebase();
    this.currentUser = authManager.getCurrentUser();
    if (this.currentUser && this.db) {
      this.subscribeToConnections();
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
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    await this.init();
  }

  // Subscribe to live connection updates so the dashboard stays fresh
  subscribeToConnections() {
    if (!this.db || !this.currentUser) return;
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = this.db
      .collection("connections")
      .where("participantIds", "array-contains", this.currentUser.id)
      .onSnapshot((snapshot) => {
        const connections = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const grouped = this.partitionConnections(connections);
        this.listeners.forEach((listener) => listener(grouped));
        this.updateNotificationCounts(grouped.pendingIncoming.length);
      });
  }

  onChange(callback) {
    if (typeof callback === "function") {
      this.listeners.push(callback);
    }
  }

  partitionConnections(connections) {
    const grouped = {
      accepted: [],
      pendingIncoming: [],
      pendingOutgoing: [], // This will include ALL sent requests (both pending and accepted)
    };

    connections.forEach((conn) => {
      if (!conn.status) {
        console.warn("Connection missing status:", conn.id);
        return;
      }
      
      // Check if user was the requester (sent the request)
      const userSentRequest = conn.requesterId === this.currentUser.id;
      // Check if user was the receiver (received the request)
      const userReceivedRequest = conn.receiverId === this.currentUser.id;
      
      if (conn.status === "accepted") {
        // All accepted connections go to accepted list
        grouped.accepted.push(conn);
        
        // Also add to sent requests if user sent it
        if (userSentRequest) {
          grouped.pendingOutgoing.push(conn);
        }
      } else if (
        conn.status === "pending" &&
        userReceivedRequest
      ) {
        // Pending requests received by user
        grouped.pendingIncoming.push(conn);
      } else if (
        conn.status === "pending" &&
        userSentRequest
      ) {
        // Pending requests sent by user
        grouped.pendingOutgoing.push(conn);
      } else if (conn.status === "declined") {
        // Ignore declined connections - they won't appear in any list
        console.log("Connection declined, not displaying:", conn.id);
      } else {
        console.warn("Unknown connection status:", conn.status, conn.id);
      }
    });

    console.log(`Partitioned connections: ${grouped.accepted.length} accepted, ${grouped.pendingIncoming.length} pending incoming, ${grouped.pendingOutgoing.length} sent requests (pending + accepted)`);
    return grouped;
  }

  updateNotificationCounts(pendingCount = 0) {
    const connectionNotification = document.getElementById(
      "connectionNotification"
    );
    if (!connectionNotification) return;

    if (pendingCount > 0) {
      connectionNotification.textContent = String(pendingCount);
      connectionNotification.classList.remove("hidden");
    } else {
      connectionNotification.classList.add("hidden");
    }
  }

  async sendConnectionRequest(targetUser) {
    if (!this.currentUser) {
      throw new Error("Please log in to create connections.");
    }

    if (!targetUser?.id || targetUser.id === this.currentUser.id) {
      throw new Error("Invalid connection target.");
    }

    // Ensure Firebase is ready
    await this.ensureFirebase();
    if (!this.db) {
      throw new Error("Database not available. Please refresh the page.");
    }

    const connectionId = this.generateConnectionId(
      this.currentUser.id,
      targetUser.id
    );
    const connectionRef = this.db.collection("connections").doc(connectionId);
    const existing = await connectionRef.get();

    if (existing.exists) {
      const data = existing.data();
      if (data.status === "accepted") {
        throw new Error("You are already connected.");
      }
      if (data.status === "pending") {
        if (data.requesterId === this.currentUser.id) {
          throw new Error("Connection request already sent.");
        }
        if (data.receiverId === this.currentUser.id) {
          throw new Error(
            "This student already requested you. Check your pending requests."
          );
        }
      }
    }

    await connectionRef.set({
      id: connectionId,
      requesterId: this.currentUser.id,
      receiverId: targetUser.id,
      requesterName: this.currentUser.name,
      receiverName: targetUser.name,
      requesterUniversity: this.currentUser.university || "",
      receiverUniversity: targetUser.university || "",
      requesterCourse: this.currentUser.course || "",
      receiverCourse: targetUser.course || "",
      requesterAvailability: this.currentUser.availability || "flexible",
      receiverAvailability: targetUser.availability || "flexible",
      requesterStudyType: this.currentUser.studyType || "group",
      receiverStudyType: targetUser.studyType || "group",
      requesterCountry: this.currentUser.country || "",
      receiverCountry: targetUser.country || "",
      participantIds: [this.currentUser.id, targetUser.id],
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return true;
  }

  async respondToRequest(connectionId, action) {
    if (!this.currentUser) {
      throw new Error("Please log in to respond to connection requests.");
    }
    
    // Ensure Firebase is ready
    await this.ensureFirebase();
    if (!this.db) {
      throw new Error("Database not available. Please refresh the page.");
    }
    
    const connectionRef = this.db.collection("connections").doc(connectionId);
    const snapshot = await connectionRef.get();

    if (!snapshot.exists) {
      throw new Error("Connection request not found.");
    }

    const currentData = snapshot.data();
    console.log(`Responding to connection ${connectionId}:`, {
      currentStatus: currentData.status,
      action: action,
      requesterId: currentData.requesterId,
      receiverId: currentData.receiverId,
      currentUserId: this.currentUser.id
    });

    const newStatus = action === "accept" ? "accepted" : "declined";
    
    // Update the connection status
    await connectionRef.set(
      {
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    
    console.log(`Connection ${connectionId} status updated to: ${newStatus}`);
    
    // If accepted, auto-create a conversation for the two users
    if (newStatus === "accepted") {
      try {
        const requesterId = currentData.requesterId;
        const receiverId = currentData.receiverId;
        const otherUserId = requesterId === this.currentUser.id ? receiverId : requesterId;
        
        // Get the other user's details
        const otherUserRef = this.db.collection("users").doc(otherUserId);
        const otherUserSnap = await otherUserRef.get();
        const otherUserData = otherUserSnap.exists ? otherUserSnap.data() : null;
        
        // Generate conversation ID (same format as in messages.js)
        const conversationId = [this.currentUser.id, otherUserId].sort().join("_");
        const conversationRef = this.db.collection("conversations").doc(conversationId);
        const conversationSnap = await conversationRef.get();
        
        // Only create if it doesn't exist
        if (!conversationSnap.exists) {
          await conversationRef.set({
            id: conversationId,
            participants: [this.currentUser.id, otherUserId],
            participantDetails: {
              [this.currentUser.id]: {
                name: this.currentUser.name,
                university: this.currentUser.university || "",
                course: this.currentUser.course || "",
              },
              [otherUserId]: {
                name: otherUserData?.name || currentData.requesterId === otherUserId ? currentData.requesterName : currentData.receiverName,
                university: otherUserData?.university || (currentData.requesterId === otherUserId ? currentData.requesterUniversity : currentData.receiverUniversity) || "",
                course: otherUserData?.course || (currentData.requesterId === otherUserId ? currentData.requesterCourse : currentData.receiverCourse) || "",
              },
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessage: "",
            messageCount: 0,
          });
          console.log(`Auto-created conversation ${conversationId} for accepted connection`);
        }
      } catch (error) {
        console.error("Error auto-creating conversation:", error);
        // Don't throw - conversation creation failure shouldn't block connection acceptance
      }
    }
    
    // Verify the update
    const updatedSnapshot = await connectionRef.get();
    const updatedData = updatedSnapshot.data();
    console.log(`Verified connection status: ${updatedData.status}`);
  }

  generateConnectionId(idA, idB) {
    return [idA, idB].sort().join("_");
  }

  async getConnectionStats() {
    if (!this.db) return { total: 0, pending: 0 };
    const snapshot = await this.db.collection("connections").get();
    let accepted = 0;
    let pending = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === "accepted") accepted += 1;
      if (data.status === "pending") pending += 1;
    });

    return { total: accepted, pending };
  }
}

// Global instance
const connectionsManager = new ConnectionsManager();
