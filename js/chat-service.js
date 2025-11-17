// Firebase Chat Service - Completely Free
class ChatService {
    constructor() {
        this.db = null;
        this.currentChat = null;
        this.init();
    }

    async init() {
        // YOUR REAL FIREBASE CONFIG
        const firebaseConfig = {
            apiKey: "AIzaSyAuAmhkTWhWWUmJvdBYBydE8Wly0ZNHTBY",
            authDomain: "academico-chat.firebaseapp.com",
            databaseURL: "https://academico-chat-default-rtdb.firebaseio.com",
            projectId: "academico-chat",
            storageBucket: "academico-chat.firebasestorage.app",
            messagingSenderId: "786614809148",
            appId: "1:786614809148:web:31eada9340cb351f6b8939"
        };

        // Load and initialize Firebase
        await this.loadFirebase();
        firebase.initializeApp(firebaseConfig);
        this.db = firebase.database();
        console.log('Firebase Chat Service Ready!');
    }

    loadFirebase() {
        return new Promise((resolve) => {
            // Check if already loaded
            if (typeof firebase !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js';
            script.onload = () => {
                const script2 = document.createElement('script');
                script2.src = 'https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js';
                script2.onload = resolve;
                document.head.appendChild(script2);
            };
            document.head.appendChild(script);
        });
    }

    // Start a chat between two students
    startChat(student1, student2) {
        const chatId = this.generateChatId(student1.id, student2.id);
        this.currentChat = chatId;
        
        // Clear previous listeners
        this.db.ref('chats/' + chatId).off();
        
        // Listen for new messages
        this.db.ref('chats/' + chatId).on('child_added', (snapshot) => {
            this.displayMessage(snapshot.val());
        });

        // Load chat history
        this.loadChatHistory(chatId);
        return chatId;
    }

    // Load existing messages
    async loadChatHistory(chatId) {
        try {
            const snapshot = await this.db.ref('chats/' + chatId).once('value');
            const messages = snapshot.val();
            
            if (messages) {
                Object.values(messages).forEach(message => {
                    this.displayMessage(message);
                });
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    // Send a message
    async sendMessage(sender, messageText) {
        if (!this.currentChat || !messageText.trim()) return;

        const message = {
            id: Date.now(),
            sender: sender.name,
            senderId: sender.id,
            text: messageText.trim(),
            timestamp: Date.now(),
            read: false
        };

        try {
            await this.db.ref('chats/' + this.currentChat).push(message);
            document.getElementById('messageInput').value = ''; // Clear input
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    }

    // Display message in UI
    displayMessage(message) {
        const chatContainer = document.getElementById('chatMessages');
        if (!chatContainer) return;

        // Simple user detection (in real app, you'd have proper user auth)
        const isCurrentUser = message.senderId === 'current-user-id'; // You'll set this properly
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isCurrentUser ? 'own-message' : 'partner-message'}`;
        messageElement.innerHTML = `
            <div class="message-sender">${message.sender}</div>
            <div class="message-text">${message.text}</div>
            <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
        `;

        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    generateChatId(id1, id2) {
        return [id1, id2].sort().join('_');
    }

    // Close chat
    closeChat() {
        if (this.currentChat) {
            this.db.ref('chats/' + this.currentChat).off();
            this.currentChat = null;
        }
    }
}

// Global instance
const chatService = new ChatService();