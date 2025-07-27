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

  const navItems = document.querySelectorAll(".sidebar-nav .nav-item");

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
    } else if (sectionElement === reportsSection) {
      loadReportsData();
    }
  }

  // --- -------------------Date Update Logic for Dashboard Header ---------------------------------------
  function updateCurrentDate() {
    const today = new Date();
    const options = { month: "short", day: "numeric", year: "numeric" };
    const formattedDate = today.toLocaleDateString("en-IN", options);

    const currentDateElement = document.getElementById("current-date");
    if (currentDateElement) {
      currentDateElement.textContent = formattedDate;
    } else {
      console.error("Error: Element with ID 'current-date' not found!");
    }
  }
  updateCurrentDate();

  // --- Navigation Link Event Listeners ---
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

  // --- ----------------------------------Activity Filter ------------------------- ---
  const today = new Date().toISOString().split("T")[0];
  if (activityDateFilter) {
    activityDateFilter.value = today;
  }

  if (activityDateFilter) {
    activityDateFilter.addEventListener("change", () => {
      console.log("Activity Date filter changed to:", activityDateFilter.value);
      fetchAndDisplayActivityData();
    });
  }

  if (activitySearchButton) {
    activitySearchButton.addEventListener("click", () => {
      console.log(
        "Activity Search button clicked. Query:",
        activitySearchInput.value
      );
      fetchAndDisplayActivityData();
    });
  }

  if (activitySearchInput) {
    activitySearchInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        console.log(
          "Activity Enter key pressed. Query:",
          activitySearchInput.value
        );
        fetchAndDisplayActivityData();
      }
    });
  }

  const ACTIVITY_API_BASE_URL = "http://localhost:3001/api/activity-proxy";

  // ------------------------------------ Activities Data (Real API) with Filtering -----------------------------------
  async function fetchAndDisplayActivityData() {
    const selectedDate = activityDateFilter ? activityDateFilter.value : "";
    const searchQuery = activitySearchInput
      ? activitySearchInput.value.trim()
      : "";

    const params = new URLSearchParams();
    if (selectedDate) {
      params.append("date", selectedDate);
    }
    if (searchQuery) {
      params.append("search", searchQuery);
    }

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

    const newActivityDateFilter = document.getElementById(
      "activity-date-filter"
    );
    const newActivitySearchInput = document.getElementById(
      "activity-search-input"
    );
    const newActivitySearchButton = document.getElementById(
      "activity-search-button"
    );

    if (newActivityDateFilter) {
      newActivityDateFilter.addEventListener("change", () =>
        fetchAndDisplayActivityData()
      );
    }
    if (newActivitySearchButton) {
      newActivitySearchButton.addEventListener("click", () =>
        fetchAndDisplayActivityData()
      );
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

    try {
      console.log("Attempting to fetch activity data from:", finalApiUrl);
      const response = await fetch(finalApiUrl);
      console.log("Fetch response received:", response);

      if (!response.ok) {
        let errorDetail = `HTTP error! Status: ${response.status} ${response.statusText}`;
        try {
          const errorJson = await response.json();
          console.error("Error JSON from proxy:", errorJson);
          if (errorJson && errorJson.detail) {
            errorDetail += ` - API Message: ${errorJson.detail}`;
          } else if (errorJson && errorJson.message) {
            errorDetail += ` - Proxy Message: ${errorJson.message}`;
          }
        } catch (e) {
          console.error("Could not parse error response as JSON:", e);
          errorDetail += ` - Response not JSON or empty.`;
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      console.log("API Data Received for Activity:", data);

      loadingEl.style.display = "none";

      if (
        data.results &&
        Array.isArray(data.results) &&
        data.results.length > 0
      ) {
        const table = document.createElement("table");
        table.classList.add("activity-table");

        const thead = document.createElement("thead");
        thead.innerHTML = `
                    <tr>
                        <th>Vehicle #</th>
                        <th>Project</th>
                        <th>Category</th>
                        <th>Event Type</th>
                        <th>Entry Time</th>
                        <th>Exit Time</th>
                        <th>Mode</th>
                        <th>Paid</th>
                        <th>Amount</th>
                        <th>Denial Reason</th>
                    </tr>
                `;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        data.results.forEach((activity) => {
          const row = document.createElement("tr");

          const entryTime = activity.entry_time
            ? new Date(activity.entry_time).toLocaleString()
            : "N/A";
          const exitTime = activity.exit_time
            ? new Date(activity.exit_time).toLocaleString()
            : "N/A";
          const isPaid = activity.paid ? "Yes" : "No";
          const amount = activity.amount !== null ? activity.amount : "N/A";

          row.innerHTML = `
                        <td data-label="Vehicle #">${
                          activity.vehicle_number || "N/A"
                        }</td>
                        <td data-label="Project">${
                          activity.project_name || "N/A"
                        }</td>
                        <td data-label="Category">${
                          activity.category_name || "N/A"
                        }</td>
                        <td data-label="Event Type"><span class="event-type-${(
                          activity.event_type || ""
                        ).toLowerCase()}">${
            activity.event_type || "N/A"
          }</span></td>
                        <td data-label="Entry Time">${entryTime}</td>
                        <td data-label="Exit Time">${exitTime}</td>
                        <td data-label="Mode">${
                          activity.entry_mode || "N/A"
                        }</td>
                        <td data-label="Paid">${isPaid}</td>
                        <td data-label="Amount">${amount}</td>
                        <td data-label="Denial Reason">${
                          activity.transaction_denial_reason || "N/A"
                        }</td>
                    `;
          tbody.appendChild(row);
        });
        table.appendChild(tbody);
        dataContainerEl.appendChild(table);
        setupImageClickListeners(dataContainerEl);
      } else {
        dataContainerEl.innerHTML =
          "<p>No activity records found for the applied filters or data format is unexpected.</p>";
        console.warn(
          "API Data for Activity does not contain 'results' array or it is empty:",
          data
        );
      }
    } catch (error) {
      console.error("Error fetching activity data via proxy:", error);
      loadingEl.style.display = "none";
      errorEl.textContent = `Failed to load activity data. Please ensure your proxy server is running and the API is accessible. Details: ${error.message}`;
    }
  }

  // ------------------------------------ Reports Data-------------- ------------------------------------
  function loadReportsData() {
    const reportsTableBody = document.getElementById("reports-table-body");
    reportsTableBody.innerHTML =
      '<tr><td colspan="2">Loading reports...</td></tr>';

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);

    const reportPromises = [];
    const reportResults = {};

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const currentDate = d.toISOString().split("T")[0];

      const params = new URLSearchParams();
      params.append("date", currentDate);

      const apiUrl = `${ACTIVITY_API_BASE_URL}?${params.toString()}`;

      reportPromises.push(
        fetch(apiUrl)
          .then((response) => {
            if (!response.ok) {
              console.error(
                `Error fetching data for ${currentDate}: ${response.status} ${response.statusText}`
              );
              return { results: [] };
            }
            return response.json();
          })
          .then((data) => {
            reportResults[currentDate] =
              data.results && Array.isArray(data.results) ? data.results : [];
          })
          .catch((error) => {
            console.error(
              `Network error fetching reports for ${currentDate}:`,
              error
            );
            reportResults[currentDate] = [];
          })
      );
    }

    Promise.all(reportPromises)
      .then(() => {
        reportsTableBody.innerHTML = "";

        const finalReports = [];
        const sortedDates = Object.keys(reportResults).sort();

        sortedDates.forEach((date) => {
          const activities = reportResults[date];
          let entryCount = 0;

          activities.forEach((activity) => {
            if (
              activity.event_type &&
              typeof activity.event_type === "string" &&
              activity.event_type.toLowerCase() === "entry"
            ) {
              entryCount++;
            }
          });

          const displayDate = new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          finalReports.push({
            date: displayDate,
            summary: `Total Entries: ${entryCount}`,
          });
        });

        if (finalReports.length === 0) {
          reportsTableBody.innerHTML =
            '<tr><td colspan="2" class="no-results">No report data available for the selected period.</td></tr>';
          return;
        }

        finalReports.forEach((report) => {
          const row = document.createElement("tr");
          row.innerHTML = `
                        <td>${report.date}</td>
                        <td>${report.summary}</td>
                    `;
          reportsTableBody.appendChild(row);
        });
      })
      .catch((error) => {
        console.error("Error processing all reports:", error);
        reportsTableBody.innerHTML =
          '<tr><td colspan="2" class="error-text">Failed to load all reports.</td></tr>';
      });
  }

  // ----------------------------------- Pass Data (Dummy)-------- ------------------------------------
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
    const [_, day, month, year] = parts;
    const fullDate = new Date(`${month} ${day}, ${year} 23:59:59`);
    return fullDate < new Date();
  }

  function randomExpiryDate() {
    const now = new Date();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
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

  // --- Pass Modal Logic ---
  window.openPassModal = function (isEdit = false, row = null) {
    const modal = document.getElementById("pass-modal");
    modal.style.display = "flex";
    document.getElementById("pass-modal-title").textContent = isEdit
      ? "Update Pass"
      : "Add New Pass";
    const inputs = modal.querySelectorAll("input");
    inputs.forEach((input) => (input.value = ""));

    if (isEdit && row) {
      const cells = row.querySelectorAll("td");
      inputs[0].value = cells[0].querySelector("strong").textContent;
      inputs[1].value = cells[1].textContent;
      inputs[2].value = cells[2].textContent;
      inputs[3].value = cells[3].textContent;
      const expiryString = cells[4].textContent.split(" ").slice(2).join(" ");
      const parsedDate = new Date(expiryString);
      if (!isNaN(parsedDate)) {
        inputs[4].value = parsedDate.toISOString().split("T")[0];
      } else {
        console.warn("Could not parse expiry date:", expiryString);
        inputs[4].value = "";
      }
      inputs[5].value = cells[5].textContent;
    }
  };

  window.closePassModal = function () {
    document.getElementById("pass-modal").style.display = "none";
  };

  window.savePass = function () {
    closePassModal();
  };

  // -----------------------------------------Tag Data (Dummy) -----------------------------------------
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

    if (values.includes("")) {
      alert("Please fill in all fields.");
      return;
    }

    const rowHTML = `
            <td>${values[0]}</td>
            <td>${values[1]}</td>
            <td>${values[2]}</td>
            <td>${values[3]}</td>
            <td>₹${values[4]}</td>
            <td>${values[5]}</td>
            <td><button class="update-btn" onclick="openTagModal(true, this.parentElement.parentElement)">Edit</button></td>
        `;

    if (editingTagRow) {
      editingTagRow.innerHTML = rowHTML;
    } else {
      const tbody = document.getElementById("tag-table-body");
      if (tbody.querySelector(".no-results")) {
        tbody.innerHTML = "";
      }
      const newRow = document.createElement("tr");
      newRow.innerHTML = rowHTML;
      tbody.appendChild(newRow);
    }

    closeTagModal();
  };

  // ------------------------------------ Hardware Data (Dummy) -----------------------------------------------------
  function populateHardwareTable() {
    const hardwareData = [
      {
        name: "Camera 1",
        type: "CCTV",
        status: "Online",
        lastCheckIn: "2025-07-26 09:00 AM",
        location: "Entry Gate A",
      },
      {
        name: "Barrier Gate 1",
        type: "Barrier",
        status: "Online",
        lastCheckIn: "2025-07-26 09:05 AM",
        location: "Entry Gate A",
      },
      {
        name: "POS Machine 1",
        type: "POS",
        status: "Offline",
        lastCheckIn: "2025-07-24 04:12 PM",
        location: "Cashier Booth 1",
      },
      {
        name: "Sensor 2",
        type: "Sensor",
        status: "Online",
        lastCheckIn: "2025-07-26 09:10 AM",
        location: "Exit Gate B",
      },
    ];

    hardware__TableBody.innerHTML = "";

    hardwareData.forEach((device, index) => {
      const row = document.createElement("tr");
      const status_Class = device.status.toLowerCase();
      row.innerHTML = `
                <td>${index + 1}</td>
                <td>${device.name}</td>
                <td>${device.type}</td>
                <td><span class="status ${status_Class}">${
        device.status
      }</span></td>
                <td>${device.lastCheckIn}</td>
                <td>${device.location}</td>
            `;
      hardware__TableBody.appendChild(row);
    });
  }

  // ------------------------------------ Image  zom -----------------
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const captionText = document.getElementById("caption");
  const closeButton = document.querySelector(".close-button");

  function setupImageClickListeners(containerElement) {
    const images = containerElement.querySelectorAll(".clickable-image");
    images.forEach((img) => {
      img.removeEventListener("click", handleImageClick);
      img.addEventListener("click", handleImageClick);
    });
  }

  function handleImageClick() {
    if (lightbox && lightboxImg && captionText) {
      lightbox.style.display = "flex";
      lightboxImg.src = this.src;
      captionText.innerHTML = this.alt || "Image";
    }
  }

  if (lightbox && closeButton) {
    closeButton.addEventListener("click", function () {
      lightbox.style.display = "none";
    });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) {
        lightbox.style.display = "none";
      }
    });
  }

  const lastActiveSectionId = localStorage.getItem("lastActiveSection");
  let initialSectionElement = welcomeMessageContent;

  if (lastActiveSectionId) {
    const foundSection = document.getElementById(lastActiveSectionId);
    if (foundSection) {
      initialSectionElement = foundSection;

      navItems.forEach((item) => {
        const link = item.querySelector("a");
        if (!link) return;

        if (
          link.id === "dashboard-link" &&
          lastActiveSectionId === "dashboard-content"
        ) {
          item.classList.add("active");
        } else if (
          link.id === "activities-link" &&
          lastActiveSectionId === "activities-section"
        ) {
          item.classList.add("active");
        } else if (
          link.id === "hardware-link" &&
          lastActiveSectionId === "hardware-section"
        ) {
          item.classList.add("active");
        } else if (
          link.id === "passes-link" &&
          lastActiveSectionId === "manual-passes-section"
        ) {
          item.classList.add("active");
        } else if (
          link.id === "tags-link" &&
          lastActiveSectionId === "tag-section"
        ) {
          item.classList.add("active");
        } else if (
          link.id === "reports-link" &&
          lastActiveSectionId === "reports-section"
        ) {
          item.classList.add("active");
        }
      });
    }
  }
  showSection(initialSectionElement);

  if (initialSectionElement === activitiesSection) {
    fetchAndDisplayActivityData();
  } else if (initialSectionElement === hardwareSection) {
    populateHardwareTable();
  } else if (initialSectionElement === passesSection) {
    fetchPassesData();
  } else if (initialSectionElement === reportsSection) {
    loadReportsData();
  }

  setupImageClickListeners(document);
});
