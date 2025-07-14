 document.addEventListener("DOMContentLoaded", () => {
    const layout = document.querySelector(".main-layout");
    if (!layout) return;

    const form = layout.querySelector(".email-form");
    const input = form.querySelector("input[type='email']");
    const groupBox = layout.querySelectorAll(".info-box")[0];
    const privateBox = layout.querySelectorAll(".info-box")[1];
    const cells = layout.querySelectorAll(".grid-container .cell");
    const loader = form.querySelector(".loader");

    const SCRIPT_URL = "https://backendblinkschedule.onrender.com/proxy";

    function formatTime(hour, minute) {
      const date = new Date(2000, 0, 1, hour, minute);
      return date.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' });
    }

    const hourMap = { "7": 1, "8": 2, "9": 3, "10": 4, "11": 5, "12": 6, "13": 7, "14": 8, "15": 9, "16": 10, "17": 11, "18": 12, "19": 13 };
    const dayMap = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5 };

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

        const data = await response.json();
        if (data.error) return alert("We couldn't find your schedule.");

        // Update hour labels based on actual minute values
        const headerTimes = document.querySelectorAll(".cell.header-time");

        headerTimes.forEach((cell, i) => {
          const baseHour = 7 + i; // starting hour is 7:00 AM
          const groupClass = data.groupClassGrid?.find(c => parseInt(c.hour) === baseHour);
          const privateClass = data.privateGrid?.find(c => parseInt(c.hour) === baseHour);
          const classInfo = groupClass || privateClass;

          if (classInfo) {
            const hour = parseInt(classInfo.hour);
            const minute = parseInt(classInfo.minute);
            cell.textContent = formatTime(hour, minute);
          }
        });

        // Reset all non-header cells
        cells.forEach(cell => {
          if (!cell.classList.contains("header-day") &&
              !cell.classList.contains("header-time") &&
              !cell.classList.contains("reloj")) {
            cell.style.backgroundColor = "";
            cell.textContent = "";
            cell.title = "";
          }
        });

        function paintCell(day, hour, minute, color) {
          const row = hourMap[hour];
          const col = dayMap[day];
          if (!row || !col) return;
          const index = 6 + (row - 1) * 6 + col;
          const cell = cells[index];
          if (cell) {
            cell.style.backgroundColor = color;
          }
        }

        // Paint classes
        data.privateGrid?.forEach(cls => paintCell(cls.day, cls.hour, cls.minute, "var(--yellow)"));
        data.groupClassGrid?.forEach(cls => paintCell(cls.day, cls.hour, cls.minute, "var(--green)"));

        // Fill group box
        if (data.groupClass) {
          groupBox.classList.remove("hidden");
          groupBox.querySelector(".group-name").innerHTML = `<span class="label">Name:</span> <span class="value">${data.groupClass.name}</span>`;
          groupBox.querySelector(".group-level").innerHTML = `<span class="label">Level:</span> <span class="value">${data.groupClass.level}</span>`;
          groupBox.querySelector(".group-group").innerHTML = `<span class="label">Group:</span> <span class="value">${data.groupClass.group}</span>`;
          groupBox.querySelector(".group-schedule").innerHTML = `<span class="label">Schedule:</span> <span class="value">${data.groupClass.schedule}</span>`;
          groupBox.querySelector(".group-location").innerHTML = `<span class="label">Location:</span> <span class="value">${data.groupClass.location}</span>`;
          groupBox.querySelector(".group-teacher").innerHTML = `<span class="label">Professor:</span> <span class="value">${data.groupClass.professor}</span>`;
          const mapBtn = groupBox.querySelector(".map-btn");
          const mapImg = groupBox.querySelector("#group-map-img");
          if (data.groupClass.map) {
            mapBtn.style.display = "inline-block";
            mapImg.src = data.groupClass.map;
            mapImg.parentElement.classList.remove("hidden");
          } else {
            mapBtn.style.display = "none";
            mapImg.src = "";
            mapImg.parentElement.classList.add("hidden");
          }
        } else {
          groupBox.classList.add("hidden");
        }

        // Fill private box
        if (data.privateClasses && data.privateClasses.length > 0) {
          privateBox.classList.remove("hidden");
          const container = privateBox.querySelector(".private-classes-container");
          container.innerHTML = "";
          data.privateClasses.forEach(cls => {
            const div = document.createElement("div");
            div.classList.add("private-slot");
            div.innerHTML = `
              <p><span class="label">Day and time:</span> <span class="value">${cls.day}, ${cls.time}</span></p>
              <p><span class="label">Location:</span> <span class="value">${cls.location}</span></p>
              <p><span class="label">Professor:</span> <span class="value">${cls.professor}</span></p>
              <hr>`;
            container.appendChild(div);
          });
        } else {
          privateBox.classList.add("hidden");
        }

      } catch (error) {
        console.error("Error:", error);
        alert("Error retrieving schedule.");
      } finally {
        loader.classList.add("hidden");
      }
    });
  });
