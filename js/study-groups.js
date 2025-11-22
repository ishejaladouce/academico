// Study Groups Management System
class StudyGroupsManager {
  constructor() {
    this.db = null;
    this.currentUser = null;
    this.groups = [];
    this.invitations = [];
  }

  async init() {
    await this.ensureFirebase();
    this.currentUser = authManager.getCurrentUser();
    if (this.currentUser && this.db) {
      this.setupEventListeners();
      await this.loadGroups();
      await this.loadInvitations();
      this.setupRealtimeListeners();
    }
  }

  async ensureFirebase() {
    if (this.db) return this.db;
    
    if (typeof authManager !== "undefined" && authManager.db) {
      this.db = authManager.db;
      return this.db;
    }
    
    throw new Error("Firebase not available");
  }

  setupEventListeners() {
    // Create group button
    const createGroupBtn = document.getElementById("createGroupBtn");
    if (createGroupBtn) {
      createGroupBtn.addEventListener("click", () => this.showCreateGroupModal());
    }

    // Close modal
    const closeModal = document.getElementById("closeCreateGroupModal");
    if (closeModal) {
      closeModal.addEventListener("click", () => this.hideCreateGroupModal());
    }

    const cancelBtn = document.getElementById("cancelCreateGroup");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.hideCreateGroupModal());
    }

    // Create group form
    const createGroupForm = document.getElementById("createGroupForm");
    if (createGroupForm) {
      createGroupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.createGroup();
      });
    }

    // Tab switching
    document.querySelectorAll('.groups-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });
  }

  async loadGroups() {
    try {
      if (!this.db || !this.currentUser) return;

      const groupsSnapshot = await this.db.collection("studyGroups")
        .where("members", "array-contains", this.currentUser.id)
        .get();

      this.groups = [];
      groupsSnapshot.forEach(doc => {
        const groupData = doc.data();
        this.groups.push({
          id: doc.id,
          ...groupData
        });
      });

      this.displayGroups();
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  }

  async loadInvitations() {
    try {
      if (!this.db || !this.currentUser) return;

      // Try with composite query first, fallback to single query if index doesn't exist
      let invitationsSnapshot;
      try {
        invitationsSnapshot = await this.db.collection("groupInvitations")
          .where("inviteeId", "==", this.currentUser.id)
          .where("status", "==", "pending")
          .get();
      } catch (error) {
        // Fallback: get all invitations for user and filter
        console.warn("Composite query failed, using fallback:", error);
        const allInvitations = await this.db.collection("groupInvitations")
          .where("inviteeId", "==", this.currentUser.id)
          .get();
        
        invitationsSnapshot = {
          docs: allInvitations.docs.filter(doc => doc.data().status === "pending"),
          forEach: function(callback) {
            this.docs.forEach(callback);
          }
        };
      }

      this.invitations = [];
      invitationsSnapshot.forEach(doc => {
        const invData = doc.data();
        this.invitations.push({
          id: doc.id,
          ...invData
        });
      });

      console.log(`Loaded ${this.invitations.length} pending invitations`);
      this.displayInvitations();
      this.updateInvitationBadge();
    } catch (error) {
      console.error("Error loading invitations:", error);
      // Show error in UI
      const invitationsList = document.getElementById("groupInvitationsList");
      if (invitationsList) {
        invitationsList.innerHTML = `
          <div class="no-invitations">
            <i class="fas fa-exclamation-circle"></i>
            <p>Error loading invitations. Please refresh.</p>
          </div>
        `;
      }
    }
  }

  async displayGroups() {
    const groupsGrid = document.getElementById("groupsGrid");
    if (!groupsGrid) return;

    if (this.groups.length === 0) {
      groupsGrid.innerHTML = `
        <div class="no-groups" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #7f8c8d;">
          <i class="fas fa-users" style="font-size: 48px; margin-bottom: 15px; color: #e9ecef;"></i>
          <p>You haven't joined any study groups yet.</p>
          <p style="margin-top: 10px; font-size: 14px;">Create a group or accept an invitation to get started!</p>
        </div>
      `;
      return;
    }

    // Fetch creator names for all groups
    const groupPromises = this.groups.map(async (group) => {
      let creatorName = "Unknown";
      try {
        if (group.creatorId) {
          const creatorDoc = await this.db.collection("users").doc(group.creatorId).get();
          if (creatorDoc.exists) {
            creatorName = creatorDoc.data().name || "Unknown";
          }
        }
      } catch (e) {
        console.error("Error fetching creator:", e);
      }
      return { ...group, creatorName };
    });

    const groupsWithCreators = await Promise.all(groupPromises);

    let html = '';
    groupsWithCreators.forEach(group => {
      const memberCount = group.members ? group.members.length : 0;
      const isCreator = group.creatorId === this.currentUser.id;

      html += `
        <div class="group-card">
          <div class="group-header">
            <div>
              <h3 class="group-name">${group.name || "Unnamed Group"}</h3>
              <p class="group-purpose">${group.purpose || "No description"}</p>
            </div>
          </div>
          <div class="group-meta">
            <span><i class="fas fa-user"></i> ${memberCount} ${memberCount === 1 ? 'member' : 'members'}</span>
            <span><i class="fas fa-user-tie"></i> ${group.creatorName}</span>
          </div>
          <div class="group-actions">
            <button class="group-action-btn primary" onclick="studyGroupsManager.viewGroup('${group.id}')">
              <i class="fas fa-users"></i> Members
            </button>
            <button class="group-action-btn chat-group-btn" onclick="studyGroupsManager.startGroupChat('${group.id}')">
              <i class="fas fa-comments"></i> Chat
            </button>
            ${isCreator ? `
              <button class="group-action-btn" onclick="studyGroupsManager.manageGroup('${group.id}')">
                <i class="fas fa-cog"></i> Manage
              </button>
            ` : `
              <button class="group-action-btn" onclick="studyGroupsManager.leaveGroup('${group.id}')">
                <i class="fas fa-sign-out-alt"></i> Leave
              </button>
            `}
          </div>
        </div>
      `;
    });

    groupsGrid.innerHTML = html;
  }

  async displayInvitations() {
    const invitationsList = document.getElementById("groupInvitationsList");
    if (!invitationsList) return;

    if (this.invitations.length === 0) {
      invitationsList.innerHTML = `
        <div class="no-invitations">
          <i class="fas fa-envelope"></i>
          <p>No pending invitations</p>
        </div>
      `;
      return;
    }

    let html = '';
    for (const invitation of this.invitations) {
      // Get group and inviter info
      let groupName = "Unknown Group";
      let inviterName = "Someone";
      
      try {
        const groupDoc = await this.db.collection("studyGroups").doc(invitation.groupId).get();
        if (groupDoc.exists) {
          groupName = groupDoc.data().name || "Unknown Group";
        }

        const inviterDoc = await this.db.collection("users").doc(invitation.inviterId).get();
        if (inviterDoc.exists) {
          inviterName = inviterDoc.data().name || "Someone";
        }
      } catch (e) {
        console.error("Error fetching invitation details:", e);
      }

      html += `
        <div class="invitation-item">
          <div class="invitation-info">
            <h4>${groupName}</h4>
            <p>Invited by ${inviterName}</p>
          </div>
          <div class="invitation-actions">
            <button class="group-action-btn primary" onclick="studyGroupsManager.acceptInvitation('${invitation.id}')">
              <i class="fas fa-check"></i> Accept
            </button>
            <button class="group-action-btn" onclick="studyGroupsManager.declineInvitation('${invitation.id}')">
              <i class="fas fa-times"></i> Decline
            </button>
          </div>
        </div>
      `;
    }

    invitationsList.innerHTML = html;
  }

  showCreateGroupModal() {
    const modal = document.getElementById("createGroupModal");
    if (modal) {
      modal.classList.remove("hidden");
      this.loadConnectionsForInvite();
    }
  }

  hideCreateGroupModal() {
    const modal = document.getElementById("createGroupModal");
    if (modal) {
      modal.classList.add("hidden");
      document.getElementById("createGroupForm").reset();
    }
  }

  async loadConnectionsForInvite() {
    const inviteSelect = document.getElementById("inviteUsers");
    if (!inviteSelect) return;

    try {
      inviteSelect.innerHTML = '<option value="">Loading connections...</option>';

      if (!this.db || !this.currentUser) {
        inviteSelect.innerHTML = '<option value="">No connections available</option>';
        return;
      }

      const userId = this.currentUser.id;

      // Fetch accepted connections where current user is a participant
      const connectionsSnapshot = await this.db.collection("connections")
        .where("participantIds", "array-contains", userId)
        .where("status", "==", "accepted")
        .get();

      const connections = [];

      connectionsSnapshot.forEach(doc => {
        const connData = doc.data();
        
        // Determine the other user in the connection
        let otherUserId = null;
        let otherUserName = null;

        if (connData.requesterId === userId) {
          otherUserId = connData.receiverId;
          otherUserName = connData.receiverName;
        } else if (connData.receiverId === userId) {
          otherUserId = connData.requesterId;
          otherUserName = connData.requesterName;
        }

        if (otherUserId) {
          connections.push({
            id: otherUserId,
            name: otherUserName || "Unknown"
          });
        }
      });

      // Fetch user details for connections that don't have names
      const connectionsWithDetails = await Promise.all(
        connections.map(async (conn) => {
          if (!conn.name || conn.name === "Unknown") {
            try {
              const userDoc = await this.db.collection("users").doc(conn.id).get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                return {
                  id: conn.id,
                  name: userData.name || userData.email || "Unknown User",
                  email: userData.email || ""
                };
              }
            } catch (e) {
              console.error("Error fetching user details:", e);
            }
          }
          return {
            id: conn.id,
            name: conn.name || "Unknown User",
            email: ""
          };
        })
      );

      // Remove duplicates (in case of any)
      const uniqueConnections = [];
      const seenIds = new Set();
      connectionsWithDetails.forEach(conn => {
        if (!seenIds.has(conn.id)) {
          seenIds.add(conn.id);
          uniqueConnections.push(conn);
        }
      });

      // Populate select dropdown
      inviteSelect.innerHTML = '<option value="">Select connections to invite (hold Ctrl/Cmd for multiple)...</option>';
      
      if (uniqueConnections.length === 0) {
        inviteSelect.innerHTML = '<option value="">No connections available. Connect with users first!</option>';
        return;
      }

      uniqueConnections.forEach(conn => {
        const option = document.createElement("option");
        option.value = conn.id;
        option.textContent = conn.name + (conn.email ? ` (${conn.email})` : '');
        inviteSelect.appendChild(option);
      });

      console.log(`Loaded ${uniqueConnections.length} connections for invitation`);

    } catch (error) {
      console.error("Error loading connections:", error);
      inviteSelect.innerHTML = '<option value="">Error loading connections. Please try again.</option>';
    }
  }

  async createGroup() {
    const groupName = document.getElementById("groupName").value.trim();
    const groupPurpose = document.getElementById("groupPurpose").value.trim();
    const inviteUsers = Array.from(document.getElementById("inviteUsers").selectedOptions)
      .map(opt => opt.value)
      .filter(v => v);

    if (!groupName || !groupPurpose) {
      alert("Please fill in group name and purpose");
      return;
    }

    try {
      // Create group
      const groupRef = this.db.collection("studyGroups").doc();
      const groupData = {
        id: groupRef.id,
        name: groupName,
        purpose: groupPurpose,
        creatorId: this.currentUser.id,
        creatorName: this.currentUser.name,
        members: [this.currentUser.id],
        memberDetails: {
          [this.currentUser.id]: {
            name: this.currentUser.name,
            email: this.currentUser.email,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
          }
        },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await groupRef.set(groupData);

      // Send invitations
      if (inviteUsers.length > 0) {
        console.log(`Sending ${inviteUsers.length} invitations...`);
        const invitationPromises = inviteUsers.map(async (userId) => {
          // Check if invitation already exists
          const existingInvites = await this.db.collection("groupInvitations")
            .where("groupId", "==", groupRef.id)
            .where("inviteeId", "==", userId)
            .where("status", "==", "pending")
            .get();

          if (!existingInvites.empty) {
            console.log(`Invitation already exists for user ${userId}`);
            return null;
          }

          // Get invitee name
          let inviteeName = "User";
          try {
            const userDoc = await this.db.collection("users").doc(userId).get();
            if (userDoc.exists) {
              inviteeName = userDoc.data().name || userDoc.data().email || "User";
            }
          } catch (e) {
            console.error("Error fetching invitee name:", e);
          }

          const invitationData = {
            groupId: groupRef.id,
            groupName: groupName,
            inviterId: this.currentUser.id,
            inviterName: this.currentUser.name,
            inviterEmail: this.currentUser.email || "",
            inviteeId: userId,
            inviteeName: inviteeName,
            status: "pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          };

          const inviteRef = await this.db.collection("groupInvitations").add(invitationData);
          console.log(`Invitation sent to ${inviteeName} (${userId}): ${inviteRef.id}`);
          return inviteRef.id;
        });
        
        const results = await Promise.all(invitationPromises);
        const successCount = results.filter(r => r !== null).length;
        console.log(`Successfully sent ${successCount} invitations`);
        
        if (successCount > 0) {
          // Reload invitations for other users (they'll see it via real-time listener)
          // For current user, we can show a success message
        }
      }

      this.hideCreateGroupModal();
      await this.loadGroups();
      alert("Group created successfully!");
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group. Please try again.");
    }
  }

  async acceptInvitation(invitationId) {
    try {
      const invitationRef = this.db.collection("groupInvitations").doc(invitationId);
      const invitationDoc = await invitationRef.get();
      
      if (!invitationDoc.exists) {
        alert("Invitation not found");
        return;
      }

      const invitationData = invitationDoc.data();
      const groupRef = this.db.collection("studyGroups").doc(invitationData.groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) {
        alert("Group not found");
        return;
      }

      const groupData = groupDoc.data();
      const members = groupData.members || [];
      
      if (members.includes(this.currentUser.id)) {
        alert("You are already a member of this group");
        await invitationRef.update({ status: "accepted" });
        await this.loadInvitations();
        return;
      }

      // Add user to group
      members.push(this.currentUser.id);
      const memberDetails = groupData.memberDetails || {};
      memberDetails[this.currentUser.id] = {
        name: this.currentUser.name,
        email: this.currentUser.email,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await groupRef.update({
        members: members,
        memberDetails: memberDetails,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Update invitation status
      await invitationRef.update({
        status: "accepted",
        respondedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await this.loadGroups();
      await this.loadInvitations();
      alert("You've joined the group!");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      alert("Failed to accept invitation. Please try again.");
    }
  }

  async declineInvitation(invitationId) {
    try {
      await this.db.collection("groupInvitations").doc(invitationId).update({
        status: "declined",
        respondedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await this.loadInvitations();
    } catch (error) {
      console.error("Error declining invitation:", error);
      alert("Failed to decline invitation. Please try again.");
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.groups-tabs .tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      }
    });

    // Update tab content
    document.querySelectorAll('.groups-content .tab-content').forEach(content => {
      content.classList.remove('active');
      if (content.id === tabName) {
        content.classList.add('active');
      }
    });
  }

  updateInvitationBadge() {
    const badge = document.getElementById("groupInvitationsBadge");
    const navBadge = document.getElementById("groupNotification");
    const count = this.invitations.length;

    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }

    if (navBadge) {
      if (count > 0) {
        navBadge.textContent = count;
        navBadge.classList.remove("hidden");
      } else {
        navBadge.classList.add("hidden");
      }
    }
  }

  async viewGroup(groupId) {
    try {
      const group = this.groups.find(g => g.id === groupId);
      if (!group) {
        alert("Group not found");
        return;
      }

      // Fetch member details
      const memberIds = group.members || [];
      const memberPromises = memberIds.map(async (memberId) => {
        try {
          const memberDoc = await this.db.collection("users").doc(memberId).get();
          if (memberDoc.exists) {
            const memberData = memberDoc.data();
            return {
              id: memberId,
              name: memberData.name || "Unknown",
              email: memberData.email || "",
              course: memberData.course || "",
              university: memberData.university || "",
              avatar: memberData.name ? memberData.name.charAt(0).toUpperCase() : "?"
            };
          }
          // Fallback to memberDetails if user doc doesn't exist
          const memberDetails = group.memberDetails || {};
          if (memberDetails[memberId]) {
            return {
              id: memberId,
              name: memberDetails[memberId].name || "Unknown",
              email: memberDetails[memberId].email || "",
              course: "",
              university: "",
              avatar: memberDetails[memberId].name ? memberDetails[memberId].name.charAt(0).toUpperCase() : "?"
            };
          }
          return {
            id: memberId,
            name: "Unknown User",
            email: "",
            course: "",
            university: "",
            avatar: "?"
          };
        } catch (error) {
          console.error(`Error fetching member ${memberId}:`, error);
          return {
            id: memberId,
            name: "Unknown User",
            email: "",
            course: "",
            university: "",
            avatar: "?"
          };
        }
      });

      const members = await Promise.all(memberPromises);

      // Show modal with members
      this.showGroupMembersModal(group, members);
    } catch (error) {
      console.error("Error viewing group:", error);
      alert("Error loading group members. Please try again.");
    }
  }

  showGroupMembersModal(group, members) {
    // Create or get modal
    let modal = document.getElementById("groupMembersModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "groupMembersModal";
      modal.className = "modal hidden";
      modal.innerHTML = `
        <div class="modal-overlay" id="groupMembersOverlay"></div>
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h3 id="groupMembersTitle">Group Members</h3>
            <button class="modal-close" id="closeGroupMembersModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div id="groupMembersList"></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Add event listeners
      document.getElementById("groupMembersOverlay")?.addEventListener("click", () => {
        this.hideGroupMembersModal();
      });
      document.getElementById("closeGroupMembersModal")?.addEventListener("click", () => {
        this.hideGroupMembersModal();
      });
    }

    // Populate modal
    document.getElementById("groupMembersTitle").textContent = `${group.name} - Members`;
    const membersList = document.getElementById("groupMembersList");
    
    if (members.length === 0) {
      membersList.innerHTML = `
        <div class="no-members">
          <i class="fas fa-users"></i>
          <p>No members found</p>
        </div>
      `;
    } else {
      membersList.innerHTML = members.map(member => `
        <div class="member-item">
          <div class="member-avatar">${member.avatar}</div>
          <div class="member-info">
            <h4>${member.name}</h4>
            ${member.course ? `<p class="member-course"><i class="fas fa-book"></i> ${member.course}</p>` : ''}
            ${member.university ? `<p class="member-university"><i class="fas fa-university"></i> ${member.university}</p>` : ''}
            ${member.id === group.creatorId ? '<span class="creator-badge"><i class="fas fa-crown"></i> Creator</span>' : ''}
          </div>
        </div>
      `).join('');
    }

    // Show modal
    modal.classList.remove("hidden");
  }

  hideGroupMembersModal() {
    const modal = document.getElementById("groupMembersModal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  async startGroupChat(groupId) {
    try {
      const group = this.groups.find(g => g.id === groupId);
      if (!group) {
        alert("Group not found");
        return;
      }

      // Check if user is a member
      if (!group.members || !group.members.includes(this.currentUser.id)) {
        alert("You must be a member of this group to chat");
        return;
      }

      // Navigate to messages section and open group chat
      if (typeof dashboard !== "undefined" && dashboard.openGroupChat) {
        dashboard.showSection("messagesSection");
        dashboard.openGroupChat(groupId, group.name);
      } else {
        // Fallback: show alert
        alert(`Opening chat for ${group.name}`);
        console.log("Group chat would open for:", group);
      }
    } catch (error) {
      console.error("Error starting group chat:", error);
      alert("Error starting group chat. Please try again.");
    }
  }

  async manageGroup(groupId) {
    // Show modal to invite more members or manage group
    const group = this.groups.find(g => g.id === groupId);
    if (!group) {
      alert("Group not found");
      return;
    }

    // For now, show option to invite more members
    if (confirm(`Would you like to invite more members to "${group.name}"?`)) {
      this.showInviteMembersModal(groupId, group.name);
    }
  }

  async showInviteMembersModal(groupId, groupName) {
    // Create a simple modal for inviting members
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "inviteMembersModal";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-user-plus"></i> Invite Members to ${groupName}</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-form">
          <div class="form-group">
            <label for="inviteMembersSelect">
              <i class="fas fa-users"></i> Select Connections to Invite
            </label>
            <select id="inviteMembersSelect" multiple class="multi-select" style="min-height: 150px;">
              <option value="">Loading connections...</option>
            </select>
            <small>Hold Ctrl/Cmd to select multiple users</small>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="document.getElementById('inviteMembersModal').remove()">
              Cancel
            </button>
            <button type="button" class="btn-primary" onclick="studyGroupsManager.sendInvitations('${groupId}')">
              <i class="fas fa-paper-plane"></i> Send Invitations
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Load connections
    await this.loadConnectionsForInviteSelect("inviteMembersSelect");
  }

  async loadConnectionsForInviteSelect(selectId) {
    const inviteSelect = document.getElementById(selectId);
    if (!inviteSelect) return;

    try {
      if (!this.db || !this.currentUser) {
        inviteSelect.innerHTML = '<option value="">No connections available</option>';
        return;
      }

      const userId = this.currentUser.id;
      const connectionsSnapshot = await this.db.collection("connections")
        .where("participantIds", "array-contains", userId)
        .where("status", "==", "accepted")
        .get();

      const connections = [];
      connectionsSnapshot.forEach(doc => {
        const connData = doc.data();
        let otherUserId = null;
        let otherUserName = null;

        if (connData.requesterId === userId) {
          otherUserId = connData.receiverId;
          otherUserName = connData.receiverName;
        } else if (connData.receiverId === userId) {
          otherUserId = connData.requesterId;
          otherUserName = connData.requesterName;
        }

        if (otherUserId) {
          connections.push({ id: otherUserId, name: otherUserName || "Unknown" });
        }
      });

      const connectionsWithDetails = await Promise.all(
        connections.map(async (conn) => {
          if (!conn.name || conn.name === "Unknown") {
            try {
              const userDoc = await this.db.collection("users").doc(conn.id).get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                return {
                  id: conn.id,
                  name: userData.name || userData.email || "Unknown User",
                  email: userData.email || ""
                };
              }
            } catch (e) {
              console.error("Error fetching user:", e);
            }
          }
          return { id: conn.id, name: conn.name || "Unknown User", email: "" };
        })
      );

      inviteSelect.innerHTML = '<option value="">Select connections to invite...</option>';
      if (connectionsWithDetails.length === 0) {
        inviteSelect.innerHTML = '<option value="">No connections available</option>';
        return;
      }

      connectionsWithDetails.forEach(conn => {
        const option = document.createElement("option");
        option.value = conn.id;
        option.textContent = conn.name + (conn.email ? ` (${conn.email})` : '');
        inviteSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading connections:", error);
      inviteSelect.innerHTML = '<option value="">Error loading connections</option>';
    }
  }

  async sendInvitations(groupId) {
    const inviteSelect = document.getElementById("inviteMembersSelect");
    if (!inviteSelect) return;

    const inviteUsers = Array.from(inviteSelect.selectedOptions)
      .map(opt => opt.value)
      .filter(v => v);

    if (inviteUsers.length === 0) {
      alert("Please select at least one connection to invite");
      return;
    }

    try {
      // Get group info
      const groupDoc = await this.db.collection("studyGroups").doc(groupId).get();
      if (!groupDoc.exists) {
        alert("Group not found");
        return;
      }

      const groupData = groupDoc.data();
      const groupName = groupData.name;

      console.log(`Sending ${inviteUsers.length} invitations to group ${groupName}...`);

      const invitationPromises = inviteUsers.map(async (userId) => {
        // Check if user is already a member
        if (groupData.members && groupData.members.includes(userId)) {
          console.log(`User ${userId} is already a member`);
          return null;
        }

        // Check if invitation already exists
        const existingInvites = await this.db.collection("groupInvitations")
          .where("groupId", "==", groupId)
          .where("inviteeId", "==", userId)
          .where("status", "==", "pending")
          .get();

        if (!existingInvites.empty) {
          console.log(`Invitation already exists for user ${userId}`);
          return null;
        }

        // Get invitee name
        let inviteeName = "User";
        try {
          const userDoc = await this.db.collection("users").doc(userId).get();
          if (userDoc.exists) {
            inviteeName = userDoc.data().name || userDoc.data().email || "User";
          }
        } catch (e) {
          console.error("Error fetching invitee name:", e);
        }

        const invitationData = {
          groupId: groupId,
          groupName: groupName,
          inviterId: this.currentUser.id,
          inviterName: this.currentUser.name,
          inviterEmail: this.currentUser.email || "",
          inviteeId: userId,
          inviteeName: inviteeName,
          status: "pending",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const inviteRef = await this.db.collection("groupInvitations").add(invitationData);
        console.log(`Invitation sent to ${inviteeName} (${userId}): ${inviteRef.id}`);
        return inviteRef.id;
      });

      const results = await Promise.all(invitationPromises);
      const successCount = results.filter(r => r !== null).length;

      // Close modal
      const modal = document.getElementById("inviteMembersModal");
      if (modal) modal.remove();

      if (successCount > 0) {
        alert(`Successfully sent ${successCount} invitation(s)!`);
      } else {
        alert("No invitations were sent. Users may already be members or have pending invitations.");
      }
    } catch (error) {
      console.error("Error sending invitations:", error);
      alert("Failed to send invitations. Please try again.");
    }
  }

  async leaveGroup(groupId) {
    if (!confirm("Are you sure you want to leave this group?")) return;

    try {
      const groupRef = this.db.collection("studyGroups").doc(groupId);
      const groupDoc = await groupRef.get();
      
      if (!groupDoc.exists) {
        alert("Group not found");
        return;
      }

      const groupData = groupDoc.data();
      const members = (groupData.members || []).filter(id => id !== this.currentUser.id);
      const memberDetails = groupData.memberDetails || {};
      delete memberDetails[this.currentUser.id];

      await groupRef.update({
        members: members,
        memberDetails: memberDetails,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await this.loadGroups();
      alert("You've left the group");
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Failed to leave group. Please try again.");
    }
  }

  setupRealtimeListeners() {
    // Listen for new invitations
    if (this.db && this.currentUser) {
      try {
        this.db.collection("groupInvitations")
          .where("inviteeId", "==", this.currentUser.id)
          .where("status", "==", "pending")
          .onSnapshot((snapshot) => {
            console.log("Invitations updated via real-time listener");
            this.loadInvitations();
          }, (error) => {
            console.error("Error in invitations listener:", error);
            // Fallback: poll every 10 seconds
            setInterval(() => this.loadInvitations(), 10000);
          });
      } catch (error) {
        console.warn("Real-time listener setup failed, using polling:", error);
        // Fallback: poll every 10 seconds
        setInterval(() => this.loadInvitations(), 10000);
      }

      // Listen for group updates
      try {
        this.db.collection("studyGroups")
          .where("members", "array-contains", this.currentUser.id)
          .onSnapshot((snapshot) => {
            console.log("Groups updated via real-time listener");
            this.loadGroups();
          });
      } catch (error) {
        console.error("Error in groups listener:", error);
      }
    }
  }
}

// Initialize study groups manager
let studyGroupsManager;
document.addEventListener("DOMContentLoaded", () => {
  if (typeof authManager !== "undefined") {
    studyGroupsManager = new StudyGroupsManager();
    // Initialize after a short delay to ensure authManager is ready
    setTimeout(() => {
      studyGroupsManager.init();
    }, 500);
  }
});

