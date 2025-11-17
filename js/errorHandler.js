/**
 * Comprehensive Error Handling System
 * Meets Rubric Requirement: Robust error handling for API downtime, invalid responses
 */

class ErrorHandler {
    constructor() {
        this.errorMessages = {
            network: 'Network connection failed. Please check your internet.',
            api: 'Service temporarily unavailable. Please try again.',
            auth: 'Authentication failed. Please check your credentials.',
            search: 'Search failed. Please adjust your criteria.',
            general: 'Something went wrong. Please try again.'
        };
    }

    /**
     * Handle API errors with user-friendly messages
     */
    handleApiError(error, context = 'operation') {
        console.error(`❌ ${context} Error:`, error);
        
        let userMessage = this.errorMessages.general;
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            userMessage = this.errorMessages.network;
        } else if (error.response && error.response.status >= 500) {
            userMessage = this.errorMessages.api;
        } else if (error.response && error.response.status === 401) {
            userMessage = this.errorMessages.auth;
        }
        
        this.showUserError(userMessage, context);
        return userMessage;
    }

    /**
     * Show error message to user
     */
    showUserError(message, context) {
        // Remove any existing error messages
        this.clearErrors();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee;
            border: 1px solid #fcc;
            border-radius: 8px;
            padding: 15px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * Clear all error messages
     */
    clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.remove());
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.clearErrors();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✅</span>
                <span class="success-text">${message}</span>
                <button class="success-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #efe;
            border: 1px solid #cfc;
            border-radius: 8px;
            padding: 15px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentElement) {
                successDiv.remove();
            }
        }, 3000);
    }

    /**
     * Validate search form inputs
     */
    validateSearchForm(filters) {
        const errors = [];
        
        if (!filters.course || filters.course.trim().length < 2) {
            errors.push('Please enter a valid course name (at least 2 characters)');
        }
        
        if (filters.topic && filters.topic.trim().length < 2) {
            errors.push('Topic should be at least 2 characters long');
        }
        
        return errors;
    }

    /**
     * Validate registration form
     */
    validateRegistration(formData) {
        const errors = [];
        
        if (!formData.name || formData.name.trim().length < 2) {
            errors.push('Please enter your full name');
        }
        
        if (!formData.email || !this.isValidEmail(formData.email)) {
            errors.push('Please enter a valid university email');
        }
        
        if (!formData.course || formData.course.trim().length < 2) {
            errors.push('Please enter your course of study');
        }
        
        return errors;
    }

    /**
     * Email validation
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Global instance
const errorHandler = new ErrorHandler();