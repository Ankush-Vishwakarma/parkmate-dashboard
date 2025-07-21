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

  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-button");
  const tbody = document.querySelector(".activities-table tbody");
  const passesTableBody = document.getElementById("passes-table-body");
  const passesSearchInput = document.getElementById("passes-search-input");
  const hardware__TableBody = document.getElementById("hardware-table-body");
  const overviewTableBody = document.getElementById("overview-table-body"); 

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

  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      setActiveLink(this);
    });
  });

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
  }

  // ------- --------------------------Date pdate Logic--------------------------------
  function updateCurrentDate() {
      const today = new Date();
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      const formattedDate = today.toLocaleDateString('en-IN', options); // Using 'en-IN' for consistency

      const currentDateElement = document.getElementById("current-date");
      if (currentDateElement) {
          currentDateElement.textContent = formattedDate;
      } else {
          console.error("Error: Element with ID 'current-date' not found!");
      }
  }
  updateCurrentDate(); 

  dashboardLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(dashboardContent);
    
  });

  activitiesLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(activitiesSection);
    fetchActivities();
  });

  hardwareLink.addEventListener("click", function (e) {
    e.preventDefault();
    showSection(hardwareSection);
    populateHardwareTable();
  });

  passesLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(passesSection);
    fetchPassesData();
  });

  tagsLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(tagSection);
  });

  reportsLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(reportsSection);
    loadReportsData();
  });

  // ------------------------------------ Overview Data ---------------------------------------------- ---
 




  //----------------------------------- Pass Data ------------------------------------

  function fetchActivities() {
    tbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;
    fetch("https://dummyjson.com/users?limit=100")
      .then((res) => res.json())
      .then((data) => {
        allUsers = data.users;
        renderTable(allUsers);
      })
      .catch(() => {
        tbody.innerHTML = `<tr><td colspan="5">Error loading data.</td></tr>`;
      });
  }

  function renderTable(data) {
    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No results found.</td></tr>`;
      return;
    }

    let rows = "";
    data.forEach((user) => {
      rows += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.firstName} ${user.lastName}</td>
                    <td>${user.gender}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                </tr>`;
    });
    tbody.innerHTML = rows;
  }

  searchBtn.addEventListener("click", function () {
    const keyword = searchInput.value.toLowerCase();
    const filtered = allUsers.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        fullName.includes(keyword) || user.phone.toLowerCase().includes(keyword)
      );
    });
    renderTable(filtered);
  });

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
      .catch(() => {
        passesTableBody.innerHTML = `<tr><td colspan="7">Error loading passes data.</td></tr>`;
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
    if (day >= 11 && day <= 13) return "th";
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

  window.openPassModal = function (isEdit = false, row = null) {
    const modal = document.getElementById("pass-modal");
    modal.style.display = "block";
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
      inputs[4].value = new Date(
        cells[4].textContent.split(" ").slice(2).join(" ")
      )
        .toISOString()
        .split("T")[0];
      inputs[5].value = cells[5].textContent;
    }
  };

  window.closePassModal = function () {
    document.getElementById("pass-modal").style.display = "none";
  };

  window.savePass = function () {
    closePassModal();
  };

  // -----------------------------------------tag data ----------------------------------

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
      const newRow = document.createElement("tr");
      newRow.innerHTML = rowHTML;
      tbody.appendChild(newRow);
    }

    closeTagModal();
  };
  // ------------------------------------  hardwareData Reports-----------------------------------------------------

  function populateHardwareTable() {
    const hardwareData = [
      {
        name: "Camera 1",
        type: "CCTV",
        status: "Online",
        lastCheckIn: "2025-07-17 09:00 AM",
        location: "Entry Gate A",
      },
      {
        name: "Barrier Gate 1",
        type: "Barrier",
        status: "Online",
        lastCheckIn: "2025-07-17 09:05 AM",
        location: "Entry Gate A",
      },
      {
        name: "POS Machine 1",
        type: "POS",
        status: "Offline",
        lastCheckIn: "2025-07-15 04:12 PM",
        location: "Cashier Booth 1",
      },
      {
        name: "Sensor 2",
        type: "Sensor",
        status: "Online",
        lastCheckIn: "2025-07-17 09:10 AM",
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

  showSection(welcomeMessageContent);
});

// --------------------------------report data--------------------------------------

function generateReport() {
  const resultDiv = document.querySelector(".reports-result");
  resultDiv.innerHTML = "<p><strong>Report generated!</strong></p>";
}

const reportData = [
  { date: "2025-07-15", summary: "50 Entries, " },
  { date: "2025-07-16", summary: "80 Entries, " },
  { date: "2025-07-17", summary: "150 Entries, " },
  { date: "2025-07-18", summary: "90 Entries, " },
  { date: "2025-07-19", summary: "110 Entries, " },
];

function loadReportsData() {
  const reportsTableBody = document.getElementById("reports-table-body");
  reportsTableBody.innerHTML = "";

  if (reportData.length === 0) {
    reportsTableBody.innerHTML =
      '<tr><td colspan="2" class="no-results">No report data available.</td></tr>';
    return;
  }

  reportData.forEach((report) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${report.date}</td>
            <td>${report.summary}</td>
        `;
    reportsTableBody.appendChild(row);
  });
}

// ----------------------------------- click image and show large image logic ----------------------------

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const captionText = document.getElementById("caption");
const closeButton = document.querySelector(".close-button");


document.addEventListener("DOMContentLoaded", function () {

  const images = document.querySelectorAll(".clickable-image");
  images.forEach((img) => {
    img.addEventListener("click", function () {
      lightbox.style.display = "flex";
      lightboxImg.src = this.src;
      captionText.innerHTML = this.alt;
    });
  });

  closeButton.addEventListener("click", function () {
    lightbox.style.display = "none";
  });

  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) {
      lightbox.style.display = "none";
    }
  });
});