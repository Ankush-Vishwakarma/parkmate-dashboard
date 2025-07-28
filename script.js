document.addEventListener("DOMContentLoaded", function () {
   
    const dateInput = document.getElementById("date-picker");
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.value = today;
    }

    const dashboardLink = document.getElementById("dashboard-link");
    const activitiesLink = document.getElementById("activities-link");
    const hardwareLink = document.querySelector(
        'aside.sidebar nav a[href="#"][rel="hardware-link"]'
    );
    const passesLink = document.getElementById("passes-link");
    const tagsLink = document.getElementById("tags-link");
    const reportsLink = document.getElementById("reports-link");

    const welcomeMessageContent = document.getElementById(
        "welcome-message-content"
    );
    const dashboardContent = document.getElementById("dashboard-content");
    const activitiesSection = document.getElementById("activities-section");
    const hardwareSection = document.getElementById("hardware-section");
    const passesSection = document.getElementById("manual-passes-section");
    const tagSection = document.getElementById("tag-section");
    const reportsSection = document.getElementById("reports-section");

    const activityDateFilter = document.getElementById("activity-date-filter");
    const activitySearchInput = document.getElementById("activity-search-input");
    const activitySearchButton = document.getElementById(
        "activity-search-button"
    );

    const passesTableBody = document.getElementById("passes-table-body");
    const passesSearchInput = document.getElementById("passes-search-input");
    const hardware__TableBody = document.getElementById("hardware-table-body"); 
    let allUsers = []; 
    let allPassesData = [];
    let editingTagRow = null;
    let editingPassRow = null; 

    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");

    // --- Lightbox Elements (NEW) ---
    const lightbox = document.getElementById("lightbox");
    const closeButton = document.querySelector(".close-button");
    const captionText = document.getElementById("caption");
    const lightboxGridContainer = document.getElementById("lightbox-grid-container");


    let allActivityImages = [];
    let dashboardCategoryImages = {
        entry: [],
        exit: [],
        pass: [],
        inside: [] 
    };

  
    function setActiveLink(clickedLink) {
        navItems.forEach((item) => {
            item.classList.remove("active");
        });
        if (clickedLink) {
            clickedLink.classList.add("active");
        }
    }

    function showSection(sectionElement) {
        [
            welcomeMessageContent,
            dashboardContent,
            activitiesSection,
            hardwareSection,
            passesSection,
            tagSection,
            reportsSection,
        ].forEach((section) => (section.style.display = "none"));

        sectionElement.style.display = "block";
        localStorage.setItem("lastActiveSection", sectionElement.id);

        if (sectionElement === activitiesSection) {
            fetchAndDisplayActivityData();
        } else if (sectionElement === hardwareSection) {
            populateHardwareTable();
        } else if (sectionElement === passesSection) {
            fetchPassesData();
            let addPassBtn = document.getElementById("add-pass-btn");
            if (addPassBtn) {
                addPassBtn.removeEventListener('click', () => window.openPassModal(false));
                addPassBtn.addEventListener('click', () => window.openPassModal(false));
            }
        } else if (sectionElement === reportsSection) {
            loadReportsData();
        } else if (sectionElement === dashboardContent) {
            fetchDashboardSummary();
        } else if (sectionElement === tagSection) {
            populateTagTable();
        
            let addTagBtn = document.getElementById("add-tag-btn");
            if (addTagBtn) {
                addTagBtn.removeEventListener('click', () => window.openTagModal(false)); 
                addTagBtn.addEventListener("click", () => window.openTagModal(false));
            }
        }
    }

    function updateCurrentDate() {
        const today = new Date();
        const options = { month: "short", day: "numeric", year: "numeric" };
        const formattedDate = today.toLocaleDateString("en-IN", options);
        const currentDateElement = document.getElementById("current-date");
        if (currentDateElement) {
            currentDateElement.textContent = formattedDate;
        }
    }
    updateCurrentDate();

    dashboardLink.addEventListener("click", (e) => {
        e.preventDefault();
        setActiveLink(dashboardLink.parentElement);
        showSection(dashboardContent);
    });

    activitiesLink.addEventListener("click", (e) => {
        e.preventDefault();
        setActiveLink(activitiesLink.parentElement);
        showSection(activitiesSection);
    });

    hardwareLink.addEventListener("click", function (e) {
        e.preventDefault();
        setActiveLink(hardwareLink.parentElement);
        showSection(hardwareSection);
    });

    passesLink.addEventListener("click", (e) => {
        e.preventDefault();
        setActiveLink(passesLink.parentElement);
        showSection(passesSection);
    });

    tagsLink.addEventListener("click", (e) => {
        e.preventDefault();
        setActiveLink(tagsLink.parentElement);
        showSection(tagSection);
    });

    reportsLink.addEventListener("click", (e) => {
        e.preventDefault();
        setActiveLink(reportsLink.parentElement);
        showSection(reportsSection);
    });


    const today = new Date().toISOString().split("T")[0];
    if (activityDateFilter) {
        activityDateFilter.value = today;
        activityDateFilter.addEventListener("change", fetchAndDisplayActivityData);
    }
    if (activitySearchButton) {
        activitySearchButton.addEventListener("click", fetchAndDisplayActivityData);
    }
    if (activitySearchInput) {
        activitySearchInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                fetchAndDisplayActivityData();
            }
        });
    }

    // --- ---------------------------------API Constants------------------------- ---
    const ACTIVITY_API_BASE_URL = "http://localhost:3001/api/activity-proxy";
    const BASE_URL_FOR_IMAGES = "https://dashboard.asaelectra.in:9000";

    async function fetchAndDisplayActivityData() {
        console.log("Fetching activity data...");
        const selectedDate = activityDateFilter ? activityDateFilter.value : "";
        const searchQuery = activitySearchInput
            ? activitySearchInput.value.trim()
            : "";

        const params = new URLSearchParams();
        if (selectedDate) params.append("date", selectedDate);
        if (searchQuery) params.append("search", searchQuery);

        const finalApiUrl = `${ACTIVITY_API_BASE_URL}?${params.toString()}`;

        activitiesSection.innerHTML = `
            <h2>Activity</h2>
            <div class="activity-filters">
                <div class="filter-group">
                    <label for="activity-date-filter">Date:</label>
                    <input type="date" id="activity-date-filter" class="form-control" value="${selectedDate}">
                </div>
                <div class="filter-group search-group">
                    <input type="text" id="activity-search-input" class="form-control" placeholder="Search Vehicle #, Project, etc." value="${searchQuery}">
                    <button id="activity-search-button" class="btn btn-primary"><i class="fas fa-search"></i> Search</button>
                </div>
            </div>
            <div id="activity-loading-message" class="loading-message">Loading activity data...</div>
            <div id="activity-error-message" class="error-text"></div>
            <div id="activity-data-container" class="data-container"></div>
        `;

        const newActivityDateFilter = document.getElementById("activity-date-filter");
        const newActivitySearchInput = document.getElementById("activity-search-input");
        const newActivitySearchButton = document.getElementById("activity-search-button");

        if (newActivityDateFilter) {
            newActivityDateFilter.addEventListener("change", fetchAndDisplayActivityData);
        }
        if (newActivitySearchButton) {
            newActivitySearchButton.addEventListener("click", fetchAndDisplayActivityData);
        }
        if (newActivitySearchInput) {
            newActivitySearchInput.addEventListener("keypress", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    fetchAndDisplayActivityData();
                }
            });
        }

        const loadingEl = document.getElementById("activity-loading-message");
        const errorEl = document.getElementById("activity-error-message");
        const dataContainerEl = document.getElementById("activity-data-container");

        loadingEl.style.display = "block";
        errorEl.textContent = "";
        dataContainerEl.innerHTML = "";

        allActivityImages = []; 

        try {
            const response = await fetch(finalApiUrl);
            if (!response.ok) {
                let errorDetail = `HTTP error! Status: ${response.status}`;
                try {
                    const errorJson = await response.json();
                    errorDetail += ` - ${errorJson.detail || errorJson.message || 'Unknown error'}`;
                } catch (e) { /* ignore__________________ */ }
                throw new Error(errorDetail);
            }

            const data = await response.json();
            loadingEl.style.display = "none";

            if (data.results && Array.isArray(data.results) && data.results.length > 0) {
                const table = document.createElement("table");
                table.classList.add("activity-table");
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Vehicle #</th>
                            <th>Event Type</th>
                            <th>Category</th>
                            <th>Entry Time</th>
                            <th>Exit Time</th>
                            <th>Mode</th>
                            <th>Paid</th>
                            <th>Pass (FOC)</th>
                            <th>Amount</th>
                            <th>Denial Reason</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                const tbody = table.querySelector("tbody");

                data.results.forEach((activity) => {
                    const entryTime = activity.entry_time ? new Date(activity.entry_time).toLocaleString() : "N/A";
                    const exitTime = activity.exit_time ? new Date(activity.exit_time).toLocaleString() : "N/A";
                    const isPaid = activity.paid ? "Yes" : "No";
                    const amount = activity.amount !== null ? activity.amount : "N/A";
                    const isFocApplied = activity.foc_applied === true ? "Yes" : "No";

                    const apiEntryImageUrl = (activity.entry_image && activity.entry_image.trim() !== "" && !activity.entry_image.includes("Parkmate.png")) ? `${BASE_URL_FOR_IMAGES}${activity.entry_image}` : 'https://via.placeholder.com/50x50?text=No+Img';
                    const apiExitImageUrl = (activity.exit_image && activity.exit_image.trim() !== "" && !activity.exit_image.includes("Parkmate.png")) ? `${BASE_URL_FOR_IMAGES}${activity.exit_image}` : 'https://via.placeholder.com/50x50?text=No+Img';

                    let displayImageUrl = 'https://via.placeholder.com/50x50?text=No+Img';
                    if (apiEntryImageUrl && !apiEntryImageUrl.includes("No+Img")) {
                        allActivityImages.push({ src: apiEntryImageUrl, alt: `Entry: ${activity.vehicle_number || 'N/A'}` });
                        displayImageUrl = apiEntryImageUrl; 
                    } else if (apiExitImageUrl && !apiExitImageUrl.includes("No+Img")) {
                        allActivityImages.push({ src: apiExitImageUrl, alt: `Exit: ${activity.vehicle_number || 'N/A'}` });
                        displayImageUrl = apiExitImageUrl; 
                    }


                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td data-label="Image">
                            <img src="${displayImageUrl}" alt="Vehicle Image" class="activity-table-image clickable-image" data-category="activity" style="width:50px; height:50px; object-fit: cover;">
                        </td>
                        <td data-label="Vehicle #">${activity.vehicle_number || "N/A"}</td>
                        <td data-label="Event Type"><span class="event-type-${(activity.event_type || "").toLowerCase()}">${activity.event_type || "N/A"}</span></td>
                        <td data-label="Category">${activity.category_name || "N/A"}</td>
                        <td data-label="Entry Time">${entryTime}</td>
                        <td data-label="Exit Time">${exitTime}</td>
                        <td data-label="Mode">${activity.entry_mode || "N/A"}</td>
                        <td data-label="Paid">${isPaid}</td>
                        <td data-label="Pass (FOC)">${isFocApplied}</td>
                        <td data-label="Amount">${amount}</td>
                        <td data-label="Denial Reason">${activity.transaction_denial_reason || "N/A"}</td>
                    `;
                    tbody.appendChild(row);
                });
                dataContainerEl.appendChild(table);
                setupImageClickListeners(dataContainerEl); 
            } else {
                dataContainerEl.innerHTML = "<p>No activity records found for the applied filters.</p>";
            }
        } catch (error) {
            console.error("Error fetching activity data:", error);
            loadingEl.style.display = "none";
            errorEl.textContent = `Failed to load activity data. Details: ${error.message}`;
        }
    }

    // -------------------------------------------- Dashboard Summary ------------------------------------- ---
    async function fetchDashboardSummary() {
        console.log("Fetching dashboard summary...");
        const dashboardContentEl = document.getElementById("dashboard-content");
        if (!dashboardContentEl) {
            console.error("Dashboard content element not found!");
            return;
        }

        dashboardContentEl.innerHTML = `
            <section class="dashboard-header">
                <h1>Hi, Adesh 👋</h1>
                <div class="date-picker">
                    <i class="fas fa-calendar-alt"></i> <span id="current-date"></span>
                </div>
            </section>
            <hr />
            <p style="text-align: center; padding: 20px;">Loading dashboard summary...</p>
        `;
        updateCurrentDate();

        try {
            const today = new Date().toISOString().split("T")[0];
            const apiUrl = `${ACTIVITY_API_BASE_URL}?date=${today}`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                let errorDetail = `HTTP error! Status: ${response.status}`;
                try {
                    const errorJson = await response.json();
                    errorDetail += ` - ${errorJson.detail || errorJson.message || 'Unknown error'}`;
                } catch (e) { /* ignore ____________________________ */ }
                throw new Error(errorDetail);
            }

            const data = await response.json();
            const activities = data.results && Array.isArray(data.results) ? data.results : [];

            let totalEntries = 0;
            let totalExits = 0;
            let totalPasses = 0;
            let totalCollection = 0;
            let totalVehiclesInside = 0;

            dashboardCategoryImages = { entry: [], exit: [], pass: [], inside: [] };

            let exampleEntryImageUrl = "https://venturekites.com/wp-content/uploads/2024/07/Parkmate.png";
            let exampleExitImageUrl = "https://venturekites.com/wp-content/uploads/2024/07/Parkmate.png";
            let examplePassImageUrl = "https://venturekites.com/wp-content/uploads/2024/07/Parkmate.png";
            let exampleInsideImageUrl = "https://venturekites.com/wp-content/uploads/2024/07/Parkmate.png"; 

            activities.forEach((activity) => {
                const eventType = (activity.event_type || "").toLowerCase();
                const amount = parseFloat(activity.amount) || 0;
                const isFocApplied = activity.foc_applied === true;

                const fullEntryImageUrl = (activity.entry_image && activity.entry_image.trim() !== "" && !activity.entry_image.includes("Parkmate.png")) ? `${BASE_URL_FOR_IMAGES}${activity.entry_image}` : null;
                const fullExitImageUrl = (activity.exit_image && activity.exit_image.trim() !== "" && !activity.exit_image.includes("Parkmate.png")) ? `${BASE_URL_FOR_IMAGES}${activity.exit_image}` : null;

                if (eventType === "entry") {
                    totalEntries++;
                    if (fullEntryImageUrl) {
                        dashboardCategoryImages.entry.push({ src: fullEntryImageUrl, alt: `Entry: ${activity.vehicle_number || 'N/A'}` });
                        exampleEntryImageUrl = fullEntryImageUrl;
                    }
                } else if (eventType === "exit") {
                    totalExits++;
                    if (fullExitImageUrl) {
                        dashboardCategoryImages.exit.push({ src: fullExitImageUrl, alt: `Exit: ${activity.vehicle_number || 'N/A'}` });
                        exampleExitImageUrl = fullExitImageUrl;
                    }
                }

                if (isFocApplied) {
                    totalPasses++;
                    if (fullEntryImageUrl) {
                        dashboardCategoryImages.pass.push({ src: fullEntryImageUrl, alt: `Pass Entry: ${activity.vehicle_number || 'N/A'}` });
                        examplePassImageUrl = fullEntryImageUrl;
                    } else if (fullExitImageUrl) {
                        dashboardCategoryImages.pass.push({ src: fullExitImageUrl, alt: `Pass Exit: ${activity.vehicle_number || 'N/A'}` });
                        examplePassImageUrl = fullExitImageUrl;
                    }
                }
                totalCollection += amount;
            });

            totalVehiclesInside = totalEntries - totalExits;
            totalVehiclesInside = Math.max(0, totalVehiclesInside);

            if (dashboardCategoryImages.entry.length === 0) exampleEntryImageUrl = "https://venturekites.com/wp-content/uploads/2024/07/Parkmate.png";
            if (dashboardCategoryImages.exit.length === 0) exampleExitImageUrl = "https://venturekites.com/wp-content/uploads/2024/07/Parkmate.png";
            if (dashboardCategoryImages.pass.length === 0) examplePassImageUrl = "https://venturekites.com/wp-content/uploads/2024/07/Parkmate.png";


            dashboardContentEl.innerHTML = `
                <section class="dashboard-header">
                    <h1>Hi, Adesh 👋</h1>
                    <div class="date-picker">
                        <i class="fas fa-calendar-alt"></i> <span id="current-date"></span>
                    </div>
                </section>
                <hr />
                <section class="fastag-summary-section">
                    <h2>Overall Summary</h2>
                    <div class="fastag-table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Value</th>
                                    <th>Image & Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><i class="fas fa-car fastag-icon"></i> Total Entries</td>
                                    <td>${totalEntries}</td>
                                    <td class="image-with-count-cell">
                                        <img src="${exampleEntryImageUrl}" alt="Car Entry icon" class="clickable-image small-table-image" data-category="entry" style="width:50px; height:50px; object-fit: cover;">
                                        <span class="image-count-overlay">${totalEntries}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td><i class="fas fa-sign-out-alt fastag-icon"></i> Total Exits</td>
                                    <td>${totalExits}</td>
                                    <td class="image-with-count-cell">
                                        <img src="${exampleExitImageUrl}" alt="Car Exit icon" class="clickable-image small-table-image" data-category="exit" style="width:50px; height:50px; object-fit: cover;">
                                        <span class="image-count-overlay">${totalExits}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td><i class="fas fa-ticket-alt fastag-icon"></i> Total Passes</td>
                                    <td>${totalPasses}</td>
                                    <td class="image-with-count-cell">
                                        <img src="${examplePassImageUrl}" alt="Pass icon" class="clickable-image small-table-image" data-category="pass" style="width:50px; height:50px; object-fit: cover;">
                                        <span class="image-count-overlay">${totalPasses}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td><i class="fas fa-parking fastag-icon"></i> Total Vehicles Inside</td>
                                    <td>${totalVehiclesInside} <span class="note">(Approx. based on today's activity)</span></td>
                                    <td class="image-with-count-cell">
                                        <img src="${exampleInsideImageUrl}" alt="Parking icon" class="clickable-image small-table-image" data-category="inside" style="width:50px; height:50px; object-fit: cover;">
                                    </td>
                                </tr>
                                <tr class="total-fastag-row">
                                    <td colspan="3">
                                        <div class="total-fastag-content">
                                            <i class="fas fa-credit-card fastag-icon"></i> Total Collection: <span class="amount"><i class="fas fa-rupee-sign"></i> ${totalCollection.toFixed(2)}</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            `;
            updateCurrentDate();
            setupImageClickListeners(dashboardContentEl);
        } catch (error) {
            console.error("Error fetching dashboard summary:", error);
            dashboardContentEl.innerHTML = `
                <section class="dashboard-header">
                    <h1>Hi, Adesh 👋</h1>
                    <div class="date-picker">
                        <i class="fas fa-calendar-alt"></i> <span id="current-date"></span>
                    </div>
                </section>
                <hr />
                <p style="text-align: center; padding: 20px; color: red;">Failed to load dashboard data. Details: ${error.message}</p>
            `;
            updateCurrentDate();
        }
    }

    // --- Reports Data ---------------------------------------- ---
    async function loadReportsData() {
        console.log("Loading reports data...");
        const reportsTableBody = document.getElementById("reports-table-body");
        reportsTableBody.innerHTML = '<tr><td colspan="2">Loading reports...</td></tr>';

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);

        const reportPromises = [];
        const reportResults = {};

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const currentDate = d.toISOString().split("T")[0];
            const apiUrl = `${ACTIVITY_API_BASE_URL}?date=${currentDate}`;

            reportPromises.push(
                fetch(apiUrl)
                    .then((response) => {
                        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                        return response.json();
                    })
                    .then((data) => {
                        reportResults[currentDate] = data.results && Array.isArray(data.results) ? data.results : [];
                    })
                    .catch((error) => {
                        console.error(`Error fetching reports for ${currentDate}:`, error);
                        reportResults[currentDate] = [];
                    })
            );
        }

        Promise.all(reportPromises)
            .then(() => {
                reportsTableBody.innerHTML = "";
                const sortedDates = Object.keys(reportResults).sort((a, b) => new Date(a) - new Date(b));
                const finalReports = [];

                sortedDates.forEach((date) => {
                    const activities = reportResults[date];
                    let entryCount = 0;
                    let exitCount = 0;
                    let totalCollection = 0;

                    activities.forEach((activity) => {
                        if (activity.event_type && activity.event_type.toLowerCase() === "entry") entryCount++;
                        if (activity.event_type && activity.event_type.toLowerCase() === "exit") exitCount++;
                        if (activity.amount) totalCollection += parseFloat(activity.amount) || 0;
                    });

                    const displayDate = new Date(date).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                    });
                    finalReports.push({ date: displayDate, summary: `Entries: ${entryCount}, Exits: ${exitCount}, Collection: ₹${totalCollection.toFixed(2)}` });
                });

                if (finalReports.length === 0) {
                    reportsTableBody.innerHTML = '<tr><td colspan="2" class="no-results">No report data available.</td></tr>';
                    return;
                }

                finalReports.forEach((report) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `<td>${report.date}</td><td>${report.summary}</td>`;
                    reportsTableBody.appendChild(row);
                });
            })
            .catch((error) => {
                console.error("Error processing all reports:", error);
                reportsTableBody.innerHTML = '<tr><td colspan="2" class="error-text">Failed to load all reports.</td></tr>';
            });
    }

    // --- ---------------------------------Passes Modal--------------------------- ---
   function fetchPassesData() {
    passesTableBody.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;
    const totalLimit = 200;
    const chunkSize = 100;
    const fetchPromises = [];

    for (let skip = 0; skip < totalLimit; skip += chunkSize) {
      const url = `https://dummyjson.com/users?limit=${chunkSize}&skip=${skip}`;
      fetchPromises.push(fetch(url).then((res) => res.json()));
    }

    Promise.all(fetchPromises)
      .then((results) => {
        const users = results.flatMap((result) => result.users);
        allPassesData = users.map((user) => ({
          holder: `${user.firstName} ${user.lastName}`,
          phone: user.phone,
          category: "General",
          vehicle: user.username.toUpperCase(),
          rate: "1137",
          expiry: randomExpiryDate(),
          email: user.email || "--",
        }));
        renderPasses(allPassesData);
      })
      .catch((error) => {
        console.error("Error fetching passes data from dummyjson:", error);
        passesTableBody.innerHTML = `<tr><td colspan="7" class="error-text">Error loading passes data. Please check dummy API or network.</td></tr>`;
      });
  }

  function renderPasses(data) {
    if (data.length === 0) {
      passesTableBody.innerHTML = `<tr><td colspan="7">No results found.</td></tr>`;
      return;
    }

    let rows = "";
    data.forEach((pass) => {
      const isExpired = isDateExpired(pass.expiry);
      const color = isExpired ? "red" : "blue"; 

      rows += `
                        <tr>
                            <td>
                                <div>${pass.phone}</div>
                                <div><strong>${pass.holder}</strong></div>
                            </td>
                            <td>${pass.category}</td>
                            <td>${pass.vehicle}</td>
                            <td>${pass.rate}</td>
                            <td><span style="color:${color};">${pass.expiry}</span></td>
                            <td>${pass.email}</td>
                            <td><button class="update-btn" onclick="openPassModal(true, this.parentElement.parentElement)"><i class="fas fa-pen"></i> Update</button></td>
                        </tr>`;
    });
    passesTableBody.innerHTML = rows;
  }

  function isDateExpired(expiryText) {
    const parts = expiryText.match(/(\d{1,2})(?:st|nd|rd|th)? (\w+) (\d{4})/);
    if (!parts) return false; 
    const [_, day, monthAbbr, year] = parts;

    const monthMap = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    const monthNum = monthMap[monthAbbr];
    if (monthNum === undefined) return false;

    const fullDate = new Date(year, monthNum, day, 23, 59, 59); 
    return fullDate < new Date();
  }

  function randomExpiryDate() {
    const now = new Date();
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
      "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const randomDays = Math.floor(Math.random() * 365) - 180;
    const future = new Date(now.getTime() + randomDays * 86400000);
    const day = future.getDate();
    const suffix = getDaySuffix(day);
    const month = months[future.getMonth()];
    const year = future.getFullYear();
    return `11:59 PM ${day}${suffix} ${month} ${year}`;
  }

  function getDaySuffix(day) {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  passesSearchInput.addEventListener("input", () => {
    const query = passesSearchInput.value.trim().toLowerCase();
    const filteredData = allPassesData.filter(
      (pass) =>
        pass.holder.toLowerCase().includes(query) ||
        pass.phone.toLowerCase().includes(query) ||
        pass.vehicle.toLowerCase().includes(query) ||
        pass.email.toLowerCase().includes(query)
    );
    renderPasses(filteredData);
  });

    // --- -----------------------------------Tags Section Modals---------------------------------- ---
    window.openTagModal = function (isEdit = false, row = null) {
    const modal = document.getElementById("tag-modal");
    modal.style.display = "flex";
    document.getElementById("tag-modal-title").textContent = isEdit
      ? "Update Tag"
      : "Add New Tag";
    const inputs = modal.querySelectorAll("input, select");
    inputs.forEach((input) => (input.value = ""));

    if (isEdit && row) {
      const cells = row.querySelectorAll("td");
      inputs[0].value = cells[0].textContent;
      inputs[1].value = cells[1].textContent; 
      inputs[2].value = cells[2].textContent; 
      inputs[3].value = cells[3].textContent; 
      inputs[4].value = cells[4].textContent.replace("₹", "");
      inputs[5].value = cells[5].textContent; 
      editingTagRow = row; 
    } else {
      editingTagRow = null; 
    }
  };

  window.closeTagModal = function () {
    document.getElementById("tag-modal").style.display = "none";
  };

  window.saveTag = function () {
    const modal = document.getElementById("tag-modal");
    const inputs = modal.querySelectorAll("input, select");
    const values = [...inputs].map((input) => input.value.trim());

    
    if (values.some(value => value === "")) { 
      alert("Please fill in all fields.");
      return;
    }

    const rowHTML = `
            <td>${values[0]}</td> <td>${values[1]}</td> <td>${values[2]}</td> <td>${values[3]}</td> <td>₹${parseFloat(values[4]).toFixed(2)}</td> <td>${values[5]}</td> <td><button class="update-btn" onclick="openTagModal(true, this.parentElement.parentElement)">Edit</button></td>
        `;

    const tagTableBody = document.getElementById("tag-table-body");
    if (editingTagRow) {

      editingTagRow.innerHTML = rowHTML;
    } else {
      
      if (tagTableBody.querySelector(".no-results")) {
        tagTableBody.innerHTML = ""; 
      }
      const newRow = document.createElement("tr");
      newRow.innerHTML = rowHTML;
      tagTableBody.appendChild(newRow);
    }

    closeTagModal();
  };

  
    // -------------------------------------------- Lightbox ------------------------------- ---
    function setupImageClickListeners(container) {
        console.log("Attaching image click listeners...");
        const images = container.querySelectorAll(".clickable-image");
        images.forEach((img) => {
            img.removeEventListener('click', handleImageClick); 
            img.addEventListener('click', handleImageClick);
        });
    }

    function handleImageClick(event) {
        const clickedImage = event.target;
        const category = clickedImage.dataset.category;
        let imagesToShow = [];
        let galleryTitle = "Images";

        if (category === "activity") {
     
            imagesToShow = [
                { src: clickedImage.src, alt: clickedImage.alt }
            ];
            galleryTitle = `Activity Image: ${clickedImage.alt}`; 
        } else if (dashboardCategoryImages[category]) {
            imagesToShow = dashboardCategoryImages[category];
            galleryTitle = `Total ${category.charAt(0).toUpperCase() + category.slice(1)} Images`;
        }

        openGridLightbox(imagesToShow, galleryTitle);
    }

    function openGridLightbox(images, title) {
        console.log(`Opening grid lightbox for: ${title}`);
        lightboxGridContainer.innerHTML = '';
        captionText.innerHTML = '';

        if (!lightboxGridContainer || !captionText || !lightbox) {
            console.error("Error: Lightbox elements not found!");
            return;
        }

        if (images.length === 0) {
            lightboxGridContainer.innerHTML = '<p style="color:white; text-align:center; padding: 20px;">No images available for this category.</p>';
            captionText.innerHTML = title;
        } else {
            images.forEach((imgData) => {
                const imgElement = document.createElement('img');
                imgElement.src = imgData.src;
                imgElement.alt = imgData.alt;
                lightboxGridContainer.appendChild(imgElement);
            });
            captionText.innerHTML = `${title} (${images.length} images)`;
        }
        lightbox.style.display = "block";
    }

    function closeLightbox() {
        console.log("Closing lightbox...");
        lightbox.style.display = "none";
        lightboxGridContainer.innerHTML = "";
        captionText.innerHTML = "";
    }

    // --- ----------------------------Lightbox Event Listeners----------------------------------- ---
    if (closeButton) {
        closeButton.addEventListener("click", closeLightbox);
    }

    if (lightbox) {
        lightbox.addEventListener("click", function (e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }


    // -------------------------------------- Initial Page ---------------------- ---
    const lastActiveSectionId = localStorage.getItem("lastActiveSection");
    if (lastActiveSectionId) {
        const sectionToLoad = document.getElementById(lastActiveSectionId);
        if (sectionToLoad) {
            let linkToActivate;
            if (lastActiveSectionId === "dashboard-content") {
                linkToActivate = dashboardLink;
            } else if (lastActiveSectionId === "activities-section") {
                linkToActivate = activitiesLink;
            } else if (lastActiveSectionId === "hardware-section") {
                linkToActivate = hardwareLink;
            } else if (lastActiveSectionId === "manual-passes-section") {
                linkToActivate = passesLink;
            } else if (lastActiveSectionId === "tag-section") {
                linkToActivate = tagsLink;
            } else if (lastActiveSectionId === "reports-section") {
                linkToActivate = reportsLink;
            }

            if (linkToActivate) {
                setActiveLink(linkToActivate.parentElement);
            }
            showSection(sectionToLoad);
        } else {
            setActiveLink(dashboardLink.parentElement);
            showSection(dashboardContent);
        }
    } else {
        setActiveLink(dashboardLink.parentElement);
        showSection(dashboardContent);
    }
});