document.addEventListener("DOMContentLoaded", () => {
  const ACTIVITIES_API_URL =
    "https://dashboard.asaelectra.in:9000/api/v1/activity/";
  const LOGOUT_API_URL = "https://dashboard.asaelectra.in:9000/api/logout/";
  const BASE_URL_FOR_IMAGES = "https://dashboard.asaelectra.in:9000";

  const dashboardLink = document.getElementById("dashboard-link");
  const activitiesLink = document.getElementById("activities-link");
  const hardwareLink = document.getElementById("hardware-link");
  const passesLink = document.getElementById("manual-passes-link");
  const tagsLink = document.getElementById("tag-link");
  const reportsLink = document.getElementById("reports-link");
  const logoutBtn = document.querySelector(".logout-btn");

  const activitiesSection = document.getElementById("activities-section");
  const dashboardSection = document.getElementById("dashboard-content");
  const hardwareSection = document.getElementById("hardware-section");
  const passesSection = document.getElementById("manual-passes-section");
  const tagsSection = document.getElementById("tag-section");
  const reportsSection = document.getElementById("reports-section");

  const lightbox = document.getElementById("lightbox");
  const closeButton = document.querySelector(".lightbox-close");
  const captionText = document.getElementById("caption");
  const lightboxGridContainer = document.getElementById(
    "lightbox-grid-container"
  );

  function showFullScreenLoader() {
    const loader = document.getElementById("full-screen-loader");
    if (loader) {
      loader.style.display = "flex";
    }
  }

  function hideFullScreenLoader() {
    const loader = document.getElementById("full-screen-loader");
    if (loader) {
      loader.style.display = "none";
    }
  }

  let dashboardCategoryImages = { entry: [], exit: [], pass: [], inside: [] };
  let allActivityImages = [];
  let cachedActivities = [];

  function checkAuth() {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      window.location.href = "index.html";
    }
  }
  checkAuth();

  function showSection(sectionElement) {
    document.querySelectorAll("main").forEach((section) => {
      section.style.display = "none";
    });
    sectionElement.style.display = "block";
  }

  
  function setActiveLink(linkElement) {
    document.querySelectorAll(".sidebar-nav-item").forEach((item) => {
      item.classList.remove("active");
    });
    linkElement.classList.add("active");
  }

  if (dashboardLink) {
    dashboardLink.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveLink(dashboardLink.parentElement);
      showSection(dashboardSection);
      fetchDashboardSummary();
      localStorage.setItem("lastActiveSection", "dashboard-content");
    });
  }

  if (activitiesLink) {
    activitiesLink.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveLink(activitiesLink.parentElement);
      showSection(activitiesSection);
      setupActivitiesSection();
      localStorage.setItem("lastActiveSection", "activities-section");
    });
  }

  if (hardwareLink) {
    hardwareLink.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveLink(hardwareLink.parentElement);
      showSection(hardwareSection);
      localStorage.setItem("lastActiveSection", "hardware-section");
    });
  }

  if (passesLink) {
    passesLink.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveLink(passesLink.parentElement);
      showSection(passesSection);
      setupPassesPage();
      localStorage.setItem("lastActiveSection", "manual-passes-section");
    });
  }

  if (tagsLink) {
    tagsLink.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveLink(tagsLink.parentElement);
      showSection(tagsSection);

      localStorage.setItem("lastActiveSection", "tag-section");
    });
  }

  if (reportsLink) {
    reportsLink.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveLink(reportsLink.parentElement);
      showSection(reportsSection);

      localStorage.setItem("lastActiveSection", "reports-section");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  // ---------------------------------Activities Functions-------------------------------------------------
  function setupActivitiesSection() {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    activitiesSection.innerHTML = `
        <div id="activity-section-content">
            <h2 id="activity-count-title"> ASA Electra Activities </h2>
            <p style="margin-bottom: 20px;">Showing activities of ${today}</p>
            <p class="section-description">View and filter all vehicle entries, exits, and transactions. Use the filters below to find specific records.</p>
            <div class="activity-filters">
                <div class="filter-group search-group">
                    <input type="text" id="activity-search-input" class="form-control" placeholder="Search Vehicle #, Project, etc.....">
                    <button id="activity-search-button" class="btn btn-primary"><i class="fas fa-search"></i> Search</button>
                </div>
                <div class="filter-group">
                    <label for="activity-date-filter">Date:</label>
                    <input type="date" id="activity-date-filter" class="form-control">
                </div>
            </div>
            
            <div class="scrollable-data-container">
                <div id="activity-error-message" class="error-text"></div>
                <div id="activity-data-container" class="data-container"></div>
            </div>
        </div>
    `;

    const activityDateFilter = document.getElementById("activity-date-filter");
    const activitySearchInput = document.getElementById(
      "activity-search-input"
    );
    const activitySearchButton = document.getElementById(
      "activity-search-button"
    );

    if (activityDateFilter) {
      activityDateFilter.addEventListener(
        "change",
        fetchAndDisplayActivityData
      );
    }

    if (activitySearchInput) {
      activitySearchInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
          fetchAndDisplayActivityData();
        } else if (activitySearchInput.value.trim() === "") {
          fetchAndDisplayActivityData();
        }
      });
    }

    if (activitySearchButton) {
      activitySearchButton.addEventListener("click", (e) => {
        e.preventDefault();
        const searchQuery = document
          .getElementById("activity-search-input")
          .value.trim();
        if (searchQuery === "") {
          alert("Please enter a search term to search.");
          fetchAndDisplayActivityData();
        } else {
          fetchAndDisplayActivityData();
        }
      });
    }

    const todayDate = new Date().toISOString().split("T")[0];
    if (activityDateFilter) {
      activityDateFilter.value = todayDate;
    }

    fetchAndDisplayActivityData();
  }

  async function fetchAndDisplayActivityData() {
    showFullScreenLoader();

    const activityDateFilter = document.getElementById("activity-date-filter");
    const activitySearchInput = document.getElementById(
      "activity-search-input"
    );
    const errorEl = document.getElementById("activity-error-message");
    const dataContainerEl = document.getElementById("activity-data-container");

    const selectedDate = activityDateFilter ? activityDateFilter.value : "";
    const searchQuery = activitySearchInput
      ? activitySearchInput.value.trim().toLowerCase()
      : "";

    errorEl.textContent = "";
    dataContainerEl.innerHTML = "";
    const activityCountEl = document.getElementById("activity-count-title");
    if (activityCountEl) {
      activityCountEl.textContent = `  ASA Electra Activities (Loading...)`;
    }

    let filteredActivities = [];

    try {
      if (selectedDate && cachedActivities.date !== selectedDate) {
        const url = new URL(ACTIVITIES_API_URL);
        url.searchParams.append("date", selectedDate);

        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          window.location.href = "index.html";
          return;
        }

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          localStorage.clear();
          window.location.href = "index.html";
          return;
        }
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.detail ||
            `Server error! Status: ${response.status} ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        cachedActivities =
          data.results && Array.isArray(data.results) ? data.results : [];
        cachedActivities.date = selectedDate;
      }

      filteredActivities = cachedActivities;
      if (searchQuery) {
        filteredActivities = cachedActivities.filter((activity) => {
          const vehicleNumber = (activity.vehicle_number || "").toLowerCase();
          const categoryName = (activity.category_name || "").toLowerCase();
          const entryMode = (activity.entry_mode || "").toLowerCase();
          const denialReason = (
            activity.transaction_denial_reason || ""
          ).toLowerCase();

          return (
            vehicleNumber.includes(searchQuery) ||
            categoryName.includes(searchQuery) ||
            entryMode.includes(searchQuery) ||
            denialReason.includes(searchQuery)
          );
        });
      }

      if (filteredActivities.length > 0) {
        renderActivityTable(filteredActivities, dataContainerEl);
      } else {
        dataContainerEl.innerHTML =
          "<p>No activity records found for the applied filters.</p>";
      }
    } catch (error) {
      console.error("Error fetching activity data:", error);
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("net::ERR_INTERNET_DISCONNECTED")
      ) {
        errorEl.textContent =
          "Could not connect to the server. Please check your internet connection or try again later.";
      } else {
        errorEl.textContent = `Failed to load activity data. Details: ${error.message}`;
      }
    } finally {
      hideFullScreenLoader();
      const activityCountEl = document.getElementById("activity-count-title");
      if (activityCountEl) {
        const displayCount = filteredActivities.length;
        activityCountEl.textContent = ` ASA Electra Activities (${displayCount})`;
      }
    }
  }

  async function fetchDashboardSummary() {
    showFullScreenLoader();

    const dashboardContentEl = document.getElementById("dashboard-content");
    if (!dashboardContentEl) {
      console.error("Dashboard content element not found!");
      hideFullScreenLoader();
      return;
    }

    dashboardContentEl.innerHTML = `
        <section class="dashboard-header">
            <p style="font-size: 2rem; font-weight: bold; margin-bottom: 0;">Hi, Adesh 👋</p>
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
      const url = new URL(ACTIVITIES_API_URL);
      url.searchParams.append("date", today);

      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        window.location.href = "index.html";
        return;
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "index.html";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();
      const activities =
        data.results && Array.isArray(data.results) ? data.results : [];

      let totalEntries = 0;
      let totalExits = 0;
      let totalPasses = 0;
      let totalCollection = 0;
      let totalVehiclesInside = 0;

      dashboardCategoryImages = { entry: [], exit: [], pass: [], inside: [] };

      activities.forEach((activity) => {
        const eventType = (activity.event_type || "").toLowerCase();
        const amount = parseFloat(activity.amount) || 0;
        const isFocApplied = activity.foc_applied === true;

        const fullEntryImageUrl =
          activity.entry_image && !activity.entry_image.includes("Parkmate.png")
            ? `${BASE_URL_FOR_IMAGES}${activity.entry_image}`
            : null;
        const fullExitImageUrl =
          activity.exit_image && !activity.exit_image.includes("Parkmate.png")
            ? `${BASE_URL_FOR_IMAGES}${activity.exit_image}`
            : null;

        if (eventType === "entry") {
          totalEntries++;
          if (fullEntryImageUrl) {
            dashboardCategoryImages.entry.push({
              src: fullEntryImageUrl,
              alt: `Entry: ${activity.vehicle_number || "N/A"}`,
            });
          }
        } else if (eventType === "exit") {
          totalExits++;
          if (fullExitImageUrl) {
            dashboardCategoryImages.exit.push({
              src: fullExitImageUrl,
              alt: `Exit: ${activity.vehicle_number || "N/A"}`,
            });
          }
        }

        if (isFocApplied) {
          totalPasses++;
          if (fullEntryImageUrl) {
            dashboardCategoryImages.pass.push({
              src: fullEntryImageUrl,
              alt: `Pass Entry: ${activity.vehicle_number || "N/A"}`,
            });
          } else if (fullExitImageUrl) {
            dashboardCategoryImages.pass.push({
              src: fullExitImageUrl,
              alt: `Pass Exit: ${activity.vehicle_number || "N/A"}`,
            });
          }
        }
        totalCollection += amount;
      });

      totalVehiclesInside = totalEntries - totalExits;
      totalVehiclesInside = Math.max(0, totalVehiclesInside);

      const exampleEntryImageUrl =
        dashboardCategoryImages.entry.length > 0
          ? dashboardCategoryImages.entry[0].src
          : "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjD1vb9QHY8eACM-bsknP_J1w8JcCuWQ9Jfcluq-QL7ANvHiVDQ1kE3Q6K6pZDhIHAZeIegdipNgzM94yw1lp2i0vAUNzWV5WcLNL7SA9wiTv7EywuWKA4u78v4y-LKEqCTpcc7UQDHCcu3zv0Ape3R-iIoqIZGeQvGGo8p_HJzDYCG0N2xgMLTg5Cd/s2822/IMG_20230210_180219.jpg";
      const exampleExitImageUrl =
        dashboardCategoryImages.exit.length > 0
          ? dashboardCategoryImages.exit[0].src
          : "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjD1vb9QHY8eACM-bsknP_J1w8JcCuWQ9Jfcluq-QL7ANvHiVDQ1kE3Q6K6pZDhIHAZeIegdipNgzM94yw1lp2i0vAUNzWV5WcLNL7SA9wiTv7EywuWKA4u78v4y-LKEqCTpcc7UQDHCcu3zv0Ape3R-iIoqIZGeQvGGo8p_HJzDYCG0N2xgMLTg5Cd/s2822/IMG_20230210_180219.jpg";
      const examplePassImageUrl =
        dashboardCategoryImages.pass.length > 0
          ? dashboardCategoryImages.pass[0].src
          : "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjD1vb9QHY8eACM-bsknP_J1w8JcCuWQ9Jfcluq-QL7ANvHiVDQ1kE3Q6K6pZDhIHAZeIegdipNgzM94yw1lp2i0vAUNzWV5WcLNL7SA9wiTv7EywuWKA4u78v4y-LKEqCTpcc7UQDHCcu3zv0Ape3R-iIoqIZGeQvGGo8p_HJzDYCG0N2xgMLTg5Cd/s2822/IMG_20230210_180219.jpg";
      const exampleInsideImageUrl =
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjD1vb9QHY8eACM-bsknP_J1w8JcCuWQ9Jfcluq-QL7ANvHiVDQ1kE3Q6K6pZDhIHAZeIegdipNgzM94yw1lp2i0vAUNzWV5WcLNL7SA9wiTv7EywuWKA4u78v4y-LKEqCTpcc7UQDHCcu3zv0Ape3R-iIoqIZGeQvGGo8p_HJzDYCG0N2xgMLTg5Cd/s2822/IMG_20230210_180219.jpg";

      dashboardContentEl.innerHTML = `
            <section class="dashboard-header">
                <p style="font-size: 2rem; font-weight: bold; margin-bottom: 0;">Hi, Adesh 👋</p>
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
                                    <img src="${exampleEntryImageUrl}"  class="clickable-image small-table-image" data-category="entry" style="width:40px; height:30px; object-fit: cover;">
                                    <span class="image-count-overlay">${totalEntries}</span>
                                </td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-sign-out-alt fastag-icon"></i> Total Exits</td>
                                <td>${totalExits}</td>
                                <td class="image-with-count-cell">
                                    <img src="${exampleExitImageUrl}"  class="clickable-image small-table-image" data-category="exit" style="width:40px; height:30px; object-fit: cover;">
                                    <span class="image-count-overlay">${totalExits}</span>
                                </td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-ticket-alt fastag-icon"></i> Total Passes</td>
                                <td>${totalPasses}</td>
                                <td class="image-with-count-cell">
                                    <img src="${examplePassImageUrl}"  class="clickable-image small-table-image" data-category="pass" style="width:40px; height:30px; object-fit: cover;">
                                    <span class="image-count-overlay">${totalPasses}</span>
                                </td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-parking fastag-icon"></i> Total Vehicles Inside</td>
                                <td>${totalVehiclesInside} <span class="note">(Approx. based on today's activity)</span></td>
                                <td class="image-with-count-cell">
                                    <img src="${exampleInsideImageUrl}"  class="clickable-image small-table-image" data-category="inside" style="width:40px; height:30px; object-fit: cover;">
                                </td>
                            </tr>
                            <tr class="total-fastag-row">
                                <td colspan="3">
                                    <div class="total-fastag-content">
                                        <i class="fas fa-credit-card fastag-icon"></i> Total Collection: <span class="amount"><i class="fas fa-rupee-sign"></i> ${totalCollection.toFixed(
                                          2
                                        )}</span>
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
                <p style="font-size: 2rem; font-weight: bold; margin-bottom: 0;">Hi, Adesh 👋</p>
                </section>
                <div class="date-picker">
                    <i class="fas fa-calendar-alt"></i> <span id="current-date"></span>
                </div>
            <hr />
            <p style="text-align: center; padding: 20px; color: red;">Failed to load dashboard data. Details: ${error.message}</p>
        `;
      updateCurrentDate();
    } finally {
      hideFullScreenLoader();
    }
  }

  function renderActivityTable(activities, containerElement) {
    const tableContainer = document.createElement("div");
    tableContainer.classList.add("activity-table-container");

    const table = document.createElement("table");
    table.classList.add("activity-table");
    table.innerHTML = `
        <thead>
            <tr>
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
                <th>Image</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    activities.forEach((activity) => {
      const entryTime = activity.entry_time
        ? new Date(activity.entry_time).toLocaleString()
        : "N/A";
      const exitTime = activity.exit_time
        ? new Date(activity.exit_time).toLocaleString()
        : "N/A";
      const isPaid = activity.paid ? "Yes" : "No";
      const amount = activity.amount !== null ? activity.amount : "N/A";
      const isFocApplied = activity.foc_applied === true ? "Yes" : "No";
      const denialReason = activity.transaction_denial_reason || "N/A";

      const apiEntryImageUrl =
        activity.entry_image &&
        activity.entry_image.trim() !== "" &&
        !activity.entry_image.includes("Parkmate.png")
          ? `${BASE_URL_FOR_IMAGES}${activity.entry_image}`
          : null;
      const apiExitImageUrl =
        activity.exit_image &&
        activity.exit_image.trim() !== "" &&
        !activity.exit_image.includes("Parkmate.png")
          ? `${BASE_URL_FOR_IMAGES}${activity.exit_image}`
          : null;
      const displayImageUrl =
        apiEntryImageUrl ||
        apiExitImageUrl ||
        "https://via.placeholder.com/50x50?text=No+Img";

      if (apiEntryImageUrl) {
        allActivityImages.push({
          src: apiEntryImageUrl,
          alt: `Entry: ${activity.vehicle_number || "N/A"}`,
        });
      }
      if (apiExitImageUrl) {
        allActivityImages.push({
          src: apiExitImageUrl,
          alt: `Exit: ${activity.vehicle_number || "N/A"}`,
        });
      }

      const row = document.createElement("tr");
      row.innerHTML = `
            <td data-label="Vehicle #">${activity.vehicle_number || "N/A"}</td>
            <td data-label="Event Type"><span class="event-type-${(
              activity.event_type || ""
            ).toLowerCase()}">${activity.event_type || "N/A"}</span></td>
            <td data-label="Category">${activity.category_name || "N/A"}</td>
            <td data-label="Entry Time">${entryTime}</td>
            <td data-label="Exit Time">${exitTime}</td>
            <td data-label="Mode">${activity.entry_mode || "N/A"}</td>
            <td data-label="Paid">${isPaid}</td>
            <td data-label="Pass (FOC)">${isFocApplied}</td>
            <td data-label="Amount">${amount}</td>
            <td data-label="Denial Reason">${denialReason}</td>
            <td data-label="Image">
                <img src="${displayImageUrl}" alt="Vehicle Image" class="activity-table-image clickable-image" data-category="activity">
            </td>
        `;
      tbody.appendChild(row);
    });

    tableContainer.appendChild(table);
    containerElement.innerHTML = "";
    containerElement.appendChild(tableContainer);
    setupImageClickListeners(tableContainer);
  }

  // --- -----------------------Logout Function-------------------------------- ---
  async function logout() {
    showFullScreenLoader();
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!accessToken && !refreshToken) {
      localStorage.clear();
      window.location.href = "index.html";
      return;
    }

    try {
      const response = await fetch(LOGOUT_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!response.ok) {
        console.error("Logout API failed:", await response.text());
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      hideFullScreenLoader();
      localStorage.clear();
      window.location.href = "index.html";
    }
  }

  // --- -----------------------Lightbox & Image Functions --------------------------- ---

  function setupImageClickListeners(container) {
    const images = container.querySelectorAll(".clickable-image");
    images.forEach((img) => {
      img.removeEventListener("click", handleImageClick);
      img.addEventListener("click", handleImageClick);
    });
  }

  function handleImageClick(event) {
    const clickedImage = event.target;
    const category = clickedImage.dataset.category;

    if (clickedImage.src.includes("No+Img")) {
      return;
    }

    let imagesToShow = [];
    let galleryTitle = "Images";

    if (category === "activity") {
      imagesToShow.push({ src: clickedImage.src, alt: clickedImage.alt });
      galleryTitle = "Activity Image";
      openSingleLightbox(
        imagesToShow[0].src,
        imagesToShow[0].alt,
        galleryTitle
      );
    } else if (category in dashboardCategoryImages) {
      imagesToShow = dashboardCategoryImages[category];
      galleryTitle = `${
        category.charAt(0).toUpperCase() + category.slice(1)
      } Images`;
      openGridLightbox(imagesToShow, galleryTitle);
    }
  }

  function openGridLightbox(images, title) {
    lightboxGridContainer.innerHTML = "";
    captionText.innerHTML = "";
    if (images.length === 0) {
      lightboxGridContainer.innerHTML =
        '<p style="color:white; text-align:center; padding: 20px;">No images available for this category.</p>';
    } else {
      images.forEach((imgData) => {
        const imgElement = document.createElement("img");
        imgElement.src = imgData.src;
        imgElement.alt = imgData.alt;
        imgElement.classList.add("modal-grid-image");
        lightboxGridContainer.appendChild(imgElement);
      });
      lightboxGridContainer.style.display = "grid";
      lightboxGridContainer.style.gridTemplateColumns = "repeat(2, 1fr)";
      lightboxGridContainer.style.gap = "10px";
      lightboxGridContainer.style.overflowY = "auto";
    }
    captionText.innerHTML = `${title} (${images.length} images)`;
    lightbox.style.display = "block";
  }

  function openSingleLightbox(imageSrc, imageAlt, title) {
    lightboxGridContainer.innerHTML = "";
    captionText.innerHTML = "";
    lightboxGridContainer.style.display = "flex";
    lightboxGridContainer.style.gridTemplateColumns = "none";
    lightboxGridContainer.style.gap = "0";
    lightboxGridContainer.style.overflowY = "hidden";
    const imgElement = document.createElement("img");
    imgElement.src = imageSrc;
    imgElement.alt = imageAlt;
    imgElement.classList.add("modal-single-image");
    lightboxGridContainer.appendChild(imgElement);
    captionText.innerHTML = title;
    lightbox.style.display = "block";
  }

  function closeLightbox() {
    lightbox.style.display = "none";
    lightboxGridContainer.innerHTML = "";
    captionText.innerHTML = "";
  }

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

  function updateCurrentDate() {
    const dateElement = document.getElementById("current-date");
    if (dateElement) {
      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      dateElement.textContent = today;
    }
  }

  function showFullScreenLoader() {
    const loaderElement = document.getElementById("full-screen-loader");
    if (loaderElement) {
      loaderElement.style.display = "flex";
    }
  }

  function hideFullScreenLoader() {
    const loaderElement = document.getElementById("full-screen-loader");
    if (loaderElement) {
      loaderElement.style.display = "none";
    }
  }

  const lastActiveSectionId = localStorage.getItem("lastActiveSection");
  let activeSection;
  if (lastActiveSectionId) {
    activeSection = document.getElementById(lastActiveSectionId);
  }

  if (activeSection && activeSection.id === "activities-section") {
    showSection(activitiesSection);
    setActiveLink(activitiesLink.parentElement);
    setupActivitiesSection();
  } else if (activeSection && activeSection.id === "manual-passes-section") {
    showSection(passesSection);
    setActiveLink(passesLink.parentElement);
    setupPassesPage();
  } else if (activeSection && activeSection.id === "hardware-section") {
    showSection(hardwareSection);
    setActiveLink(hardwareLink.parentElement);
  } else if (activeSection && activeSection.id === "tag-section") {
    showSection(tagsSection);
    setActiveLink(tagsLink.parentElement);
  } else if (activeSection && activeSection.id === "reports-section") {
    showSection(reportsSection);
    setActiveLink(reportsLink.parentElement);
  } else {
    showSection(dashboardSection);
    setActiveLink(dashboardLink.parentElement);
    fetchDashboardSummary();
  }

  function updateCurrentDate() {
    const dateElement = document.getElementById("current-date");
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    if (dateElement) {
      dateElement.textContent = now.toLocaleDateString("en-US", options);
    }
  }

  function initializeApp() {
    const lastActiveSection = localStorage.getItem("lastActiveSection");
    const sections = {
      "dashboard-content": {
        element: dashboardSection,
        link: dashboardLink,
        initFunc: fetchDashboardSummary,
      },
      "activities-section": {
        element: activitiesSection,
        link: activitiesLink,
        initFunc: setupActivitiesSection,
      },
      "hardware-section": {
        element: hardwareSection,
        link: hardwareLink,
        initFunc: () => {},
      },
      "manual-passes-section": {
        element: passesSection,
        link: passesLink,
        initFunc: () => {},
      },
      "tag-section": {
        element: tagsSection,
        link: tagsLink,
        initFunc: () => {},
      },
      "reports-section": {
        element: reportsSection,
        link: reportsLink,
        initFunc: () => {},
      },
    };

    if (lastActiveSection && sections[lastActiveSection]) {
      const section = sections[lastActiveSection];
      showSection(section.element);
      setActiveLink(section.link.parentElement);
      section.initFunc();
    } else {
      showSection(dashboardSection);
      setActiveLink(dashboardLink.parentElement);
      fetchDashboardSummary();
      localStorage.setItem("lastActiveSection", "dashboard-content");
    }
  }

  initializeApp();

  // ------------------------------Passes Start ------------------------------------------

  
  const setupPassesPage = () => {
    const passesSection = document.getElementById("manual-passes-section");
    if (!passesSection) {
      console.error("Passes section element not found!");
      return;
    }

    const passModal = document.getElementById("pass-modal");
    const passModalContent = document.getElementById("pass-modal-content");
    const closePassModalBtn = passModal
      ? passModal.querySelector(".close-btn")
      : null;

    let allPasses = [];

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    passesSection.innerHTML = `
        <div class="header-container">
            <h2 id="passes-count-title">Pass Dashboard</h2>
            <p style="margin-bottom: 20px;">Showing passes as of ${today}</p>
            <div class="actions">
                <div class="search-container">
                    <input type="text" id="pass-search-input" placeholder="Search passes..." />
                    <button id="pass-search-btn" class="search-btn"><i class="fas fa-search"></i> Search</button>
                </div>
                <button id="add-pass-btn" class="add-btn"><i class="fas fa-plus"></i> Add New Pass</button>
            </div>
        </div>
        <p class="loading" id="passes-loading-message" style="display: none;">Loading passes...</p>
        <div id="passes-table" class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Vehicle No.</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Amount</th>
                        <th>Expiry Date</th>
                        <th>User Name</th>
                        <th>Active</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="passes-container"></tbody>
            </table>
        </div>
    `;

    const passesContainer = document.getElementById("passes-container");
    const passesCountTitle = document.getElementById("passes-count-title");
    const proxyUrl = "https://dashboard.asaelectra.in:9000/api/v1/pass/";

    const createPassForm = (pass = {}) => {
      if (!passModal || !passModalContent) {
        console.error("Pass modal elements not found!");
        return;
      }
      passModalContent.innerHTML = "";
      const formTitle = document.createElement("h2");
      formTitle.id = "pass-form-title";
      formTitle.innerText = pass.id ? "Update Pass" : "Add New Pass";
      const passForm = document.createElement("form");
      passForm.id = "pass-form";

      const createInput = (
        id,
        labelText,
        type,
        value = "",
        required = false,
        readonly = false
      ) => {
        const label = document.createElement("label");
        label.htmlFor = id;
        label.innerText = labelText;
        const input = document.createElement("input");
        input.type = type;
        input.id = id;
        input.value = value;
        input.required = required;
        input.readOnly = readonly;
        passForm.appendChild(label);
        passForm.appendChild(input);
        return input;
      };

      createInput("pass-id", "Pass ID:", "hidden", pass.id || "");
      createInput(
        "project_id",
        "Project ID:",
        "number",
        pass.project_id || "1",
        true,
        true
      );
      createInput(
        "vehicle_number",
        "Vehicle Number:",
        "text",
        pass.vehicle_number || "",
        true
      );
      createInput(
        "pass_type",
        "Pass Type:",
        "number",
        pass.pass_type || "3",
        true
      );
      createInput(
        "user_name",
        "User Name:",
        "text",
        pass.config?.name || "",
        true
      );
      const expiryDateValue = pass.expiry_date
        ? new Date(pass.expiry_date).toISOString().split("T")[0]
        : "";
      createInput("expiry_date", "Expiry Date:", "date", expiryDateValue, true);
      createInput("amount", "Amount:", "number", pass.amount || "1200");
      createInput(
        "building_id",
        "Building ID:",
        "number",
        pass.building_id || "1"
      );
      createInput("floor_id", "Floor ID:", "number", pass.floor_id || "1");
      createInput(
        "company_id",
        "Company ID:",
        "number",
        pass.company_id || "1"
      );
      createInput(
        "category_id",
        "Category ID:",
        "number",
        pass.category_id || "1"
      );
      createInput(
        "slot_allocation_type",
        "Slot Allocation Type:",
        "text",
        pass.slot_allocation_type || "general"
      );
      createInput(
        "wheel_count",
        "Wheel Count:",
        "number",
        pass.wheel_count || "4"
      );
      createInput(
        "vehicle_type",
        "Vehicle Type:",
        "number",
        pass.vehicle_type || "3"
      );
      createInput("epc_code", "EPC Code:", "text", pass.epc_code || "");

      const isActiveLabel = document.createElement("label");
      isActiveLabel.htmlFor = "is_active";
      isActiveLabel.innerText = "Is Active:";
      const isActiveInput = document.createElement("input");
      isActiveInput.type = "checkbox";
      isActiveInput.id = "is_active";
      isActiveInput.checked =
        pass.is_active !== undefined ? pass.is_active : false;
      passForm.appendChild(isActiveLabel);
      passForm.appendChild(isActiveInput);

      const buttonContainer = document.createElement("div");
      buttonContainer.classList.add("form-buttons");

      const submitButton = document.createElement("button");
      submitButton.type = "submit";
      submitButton.className = "add-btn";
      submitButton.id = "pass-submit-button";
      submitButton.innerText = pass.id ? "Update Pass" : "Add Pass";

      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "cancel-btn";
      cancelButton.id = "pass-cancel-button-form";
      cancelButton.innerText = "Cancel";

      buttonContainer.appendChild(submitButton);
      buttonContainer.appendChild(cancelButton);

      passForm.appendChild(buttonContainer);

      passModalContent.appendChild(formTitle);
      passModalContent.appendChild(passForm);
      passModal.style.display = "block";
    };

    const fetchPasses = async () => {
      showFullScreenLoader();
      if (!passesContainer || !passesCountTitle) {
        hideFullScreenLoader();
        return;
      }

      passesCountTitle.textContent = " ASA ElectraPass Dashboard (Loading...)";
      passesContainer.innerHTML = "";
      try {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          window.location.href = "index.html";
          return;
        }

        const response = await fetch(proxyUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          localStorage.clear();
          window.location.href = "index.html";
          return;
        }

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(
            errData.detail || `HTTP error! Status: ${response.status}`
          );
        }

        const data = await response.json();
        allPasses = data.results || [];
        renderPasses(allPasses);
      } catch (error) {
        console.error("Error fetching passes:", error);
        passesContainer.innerHTML = `<tr><td colspan="9">Failed to load data. Error: ${error.message}</td></tr>`;
        passesCountTitle.textContent = "Pass Dashboard (0)";
      } finally {
        hideFullScreenLoader();
      }
    };

    const renderPasses = (passes) => {
      if (!passesContainer || !passesCountTitle) return;

      passesContainer.innerHTML = "";
      if (Array.isArray(passes) && passes.length > 0) {
        passes.forEach((pass) => {
          const row = document.createElement("tr");
          row.setAttribute("data-pass", JSON.stringify(pass));
          row.innerHTML = `
                    <td>${pass.id || "N/A"}</td>
                    <td>${pass.vehicle_number || "N/A"}</td>
                    <td>${
                      pass.start_time
                        ? new Date(pass.start_time).toLocaleString()
                        : "N/A"
                    }</td>
                    <td>${
                      pass.end_time
                        ? new Date(pass.end_time).toLocaleString()
                        : "N/A"
                    }</td>
                    <td>${pass.amount || "N/A"}</td>
                    <td>${
                      pass.expiry_date
                        ? new Date(pass.expiry_date).toLocaleDateString()
                        : "N/A"
                    }</td>
                    <td>${pass.config?.name || "N/A"}</td>
                    <td>${
                      pass.is_active !== undefined
                        ? pass.is_active
                          ? "Yes"
                          : "No"
                        : "N/A"
                    }</td>
                    <td>
                        <button class="update-btn" data-id="${
                          pass.id
                        }"><i class="fas fa-edit"></i> Edit</button>
                    </td>
                `;
          passesContainer.appendChild(row);
        });
        passesCountTitle.textContent = `Pass Dashboard (${passes.length})`;
      } else {
        passesContainer.innerHTML =
          '<tr><td colspan="9">No passes data found.</td></tr>';
        passesCountTitle.textContent = "Pass Dashboard (0)";
      }
    };

    const handleSearch = () => {
      const searchInput = document.getElementById("pass-search-input");
      const searchTerm = searchInput.value.toLowerCase();
      const passesCountTitle = document.getElementById("passes-count-title");

      const filteredPasses = allPasses.filter((pass) => {
        const vehicleNumber = String(pass.vehicle_number || "").toLowerCase();
        const userName = String(pass.config?.name || "").toLowerCase();
        const epcCode = String(pass.epc_code || "").toLowerCase();

        return (
          vehicleNumber.includes(searchTerm) ||
          userName.includes(searchTerm) ||
          epcCode.includes(searchTerm)
        );
      });

      if (passesCountTitle) {
        passesCountTitle.textContent = `Pass Dashboard (${filteredPasses.length})`;
      }
      renderPasses(filteredPasses);
    };

    if (closePassModalBtn) {
      closePassModalBtn.addEventListener("click", () => {
        passModal.style.display = "none";
      });
    }

    if (passModal) {
      passModal.addEventListener("click", (event) => {
        if (
          event.target.id === "pass-cancel-button-form" ||
          event.target === passModal
        ) {
          event.preventDefault();
          passModal.style.display = "none";
        }
      });
      passModalContent.addEventListener("submit", async (e) => {
        e.preventDefault();
        const passId = document.getElementById("pass-id").value;
        const method = passId ? "PUT" : "POST";
        const url = passId ? `${proxyUrl}${passId}/` : proxyUrl;

        const passData = {
          project_id: parseInt(document.getElementById("project_id").value),
          pass_type: parseInt(document.getElementById("pass_type").value),
          vehicle_number: document.getElementById("vehicle_number").value,
          expiry_date:
            document.getElementById("expiry_date").value + "T00:00:00+05:30",
          config: {
            name: document.getElementById("user_name").value,
          },
          building_id:
            parseInt(document.getElementById("building_id").value) || null,
          floor_id: parseInt(document.getElementById("floor_id").value) || null,
          company_id:
            parseInt(document.getElementById("company_id").value) || null,
          category_id:
            parseInt(document.getElementById("category_id").value) || 1,
          slot_allocation_type:
            document.getElementById("slot_allocation_type").value || "general",
          wheel_count:
            parseInt(document.getElementById("wheel_count").value) || 4,
          vehicle_type:
            parseInt(document.getElementById("vehicle_type").value) || 3,
          epc_code: document.getElementById("epc_code").value || null,
          amount: parseFloat(document.getElementById("amount").value) || 0,
          is_active: document.getElementById("is_active").checked,
        };

        try {
          showFullScreenLoader();
          const accessToken = localStorage.getItem("access_token");
          const response = await fetch(url, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(passData),
          });

          if (response.status === 401) {
            localStorage.clear();
            window.location.href = "index.html";
            return;
          }

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || JSON.stringify(errData));
          }
          passModal.style.display = "none";
          fetchPasses();
        } catch (error) {
          console.error("Operation failed:", error);
          alert(`Operation failed: ${error.message}`);
        } finally {
          hideFullScreenLoader();
        }
      });
    }

    passesSection.addEventListener("click", async (e) => {
      if (e.target.closest("#add-pass-btn")) {
        createPassForm();
      } else if (e.target.closest(".update-btn")) {
        const row = e.target.closest("tr");
        const passId = row.querySelector(".update-btn").dataset.id;
        try {
          showFullScreenLoader();
          const accessToken = localStorage.getItem("access_token");
          if (!accessToken) {
            window.location.href = "index.html";
            return;
          }
          const response = await fetch(`${proxyUrl}${passId}/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (!response.ok) {
            throw new Error(
              `Failed to fetch pass details. Status: ${response.status}`
            );
          }
          const passData = await response.json();
          createPassForm(passData);
          passModal.style.display = "block";
        } catch (error) {
          console.error("Error fetching pass details:", error);
          alert("Failed to load pass details for editing.");
        } finally {
          hideFullScreenLoader();
        }
      } else if (e.target.closest("#pass-search-btn")) {
        handleSearch();
      }
    });

    const searchInput = document.getElementById("pass-search-input");
    if (searchInput) {
      searchInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
          handleSearch();
        } else if (searchInput.value.trim() === "") {
          renderPasses(allPasses);
        }
      });
    }

    fetchPasses();
  };

  // ============================= Passes End ================================


  
  // ============================= Tags Start ================================

  // ----------------------------------------- Authentication Start -------------------------------

  const API_BASE_URL = "https://dashboard.asaelectra.in:9000/api/";

  const ACCESS_TOKEN_KEY = "access_token";
  const REFRESH_TOKEN_KEY = "refresh_token";

  const showNotification = (message, type = "error") => {
    let notificationContainer = document.querySelector(
      ".notification-container"
    );
    if (!notificationContainer) {
      notificationContainer = document.createElement("div");
      notificationContainer.className = "notification-container";
      document.body.appendChild(notificationContainer);
    }
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `<p>${message}</p>`;
    notificationContainer.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("hide");
      notification.addEventListener("transitionend", () =>
        notification.remove()
      );
    }, 5000);
  };

  const saveTokens = (access, refresh) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  };

  const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  };

  const loginUser = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const data = await response.json();
      saveTokens(data.access, data.refresh);
      console.log("Login successful! Tokens saved.");
      return data;
    } catch (error) {
      console.error("Login Error:", error);
      showNotification("Login failed. Please check your credentials.");
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refresh_token) {
        throw new Error("No refresh token found.");
      }

      const response = await fetch(`${API_BASE_URL}token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refresh_token }),
      });

      if (!response.ok) {
        clearTokens();
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const data = await response.json();
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      console.log("Access token refreshed!");
      return data.access;
    } catch (error) {
      console.error("Token Refresh Error:", error);
      showNotification("Session expired. Please log in again.", "info");
      throw error;
    }
  };

  const apiFetch = async (url, options = {}) => {
    let access_token = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!access_token) {
      window.location.href = "index.html";
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
      ...options.headers,
    };

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      console.log("Access token expired. Attempting to refresh...");
      try {
        const new_access_token = await refreshToken();
        headers["Authorization"] = `Bearer ${new_access_token}`;

        response = await fetch(url, { ...options, headers });
      } catch (refreshError) {
        console.error("Auto-refresh failed. Redirecting to login.");
        clearTokens();
        window.location.href = "index.html";
        return;
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    return response.json();
  };

  const logoutUser = async () => {
    try {
      const access_token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (access_token) {
        await fetch(`${API_BASE_URL}logout/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
        console.log("Logged out successfully.");
      }
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      clearTokens();
      window.location.href = "index.html";
    }
  };
  // ============================= Authentication End ================================

  // -------------------------------------- Tags Section Code Start--------------------------------

  const tagSection = document.getElementById("tag-section");
  const tagModal = document.getElementById("tag-modal");
  const tagModalContent = document.getElementById("tag-modal-content");

  const setupTagsPage = () => {
    if (!tagSection) {
      console.error("Tag section element not found!");
      return;
    }

    tagSection.innerHTML = `
        <div class="header-container">
            <h1 class="page-title">Parkmate Tags Dashboard</h1>
            <div class="actions-container">
                <div class="search-box">
                    <input type="text" id="tag-search-input" placeholder="Search by Username, Vehicle Number or Tag ID">
                    <button id="tag-search-btn" class="search-btn"><i class="fas fa-search"></i></button>
                </div>
                <button id="add-tag-btn" class="add-btn"><i class="fas fa-plus"></i> Add New Tag</button>
            </div>
        </div>
        <p class="loading" id="tag-loading">Loading tags...</p>
        <div id="tags-container" class="tags-table-container"></div>
    `;

    const addTagBtn = document.getElementById("add-tag-btn");
    if (addTagBtn) {
      addTagBtn.addEventListener("click", () => createTagForm());
    }

    const searchInput = document.getElementById("tag-search-input");
    const searchBtn = document.getElementById("tag-search-btn");

    if (searchInput && searchBtn) {
      const performSearch = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const rows = document.querySelectorAll(
          "#tags-container table tbody tr"
        );
        rows.forEach((row) => {
          const username = row.children[1].textContent.toLowerCase();
          const vehicleNumber = row.children[2].textContent.toLowerCase();
          const staticTagId = row.children[3].textContent.toLowerCase();

          if (
            username.includes(searchTerm) ||
            vehicleNumber.includes(searchTerm) ||
            staticTagId.includes(searchTerm)
          ) {
            row.style.display = "";
          } else {
            row.style.display = "none";
          }
        });
      };

      searchBtn.addEventListener("click", performSearch);
      searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
          performSearch();
        }
      });
    }

    tagSection.addEventListener("click", async (e) => {
      if (e.target.closest(".update-tag-btn")) {
        const tagId = e.target.closest(".update-tag-btn").dataset.id;
        try {
          const tag = await apiFetch(`${API_BASE_URL}v1/tag/${tagId}/`);
          createTagForm(tag);
        } catch (error) {
          console.error("Error fetching tag details:", error);
          showNotification("Failed to load tag details for editing.");
        }
      }
    });

    fetchTagsAndRender();
  };

  const createTagForm = (tag = {}) => {
    if (!tagModal || !tagModalContent) {
      console.error("Tag modal elements not found!");
      return;
    }

    tagModalContent.innerHTML = `<span class="close-btn">&times;</span>`;

    const formTitle = document.createElement("h2");
    formTitle.id = "tag-form-title";
    formTitle.innerText = tag.id ? "Update Tag" : "Add New Tag";

    const tagForm = document.createElement("form");
    tagForm.id = "tag-form";

    const fields = [
      {
        label: "Project ID:",
        id: "tag-project-id",
        type: "number",
        value: tag.project_id || 1,
        required: true,
        readonly: true,
      },
      {
        label: "Username:",
        id: "tag-username",
        type: "text",
        value: tag.username || "",
        required: true,
      },
      {
        label: "Vehicle Number:",
        id: "tag-vehicle-number",
        type: "text",
        value: tag.vehicle_number || "",
        required: true,
      },
      {
        label: "Static Tag ID:",
        id: "static-tag-id",
        type: "text",
        value: tag.tag_id || "",
        required: true,
      },
      {
        label: "EPC Code:",
        id: "tag-epc-code",
        type: "text",
        value: tag.epc_code || "",
      },
      {
        label: "Contact:",
        id: "tag-contact",
        type: "text",
        value: tag.contact || "",
      },
      {
        label: "Email:",
        id: "tag-email",
        type: "email",
        value: tag.email || "",
      },
      {
        label: "Slot Allocation Type:",
        id: "tag-slot-allocation-type",
        type: "text",
        value: tag.slot_allocation_type || "",
        required: true,
      },
      {
        label: "Vehicle Type:",
        id: "tag-vehicle-type",
        type: "text",
        value: tag.vehicle_type || "",
        required: true,
      },
    ];

    fields.forEach((field) => {
      const label = document.createElement("label");
      label.setAttribute("for", field.id);
      label.textContent = field.label;

      const input = document.createElement("input");
      input.type = field.type;
      input.id = field.id;
      input.value = field.value;
      if (field.required) input.required = true;
      if (field.readonly) input.readOnly = true;

      tagForm.appendChild(label);
      tagForm.appendChild(input);
    });

    // -----------------------------------Is Active switch--------------------------------//

    const activeContainer = document.createElement("div");
    activeContainer.className = "is-active-container";
    activeContainer.innerHTML = `
        <label for="tag-is-active">Is Active:</label>
        <label class="switch">
            <input type="checkbox" id="tag-is-active" ${
              tag.is_active !== undefined && tag.is_active ? "checked" : ""
            }>
            <span class="slider"></span>
        </label>
    `;
    tagForm.appendChild(activeContainer);

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = "tag-id";
    hiddenInput.value = tag.id || "";
    tagForm.appendChild(hiddenInput);

    const formButtons = document.createElement("div");
    formButtons.className = "form-buttons";
    formButtons.innerHTML = `
        <button type="submit" class="add-btn" id="tag-submit-button">${
          tag.id ? "Update Tag" : "Add Tag"
        }</button>
        <button type="button" class="cancel-btn" id="tag-cancel-button-form">Cancel</button>
    `;
    tagForm.appendChild(formButtons);

    tagModalContent.appendChild(formTitle);
    tagModalContent.appendChild(tagForm);

    tagModal.style.display = "flex";

    document
      .getElementById("tag-cancel-button-form")
      .addEventListener("click", () => {
        tagModal.style.display = "none";
      });

    tagModalContent
      .querySelector(".close-btn")
      .addEventListener("click", () => {
        tagModal.style.display = "none";
      });

    tagForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const tagId = document.getElementById("tag-id").value;
      const method = tagId ? "PUT" : "POST";
      const url = tagId
        ? `${API_BASE_URL}v1/tag/${tagId}/`
        : `${API_BASE_URL}v1/tag/`;

      const tagData = {
        project_id: parseInt(document.getElementById("tag-project-id").value),
        vehicle_number: document.getElementById("tag-vehicle-number").value,
        tag_id: document.getElementById("static-tag-id").value,
        epc_code: document.getElementById("tag-epc-code").value || null,
        username: document.getElementById("tag-username").value,
        contact: document.getElementById("tag-contact").value,
        email: document.getElementById("tag-email").value,
        is_active: document.getElementById("tag-is-active").checked,
        slot_allocation_type: document.getElementById(
          "tag-slot-allocation-type"
        ).value,
        vehicle_type: document.getElementById("tag-vehicle-type").value,
      };

      try {
        await apiFetch(url, {
          method: method,
          body: JSON.stringify(tagData),
        });
        tagModal.style.display = "none";
        showNotification("Tag saved successfully!", "success");
        fetchTagsAndRender();
      } catch (error) {
        console.error("Operation failed:", error);
        const errorDetail =
          JSON.parse(error.message).detail || "Failed to save tag";
        showNotification(`Operation failed: ${errorDetail}`);
      }
    });
  };

  const fetchTagsAndRender = async () => {
    showFullScreenLoader();
    const loadingMessage = document.getElementById("tag-loading");
    const container = document.getElementById("tags-container");
    if (!loadingMessage || !container) {
      hideFullScreenLoader();
      return;
    }

    loadingMessage.style.display = "block";
    container.innerHTML = "";
    try {
      const data = await apiFetch(`${API_BASE_URL}v1/tag/?project_id=1`);
      renderTags(data.results);
    } catch (error) {
      console.error("Error fetching tags:", error);
      const errorDetail =
        JSON.parse(error.message).detail || "Failed to load tag data";
      container.innerHTML = `<p class="error">Failed to load tag data. Error: ${errorDetail}</p>`;
    } finally {
      loadingMessage.style.display = "none";
      hideFullScreenLoader();
    }
  };

  const renderTags = (tags) => {
    const container = document.getElementById("tags-container");
    if (!container) return;

    if (Array.isArray(tags) && tags.length > 0) {
      const table = document.createElement("table");
      table.classList.add("tags-table");
      table.innerHTML = `
            <thead>
                <tr>
                    <th>Tag ID</th>
                    <th>Username</th>
                    <th>Vehicle Number</th>
                    <th>Static Tag ID</th>
                    <th>EPC Code</th>
                    <th>Is Active</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Project ID</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
      const tbody = table.querySelector("tbody");
      tags.forEach((tag) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                <td>${tag.id || "N/A"}</td>
                <td>${tag.username || "N/A"}</td>
                <td>${tag.vehicle_number || "N/A"}</td>
                <td>${tag.tag_id || "N/A"}</td>
                <td>${tag.epc_code || "N/A"}</td>
                <td>${tag.is_active ? "Yes" : "No"}</td>
                <td>${tag.contact || "N/A"}</td>
                <td>${tag.email || "N/A"}</td>
                <td>${tag.project_id || "N/A"}</td>
                <td>${
                  tag.created_at
                    ? new Date(tag.created_at).toLocaleString()
                    : "N/A"
                }</td>
                <td>${
                  tag.updated_at
                    ? new Date(tag.updated_at).toLocaleString()
                    : "N/A"
                }</td>
                <td><button class="update-tag-btn" data-id="${
                  tag.id
                }"> <i class="fas fa-edit"></i> Edit</button></td>
            `;
        tbody.appendChild(row);
      });
      container.innerHTML = "";
      container.appendChild(table);
    } else {
      container.innerHTML = "<p>No tag data found.</p>";
    }
  };
  setupTagsPage();

  // =============================--- Tags Section  End ----================================//


  const reports = [
    {
      date: "2024-07-20",
      total_entries: 150,
      total_exits: 120,
      total_passes: 30,
      total_collection: 5000.5,
    },
    {
      date: "2024-07-21",
      total_entries: 165,
      total_exits: 140,
      total_passes: 35,
      total_collection: 5500.75,
    },
    
  ];

  
  function renderReportTable(reports, containerElement) {
    const reportsResult = document.createElement("div");
    reportsResult.classList.add("reports-result");

    const table = document.createElement("table");
    table.classList.add("reports-table");

    table.innerHTML = `
        <thead>
            <tr>
                <th style="width: 50%;">Date</th>
                <th style="width: 50%;">Summary</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    reports.forEach((report) => {
      const reportDate = new Date(report.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const totalEntries = report.total_entries || 0;
      const totalExits = report.total_exits || 0;
      const totalPasses = report.total_passes || 0;
      const totalCollection =
        report.total_collection !== null
          ? parseFloat(report.total_collection).toFixed(2)
          : "0.00";

      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${reportDate}</td>
         <td>
    Entries: ${totalEntries} &nbsp;&nbsp;&nbsp; 
    Exits: ${totalExits} &nbsp;&nbsp;&nbsp;
    Passes: ${totalPasses} &nbsp;&nbsp;&nbsp;
    Collection: <i class="fas fa-rupee-sign"></i> ${totalCollection}
</td>
        `;
      tbody.appendChild(row);
    });

    reportsResult.appendChild(table);
    containerElement.appendChild(reportsResult);
  }

 
  const reportDataContainer = document.getElementById("report-data-container");

  renderReportTable(reports, reportDataContainer);
});



