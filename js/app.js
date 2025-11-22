// Complete AcademicO Main Application
class AcademicOApp {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.animateStatistics();
    this.updateDynamicContent();
    this.setupEnhancedSearch();
    this.checkExistingSession();
    this.loadCountriesOnStart();
    this.setupDemoData();
    this.initializeEnhancedAPIs();

    console.log("AcademicO Started with Full Functionality!");
  }

  checkExistingSession() {
    if (authManager.isLoggedIn()) {
      window.location.href = "dashboard.html";
    }
  }

  setupEventListeners() {
    // Modal Management
    this.safeAddEventListener("loginBtn", "click", () =>
      this.openModal("loginModal")
    );
    this.safeAddEventListener("loginBtnMain", "click", () =>
      this.openModal("loginModal")
    );
    this.safeAddEventListener("registerBtnMain", "click", () =>
      this.openModal("registerModal")
    );
    this.safeAddEventListener("showRegisterModal", "click", (e) => {
      e.preventDefault();
      this.closeModals();
      this.openModal("registerModal");
    });
    this.safeAddEventListener("showForgotPasswordModal", "click", (e) => {
      e.preventDefault();
      this.closeModals();
      this.openModal("forgotPasswordModal");
    });
    this.safeAddEventListener("backToLoginFromForgot", "click", (e) => {
      e.preventDefault();
      this.closeModals();
      this.openModal("loginModal");
    });
    this.safeAddEventListener("showLoginModal", "click", (e) => {
      e.preventDefault();
      this.closeModals();
      this.openModal("loginModal");
    });

    // Modal Close
    this.safeAddEventListener("closeLogin", "click", () => this.closeModals());
    this.safeAddEventListener("closeRegister", "click", () =>
      this.closeModals()
    );
    this.safeAddEventListener("closeForgotPassword", "click", () =>
      this.closeModals()
    );
    this.safeAddEventListener("loginOverlay", "click", () =>
      this.closeModals()
    );
    this.safeAddEventListener("registerOverlay", "click", () =>
      this.closeModals()
    );
    this.safeAddEventListener("forgotPasswordOverlay", "click", () =>
      this.closeModals()
    );

    // Forms
    this.safeAddEventListener("loginForm", "submit", (e) =>
      this.handleLogin(e)
    );
    this.safeAddEventListener("registerForm", "submit", (e) =>
      this.handleRegister(e)
    );
    this.safeAddEventListener("forgotPasswordForm", "submit", (e) =>
      this.handleForgotPassword(e)
    );
    this.safeAddEventListener("closePasswordResetSuccess", "click", () =>
      this.closeModals()
    );
    this.safeAddEventListener("passwordResetSuccessOverlay", "click", () =>
      this.closeModals()
    );
    this.safeAddEventListener("goToLoginAfterReset", "click", () => {
      this.closeModals();
      this.openModal("loginModal");
    });
    this.safeAddEventListener("copyTempPassword", "click", () => {
      const tempPasswordInput = document.getElementById("tempPasswordDisplay");
      if (tempPasswordInput) {
        // Don't trim - copy exactly as displayed
        const password = tempPasswordInput.value;
        console.log(`Copying password: "${password}" (length: ${password.length})`);
        
        try {
          // Use modern Clipboard API if available
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(password).then(() => {
              errorHandler.showSuccess("Password copied to clipboard!");
            }).catch(() => {
              // Fallback to execCommand
              tempPasswordInput.select();
              document.execCommand("copy");
              errorHandler.showSuccess("Password copied to clipboard!");
            });
          } else {
            // Fallback for older browsers
            tempPasswordInput.select();
            tempPasswordInput.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand("copy");
            errorHandler.showSuccess("Password copied to clipboard!");
          }
        } catch (err) {
          console.error("Failed to copy password:", err);
          errorHandler.showUserError("Failed to copy. Please select and copy manually.");
        }
      }
    });

    // Test password hash button
    this.safeAddEventListener("testPasswordHash", "click", async () => {
      const tempPasswordInput = document.getElementById("tempPasswordDisplay");
      const resultDiv = document.getElementById("passwordTestResult");
      
      if (!tempPasswordInput || !resultDiv) return;
      
      const password = tempPasswordInput.value;
      if (!password) {
        resultDiv.style.display = "block";
        resultDiv.style.background = "#fee";
        resultDiv.style.color = "#c00";
        resultDiv.innerHTML = "No password to test";
        return;
      }
      
      resultDiv.style.display = "block";
      resultDiv.style.background = "#e3f2fd";
      resultDiv.style.color = "#2c3e50";
      resultDiv.innerHTML = "Testing password hash...";
      
      try {
        const hashedPassword = await authManager.hashPassword(password);
        const email = document.getElementById("forgotPasswordEmail")?.value || 
                     localStorage.getItem("last_reset_email") || "unknown";
        
        // Try to get the stored hash from Firestore
        if (authManager.db) {
          const snapshot = await authManager.db
            .collection("users")
            .where("email", "==", email)
            .limit(1)
            .get();
          
          if (!snapshot.empty) {
            const user = snapshot.docs[0].data();
            const storedHash = user.passwordHash;
            
            const matches = storedHash === hashedPassword;
            
            resultDiv.style.background = matches ? "#d4edda" : "#f8d7da";
            resultDiv.style.color = matches ? "#155724" : "#721c24";
            resultDiv.innerHTML = `
              <strong>Hash Test Result:</strong><br>
              Password: "${password}" (length: ${password.length})<br>
              Generated Hash: ${hashedPassword.substring(0, 40)}...<br>
              Stored Hash: ${storedHash ? storedHash.substring(0, 40) + '...' : 'NOT FOUND'}<br>
              <strong style="color: ${matches ? '#155724' : '#721c24'}">
                ${matches ? '✓ HASHES MATCH!' : '✗ HASHES DO NOT MATCH'}
              </strong>
            `;
            
            console.log("Password hash test:");
            console.log(`  Password: "${password}"`);
            console.log(`  Generated hash: ${hashedPassword}`);
            console.log(`  Stored hash: ${storedHash}`);
            console.log(`  Match: ${matches}`);
          } else {
            resultDiv.style.background = "#fff3cd";
            resultDiv.style.color = "#856404";
            resultDiv.innerHTML = "Could not find user in database";
          }
        } else {
          resultDiv.style.background = "#fff3cd";
          resultDiv.style.color = "#856404";
          resultDiv.innerHTML = "Database not initialized";
        }
      } catch (error) {
        resultDiv.style.background = "#fee";
        resultDiv.style.color = "#c00";
        resultDiv.innerHTML = `Error: ${error.message}`;
        console.error("Password hash test error:", error);
      }
    });
    this.safeAddEventListener("studySearchForm", "submit", (e) =>
      this.handleSearch(e)
    );

    // Country & University
    this.safeAddEventListener("regCountry", "change", (e) =>
      this.handleCountryChange(e.target.value)
    );
    this.safeAddEventListener("regUniversity", "change", (e) => {
      universitiesService.handleUniversityChange("regUniversity");
    });

    // Search Filters
    this.safeAddEventListener("countryFilter", "change", (e) => {
      this.handleSearchCountryChange(e.target.value);
    });
    this.safeAddEventListener("universityFilter", "change", (e) => {
      this.handleSearchUniversityChange(e.target.value);
    });

    // Study Break (Keep for demo on index page)
    this.safeAddEventListener("studyBreakBtn", "click", () =>
      this.getStudyBreakActivity()
    );

    // Enhanced Search Controls
    this.safeAddEventListener("sortBy", "change", (e) => {
      this.sortResults(e.target.value);
    });
    this.safeAddEventListener("filterToggle", "click", () => {
      this.toggleFilterPanel();
    });
    this.safeAddEventListener("applyFilters", "click", () => {
      this.applyFilters();
    });

    // ESC Key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeModals();
    });
  }

  // ==================== AUTHENTICATION ====================

  // Registration form
  async handleRegister(e) {
    e.preventDefault();
    this.showLoading("Creating your account...");

    const countrySelect = document.getElementById("regCountry");
    const universityValue = universitiesService.getUniversityValue(
      "regUniversity",
      "customUniversity"
    );

    if (!countrySelect.value) {
      errorHandler.showUserError("Please select your country");
      this.hideLoading();
      return;
    }

    if (!universityValue) {
      errorHandler.showUserError("Please select or enter your university");
      this.hideLoading();
      return;
    }

    // GET THE PASSWORD VALUES
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;

    if (password !== confirmPassword) {
      errorHandler.showUserError("Passwords do not match!");
      this.hideLoading();
      return;
    }

    const userData = {
      name: document.getElementById("regFullName").value,
      email: document.getElementById("regEmail").value,
      password: password, // ADD THIS LINE - PASS THE PASSWORD
      country: countrySelect.options[countrySelect.selectedIndex].text,
      countryCode: countrySelect.value,
      university: universityValue,
      course: document.getElementById("regCourse").value,
      availability: document.getElementById("regAvailability").value,
      studyType: document.getElementById("regStudyType").value,
      topic: document.getElementById("regCourse").value + " General",
    };

    try {
      const userId = await authManager.registerUser(userData);
      errorHandler.showSuccess(
        "Welcome to AcademicO! Your account has been created successfully. Please login to continue."
      );
      this.closeModals();

      // Clear the registration form
      document.getElementById("registerForm").reset();
    } catch (error) {
      errorHandler.handleApiError(error, "registration");
    } finally {
      this.hideLoading();
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    this.showLoading("Signing you in...");

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
      errorHandler.showUserError("Please fill in all fields");
      this.hideLoading();
      return;
    }

    try {
      const user = await authManager.loginUser(email, password);
      errorHandler.showSuccess(`Welcome back, ${user.name}!`);
      this.closeModals();

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (error) {
      errorHandler.showUserError(
        "Invalid email or password. Please try again."
      );
    } finally {
      this.hideLoading();
    }
  }

  async handleForgotPassword(e) {
    e.preventDefault();
    this.showLoading("Processing your request...");

    const email = document.getElementById("forgotPasswordEmail").value;

    if (!email) {
      errorHandler.showUserError("Please enter your email address");
      this.hideLoading();
      return;
    }

    try {
      const result = await authManager.resetPassword(email);
      
      // Close forgot password modal
      this.closeModals();
      
      // Show the password reset success modal with the temporary password
      const tempPasswordDisplay = document.getElementById("tempPasswordDisplay");
      if (tempPasswordDisplay && result.tempPassword) {
        // Set the password value exactly as generated (no modifications)
        tempPasswordDisplay.value = result.tempPassword;
        console.log(`Displaying temp password in modal: "${result.tempPassword}"`);
        console.log(`Password length: ${result.tempPassword.length}`);
        
        // Store email for hash testing
        localStorage.setItem("last_reset_email", email);
      }
      
      // Clear any previous test results
      const testResult = document.getElementById("passwordTestResult");
      if (testResult) {
        testResult.style.display = "none";
      }
      
      // Show success modal after a delay to ensure password is saved in Firestore
      setTimeout(() => {
        this.openModal("passwordResetSuccessModal");
      }, 1000);
      
      // Clear the form
      document.getElementById("forgotPasswordForm").reset();
    } catch (error) {
      errorHandler.showUserError(
        error.message || "Unable to process password reset. Please try again."
      );
    } finally {
      this.hideLoading();
    }
  }

  // ==================== SEARCH FUNCTIONALITY ====================

  async handleSearch(e) {
    e.preventDefault();

    const filters = {
      course: document.getElementById("courseInput").value,
      availability: document.getElementById("availabilitySelect").value,
      studyType: document.getElementById("studyTypeSelect").value,
      topic: document.getElementById("topicInput").value,
      country: document.getElementById("countryFilter").value,
      university: this.getSearchUniversityValue(),
    };

    if (!filters.course) {
      errorHandler.showUserError("Please enter a course to search for");
      return;
    }

    this.showLoading("Searching for study partners worldwide...");

    try {
      const timezoneData = await apiService.getUserTimezone();
      const results = await this.searchWithDynamicFeatures(
        filters,
        timezoneData
      );
      this.showDynamicResults(results, filters);
    } catch (error) {
      errorHandler.handleApiError(error, "search");
    } finally {
      this.hideLoading();
    }
  }

  async searchWithDynamicFeatures(filters, timezoneData) {
    const users = await authManager.searchUsers(filters);

    return users.map((user) => ({
      ...user,
      localTime: this.calculateLocalTime(timezoneData.timezone),
      matchScore: this.calculateMatchScore(user, filters),
      isOnline: Math.random() > 0.3,
      lastActive: this.getRandomTime(),
      responseTime: this.getRandomResponseTime(),
    }));
  }

  calculateMatchScore(partner, filters) {
    let score = 50;

    if (
      filters.course &&
      partner.course &&
      partner.course.toLowerCase().includes(filters.course.toLowerCase())
    ) {
      score += 20;
    }
    if (
      filters.topic &&
      partner.topic &&
      partner.topic.toLowerCase().includes(filters.topic.toLowerCase())
    ) {
      score += 15;
    }
    if (filters.availability && partner.availability === filters.availability) {
      score += 10;
    }
    if (filters.studyType && partner.studyType === filters.studyType) {
      score += 5;
    }
    if (filters.country && partner.countryCode === filters.country) {
      score += 10;
    }
    if (filters.university && partner.university === filters.university) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  showDynamicResults(partners, filters) {
    const container = document.getElementById("resultsContainer");
    const countElement = document.getElementById("resultsCount");
    const section = document.getElementById("resultsSection");

    if (!container || !countElement || !section) return;

    countElement.textContent = `Found ${partners.length} partners for "${filters.course}"`;
    partners.sort((a, b) => b.matchScore - a.matchScore);

    if (partners.length === 0) {
      container.innerHTML = `
                <div class="no-results">
                    <h3>No study partners found</h3>
                    <p>Try adjusting your search criteria or check back later.</p>
                </div>
            `;
    } else {
      container.innerHTML = partners
        .map((partner) => {
          const tzCompatibility = this.calculateTimezoneCompatibility(partner);
          const badgeClass = `tz-badge ${tzCompatibility.level}`;

          return `
                    <div class="partner-card">
                        <div class="partner-header">
                            <div class="partner-avatar ${
                              partner.isOnline ? "online" : "offline"
                            }">
                                ${
                                  partner.name
                                    ? partner.name.charAt(0).toUpperCase()
                                    : "U"
                                }
                            </div>
                            <div class="partner-info">
                                <h3>${partner.name || "Unknown User"}</h3>
                                <span class="partner-university">${
                                  partner.university || "Student"
                                }</span>
                                <span class="partner-course">${
                                  partner.course || "General"
                                } • ${partner.matchScore}% match</span>
                            </div>
                        </div>
                        
                        <div class="${badgeClass}">
                            ${tzCompatibility.label} • ${
            tzCompatibility.score
          }% time match
                        </div>
                        
                        <div class="partner-details">
                            <div class="detail-item"><strong>Topic:</strong> ${
                              partner.topic || "General"
                            }</div>
                            <div class="detail-item"><strong>Available:</strong> ${this.formatAvailability(
                              partner.availability
                            )}</div>
                            <div class="detail-item"><strong>Local Time:</strong> ${
                              partner.localTime
                            }</div>
                            <div class="detail-item"><strong>Study Style:</strong> ${this.formatStudyType(
                              partner.studyType
                            )}</div>
                            <div class="detail-item"><strong>${
                              partner.responseTime
                            }</strong></div>
                            <div class="last-active">Last active: ${
                              partner.lastActive
                            }</div>
                        </div>
                        <div class="partner-actions">
                            <button class="action-btn chat-btn" onclick="app.startChat('${
                              partner.id
                            }', '${partner.name}')">
                                Message
                            </button>
                            <button class="action-btn connect-btn" onclick="app.connectPartner('${
                              partner.id
                            }')">
                                Connect
                            </button>
                        </div>
                    </div>
                `;
        })
        .join("");
    }

    section.classList.remove("hidden");
  }

  // ==================== ENHANCED FEATURES ====================

  calculateTimezoneCompatibility(partner) {
    const userOffset = -new Date().getTimezoneOffset() / 60;
    const offsets = [0, 1, 2, 3, -5, -8, 5, 7, -3, -1];
    const partnerOffset = offsets[Math.floor(Math.random() * offsets.length)];
    const diff = Math.abs(userOffset - partnerOffset);

    if (diff <= 2) {
      return { score: 95, level: "excellent", label: "Same Region" };
    } else if (diff <= 4) {
      return { score: 80, level: "good", label: "Nearby" };
    } else if (diff <= 6) {
      return { score: 65, level: "fair", label: "Moderate" };
    } else {
      return { score: 50, level: "challenging", label: "Distant" };
    }
  }

  calculateLocalTime(timezone) {
    try {
      return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return new Date().toLocaleTimeString();
    }
  }

  getRandomTime() {
    const minutes = Math.floor(Math.random() * 120);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }

  getRandomResponseTime() {
    const times = [
      "Usually responds in 5m",
      "Typically replies in 1h",
      "Responds within 30m",
    ];
    return times[Math.floor(Math.random() * times.length)];
  }

  formatAvailability(availability) {
    const formats = {
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      weekend: "Weekend",
    };
    return formats[availability] || "Flexible";
  }

  formatStudyType(studyType) {
    const formats = {
      group: "Group Study",
      pair: "One-on-One",
      project: "Project Collaboration",
    };
    return formats[studyType] || "Any Style";
  }

  // ==================== STUDY BREAK FEATURE ====================

  async getStudyBreakActivity() {
    this.showLoading("Finding a study break activity...");

    try {
      // Use academic quotes instead of advice slip
      const academicQuotes = [
        "The beautiful thing about learning is that no one can take it away from you. - B.B. King",
        "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
        "The mind is not a vessel to be filled, but a fire to be kindled. - Plutarch",
        "Live as if you were to die tomorrow. Learn as if you were to live forever. - Mahatma Gandhi",
        "An investment in knowledge pays the best interest. - Benjamin Franklin",
        "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice. - Brian Herbert",
        "Education is not preparation for life; education is life itself. - John Dewey",
        "Learning never exhausts the mind. - Leonardo da Vinci",
        "The more that you read, the more things you will know. The more that you learn, the more places you'll go. - Dr. Seuss",
        "Success is the sum of small efforts repeated day in and day out. - Robert Collier",
      ];
      
      const randomQuote = academicQuotes[Math.floor(Math.random() * academicQuotes.length)];
      alert(`Study Break Wisdom:\n\n"${randomQuote}"\n\nTake a moment to reflect!`);
    } catch (error) {
      this.showFallbackStudyBreak();
    } finally {
      this.hideLoading();
    }
  }

  showFallbackStudyBreak() {
    const fallbackActivities = [
      "Take a 5-minute walk and stretch",
      "Do 10 deep breathing exercises",
      "Get a glass of water and hydrate",
      "Look away from screen for 2 minutes",
    ];
    const activity =
      fallbackActivities[Math.floor(Math.random() * fallbackActivities.length)];
    alert(
      `Study Break Suggestion:\n\n${activity}\n\nYour eyes and brain will thank you!`
    );
  }

  // ==================== CHAT FUNCTIONALITY ====================

  startChat(userId, userName) {
    if (authManager.isLoggedIn()) {
      // If logged in, redirect to dashboard messages
      window.location.href = "dashboard.html#messages";
    } else {
      // If not logged in, show login modal
      errorHandler.showUserError(
        "Please login to start chatting with study partners"
      );
      this.openModal("loginModal");
    }
  }

  connectPartner(userId) {
    if (authManager.isLoggedIn()) {
      errorHandler.showSuccess(
        "Connection request sent! The user will be notified."
      );
    } else {
      errorHandler.showUserError("Please login to connect with study partners");
      this.openModal("loginModal");
    }
  }

  // ==================== ENHANCED SEARCH CONTROLS ====================

  setupEnhancedSearch() {
    // Sorting and filtering controls
    console.log("Enhanced search controls initialized");
  }

  sortResults(sortBy) {
    const container = document.getElementById("resultsContainer");
    const partnerCards = Array.from(
      container.querySelectorAll(".partner-card")
    );

    partnerCards.sort((a, b) => {
      const aData = this.getPartnerData(a);
      const bData = this.getPartnerData(b);

      switch (sortBy) {
        case "online":
          return (bData.isOnline ? 1 : 0) - (aData.isOnline ? 1 : 0);
        case "responseTime":
          return (
            this.getResponseTimeValue(aData.responseTime) -
            this.getResponseTimeValue(bData.responseTime)
          );
        case "recent":
          return (
            this.getLastActiveValue(bData.lastActive) -
            this.getLastActiveValue(aData.lastActive)
          );
        case "matchScore":
        default:
          return bData.matchScore - aData.matchScore;
      }
    });

    partnerCards.forEach((card) => container.appendChild(card));
  }

  getPartnerData(cardElement) {
    const matchScoreText =
      cardElement.querySelector(".partner-course").textContent;
    const matchScore = parseInt(matchScoreText.match(/(\d+)%/)?.[1] || 50);

    const isOnline = cardElement
      .querySelector(".partner-avatar")
      .classList.contains("online");
    const responseTime = cardElement.querySelector(
      ".detail-item:nth-child(5) strong"
    ).textContent;
    const lastActive = cardElement.querySelector(".last-active").textContent;

    return { matchScore, isOnline, responseTime, lastActive };
  }

  getResponseTimeValue(responseTime) {
    if (responseTime.includes("5m")) return 1;
    if (responseTime.includes("30m")) return 2;
    return 3;
  }

  getLastActiveValue(lastActive) {
    if (lastActive.includes("Just now")) return 0;
    if (lastActive.includes("m")) return parseInt(lastActive);
    if (lastActive.includes("h")) return parseInt(lastActive) * 60;
    return 1000;
  }

  toggleFilterPanel() {
    const panel = document.getElementById("filterPanel");
    panel.classList.toggle("hidden");
  }

  applyFilters() {
    this.toggleFilterPanel();
    errorHandler.showSuccess("Filters applied!");
  }

  // ==================== COUNTRY & UNIVERSITY ====================

  async loadCountriesOnStart() {
    try {
      await countriesService.populateCountryDropdown("countryFilter", {
        placeholder: "All Countries",
        includeAllOption: true,
      });
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  }

  async handleCountryChange(countryCode) {
    if (!countryCode) return;

    this.showInlineLoading("regUniversity", "Loading universities...");

    try {
      const universitiesData = await universitiesService.loadUniversities(
        countryCode
      );
      universitiesService.populateUniversityDropdown(
        "regUniversity",
        universitiesData.universities,
        {
          placeholder: "Select your university",
          includeOtherOption: true,
        }
      );
    } catch (error) {
      console.error("Error loading universities:", error);
      errorHandler.showUserError(
        "Failed to load universities. Please try again."
      );
    }
  }

  async handleSearchCountryChange(countryCode) {
    if (!countryCode) {
      const universityFilter = document.getElementById("universityFilter");
      const searchCustomContainer = document.getElementById(
        "searchCustomUniversityContainer"
      );
      if (universityFilter) {
        universityFilter.innerHTML =
          '<option value="">All Universities</option>';
      }
      if (searchCustomContainer) {
        searchCustomContainer.classList.add("hidden");
      }
      return;
    }

    try {
      const universitiesData = await universitiesService.loadUniversities(
        countryCode
      );
      this.populateSearchUniversityFilter(universitiesData.universities);
    } catch (error) {
      console.error("Error loading universities for search:", error);
    }
  }

  populateSearchUniversityFilter(universities) {
    const universityFilter = document.getElementById("universityFilter");
    if (!universityFilter) return;

    universitiesService.populateUniversityDropdown(
      "universityFilter",
      universities,
      {
        placeholder: "All Universities",
        includeAllOption: true,
        includeOtherOption: true,
      }
    );
  }

  handleSearchUniversityChange(selectedValue) {
    const searchCustomContainer = document.getElementById(
      "searchCustomUniversityContainer"
    );
    const searchCustomInput = document.getElementById("searchCustomUniversity");

    if (!searchCustomContainer || !searchCustomInput) return;

    if (selectedValue === "other") {
      searchCustomContainer.classList.remove("hidden");
      searchCustomInput.required = true;
    } else {
      searchCustomContainer.classList.add("hidden");
      searchCustomInput.required = false;
      searchCustomInput.value = "";
    }
  }

  getSearchUniversityValue() {
    const universityFilter = document.getElementById("universityFilter");
    const searchCustomInput = document.getElementById("searchCustomUniversity");

    if (!universityFilter) return "";

    if (universityFilter.value === "other" && searchCustomInput) {
      return searchCustomInput.value.trim();
    }

    return universityFilter.value;
  }

  // ==================== DYNAMIC CONTENT ====================

  async animateStatistics() {
    try {
      const stats = await this.getLiveStatistics();
      
      console.log("Fetched statistics:", stats);

      // Map the stats keys to the actual element IDs
      const statMapping = {
        students: "studentsCount",
        studyGroups: "studyGroupsCount",
        courses: "coursesCount"
      };

      Object.keys(statMapping).forEach((statKey, index) => {
        const elementId = statMapping[statKey];
        const element = document.getElementById(elementId);
        if (element) {
          const value = stats[statKey] || 0;
          console.log(`Animating ${elementId} from 0 to ${value}`);
          this.animateCount(element, 0, value, 2000 + index * 500);
        } else {
          console.warn(`Element with ID ${elementId} not found`);
        }
      });
    } catch (error) {
      console.error("Error animating statistics:", error);
      // Set default values if there's an error
      const defaultElements = {
        studentsCount: 0,
        studyGroupsCount: 0,
        coursesCount: 0
      };
      Object.keys(defaultElements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = defaultElements[id];
        }
      });
    }
  }

  async getLiveStatistics() {
    try {
      console.log("Fetching live statistics from Firebase...");
      
      // Ensure Firebase is initialized
      if (!authManager.db) {
        console.log("Initializing Firebase...");
        await authManager.init();
      }
      
      if (!authManager.db) {
        console.error("Firebase database not available after initialization");
        throw new Error("Database not available");
      }
      
      console.log("Fetching data from Firestore...");
      
      // Fetch all users (not filtered by deleted) to match admin dashboard
      const [usersSnapshot, groupsSnapshot] = await Promise.all([
        authManager.db.collection("users").get(),
        authManager.db.collection("studyGroups").get()
      ]);
      
      console.log(`Fetched ${usersSnapshot.size} users, ${groupsSnapshot.size} groups`);
      
      // Count active users (not deleted) - this is "Students Connected"
      const activeUsers = usersSnapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.deleted;
      }).length;
      
      const groupCount = groupsSnapshot.size;
      
      // Count unique courses from all users (including deleted for course count)
      const courses = new Set();
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.course && userData.course.trim()) {
          courses.add(userData.course.trim().toLowerCase());
        }
      });

      const stats = {
        students: activeUsers || 0,
        studyGroups: groupCount || 0,
        courses: courses.size || 0,
      };

      console.log(`Statistics loaded: ${stats.students} active users, ${stats.studyGroups} groups, ${stats.courses} unique courses`);
      
      return stats;
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }

    // Return zeros if we can't fetch from Firebase
    return {
      students: 0,
      studyGroups: 0,
      courses: 0,
    };
  }

  animateCount(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      element.textContent = value.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  updateDynamicContent() {
    const greeting = this.getDynamicGreeting();
    const subtitleElement = document.querySelector(".welcome-subtitle");
    if (subtitleElement) {
      subtitleElement.textContent = greeting;
    }

    this.displayStudyTip();
  }

  getDynamicGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! Ready to study?";
    if (hour < 18) return "Good afternoon! Let's learn!";
    return "Good evening! Time to focus!";
  }

  displayStudyTip() {
    const tips = this.getDynamicStudyTips();
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    let tipElement = document.getElementById("studyTip");
    if (!tipElement) {
      tipElement = document.createElement("div");
      tipElement.id = "studyTip";
      tipElement.className = "study-tip";
      tipElement.style.cssText = `
                background: #e3f2fd;
                border-left: 4px solid #4a90e2;
                padding: 12px 16px;
                margin: 20px 0;
                border-radius: 4px;
                font-size: 14px;
                color: #2c3e50;
            `;

      const welcomeDesc = document.querySelector(".welcome-description");
      if (welcomeDesc && welcomeDesc.parentNode) {
        welcomeDesc.parentNode.insertBefore(
          tipElement,
          welcomeDesc.nextSibling
        );
      }
    }

    tipElement.innerHTML = `<strong>Study Tip:</strong> ${randomTip}`;
  }

  getDynamicStudyTips() {
    const hour = new Date().getHours();
    const currentPeriod = this.getDynamicAvailability();

    const tips = {
      morning: [
        "Mornings are great for learning new concepts!",
        "Start your day with focused reading sessions",
        "Fresh mind = Better retention in the morning",
      ],
      afternoon: [
        "Afternoons are perfect for group discussions!",
        "Ideal time for collaborative problem solving",
        "Great for practicing and applying knowledge",
      ],
      evening: [
        "Evenings are best for review sessions!",
        "Perfect time to recap what you learned",
        "Good for flashcards and memory reinforcement",
      ],
    };

    return tips[currentPeriod] || ["Study smart, not just hard!"];
  }

  getDynamicAvailability() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    return "evening";
  }

  // ==================== UTILITIES ====================

  safeAddEventListener(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(event, handler);
    }
  }

  openModal(modalId) {
    this.closeModals();
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";

      if (modalId === "registerModal") {
        this.setupCountryUniversityEvents();
        this.populateCountryDropdown();
      }
    }
  }

  closeModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.add("hidden");
    });
    document.body.style.overflow = "auto";
  }

  setupCountryUniversityEvents() {
    this.safeAddEventListener("regCountry", "change", (e) => {
      this.handleCountryChange(e.target.value);
    });
    this.safeAddEventListener("regUniversity", "change", (e) => {
      universitiesService.handleUniversityChange("regUniversity");
    });
  }

  populateCountryDropdown() {
    const countrySelect = document.getElementById("regCountry");
    if (!countrySelect) return;

    countriesService
      .populateCountryDropdown("regCountry", {
        placeholder: "Select your country",
      })
      .catch((error) => {
        console.error("Error loading countries:", error);
      });
  }

  showInlineLoading(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!container.dataset.originalContent) {
      container.dataset.originalContent = container.innerHTML;
    }

    container.innerHTML = `
            <div style="text-align: center; padding: 10px; color: #666;">
                <div class="loading-spinner" style="width: 20px; height: 20px; border: 2px solid #e9ecef; border-top: 2px solid #4a90e2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 5px;"></div>
                <p style="font-size: 12px; margin: 0;">${message}</p>
            </div>
        `;
  }

  hideInlineLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !container.dataset.originalContent) return;

    container.innerHTML = container.dataset.originalContent;
    delete container.dataset.originalContent;
  }

  showLoading(message) {
    this.hideLoading();

    const loadingDiv = document.createElement("div");
    loadingDiv.id = "globalLoading";
    loadingDiv.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 10000; color: white; font-size: 18px;">
                <div style="text-align: center;">
                    <div class="loading-spinner" style="width: 50px; height: 50px; border: 4px solid #e9ecef; border-top: 4px solid #4a90e2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <p>${message}</p>
                </div>
            </div>
        `;

    document.body.appendChild(loadingDiv);
  }

  hideLoading() {
    const existingLoader = document.getElementById("globalLoading");
    if (existingLoader) {
      existingLoader.remove();
    }
  }

  setupDemoData() {
    // Initialize demo data for testing
    console.log("Demo data initialized for testing");
  }

  // ==================== ENHANCED API INTEGRATION ====================

  async initializeEnhancedAPIs() {
    console.log("Initializing enhanced APIs...");

    try {
      // Load multiple APIs simultaneously for better performance
      const [timezoneData, weatherData, quoteData] = await Promise.all([
        enhancedAPI.getEnhancedTimezoneData(),
        enhancedAPI.getStudyWeather(),
        enhancedAPI.getStudyQuote(),
      ]);

      this.displayAPIFeatures(timezoneData, weatherData, quoteData);
      this.updateAPIStats();
    } catch (error) {
      console.log("Enhanced APIs initialization failed, using fallbacks");
      this.displayFallbackFeatures();
    }
  }

  displayAPIFeatures(timezoneData, weatherData, quoteData) {
    // Display weather on top of PNG image (not in feature cards)
    this.displayWeatherOnImage(weatherData);

    // Display motivational quote
    this.displayStudyQuote(quoteData);

    // Show API status
    this.showAPIStatus();
  }

  displayWeatherOnImage(weatherData) {
    // Display weather in the weather widget
    const weatherWidget = document.getElementById("weatherWidget");
    if (weatherWidget) {
      const weatherIcon = this.getWeatherIcon(weatherData.conditions);
      
      weatherWidget.innerHTML = `
        <div class="weather-content">
          <div class="weather-header">
            <div class="weather-icon">${weatherIcon}</div>
            <div class="weather-main">
              <div class="weather-city">${weatherData.city || "Your Location"}</div>
              <div class="weather-temp">${weatherData.temperature}°C</div>
              <div class="weather-condition">${weatherData.conditions}</div>
            </div>
          </div>
          <div class="weather-tip">
            <i class="fas fa-lightbulb"></i> ${weatherData.studySuggestion || "Great weather for studying!"}
          </div>
        </div>
      `;
    }
  }

  getWeatherIcon(conditions) {
    if (!conditions) return '<i class="fas fa-sun"></i>';
    const cond = conditions.toLowerCase();
    if (cond.includes('rain') || cond.includes('drizzle')) {
      return '<i class="fas fa-cloud-rain"></i>';
    } else if (cond.includes('cloud')) {
      return '<i class="fas fa-cloud"></i>';
    } else if (cond.includes('sun') || cond.includes('clear')) {
      return '<i class="fas fa-sun"></i>';
    } else if (cond.includes('snow')) {
      return '<i class="fas fa-snowflake"></i>';
    } else if (cond.includes('storm') || cond.includes('thunder')) {
      return '<i class="fas fa-bolt"></i>';
    } else {
      return '<i class="fas fa-cloud-sun"></i>';
    }
  }

  displayStudyQuote(quoteData) {
    // Add quote to study tip section
    const studyTip = document.getElementById("studyTip");
    if (studyTip) {
      studyTip.innerHTML += `
            <div class="motivational-quote">
                <i class="fas fa-quote-left"></i>
                "${quoteData.quote}"
                <div class="quote-author">- ${quoteData.author}</div>
                <small>Via ${quoteData.source}</small>
            </div>
        `;
    }
  }

  showAPIStatus() {
    const apiStats = enhancedAPI.getAPIStats();
    console.log("API Usage Statistics:", apiStats);

    // You can display this in admin panel or console for verification
    if (typeof adminDashboard !== "undefined") {
      // This will be visible in admin dashboard
      window.apiStats = apiStats;
    }
  }

  displayFallbackFeatures() {
    console.log("Displaying fallback features");
    // Fallback content when APIs are unavailable
    const featuresGrid = document.querySelector(".features-grid");
    if (featuresGrid) {
      featuresGrid.innerHTML += `
            <div class="feature-card">
                <div class="feature-icon"><i class="fas fa-wifi"></i></div>
                <h4>Smart Time Matching</h4>
                <p>Find study partners in compatible time zones</p>
                <small>Basic timezone matching active</small>
            </div>
            <div class="feature-card">
                <div class="feature-icon"><i class="fas fa-graduation-cap"></i></div>
                <h4>Study Optimization</h4>
                <p>Get personalized study recommendations</p>
                <small>Local recommendations active</small>
            </div>
        `;
    }
  }

  updateAPIStats() {
    // API stats are tracked internally but not displayed on the index page
    // This keeps the UI clean and focused on user-facing statistics
    const stats = enhancedAPI.getAPIStats();
    console.log("API Usage Statistics:", stats);
    // Stats are available for admin dashboard if needed
    if (typeof window !== "undefined") {
      window.apiStats = stats;
    }
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  window.app = new AcademicOApp();
});

// Add CSS for animations
const style = document.createElement("style");
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
