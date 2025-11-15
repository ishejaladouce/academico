// Modal Authentication System
class ModalAuth {
    constructor() {
        this.init();
    }

    init() {
        this.bindModalEvents();
    }

    bindModalEvents() {
        // Open Login Modal
        document.getElementById('loginBtn').addEventListener('click', () => this.openLogin());
        document.getElementById('loginBtnMain').addEventListener('click', () => this.openLogin());
        
        // Open Register Modal
        document.getElementById('registerBtnMain').addEventListener('click', () => this.openRegister());

        // Close Modals
        document.getElementById('closeLogin').addEventListener('click', () => this.closeLogin());
        document.getElementById('closeRegister').addEventListener('click', () => this.closeRegister());
        
        // Overlay clicks
        document.getElementById('loginOverlay').addEventListener('click', () => this.closeLogin());
        document.getElementById('registerOverlay').addEventListener('click', () => this.closeRegister());

        // Switch between modals
        document.getElementById('showRegisterModal').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeLogin();
            this.openRegister();
        });

        document.getElementById('showLoginModal').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeRegister();
            this.openLogin();
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeLogin();
                this.closeRegister();
            }
        });
    }

    openLogin() {
        document.getElementById('loginModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    openRegister() {
        document.getElementById('registerModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeLogin() {
        document.getElementById('loginModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        document.getElementById('loginForm').reset();
    }

    closeRegister() {
        document.getElementById('registerModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        document.getElementById('registerForm').reset();
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Simulate login success
        alert(`Welcome back! Login functionality would be implemented here.`);
        this.closeLogin();
    }

    handleRegister(e) {
        e.preventDefault();
        const fullName = document.getElementById('regFullName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        if (!fullName || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        // Simulate registration success
        alert(`Welcome to AcademicO, ${fullName}! Registration would be saved to database.`);
        this.closeRegister();
        this.openLogin(); // Redirect to login after registration
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ModalAuth();
});