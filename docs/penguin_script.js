"use strict";
const penguin_site = `https://api.w60pengu.in`;
let penguin_data;
let penguin_count;
const perform_fetch = true;
const INFO_BOX_STORAGE_KEY = "w60penguins_infobox_state";
function start() {
    reset_rows();
    refresh();
    loadInfoBoxState();
    setInterval(() => {
        refresh();
    }, 30000);
}
function loadInfoBoxState() {
    const box = document.getElementById("infoBox");
    const toggle = document.getElementById("infoToggle");
    if (box && toggle) {
        try {
            const savedState = localStorage.getItem(INFO_BOX_STORAGE_KEY);
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
    const toggle = document.getElementById("infoToggle");
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
function manual_refresh() {
    var button = document.getElementById("refreshButton");
    if (button && !button.hasAttribute("disabled")) {
        refresh();
        button.setAttribute("disabled", "true");
        setTimeout(() => {
            button?.removeAttribute("disabled");
        }, 10000);
    }
}
function reset_rows() {
    for (let n = 1; n < penguin_count + 1; n++) {
        const row = document.getElementById(`p${n}`);
        if (row) {
            row.style.opacity = "1";
            if (row.hasAttribute("dimmed")) {
                row.removeAttribute("dimmed");
            }
        }
    }
}
function dim_row(number) {
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
    if (perform_fetch)
        penguin_data = await fetch_penguin_data(`${penguin_site}/locations`);
    penguin_count = penguin_data ? Object.keys(penguin_data).filter((k) => !isNaN(Number(k))).length : 1;
    clear_old_data(penguin_count);
    build_penguin_table(penguin_count);
    if (penguin_data) {
        for (let n = 1; n <= penguin_count; n++) {
            update_penguin(get_penguin_info(n));
        }
    }
}
function clear_old_data(count) {
    document.querySelector("#error")?.remove();
    for (let i = 1; i <= count; i++) {
        let disguise = i < penguin_count ? document.querySelector(`#p${i} #row1 tbody tr #disguise`) : document.querySelector(`#p${i} table tr #disguise`);
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
function get_penguin_info(n) {
    const data = n < penguin_count ? penguin_data[String(n)] : "";
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
        disguise: n < penguin_count ? data["disguise"] : "",
        points: n < penguin_count ? data["points"] : "",
        spawn: n < penguin_count ? data["name"] : penguin_data[13]["name"],
        specific: n < penguin_count ? data["location"] : "",
        last_updated: n < penguin_count ? time_string : "",
        warnings: n < penguin_count ? data["warning"] : "",
        requirements: data["requirements"],
    };
    return entry;
}
function update_penguin(entry) {
    const element = entry.number < penguin_count ? `#p${entry.number} #row1 tr` : `#p${entry.number} table tbody tr`;
    const disguise_element = document.querySelector(`${element} #disguise`);
    const points_element = document.querySelector(`${element} #points`);
    const spawn_element = document.querySelector(`${element} #spawn`);
    const updated_element = document.querySelector(`${element} #updated`);
    const warnings_element = document.querySelector(`${element} #warnings`);
    const specific_element = entry.number < penguin_count ? document.querySelector(`#p${entry.number} #row2 #specific`) : null;
    if (entry.number < penguin_count) {
        disguise_element.innerHTML = `<img class="disguise" src="./docs/images/w60/${entry.disguise.toLowerCase()}.png">`;
        spawn_element.innerText = entry.spawn;
        specific_element.innerHTML = `
      <div class="location-container">
        <div class="location-text">${entry.specific}</div>
        <div class="location-actions">
          <span class="edit-icon" onclick="event.stopPropagation(); editLocation(${entry.number}, event)" title="Edit location">✏️</span>
        </div>
      </div>`;
        updated_element.innerText = entry.last_updated;
        points_element.innerText = entry.points;
        if (entry.number == penguin_count - 1)
            warnings_element.innerHTML += `<span class="req" title="Requires the following quest:\nBack to the Freezer">i</span>`;
        if (entry.number == penguin_count - 2)
            warnings_element.innerHTML += `<span class="req" title="Requires the following quests:\nSome Like it Cold\nDesert Treasure">i</span>`;
        if (entry.requirements)
            warnings_element.innerHTML += `<span class="req" title="${entry.requirements}">i</span>`;
        if (entry.warnings)
            warnings_element.innerHTML += `<span class="war" title="${entry.warnings}">!</span>`;
    }
    else {
        disguise_element.innerHTML = `<img class="disguise" src="./docs/images/w60/polarbear.png" id="icon">`;
        spawn_element.innerText = `${entry.spawn}`;
        points_element.innerText = 1;
        warnings_element.innerHTML = `<span class="req" title="Requires the following quest:\nHunt for Red Raktuber">i</span>`;
    }
}
function build_penguin_table(row_amount) {
    const penguins_div = document.querySelector(".pengs");
    const error_template = `
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
      <th><small id="specific">Auto-Reload will trigger in 10 seconds</small></th>
      </tr>

      <tr>
      <th><small id="specific">If the problem persists, please consider submitting an issue at:</small></th>
      </tr>

      <tr>
      <th><small id="specific">https://github.com/seatta/World-60-Penguins/issues</small></th>
      </tr>`;
    const penguin_template = `
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
    const bear_template = `
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
    let row_div;
    if (!penguin_data || row_amount === 1) {
        row_div = document.createElement("div");
        add_row(penguins_div, row_div, error_template, "error");
    }
    else {
        for (let i = 1; i <= row_amount; i++) {
            row_div = document.createElement("div");
            row_div.setAttribute("onclick", `dim_row(${i})`);
            const template = i < row_amount ? penguin_template.replace(/\$PID\$/g, i.toString()) : bear_template;
            add_row(penguins_div, row_div, template, `p${i}`);
        }
    }
}
function add_row(penguins_div, row_div, template, id) {
    if (!document.querySelector(`#${id}`)) {
        row_div.id = id;
        row_div.innerHTML = template;
        penguins_div.appendChild(row_div);
    }
}
async function fetch_penguin_data(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    }
    catch (error) {
        setTimeout(() => {
            manual_refresh();
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
    if (!penguin_data || !penguin_data[String(penguinId)]) {
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
            const response = await fetch(`${penguin_site}/locationConfirm`, {
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
    if (!penguin_data || !penguin_data[String(penguinId)]) {
        console.error("Cannot edit location: No penguin data available");
        return;
    }
    const specificElement = document.querySelector(`#p${penguinId} #specific`);
    if (!specificElement)
        return;
    if (specificElement.querySelector(".edit-form"))
        return;
    const currentLocation = penguin_data[String(penguinId)].location;
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
    const originalContent = penguin_data[String(penguinId)].location;
    specificElement.innerHTML = `<span class="loading-indicator">Updating...</span>`;
    try {
        const data = {
            key: penguinId,
            location: newLocation,
        };
        const response = await fetch(`${penguin_site}/locationUpdate`, {
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
        penguin_data[String(penguinId)].location = newLocation;
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
