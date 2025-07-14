document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".email-form");
  const input = form.querySelector("input[type='email']");
  const groupBox = document.querySelectorAll(".info-box")[0];
  const privateBox = document.querySelectorAll(".info-box")[1];
  const cells = document.querySelectorAll(".grid-container .cell");
  const loader = document.querySelector(".loader");

  const SCRIPT_URL = "https://backendblinkschedule.onrender.com/proxy";

  let hourMap = {};
  const dayMap = {
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5
  };

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
      console.log("Raw response:", text);
      const data = JSON.parse(text);
      if (data.error) return alert(data.error);

      groupBox.classList.add("hidden");
      privateBox.classList.add("hidden");
      groupBox.classList.remove("fade-in");
      privateBox.classList.remove("fade-in");
      document.querySelector(".grid-container").classList.remove("fade-in");

      document.querySelector(".group-name").textContent = "";
      document.querySelector(".group-level").textContent = "";
      document.querySelector(".group-group").textContent = "";
      document.querySelector(".group-schedule").textContent = "";
      document.querySelector(".group-location").textContent = "";
      document.querySelector(".group-teacher").textContent = "";
      document.querySelector(".map-btn").style.display = "none";

      document.querySelector(".private-classes-container").innerHTML = "";

      cells.forEach(cell => {
        if (!cell.classList.contains("header-day") &&
            !cell.classList.contains("header-time") &&
            !cell.classList.contains("reloj")) {
          cell.style.backgroundColor = "";
          cell.textContent = "";
          cell.title = "";
        }
      });

      if (data.groupClass) {
        groupBox.classList.remove("hidden");
        groupBox.classList.add("fade-in");
        document.querySelector(".group-name").textContent = data.groupClass.name;
        document.querySelector(".group-level").textContent = data.groupClass.level;
        document.querySelector(".group-group").textContent = data.groupClass.group;
        document.querySelector(".group-schedule").textContent = data.groupClass.horario;
        document.querySelector(".group-location").textContent = data.groupClass.lugar;
        document.querySelector(".group-teacher").textContent = data.groupClass.teacher;
        document.querySelector(".map-btn").style.display = "inline-block";
      }

      if (data.privateClasses && data.privateClasses.length > 0) {
        privateBox.classList.remove("hidden");
        privateBox.classList.add("fade-in");

        const container = document.querySelector(".private-classes-container");
        const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const sorted = data.privateClasses.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

        sorted.forEach(cls => {
          const slot = document.createElement("div");
          slot.classList.add("private-slot");
          slot.innerHTML = `
            <p><strong>Day and time:</strong> ${cls.day}, ${cls.time}</p>
            <p><strong>Location:</strong> ${cls.room}</p>
            <p><strong>Professor:</strong> ${cls.teacher}</p>
            <button class="map-btn">View Map</button>
          `;
          container.appendChild(slot);
        });
      }

      const allTimes = (data.groupGrid || []).concat(data.privateGrid || []);
const timeKeysSet = new Set();

allTimes.forEach(c => {
  const hour = parseInt(c.hour, 10);
  const minute = parseInt(c.minute, 10);
  if (!isNaN(hour) && !isNaN(minute)) {
    timeKeysSet.add(`${hour}:${minute}`);
  }
});

const timeKeys = Array.from(timeKeysSet).sort((a, b) => {
  const [ha, ma] = a.split(":").map(Number);
  const [hb, mb] = b.split(":").map(Number);
  return ha !== hb ? ha - hb : ma - mb;
});


      hourMap = timeKeys.reduce((acc, key, i) => {
        acc[key] = i + 1;
        return acc;
      }, {});

      function paintCell(day, hour, minute, color, label = "") {
        const key = `${hour}:${minute}`;
        const row = hourMap[key];
        const col = dayMap[day];
        if (!row || !col) return;

        const index = 6 + (row - 1) * 6 + col;
        const cell = cells[index];
        if (cell) {
          cell.style.backgroundColor = color;
          cell.textContent = "";
          cell.title = `${label}${hour}:${minute.toString().padStart(2, "0")} - ${day}`;
        }
      }

      if (data.privateGrid) {
        data.privateGrid.forEach(cls => {
          paintCell(cls.day, cls.hour, cls.minute, "var(--yellow)", "");
        });
      }

      if (data.groupGrid) {
        data.groupGrid.forEach(cls => {
          paintCell(cls.day, cls.hour, cls.minute, "var(--green)", "");
        });
      }

      function actualizarHorasVisibles() {
        const headers = document.querySelectorAll(".cell.header-time");
        timeKeys.forEach((key, i) => {
          const [h, m] = key.split(":").map(Number);
          const hour12 = h % 12 || 12;
          const suffix = h < 12 ? "a.m." : "p.m.";
          headers[i].textContent = `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
        });
      }

      actualizarHorasVisibles();
      document.querySelector(".grid-container").classList.add("fade-in");

    } catch (error) {
      console.error("Error:", error);
      alert("Error retrieving schedule. Please try again.");
    } finally {
      loader.classList.add("hidden");
    }

    document.querySelectorAll(".map-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const container = btn.closest(".info-box, .private-slot");
        const text = container.innerText.toLowerCase();

        let src = "";
        if (text.includes("building 1")) src = "mapa1.jpg";
        else if (text.includes("building 2")) src = "mapa2.jpg";
        else if (text.includes("building 3")) src = "mapa3.jpg";
        else {
          alert("No map available for this location.");
          return;
        }

        const existingMap = container.querySelector("img.mapa-dinamico");
        if (existingMap) {
          existingMap.remove();
          btn.textContent = "View Map";
          return;
        }

        const img = document.createElement("img");
        img.src = src;
        img.alt = "Mapa";
        img.className = "mapa-dinamico";
        img.style = "max-width: 100%; margin-top: 10px;";
        btn.insertAdjacentElement("afterend", img);
        btn.textContent = "Hide Map";
      });
    });
  });
});
