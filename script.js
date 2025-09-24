document.addEventListener("DOMContentLoaded", () => {
  const layout = document.querySelector(".main-layout");
  if (!layout) return;

  const form = layout.querySelector(".email-form");
  if (!form) return;

  const input = form.querySelector("input[type='email']");
  const groupBox = layout.querySelectorAll(".info-box")[0];
  const privateBox = layout.querySelectorAll(".info-box")[1];
  const masterBox = layout.querySelectorAll(".info-box")[2]; // NEW
  const cells = layout.querySelectorAll(".grid-container .cell");
  const loader = form.querySelector(".loader");

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwiedPjznWict_f6JW4PDV-YCC71p7d9ypjcf9thN4N4jvxaPB5jonHM1Qw6QIgL7fLOQ/exec";
  const hourMap = {
    "7": 1,
    "8": 2,
    "9": 3,
    "10": 4,
    "11": 5,
    "12": 6,
    "13": 7,
    "14": 8,
    "15": 9,
    "16": 10,
    "17": 11,
    "18": 12,
    "19": 13,
  };
  const dayMap = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = input.value.trim().toLowerCase();
    if (!email) return alert("Please enter your email.");

    loader.classList.remove("hidden");

    try {
      // Fetch with Post
      const response = await fetch(SCRIPT_URL, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: `email=${encodeURIComponent(email)}`
});
const data = await response.json();




      if (data.error)
        return alert(
          "We couldn't find your schedule. Please make sure the email is correct."
        );

      // Reset sections
      groupBox.classList.add("hidden");
      privateBox.classList.add("hidden");
      masterBox.classList.add("hidden");

      layout.querySelector(".private-classes-container").innerHTML = "";
      layout.querySelector(".master-classes-container").innerHTML = "";

      // Clear grid
      cells.forEach((cell) => {
        if (
          !cell.classList.contains("header-day") &&
          !cell.classList.contains("header-time") &&
          !cell.classList.contains("reloj")
        ) {
          cell.style.backgroundColor = "";
          cell.textContent = "";
          cell.title = "";
        }
      });

      // --- GROUP CLASSES ---
      if (data.groupClasses) {
        groupBox.classList.remove("hidden");
        groupBox.classList.add("fade-in");

        // Just show general info (using first class of Monday if exists)
        const mondayClasses = data.groupClasses.monday || [];
        if (mondayClasses.length > 0) {
          const c = mondayClasses[0];
          layout.querySelector(".group-name").textContent = data.name;
          layout.querySelector(".group-level").textContent = data.level;
          layout.querySelector(".group-group").textContent = data.group;
          layout.querySelector(".group-schedule").textContent = data.schedule;
          layout.querySelector(".group-location").textContent = c.room;
          layout.querySelector(".group-teacher").textContent = c.teacher;
        }
      }

      // --- PRIVATE CLASSES ---
      if (data.privateClasses) {
        privateBox.classList.remove("hidden");
        privateBox.classList.add("fade-in");

        const container = layout.querySelector(".private-classes-container");
        Object.keys(data.privateClasses).forEach((day) => {
          data.privateClasses[day].forEach((cls) => {
            const slot = document.createElement("div");
            slot.classList.add("private-slot");
            slot.innerHTML = `
              <p><span class="label">Day and time:</span> ${day}, ${cls.startHour} - ${cls.endHour}</p>
              <p><span class="label">Location:</span> ${cls.room}</p>
              <p><span class="label">Professor:</span> ${cls.teacher}</p>
            `;
            container.appendChild(slot);
          });
        });
      }

      // --- MASTER CLASSES ---
      if (data.masterClasses) {
        masterBox.classList.remove("hidden");
        masterBox.classList.add("fade-in");

        const container = layout.querySelector(".master-classes-container");
        Object.keys(data.masterClasses).forEach((day) => {
          data.masterClasses[day].forEach((cls) => {
            const slot = document.createElement("div");
            slot.classList.add("master-slot");
            slot.innerHTML = `
              <p><span class="label">Class:</span> ${cls.className}</p>
              <p><span class="label">Time:</span> ${day}, ${cls.startHour} - ${cls.endHour}</p>
              <p><span class="label">Room:</span> ${cls.room}</p>
            `;
            container.appendChild(slot);
          });
        });
      }

      // --- GRID PAINTING ---
      function paintCell(day, hour, type) {
        const row = hourMap[hour];
        const col = dayMap[day.charAt(0).toUpperCase() + day.slice(1)];
        if (!row || !col) return;
        const index = 6 + (row - 1) * 6 + col;
        const cell = cells[index];
        if (cell) {
          if (type === "gr") cell.style.backgroundColor = "var(--green)";
          if (type === "pr") cell.style.backgroundColor = "var(--yellow)";
          if (type === "mc") cell.style.backgroundColor = "var(--blue)";
        }
      }

      Object.keys(data.grid).forEach((hour) => {
        const slots = data.grid[hour];
        Object.keys(slots).forEach((day) => {
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
