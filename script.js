async function consultarHorario() {
  const email = document.getElementById("email").value.trim();
  const resultado = document.getElementById("resultado");
  const mapImage = document.querySelector(".right-panel img");

resultado.style.display = "block";
setTimeout(() => resultado.classList.add("show"), 10);

  if (!email) {
    resultado.style.display = "block";
    resultado.innerHTML = "Por favor ingresa un correo.";
    return;
  }

  resultado.style.display = "block";
  resultado.innerHTML = "Consultando...";

  try {
    const res = await fetch(`https://script.google.com/macros/s/AKfycbzHyXZNRHltuySQrnq_2u5e_Kw1P4GN89wiHzRirQW4OyL7A13WsgYL3RGk-FguqdgBsw/exec?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (data.error) {
      resultado.innerHTML = `❌ ${data.error}`;
      mapImage.src = "mapa.jpg";
    } else {
      const location = data.lugar || "";
      let mapFile = "mapa.jpg";

      if (location.includes("Building 1")) mapFile = "mapa1.jpg";
      else if (location.includes("Building 2")) mapFile = "mapa2.jpg";
      else if (location.includes("Building 3")) mapFile = "mapa3.jpg";

      mapImage.src = mapFile;

      resultado.innerHTML = `Name: ${emailToName(email)}
        Level: A2.1
        Group: ${extraerGrupo(data.grupo)}
        Schedule: Monday to Friday
        Time: ${data.horario}
        Location: ${data.lugar}
        Professor: ${data.profesor}
      `;
    }
  } catch (err) {
    resultado.style.display = "block";
    resultado.innerHTML = "Error al consultar. Por favor intenta más tarde.";
    console.error(err);
  }
}

function extraerGrupo(grupoStr) {
  const match = grupoStr.match(/Grupo\s*(\d+)/i);
  return match ? match[1] : grupoStr;
}

function emailToName(email) {
  return email
    .split("@")[0]
    .replace(/\./g, " ")
    .replace(/\d+/g, '')
    .replace(/\b\w/g, c => c.toUpperCase());
}
