"use strict";
const PENGUIN_SITE = `https://api.w60pengu.in`;
const PERFORM_FETCH = true;
const INFO_BOX_STORAGE_KEY = "w60penguins_infobox_state";
let penguinData;
let penguinCount;
function start() {
    loadInfoBoxState();
    watchEditForm();
    async function loopRefresh() {
        while (document.querySelector(".edit-form")) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
        await refresh();
        let delay = penguinData ? 30000 : 10000;
        animateProgressBar(delay);
        setTimeout(loopRefresh, delay);
    }
    loopRefresh();
}
function watchEditForm() {
    const bar = document.getElementById("progressBar");
    const observer = new MutationObserver(() => {
        const editing = document.querySelector(".edit-form") !== null;
        if (bar) {
            bar.style.backgroundColor = editing ? "#f28b82" : "#4caf50";
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}
function animateProgressBar(duration) {
    const bar = document.getElementById("progressBar");
    if (!bar)
        return;
    bar.style.transition = "none";
    bar.style.width = "0%";
    void bar.offsetWidth;
    bar.style.transition = `width ${duration}ms linear`;
    bar.style.width = "100%";
}
function loadInfoBoxState() {
    const box = document.getElementById("infoBox");
    const toggle = document.getElementById("infoToggleText");
    if (box && toggle) {
        try {
            const savedState = localStorage.getItem(INFO_BOX_STORAGE_KEY);
            console.log(savedState);
            if (savedState === "closed") {
                box.style.display = "none";
                toggle.textContent = "Click to expand";
            }
            else {
                box.style.display = "block";
                toggle.textContent = "Click to collapse";
            }
        }
        catch (error) {
            console.error("Error accessing localStorage:", error);
        }
    }
}
function toggleInfo() {
    const box = document.getElementById("infoBox");
    const toggle = document.getElementById("infoToggleText");
    if (box && toggle) {
        const newState = box.style.display === "none" ? "block" : "none";
        box.style.display = newState;
        toggle.textContent = newState === "none" ? "Click to expand" : "Click to collapse";
        try {
            localStorage.setItem(INFO_BOX_STORAGE_KEY, newState === "none" ? "closed" : "open");
        }
        catch (error) {
            console.error("Error saving to localStorage:", error);
        }
    }
}
function resetRows() {
    for (let n = 1; n < penguinCount + 1; n++) {
        const row = document.getElementById(`p${n}`);
        if (row) {
            row.style.opacity = "1";
            if (row.hasAttribute("dimmed")) {
                row.removeAttribute("dimmed");
            }
        }
    }
}
function dimRow(number) {
    const peng = `p${number}`;
    const entry = document.getElementById(`${peng}`);
    const specificElement = document.querySelector(`#${peng} #specific`);
    if (entry && ((specificElement && !specificElement.querySelector(".edit-form")) || peng === `p13`)) {
        if (entry.hasAttribute("dimmed")) {
            entry.removeAttribute("dimmed");
            entry.style.opacity = "1";
        }
        else {
            entry.setAttribute("dimmed", "");
            entry.style.opacity = "0.2";
        }
    }
}
async function refresh() {
    const now = new Date();
    if (PERFORM_FETCH)
        penguinData = await fetchPenguinData(`${PENGUIN_SITE}/locations`);
    penguinCount = penguinData ? Object.keys(penguinData).filter((k) => !isNaN(Number(k))).length : 1;
    clearOldData(penguinCount);
    buildPenguinTable(penguinCount);
    if (penguinData) {
        for (let n = 1; n <= penguinCount; n++) {
            updatePenguin(getPenguinInfo(n));
        }
    }
}
function clearOldData(count) {
    document.querySelector("#error")?.remove();
    for (let i = 1; i <= count; i++) {
        let disguise = i < penguinCount ? document.querySelector(`#p${i} #row1 tbody tr #disguise`) : document.querySelector(`#p${i} table tr #disguise`);
        let warning = document.querySelector(`#p${i} #row1 tbody tr #warnings`);
        let penguin_entry = document.querySelector(`#p${i}`);
        if (penguin_entry && penguin_entry.hasAttribute("hidden"))
            penguin_entry.removeAttribute("hidden");
        while (disguise && disguise.hasChildNodes())
            disguise.removeChild(disguise.firstChild);
        while (warning && warning.hasChildNodes())
            warning.removeChild(warning.firstChild);
    }
}
function getPenguinInfo(n) {
    const data = n < penguinCount ? penguinData[String(n)] : "";
    const timeDiffInMinutes = Math.floor(Math.abs(new Date().getTime() / 1000 - data["lastUpdated"]) / 60);
    const time_string = timeDiffInMinutes > 1440
        ? `${Math.floor(timeDiffInMinutes / 1440)}d ` + `${Math.floor((timeDiffInMinutes / 60) % 24)}h ` + `${timeDiffInMinutes % 60}m`
        : timeDiffInMinutes > 60
            ? `${Math.floor((timeDiffInMinutes / 60) % 24)}h ` + `${timeDiffInMinutes % 60}m`
            : timeDiffInMinutes > 1
                ? `${timeDiffInMinutes % 60}m`
                : "<1m";
    const entry = {
        number: n,
        disguise: n < penguinCount ? data["disguise"] : "",
        points: n < penguinCount ? data["points"] : "",
        spawn: n < penguinCount ? data["name"] : penguinData[13]["name"],
        specific: n < penguinCount ? data["location"] : "",
        lastUpdated: n < penguinCount ? time_string : "",
        warnings: n < penguinCount ? data["warning"] : "",
        requirements: data["requirements"],
    };
    return entry;
}
function updatePenguin(entry) {
    const element = entry.number < penguinCount ? `#p${entry.number} #row1 tr` : `#p${entry.number} table tbody tr`;
    const disguiseElement = document.querySelector(`${element} #disguise`);
    const pointsElement = document.querySelector(`${element} #points`);
    const spawnElement = document.querySelector(`${element} #spawn`);
    const updatedElement = document.querySelector(`${element} #updated`);
    const warningsElement = document.querySelector(`${element} #warnings`);
    const specificElement = entry.number < penguinCount ? document.querySelector(`#p${entry.number} #row2 #specific`) : null;
    if (entry.number < penguinCount) {
        disguiseElement.innerHTML = `<img class="disguise" src="./images/w60/${entry.disguise.toLowerCase()}.png">`;
        spawnElement.innerText = entry.spawn;
        specificElement.innerHTML = `
      <div class="location-container">
        <div class="location-text">${entry.specific}</div>
        <div class="location-actions">
          <span class="edit-icon" onclick="event.stopPropagation(); editLocation(${entry.number}, event)" title="Edit location">✏️</span>
        </div>
      </div>`;
        updatedElement.innerText = entry.lastUpdated;
        pointsElement.innerText = entry.points;
        if (entry.number == penguinCount - 1)
            warningsElement.innerHTML += `<span class="req" title="Requires the following quest:\nBack to the Freezer">i</span>`;
        if (entry.number == penguinCount - 2)
            warningsElement.innerHTML += `<span class="req" title="Requires the following quests:\nSome Like it Cold\nDesert Treasure">i</span>`;
        if (entry.requirements)
            warningsElement.innerHTML += `<span class="req" title="${entry.requirements}">i</span>`;
        if (entry.warnings)
            warningsElement.innerHTML += `<span class="war" title="${entry.warnings}">!</span>`;
    }
    else {
        disguiseElement.innerHTML = `<img class="disguise" src="./images/w60/polarbear.png" id="icon">`;
        spawnElement.innerText = `${entry.spawn}`;
        pointsElement.innerText = 1;
        warningsElement.innerHTML = `<span class="req" title="Requires the following quest:\nHunt for Red Raktuber">i</span>`;
    }
}
function buildPenguinTable(row_amount) {
    const penguinsDiv = document.querySelector(".pengs");
    const errorTemplate = `
    <table class="nistable" id="row1">
      <tr>
      <th class="spawn">
        <span class="war">!</span>
        An error occurred while fetching penguin data!<small id="spawn"></small>
        <span class="war">!</span>
      </th>
      </tr>
  </table>
  <table class="nistable pengtable" id="row2">
    <tr>
      <th>
        <small id="specific">
        Auto-Reload will trigger in 10 seconds <br> <br>
        If the problem persists, please consider submitting an issue at:<br>
          <a href="https://github.com/seatta/World-60-Penguins/issues" target="_blank" rel="noopener noreferrer">
            https://github.com/seatta/World-60-Penguins/issues
          </a>
        </small>
      </th>
    </tr>
  </table>`;
    const penguinTemplate = `
  <div class="peng-entry">
    <table class="nistable" id="row1">
      <tr>
      <th class="disguise"><small id="disguise"></small></th>
      <th class="points" id="points"></th>
      <th class="warnings" id="warnings"></th>
      <th class="spawn"><small id="spawn"></small></th>
      <th class="updated"><small id="updated"></small></th>
      <th class="confirm"><small><span class="confirm-button" onclick="event.stopPropagation(); confirmLocation($PID$)" title="Confirm location">👍</span></small></th>
      </tr>
    </table>
    <table class="nistable pengtable" id="row2">
      <tr>
      <th><small id="specific"></small></th>
      </tr>
    </table>
  </div>`;
    const bearTemplate = `
  <div class="peng-entry">
    <table class="nistable">
      <tr class="bear">
      <th class="disguise"><small id="disguise"></small></th>
      <th class="points" id="points"></th>
      <th class="warnings" id="warnings"></th>
      <th class="spawn"><small id="spawn"></small></th>
      <th class="updated"></th>
      </tr>
    </table>
  </div>`;
    let rowDiv;
    if (!penguinData || row_amount === 1) {
        rowDiv = document.createElement("div");
        addRow(penguinsDiv, rowDiv, errorTemplate, "error");
    }
    else {
        for (let i = 1; i <= row_amount; i++) {
            rowDiv = document.createElement("div");
            rowDiv.setAttribute("onclick", `dimRow(${i})`);
            const template = i < row_amount ? penguinTemplate.replace(/\$PID\$/g, i.toString()) : bearTemplate;
            addRow(penguinsDiv, rowDiv, template, `p${i}`);
        }
    }
}
function addRow(penguins_div, row_div, template, id) {
    if (!document.querySelector(`#${id}`)) {
        row_div.id = id;
        row_div.innerHTML = template;
        penguins_div.appendChild(row_div);
    }
}
async function fetchPenguinData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    }
    catch (error) {
        setTimeout(() => {
            refresh();
        }, 10000);
        if (error instanceof Error) {
            console.error("Error fetching data:", error.message);
        }
        else {
            console.error("Unknown error occurred");
        }
    }
}
async function confirmLocation(penguinId) {
    if (!penguinData || !penguinData[String(penguinId)]) {
        console.error("Cannot confirm location: No penguin data available");
        return;
    }
    const confirmButton = document.querySelector(`#p${penguinId} .confirm-button`);
    if (confirmButton) {
        const originalContent = confirmButton.innerHTML;
        confirmButton.innerHTML = "⏳";
        confirmButton.style.pointerEvents = "none";
        try {
            const data = {
                key: penguinId,
            };
            const response = await fetch(`${PENGUIN_SITE}/locationConfirm`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
            }
            const result = await response.json();
            confirmButton.innerHTML = "✓";
            confirmButton.classList.add("confirmed");
            setTimeout(() => {
                confirmButton.innerHTML = originalContent;
                confirmButton.style.pointerEvents = "auto";
            }, 3000);
        }
        catch (error) {
            console.error("Error confirming location:", error);
            confirmButton.innerHTML = "❌";
            setTimeout(() => {
                confirmButton.innerHTML = originalContent;
                confirmButton.style.pointerEvents = "auto";
            }, 3000);
        }
    }
}
function editLocation(penguinId, event) {
    event.stopPropagation();
    if (!penguinData || !penguinData[String(penguinId)]) {
        console.error("Cannot edit location: No penguin data available");
        return;
    }
    const specificElement = document.querySelector(`#p${penguinId} #specific`);
    if (!specificElement)
        return;
    if (specificElement.querySelector(".edit-form"))
        return;
    const currentLocation = penguinData[String(penguinId)].location;
    const originalContent = specificElement.innerHTML;
    const form = document.createElement("div");
    form.className = "edit-form";
    form.innerHTML = `
    <input type="text" class="location-input" value="${currentLocation}" />
    <div class="edit-buttons">
      <button class="save-button" title="Save">✓</button>
      <button class="cancel-button" title="Cancel">✗</button>
    </div>
  `;
    specificElement.innerHTML = "";
    specificElement.appendChild(form);
    const inputField = form.querySelector(".location-input");
    inputField.focus();
    inputField.select();
    const saveButton = form.querySelector(".save-button");
    const cancelButton = form.querySelector(".cancel-button");
    saveButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        const newLocation = inputField.value.trim();
        if (newLocation && newLocation !== currentLocation) {
            await updateLocation(penguinId, newLocation);
        }
        else {
            specificElement.innerHTML = originalContent;
        }
    });
    cancelButton.addEventListener("click", (e) => {
        e.stopPropagation();
        specificElement.innerHTML = originalContent;
    });
    inputField.addEventListener("keyup", async (e) => {
        if (e.key === "Enter") {
            e.stopPropagation();
            const newLocation = inputField.value.trim();
            if (newLocation && newLocation !== currentLocation) {
                await updateLocation(penguinId, newLocation);
            }
            else {
                specificElement.innerHTML = originalContent;
            }
        }
        else if (e.key === "Escape") {
            specificElement.innerHTML = originalContent;
        }
    });
}
async function updateLocation(penguinId, newLocation) {
    const specificElement = document.querySelector(`#p${penguinId} #specific`);
    if (!specificElement)
        return;
    const originalContent = penguinData[String(penguinId)].location;
    specificElement.innerHTML = `<span class="loading-indicator">Updating...</span>`;
    try {
        const data = {
            key: penguinId,
            location: newLocation,
        };
        const response = await fetch(`${PENGUIN_SITE}/locationUpdate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        }
        await response.json();
        penguinData[String(penguinId)].location = newLocation;
        specificElement.innerHTML = `
      <div class="location-container">
        <div class="location-text">${newLocation}</div>
        <div class="location-actions">
          <span class="edit-icon" onclick="event.stopPropagation(); editLocation(${penguinId}, event)" title="Edit location">✏️</span>
        </div>
      </div>`;
        const notification = document.createElement("div");
        notification.className = "update-notification success";
        notification.textContent = "Location updated!";
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    catch (error) {
        console.error("Error updating location:", error);
        specificElement.innerHTML = `
      <div class="location-container">
        <div class="location-text">${originalContent}</div>
        <div class="location-actions">
          <span class="edit-icon" onclick="event.stopPropagation(); editLocation(${penguinId}, event)" title="Edit location">✏️</span>
        </div>
      </div>`;
        const notification = document.createElement("div");
        notification.className = "update-notification error";
        notification.textContent = "Failed to update location!";
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}
