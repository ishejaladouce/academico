// Universities Service - Dynamic University Data with "Other" option
const universityApiConfig = window.__ACADEMICO_CONFIG?.apis || {};

const universitiesService = {
  datasetCache: null,
  datasetSource: null,

  async loadUniversities(countryCode) {
    try {
      console.log(`Loading universities for country: ${countryCode}`);

      const countryName = countriesService.getCountryName(countryCode);
      if (!countryName) {
        throw new Error("Country not found");
      }

      const baseUrl =
        universityApiConfig.universities ||
        "https://universities.hipolabs.com/search";

      let universitiesData = [];

      if (baseUrl.includes("githubusercontent.com")) {
        if (!this.datasetCache || this.datasetSource !== baseUrl) {
          const response = await fetch(baseUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          this.datasetCache = await response.json();
          this.datasetSource = baseUrl;
        }

        universitiesData = this.datasetCache.filter(
          (uni) =>
            uni.country &&
            uni.country.toLowerCase() === countryName.toLowerCase()
        );
      } else {
        const response = await fetch(
          `${baseUrl}?country=${encodeURIComponent(countryName)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        universitiesData = await response.json();
      }

      const formattedUniversities = universitiesData.map((uni) => ({
        name: uni.name,
        website: Array.isArray(uni.web_pages) ? uni.web_pages[0] : uni.website,
        country: uni.country || countryName,
      }));

      // Remove duplicates and sort
      const uniqueUniversities = this.removeDuplicates(formattedUniversities);

      console.log(
        `Loaded ${uniqueUniversities.length} universities for ${countryName}`
      );

      return {
        universities: uniqueUniversities,
        country: countryCode,
        count: uniqueUniversities.length,
      };
    } catch (error) {
      console.log("Failed to load universities from API, using fallback data");

      // Fallback universities by country
      const fallbackUniversities = this.getFallbackUniversities(countryCode);

      return {
        universities: fallbackUniversities,
        country: countryCode,
        count: fallbackUniversities.length,
        fallback: true,
      };
    }
  },

  removeDuplicates(universities) {
    const seen = new Set();
    return universities
      .filter((uni) => {
        const key = uni.name.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  getFallbackUniversities(countryCode) {
    const fallbackData = {
      RW: [
        { name: "University of Rwanda" },
        { name: "Kigali Independent University" },
        { name: "Catholic University of Rwanda" },
        { name: "University of Kigali" },
      ],
      KE: [
        { name: "University of Nairobi" },
        { name: "Kenyatta University" },
        { name: "Strathmore University" },
        { name: "Moi University" },
      ],
      UG: [
        { name: "Makerere University" },
        { name: "Kyambogo University" },
        { name: "Uganda Christian University" },
      ],
      TZ: [
        { name: "University of Dar es Salaam" },
        { name: "Mzumbe University" },
        { name: "Ardhi University" },
      ],
      US: [
        { name: "Harvard University" },
        { name: "Stanford University" },
        { name: "MIT" },
        { name: "University of California, Berkeley" },
      ],
      GB: [
        { name: "University of Oxford" },
        { name: "University of Cambridge" },
        { name: "Imperial College London" },
      ],
      ZA: [
        { name: "University of Cape Town" },
        { name: "University of Witwatersrand" },
        { name: "Stellenbosch University" },
      ],
      NG: [
        { name: "University of Lagos" },
        { name: "University of Ibadan" },
        { name: "Covenant University" },
      ],
      IN: [
        { name: "University of Delhi" },
        { name: "University of Mumbai" },
        { name: "Indian Institute of Technology" },
      ],
      AU: [
        { name: "University of Sydney" },
        { name: "University of Melbourne" },
        { name: "Australian National University" },
      ],
    };

    return (
      fallbackData[countryCode] || [
        { name: "National University" },
        { name: "Local University" },
      ]
    );
  },

  populateUniversityDropdown(
    selectId,
    universities,
    {
      placeholder = "Select your university",
      includeAllOption = false,
      includeOtherOption = true,
    } = {}
  ) {
    const select = document.getElementById(selectId);
    if (!select) {
      console.log(`Select element with id '${selectId}' not found`);
      return;
    }

    // Clear existing options
    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = placeholder;
    select.appendChild(defaultOption);

    // Add universities to dropdown
    universities.forEach((uni) => {
      const option = document.createElement("option");
      option.value = uni.name;
      option.textContent = uni.name;
      select.appendChild(option);
    });

    if (includeAllOption) {
      defaultOption.textContent = placeholder || "All Universities";
    }

    if (includeOtherOption) {
      const otherOption = document.createElement("option");
      otherOption.value = "other";
      otherOption.textContent = "Other (My university is not listed)";
      select.appendChild(otherOption);
    }

    console.log(
      `Populated ${universities.length} universities + "Other" option in ${selectId}`
    );
  },

  handleUniversityChange(selectId) {
    const select = document.getElementById(selectId);
    const customContainer = document.getElementById(
      "customUniversityContainer"
    );

    if (!select || !customContainer) return;

    if (select.value === "other") {
      customContainer.classList.remove("hidden");
      // Make custom university input required
      const customInput = document.getElementById("customUniversity");
      if (customInput) customInput.required = true;
    } else {
      customContainer.classList.add("hidden");
      // Remove required attribute when not using custom input
      const customInput = document.getElementById("customUniversity");
      if (customInput) customInput.required = false;
    }
  },

  getUniversityValue(selectId, customInputId) {
    const select = document.getElementById(selectId);
    const customInput = document.getElementById(customInputId);

    if (!select) return "";

    if (select.value === "other" && customInput) {
      return customInput.value.trim();
    }

    return select.value;
  },
};
