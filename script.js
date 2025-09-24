document.addEventListener("DOMContentLoaded", () => {
  const layout = document.querySelector(".main-layout");
  if (!layout) return;

  const form = layout.querySelector(".email-form");
  if (!form) return;

  const input = form.querySelector("input[type='email']");
  const groupBox = layout.querySelectorAll(".info-box")[0];
  const privateBox = layout.querySelectorAll(".info-box")[1];
  const masterBox = layout.querySelectorAll(".info-box")[2];
  const cells = layout.querySelectorAll(".grid-container .cell");
  const loader = form.querySelector(".loader");

  const SCRIPT_URL = "https://backendblinkschedule.onrender.com/proxy";
  const hourMap = { "7": 1, "8": 2, "9": 3, "10": 4, "11": 5, "12": 6, "13": 7, "14": 8, "15": 9, "16": 10, "17": 11, "18": 12, "19": 13 };
  const dayMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5 };

  // --- Unified rendering function ---
  function renderClasses(containerSelector, classesByDay, type) {
    const container = layout.querySelector(containerSelector);
    container.innerHTML = "";

    Object.keys(classesByDay).forEach(day => {
      classesByDay[day].forEach(cls => {
        const slot = document.createElement("div");
        slot.classList.add(`${type}-slot`);

        if (type === "group") {
          slot.innerHTML = `
            <p><span class="label">Day:</span> ${day}</p>
            <p><span class="label">Time:</span> ${cls.startHour} - ${cls.endHour}</p>
            <p><span class="label">Room:</span> ${cls.room}</p>
            <p><span class="label">Professor:</span> ${cls.teacher}</p>
          `;
        }

        if (type === "private") {
          slot.innerHTML = `
            <p><span class="label">Day:</span> ${day}</p>
            <p><span class="label">Time:</span> ${cls.startHour} - ${cls.endHour}</p>
            <p><span class="label">Room:</span> ${cls.room}</p>
            <p><span class="label">Professor:</span> ${cls.teacher}</p>
          `;
        }

        if (type === "master") {
          slot.innerHTML = `
            <p><span class="label">Class:</span> ${cls.className}</p>
            <p><span class="label">Day & Time:</span> ${day}, ${cls.startHour} - ${cls.endHour}</p>
            <p><span class="label">Room:</span> ${cls.room}</p>
          `;
        }

        container.appendChild(slot);
      });
    });
  }

  // --- Paint grid function ---
  function paintCell(day, hour, type) {
    const row = hourMap[hour];
    const col = dayMap[day.toLowerCase()];
    if (!row || !col) return;
    const index = 6 + (row - 1) * 6 + col;
    const cell = cells[index];
    if (cell) {
      if (type === "gr") cell.style.backgroundColor = "var(--green)";
      if (type === "pr") cell.style.backgroundColor = "var(--yellow)";
      if (type === "mc") cell.style.backgroundColor = "var(--blue)";
    }
  }

  // --- Form submit ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = input.value.trim().toLowerCase();
    if (!email) return alert("Please enter your email.");

    loader.classList.remove("hidden");

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `email=${encodeURIComponent(email)}`
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (data.error) return alert("We couldn't find your schedule. Please check your email.");

      // Reset boxes
      groupBox.classList.add("hidden");
      privateBox.classList.add("hidden");
      masterBox.classList.add("hidden");

      // Clear grid
      cells.forEach(cell => {
        if (!cell.classList.contains("header-day") && !cell.classList.contains("header-time") && !cell.classList.contains("reloj")) {
          cell.style.backgroundColor = "";
          cell.textContent = "";
          cell.title = "";
        }
      });

      // --- GROUP CLASSES ---
      if (data.hasGroup && data.groupClasses) {
        groupBox.classList.remove("hidden");
        groupBox.classList.add("fade-in");
        renderClasses(".group-classes-container", data.groupClasses, "group");
      }

      // --- PRIVATE CLASSES ---
      if (data.hasPrivate && data.privateClasses) {
        privateBox.classList.remove("hidden");
        privateBox.classList.add("fade-in");
        renderClasses(".private-classes-container", data.privateClasses, "private");
      }

      // --- MASTER CLASSES ---
      if (data.hasMaster && data.masterClasses) {
        masterBox.classList.remove("hidden");
        masterBox.classList.add("fade-in");
        renderClasses(".master-classes-container", data.masterClasses, "master");
      }

      // --- GRID ---
      Object.keys(data.grid).forEach(hour => {
        const slots = data.grid[hour];
        Object.keys(slots).forEach(day => {
          paintCell(day, hour, slots[day].type);
        });
      });

    } catch (error) {
      console.error("Error:", error);
      alert("Error retrieving schedule. Please try again.");
    } finally {
      loader.classList.add("hidden");
    }
  });
});
