
  document.addEventListener("DOMContentLoaded", () => {
    const layout = document.querySelector(".main-layout");
    if (!layout) return;

    const form = layout.querySelector(".email-form");
    if (!form) return;

    const input = form.querySelector("input[type='email']");
    const groupBox = layout.querySelectorAll(".info-box")[0];
    const privateBox = layout.querySelectorAll(".info-box")[1];
    const cells = layout.querySelectorAll(".grid-container .cell");
    const loader = form.querySelector(".loader");

    const SCRIPT_URL = "https://backendblinkschedule.onrender.com/proxy";
    const hourMap = { "7": 1, "8": 2, "9": 3, "10": 4, "11": 5, "12": 6, "13": 7, "14": 8, "15": 9, "16": 10, "17": 11, "18": 12, "19": 13 };
    const dayMap = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5 };

    function formatTime(hour, minute) {
      const date = new Date(2000, 0, 1, hour, minute);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
      });
    }


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
        if (data.error) return alert("We couldn't find your schedule. Please make sure the email is correct. If you continue having this problem, contact Blink Spanish.");
        const headerTimes = document.querySelectorAll(".cell.header-time");

        headerTimes.forEach((cell) => {
          const baseHour = parseInt(cell.getAttribute("data-hour"));
          const groupClass = data.groupGrid?.find(c => parseInt(c.hour) === baseHour);
          const privateClass = data.privateGrid?.find(c => parseInt(c.hour) === baseHour);
          const classInfo = groupClass || privateClass;

          if (classInfo) {
            const hour = parseInt(classInfo.hour);
            const minute = parseInt(classInfo.minute);
            const date = new Date(2000, 0, 1, hour, minute);
            const timeFormatted = date.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' });
            cell.textContent = timeFormatted;
            cell.title = timeFormatted;
          }
        });

        groupBox.classList.add("hidden");
        privateBox.classList.add("hidden");
        groupBox.classList.remove("fade-in");
        privateBox.classList.remove("fade-in");
        layout.querySelector(".grid-container").classList.remove("fade-in");

        layout.querySelector(".group-name").innerHTML = "";
        layout.querySelector(".group-level").innerHTML = "";
        layout.querySelector(".group-group").innerHTML = "";
        layout.querySelector(".group-schedule").innerHTML = "";
        layout.querySelector(".group-location").innerHTML = "";
        layout.querySelector(".group-teacher").innerHTML = "";
        layout.querySelector(".map-btn").style.display = "none";
        layout.querySelector(".private-classes-container").innerHTML = "";

        cells.forEach(cell => {
          if (!cell.classList.contains("header-day") && !cell.classList.contains("header-time") && !cell.classList.contains("reloj")) {
            cell.style.backgroundColor = "";
            cell.textContent = "";
            cell.title = "";
          }
        });

        if (data.groupClass) {
          groupBox.classList.remove("hidden");
          groupBox.classList.add("fade-in");
          layout.querySelector(".group-name").innerHTML = `<span class="label">Name:</span> <span class="value">${data.groupClass.name}</span>`;
          layout.querySelector(".group-level").innerHTML = `<span class="label">Level:</span> <span class="value">${data.groupClass.level}</span>`;
          layout.querySelector(".group-group").innerHTML = `<span class="label">Group:</span> <span class="value">${data.groupClass.group}</span>`;
          layout.querySelector(".group-schedule").innerHTML = `<span class="label">Schedule:</span> <span class="value">${data.groupClass.horario}</span>`;
          layout.querySelector(".group-location").innerHTML = `<span class="label">Location:</span> <span class="value">${data.groupClass.lugar}</span>`;
          layout.querySelector(".group-teacher").innerHTML = `<span class="label">Professor:</span> <span class="value">${data.groupClass.teacher}</span>`;
          layout.querySelector(".map-btn").style.display = "inline-block";
        }

        const container = layout.querySelector(".private-classes-container");
        const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

        if (data.privateClasses && data.privateClasses.length > 0) {
          privateBox.classList.remove("hidden");
          privateBox.classList.add("fade-in");

          const sorted = data.privateClasses.sort((a, b) => {
            const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
            if (dayDiff !== 0) return dayDiff;

            // Ordenar por hora dentro del mismo día
            const [aHour, aMin] = a.time.split(":").map(t => parseInt(t));
            const [bHour, bMin] = b.time.split(":").map(t => parseInt(t));

            return aHour !== bHour ? aHour - bHour : aMin - bMin;
          });

          sorted.forEach(cls => {
            const slot = document.createElement("div");
            slot.classList.add("private-slot");
            slot.innerHTML = `
            <p><span class="label">Day and time:</span> <span class="value">${cls.day}, ${cls.time}</span></p>
            <p><span class="label">Location:</span> <span class="value">${cls.room}</span></p>
            <p><span class="label">Professor:</span> <span class="value">${cls.teacher}</span></p>
            <button class="map-btn">View Map</button>
          `;
            container.appendChild(slot);
          });
        }

        function getMapFromLocation(locationText) {
          const location = locationText.toLowerCase();
          if (location.includes("building 1")) {
            return "<?php echo get_stylesheet_directory_uri(); ?>/schedule/mapa1.jpg";
          } else if (location.includes("building 2")) {
            return "<?php echo get_stylesheet_directory_uri(); ?>/schedule/mapa2.jpg";
          } else if (location.includes("building 3")) {
            return "<?php echo get_stylesheet_directory_uri(); ?>/schedule/mapa3.jpg";
          }
          return "";
        }

        const groupMapBtn = layout.querySelector(".map-btn");
        const groupMapContainer = layout.querySelector(".group-map");
        const groupMapImg = document.getElementById("group-map-img");
        if (groupMapBtn && data.groupClass) {
          groupMapBtn.addEventListener("click", () => {
            const mapSrc = getMapFromLocation(data.groupClass.lugar);
            groupMapImg.src = mapSrc;
            groupMapContainer.classList.toggle("hidden");
          });
        }

        const privateSlots = layout.querySelectorAll(".private-slot");
        privateSlots.forEach(slot => {
          const btn = slot.querySelector(".map-btn");
          const locationText = slot.querySelectorAll(".value")[1].innerText;
          let img = slot.querySelector("img");

          if (!img) {
            img = document.createElement("img");
            img.style.maxWidth = "100%";
            img.style.marginTop = "1rem";
            img.classList.add("hidden");
            slot.appendChild(img);
          }

          btn.addEventListener("click", () => {
            img.src = getMapFromLocation(locationText);
            img.classList.toggle("hidden");
          });
        });

        function paintCell(day, hour, minute, color, label = "") {
          const row = hourMap[hour];
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

        data.privateGrid?.forEach(cls => paintCell(cls.day, cls.hour, cls.minute, "var(--yellow)", ""));
        data.groupGrid?.forEach(cls => paintCell(cls.day, cls.hour, cls.minute, "var(--green)", ""));

      } catch (error) {
        console.error("Error:", error);
        alert("Error retrieving schedule. Please try again.");
      } finally {
        loader.classList.add("hidden");
      }
    });
  });

