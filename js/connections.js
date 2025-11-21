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
    this.currentUser = authManager.getCurrentUser();
    if (firebase && firebase.firestore) {
      this.db = firebase.firestore();
      if (this.currentUser) {
        this.subscribeToConnections();
      }
    }
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
      pendingOutgoing: [],
    };

    connections.forEach((conn) => {
      if (conn.status === "accepted") {
        grouped.accepted.push(conn);
      } else if (
        conn.status === "pending" &&
        conn.receiverId === this.currentUser.id
      ) {
        grouped.pendingIncoming.push(conn);
      } else if (
        conn.status === "pending" &&
        conn.requesterId === this.currentUser.id
      ) {
        grouped.pendingOutgoing.push(conn);
      }
    });

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
    if (!this.db || !this.currentUser) return;
    const connectionRef = this.db.collection("connections").doc(connectionId);
    const snapshot = await connectionRef.get();

    if (!snapshot.exists) {
      throw new Error("Connection request not found.");
    }

    const newStatus = action === "accept" ? "accepted" : "declined";
    await connectionRef.set(
      {
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
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
