// Firebase Chat Service using Firestore
class ChatService {
    constructor() {
        this.db = null;
        this.currentChat = null;
        this.unsubscribe = null;
        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            // Wait for Firebase to be available
            await this.waitForFirebase();
            
            // Use the same Firebase instance that auth.js already initialized
            this.db = firebase.firestore();
            this.initialized = true;
            console.log('✅ Firestore Chat Service Ready!');
            
        } catch (error) {
            console.error('❌ Chat service init failed:', error);
            // Retry initialization after a delay
            setTimeout(() => this.init(), 2000);
        }
    }

    waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkFirebase = () => {
                attempts++;
                
                if (typeof firebase !== 'undefined' && 
                    typeof firebase.firestore === 'function' &&
                    firebase.apps.length > 0) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Firebase not available after multiple attempts'));
                } else {
                    console.log(`⏳ Waiting for Firebase... (attempt ${attempts})`);
                    setTimeout(checkFirebase, 500);
                }
            };
            
            checkFirebase();
        });
    }

    // Start a chat between two students
    startChat(student1, student2) {
        try {
            if (!this.initialized) {
                throw new Error('Chat service not initialized yet');
            }

            const chatId = this.generateChatId(student1.id, student2.id);
            this.currentChat = chatId;
            
            console.log(`💬 Starting chat: ${chatId}`);
            
            // Clear previous listeners
            if (this.unsubscribe) {
                this.unsubscribe();
            }
            
            // Clear chat messages
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages) chatMessages.innerHTML = '';
            
            // Listen for new messages in real-time
            this.unsubscribe = this.db.collection('chats')
                .doc(chatId)
                .collection('messages')
                .orderBy('timestamp', 'asc')
                .onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            this.displayMessage(change.doc.data());
                        }
                    });
                });
            
            // Load existing messages
            this.loadChatHistory(chatId);
            return chatId;
            
        } catch (error) {
            console.error('Error starting chat:', error);
            errorHandler.showUserError('Chat service is still loading. Please try again in a moment.');
        }
    }

    // Load existing messages
    async loadChatHistory(chatId) {
        try {
            const snapshot = await this.db.collection('chats')
                .doc(chatId)
                .collection('messages')
                .orderBy('timestamp', 'asc')
                .get();
            
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    this.displayMessage(doc.data());
                });
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
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
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            };

            // Add message to Firestore
            await this.db.collection('chats')
                .doc(this.currentChat)
                .collection('messages')
                .add(message);
            
            // Clear input
            const messageInput = document.getElementById('messageInput');
            if (messageInput) messageInput.value = '';
            
            console.log('✅ Message sent:', message);
            
        } catch (error) {
            console.error('Error sending message:', error);
            errorHandler.showUserError('Failed to send message. Please try again.');
        }
    }

    // Display message in UI
    displayMessage(message) {
        const chatContainer = document.getElementById('chatMessages');
        if (!chatContainer) return;

        // Simple user detection
        const isCurrentUser = message.senderId === (window.app?.currentUser?.id || 'demo-user');
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isCurrentUser ? 'own-message' : 'partner-message'}`;
        messageElement.innerHTML = `
            <div class="message-sender">${message.sender}</div>
            <div class="message-text">${message.text}</div>
            <div class="message-time">${this.formatTime(message.timestamp)}</div>
        `;

        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Format timestamp
    formatTime(timestamp) {
        if (!timestamp) return 'Just now';
        
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return 'Just now';
        }
    }

    generateChatId(id1, id2) {
        return [id1, id2].sort().join('_');
    }

    // Close chat
    closeChat() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.currentChat = null;
    }

    // Check if service is ready
    isReady() {
        return this.initialized;
    }
}

// Global instance - this makes chatService available globally
window.chatService = new ChatService();