// -----------------------------------Loader --------------------------------------------

const showFullScreenLoader = () => {
  let loader = document.getElementById("full-screen-loader");
  if (loader) {
    loader.style.display = "flex";
    return;
  }

  loader = document.createElement("div");
  loader.id = "full-screen-loader";
  loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(7, 7, 7, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        flex-direction: column;
    `;

  loader.innerHTML = `
        <div class="loader-content" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        ">
            <svg
                width="50"
                height="50"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="conic-gradient" gradientTransform="rotate(90)">
                        <stop offset="20%" stop-color="#00A89F" />
                        <stop offset="30%" stop-color="#01A199" />
                        <stop offset="100%" stop-color="#1D2433" />
                    </linearGradient>
                </defs>
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="url(#conic-gradient)"
                    stroke-width="10"
                    stroke-dasharray="283"
                    stroke-dashoffset="0"
                    stroke-linecap="round"
                    fill="none"
                />
                <animateTransform
                    from="0 0 0"
                    to="360 0 0"
                    attributeName="transform"
                    type="rotate"
                    repeatCount="indefinite"
                    dur="1300ms"
                />
            </svg>
            <p style="
                font-family: 'Noto Sans', sans-serif;
                font-size: 22px;
                font-style: italic;
                color: white;
                font-weight: 300;
                margin-top: 16px;
            ">Loading...</p>
        </div>
    `;

  document.body.appendChild(loader);
};

const hideFullScreenLoader = () => {
  const loader = document.getElementById("full-screen-loader");
  if (loader) {
    loader.style.display = "none";
  }
};

// ============================= Loader Functions End ================================
