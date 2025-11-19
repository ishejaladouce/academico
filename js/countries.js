// Simple Countries Service - Guaranteed to work
const countriesService = {
  countries: [],

  async loadCountries() {
    try {
      console.log("Loading countries...");

      // Try to load from API first
      const response = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,cca2"
      );

      if (response.ok) {
        const data = await response.json();
        this.countries = data
          .map((country) => ({
            name: country.name.common,
            code: country.cca2,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        console.log(`Loaded ${this.countries.length} countries from API`);
      } else {
        throw new Error("API failed");
      }
    } catch (error) {
      console.log("Using fallback countries data");
      // Fallback data
      this.countries = [
        { name: "Rwanda", code: "RW" },
        { name: "Kenya", code: "KE" },
        { name: "Uganda", code: "UG" },
        { name: "Tanzania", code: "TZ" },
        { name: "United States", code: "US" },
        { name: "United Kingdom", code: "GB" },
        { name: "Canada", code: "CA" },
        { name: "South Africa", code: "ZA" },
        { name: "Nigeria", code: "NG" },
        { name: "India", code: "IN" },
        { name: "Australia", code: "AU" },
        { name: "Germany", code: "DE" },
        { name: "France", code: "FR" },
        { name: "Brazil", code: "BR" },
        { name: "China", code: "CN" },
        { name: "Japan", code: "JP" },
      ].sort((a, b) => a.name.localeCompare(b.name));
    }

    return this.countries;
  },

  populateCountryDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) {
      console.log("Country select element not found");
      return;
    }

    // Clear loading message
    select.innerHTML = '<option value="">Select your country</option>';

    // Add countries
    this.countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.code;
      option.textContent = country.name;
      select.appendChild(option);
    });

    console.log(`Added ${this.countries.length} countries to dropdown`);
  },

  getCountryName(countryCode) {
    const country = this.countries.find((c) => c.code === countryCode);
    return country ? country.name : "Unknown Country";
  },
};
