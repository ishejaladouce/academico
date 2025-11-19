// Connections Management System
class ConnectionsManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  async init() {
    this.currentUser = authManager.getCurrentUser();
  }

  // Get user's connections
  async getConnections() {
    if (!this.currentUser) return [];

    return this.getDemoConnections();
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
        connectedSince: new Date(Date.now() - 7 * 24 * 3600000), // 1 week ago
        lastActive: "2 hours ago",
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
        connectedSince: new Date(Date.now() - 3 * 24 * 3600000), // 3 days ago
        lastActive: "Online now",
      },
    ];
  }

  // Get pending connection requests
  async getPendingRequests() {
    // For demo - return empty array (no pending requests)
    return [];
  }

  // Get sent connection requests
  async getSentRequests() {
    // For demo - return empty array (no sent requests)
    return [];
  }

  // Update connection notification counts
  updateNotificationCounts() {
    const connectionNotification = document.getElementById(
      "connectionNotification"
    );
    if (connectionNotification) {
      // Only show notification if there are pending requests
      const hasPendingRequests = false; // Change this based on actual pending requests
      if (hasPendingRequests) {
        connectionNotification.textContent = "1";
        connectionNotification.classList.remove("hidden");
      } else {
        connectionNotification.classList.add("hidden");
      }
    }
  }

  // Send connection request
  async sendConnectionRequest(userId) {
    console.log("Connection request sent to user:", userId);
    return true;
  }

  // Accept connection request
  async acceptConnectionRequest(requestId) {
    console.log("Connection request accepted:", requestId);
    return true;
  }

  // Decline connection request
  async declineConnectionRequest(requestId) {
    console.log("Connection request declined:", requestId);
    return true;
  }
}

// Global instance
const connectionsManager = new ConnectionsManager();
