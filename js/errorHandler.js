// Enhanced Error Handler for AcademicO - Comprehensive Error Management
class ErrorHandler {
  constructor() {
    this.errorMessages = {
      network:
        "Network connection failed. Please check your internet connection.",
      api: "Service temporarily unavailable. Please try again later.",
      auth: "Authentication failed. Please check your credentials.",
      search: "Search failed. Please adjust your criteria and try again.",
      validation: "Please check your input and try again.",
      general: "Something went wrong. Please try again.",
      timeout: "Request timed out. Please check your connection.",
      server: "Server error. Please try again in a few moments.",
    };

    this.errorCounts = {
      total: 0,
      byType: {},
    };
  }

  /**
   * Comprehensive API error handling with specific fallbacks
   */
  handleApiError(error, context = "operation") {
    console.error(`🔴 ${context.toUpperCase()} Error:`, error);
    this.errorCounts.total++;

    let userMessage = this.errorMessages.general;
    let errorType = "general";

    // Network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      userMessage = this.errorMessages.network;
      errorType = "network";
    }
    // Timeout errors
    else if (error.name === "AbortError") {
      userMessage = this.errorMessages.timeout;
      errorType = "timeout";
    }
    // HTTP errors
    else if (error.response) {
      switch (error.response.status) {
        case 401:
          userMessage = this.errorMessages.auth;
          errorType = "auth";
          break;
        case 404:
          userMessage = "Requested resource not found.";
          errorType = "not_found";
          break;
        case 500:
          userMessage = this.errorMessages.server;
          errorType = "server";
          break;
        case 503:
          userMessage = this.errorMessages.api;
          errorType = "api";
          break;
        default:
          userMessage = this.errorMessages.general;
          errorType = "http";
      }
    }
    // Custom API errors
    else if (error.message?.includes("API")) {
      userMessage = this.errorMessages.api;
      errorType = "api";
    }

    // Track error type
    this.errorCounts.byType[errorType] =
      (this.errorCounts.byType[errorType] || 0) + 1;

    this.showUserError(userMessage, context);
    return { message: userMessage, type: errorType };
  }

  /**
   * Show user-friendly error message
   */
  showUserError(message, context = "System") {
    this.clearErrors();

    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.setAttribute("data-context", context);

    errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <div class="error-text-content">
                    <strong>${context} Error</strong>
                    <span class="error-text">${message}</span>
                </div>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

    errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
            padding: 15px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
        `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 6 seconds
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 6000);
  }

  /**
   * Show success message
   */
  showSuccess(message, context = "Success") {
    this.clearErrors();

    const successDiv = document.createElement("div");
    successDiv.className = "success-message";

    successDiv.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✅</span>
                <div class="success-text-content">
                    <strong>${context}</strong>
                    <span class="success-text">${message}</span>
                </div>
                <button class="success-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

    successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #efe;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 15px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
        `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
      if (successDiv.parentElement) {
        successDiv.remove();
      }
    }, 4000);
  }

  /**
   * Handle API downtime gracefully
   */
  handleApiDowntime(apiName, fallbackData) {
    console.warn(`🟡 API Downtime: ${apiName} - Using fallback data`);

    this.showUserError(
      `${apiName} is temporarily unavailable. Using demo data.`,
      "Service Notice"
    );

    return fallbackData;
  }

  /**
   * Validate search form inputs comprehensively
   */
  validateSearchForm(filters) {
    const errors = [];

    if (!filters.course || filters.course.trim().length < 2) {
      errors.push("Please enter a valid course name (at least 2 characters)");
    }

    if (filters.course && filters.course.trim().length > 50) {
      errors.push("Course name is too long (maximum 50 characters)");
    }

    if (filters.topic && filters.topic.trim().length < 2) {
      errors.push("Topic should be at least 2 characters long");
    }

    if (filters.topic && filters.topic.trim().length > 100) {
      errors.push("Topic is too long (maximum 100 characters)");
    }

    return errors;
  }

  /**
   * Validate registration form with comprehensive checks
   */
  validateRegistration(formData) {
    const errors = [];

    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
      errors.push("Please enter your full name (at least 2 characters)");
    }

    if (formData.name && formData.name.trim().length > 100) {
      errors.push("Name is too long (maximum 100 characters)");
    }

    // Email validation
    if (!formData.email || !this.isValidEmail(formData.email)) {
      errors.push("Please enter a valid university email address");
    }

    // Course validation
    if (!formData.course || formData.course.trim().length < 2) {
      errors.push("Please enter your course of study");
    }

    if (formData.course && formData.course.trim().length > 100) {
      errors.push("Course name is too long (maximum 100 characters)");
    }

    // University validation
    if (!formData.university || formData.university.trim().length < 2) {
      errors.push("Please select or enter your university");
    }

    return errors;
  }

  /**
   * Enhanced email validation
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Clear all error messages
   */
  clearErrors() {
    document
      .querySelectorAll(".error-message, .success-message")
      .forEach((el) => el.remove());
  }

  /**
   * Get error statistics (useful for admin dashboard)
   */
  getErrorStats() {
    return {
      totalErrors: this.errorCounts.total,
      errorsByType: this.errorCounts.byType,
      mostCommonError: Object.keys(this.errorCounts.byType).reduce(
        (a, b) =>
          this.errorCounts.byType[a] > this.errorCounts.byType[b] ? a : b,
        "none"
      ),
    };
  }

  /**
   * Reset error counts (useful for testing)
   */
  resetErrorCounts() {
    this.errorCounts = {
      total: 0,
      byType: {},
    };
  }

  /**
   * Handle network connectivity issues
   */
  handleNetworkFailure() {
    this.showUserError(
      "Network connection lost. Please check your internet connection and try again.",
      "Connection Lost"
    );

    // You could add offline mode detection here
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      console.log("🔴 App is offline - enabling offline features");
    }
  }

  /**
   * Handle data validation errors from API responses
   */
  handleDataValidation(errors, context = "Form") {
    if (Array.isArray(errors)) {
      errors.forEach((error) => this.showUserError(error, context));
    } else if (typeof errors === "string") {
      this.showUserError(errors, context);
    } else if (typeof errors === "object") {
      Object.values(errors).forEach((error) => {
        if (Array.isArray(error)) {
          error.forEach((e) => this.showUserError(e, context));
        } else {
          this.showUserError(error, context);
        }
      });
    }
  }
}

// Global instance - REPLACES your existing errorHandler
const errorHandler = new ErrorHandler();

// Add CSS animations for error messages
const errorHandlerStyles = document.createElement("style");
errorHandlerStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .error-content, .success-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
    }
    
    .error-text-content, .success-text-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .error-content strong, .success-content strong {
        font-size: 14px;
        font-weight: 600;
    }
    
    .error-text, .success-text {
        font-size: 13px;
        line-height: 1.4;
    }
    
    .error-close, .success-close {
        background: none;
        border: none;
        font-size: 14px;
        cursor: pointer;
        opacity: 0.7;
        padding: 4px;
        border-radius: 4px;
        transition: opacity 0.2s ease;
    }
    
    .error-close:hover, .success-close:hover {
        opacity: 1;
        background: rgba(0,0,0,0.1);
    }
    
    .error-icon, .success-icon {
        font-size: 16px;
        margin-top: 2px;
    }
`;
document.head.appendChild(errorHandlerStyles);
