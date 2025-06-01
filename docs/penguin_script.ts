const PENGUIN_SITE: string = `https://api.w60pengu.in`;
// Used to toggle fetching for testing
const PERFORM_FETCH: boolean = true;
// Local storage key for retaining infobox state
const INFO_BOX_STORAGE_KEY: string = "w60penguins_infobox_state";
let penguinData: any;
let penguinCount: number;

type Entry = {
  number: number;
  disguise: string;
  points: string;
  spawn: string;
  specific: string;
  lastUpdated: string;
  warnings: string;
  requirements: string;
};

/**
 * Main entrypoint of the script
 **/
function start(): void {
  resetRows();
  refresh();
  loadInfoBoxState();
  animateProgressBar(penguinData ? 30000 : 10000);

  // Auto-refresh every 30 seconds
  setInterval(
    async () => {
      await refresh();
      animateProgressBar(penguinData ? 30000 : 10000);
    },
    penguinData ? 30000 : 10000
  );
}

/**
 * Animates the progress bar from 0-100% througout a duration
 * @param duration Duration of the progress bar in ms
 */
function animateProgressBar(duration: number): void {
  const bar = document.getElementById("progressBar") as HTMLElement;
  if (!bar) return;

  // Reset bar immediately
  bar.style.transition = "none";
  bar.style.width = "0%";

  // Trigger reflow so the reset takes effect before animation
  void bar.offsetWidth;

  // Animate to 100%
  bar.style.transition = `width ${duration}ms linear`;
  bar.style.width = "100%";
}

/**
 * Loads the info box state from local storage and applies it
 */
function loadInfoBoxState(): void {
  const box = document.getElementById("infoBox");
  const toggle = document.getElementById("infoToggleText");

  if (box && toggle) {
    try {
      const savedState = localStorage.getItem(INFO_BOX_STORAGE_KEY);
      if (savedState === "closed") {
        box.style.display = "none";
        toggle.textContent = "Click to expand";
      } else {
        box.style.display = "block";
        toggle.textContent = "Click to collapse";
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }
}

/**
 * Toggles the info box visibility and saves the state to local storage
 */
function toggleInfo(): void {
  const box = document.getElementById("infoBox");
  const toggle = document.getElementById("infoToggleText");

  if (box && toggle) {
    const newState = box.style.display === "none" ? "block" : "none";
    box.style.display = newState;
    toggle.textContent = newState === "none" ? "Click to expand" : "Click to collapse";

    // Save state to local storage
    try {
      localStorage.setItem(INFO_BOX_STORAGE_KEY, newState === "none" ? "closed" : "open");
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }
}

/**
 * Resets or undims all rows
 */
function resetRows(): void {
  for (let n: number = 1; n < penguinCount + 1; n++) {
    const row = document.getElementById(`p${n}`);
    if (row) {
      row.style.opacity = "1";
      if (row.hasAttribute("dimmed")) {
        row.removeAttribute("dimmed");
      }
    }
  }
}

/**
 * Toggles opacity for a table row
 * @param number Row to toggle dim
 */
function dimRow(number: number) {
  const peng = `p${number}`;
  const entry = document.getElementById(`${peng}`);

  // Check if the row is currently being edited
  const specificElement = document.querySelector(`#${peng} #specific`);

  // If the row is being edited (contains an edit form), do not dim it
  if (entry && ((specificElement && !specificElement.querySelector(".edit-form")) || peng === `p13`)) {
    if (entry.hasAttribute("dimmed")) {
      entry.removeAttribute("dimmed");
      entry.style.opacity = "1";
    } else {
      entry.setAttribute("dimmed", "");
      entry.style.opacity = "0.2";
    }
  }
}

/**
 * The main function. Builds the table and inputs the data
 */
async function refresh() {
  const now = new Date();
  if (PERFORM_FETCH) penguinData = await fetchPenguinData(`${PENGUIN_SITE}/locations`);
  penguinCount = penguinData ? Object.keys(penguinData).filter((k) => !isNaN(Number(k))).length : 1;
  clearOldData(penguinCount);
  buildPenguinTable(penguinCount);

  if (penguinData) {
    for (let n: number = 1; n <= penguinCount; n++) {
      updatePenguin(getPenguinInfo(n));
    }
  }
}

/**
 * Clears the data for a penguin
 * @param count Number of penguin
 */
function clearOldData(count: number): void {
  document.querySelector("#error")?.remove();
  for (let i: number = 1; i <= count; i++) {
    let disguise: any = i < penguinCount ? document.querySelector(`#p${i} #row1 tbody tr #disguise`) : document.querySelector(`#p${i} table tr #disguise`);
    let warning: any = document.querySelector(`#p${i} #row1 tbody tr #warnings`);
    let penguin_entry: any = document.querySelector(`#p${i}`);
    if (penguin_entry && penguin_entry.hasAttribute("hidden")) penguin_entry.removeAttribute("hidden");
    while (disguise && disguise.hasChildNodes()) disguise.removeChild(disguise.firstChild);
    while (warning && warning.hasChildNodes()) warning.removeChild(warning.firstChild);
  }
}

/**
 * Returns the entry for the specified penguin
 * @param n Number of penguin
 * @returns Entry of n penguin
 */
function getPenguinInfo(n: number): Entry {
  const data = n < penguinCount ? penguinData[String(n)] : "";
  const timeDiffInMinutes = Math.floor(Math.abs(new Date().getTime() / 1000 - data["lastUpdated"]) / 60);
  const time_string =
    timeDiffInMinutes > 1440
      ? `${Math.floor(timeDiffInMinutes / 1440)}d ` + `${Math.floor((timeDiffInMinutes / 60) % 24)}h ` + `${timeDiffInMinutes % 60}m`
      : timeDiffInMinutes > 60
      ? `${Math.floor((timeDiffInMinutes / 60) % 24)}h ` + `${timeDiffInMinutes % 60}m`
      : timeDiffInMinutes > 1
      ? `${timeDiffInMinutes % 60}m`
      : "<1m";

  const entry: Entry = {
    number: n,
    disguise: n < penguinCount ? data["disguise"] : "",
    points: n < penguinCount ? data["points"] : "",
    spawn: n < penguinCount ? data["name"] : penguinData[13]["name"],
    specific: n < penguinCount ? data["location"] : "",
    lastUpdated: n < penguinCount ? time_string : "",

    // The new API doesn't have warning or requirement json keys, but I'm leaving them here incase they ever get added.
    warnings: n < penguinCount ? data["warning"] : "",
    requirements: data["requirements"],
  };

  return entry;
}

/**
 * Updates an Entry's information
 * @param entry Entry for the penguin/bear to update
 */
function updatePenguin(entry: Entry): void {
  const element: string = entry.number < penguinCount ? `#p${entry.number} #row1 tr` : `#p${entry.number} table tbody tr`;
  const disguiseElement: any = document.querySelector(`${element} #disguise`);
  const pointsElement: any = document.querySelector(`${element} #points`);
  const spawnElement: any = document.querySelector(`${element} #spawn`);
  const updatedElement: any = document.querySelector(`${element} #updated`);
  const warningsElement: any = document.querySelector(`${element} #warnings`);
  const specificElement: any = entry.number < penguinCount ? document.querySelector(`#p${entry.number} #row2 #specific`) : null;

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
    // Gives the 2 point penguin the Back to the Freezer requirement tooltip
    if (entry.number == penguinCount - 1) warningsElement.innerHTML += `<span class="req" title="Requires the following quest:\nBack to the Freezer">i</span>`;
    // Gives the ghost penguin the Some Like it Cold and Desert Treasure requirements tooltip
    if (entry.number == penguinCount - 2)
      warningsElement.innerHTML += `<span class="req" title="Requires the following quests:\nSome Like it Cold\nDesert Treasure">i</span>`;
    if (entry.requirements) warningsElement.innerHTML += `<span class="req" title="${entry.requirements}">i</span>`;
    if (entry.warnings) warningsElement.innerHTML += `<span class="war" title="${entry.warnings}">!</span>`;
  } else {
    disguiseElement.innerHTML = `<img class="disguise" src="./images/w60/polarbear.png" id="icon">`;
    spawnElement.innerText = `${entry.spawn}`;
    pointsElement.innerText = 1;
    // Gives the polar bear the Hunt for Red Raktuber requirement tooltip
    warningsElement.innerHTML = `<span class="req" title="Requires the following quest:\nHunt for Red Raktuber">i</span>`;
  }
}

/**
 * Builds the penguin table based on an amount of rows
 * @param row_amount Amount of rows to add
 */
function buildPenguinTable(row_amount: number): void {
  const penguinsDiv: any = document.querySelector(".pengs");
  const errorTemplate: string = `
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
  const penguinTemplate: string = `
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
  const bearTemplate: string = `
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
  let rowDiv: any;

  if (!penguinData || row_amount === 1) {
    rowDiv = document.createElement("div");
    addRow(penguinsDiv, rowDiv, errorTemplate, "error");
  } else {
    for (let i: number = 1; i <= row_amount; i++) {
      rowDiv = document.createElement("div");
      rowDiv.setAttribute("onclick", `dimRow(${i})`);
      // Replace $PID$ placeholder with the actual penguin ID
      const template = i < row_amount ? penguinTemplate.replace(/\$PID\$/g, i.toString()) : bearTemplate;
      addRow(penguinsDiv, rowDiv, template, `p${i}`);
    }
  }
}

/**
 * Adds a row to the penguins_div
 * @param penguins_div HTML Div where penguins are nested
 * @param row_div HTML Div of the current row
 * @param template HTML string to add to row_div
 * @param id Id to assign row_div
 */
function addRow(penguins_div: any, row_div: any, template: string, id: string): void {
  if (!document.querySelector(`#${id}`)) {
    row_div.id = id;
    row_div.innerHTML = template;
    penguins_div.appendChild(row_div);
  }
}

/**
 * Fetches the penguin data JSON -- Will retry every 10 seconds if an error occurred
 * @param url Url to fetch JSON data from
 * @returns Promise<JSON>
 */
async function fetchPenguinData(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
    }
    return await response.json();
  } catch (error: unknown) {
    setTimeout(() => {
      refresh();
    }, 10000);

    if (error instanceof Error) {
      console.error("Error fetching data:", error.message);
    } else {
      console.error("Unknown error occurred");
    }
  }
}

/**
 * Confirms a penguin's location by sending data to the API
 * @param penguinId The ID of the penguin to confirm
 */
async function confirmLocation(penguinId: number): Promise<void> {
  if (!penguinData || !penguinData[String(penguinId)]) {
    console.error("Cannot confirm location: No penguin data available");
    return;
  }

  const confirmButton = document.querySelector(`#p${penguinId} .confirm-button`) as HTMLElement;

  if (confirmButton) {
    // Show loading state
    const originalContent = confirmButton.innerHTML;
    confirmButton.innerHTML = "⏳";
    confirmButton.style.pointerEvents = "none";

    try {
      // Prepare the data to send (adjust according to actual API requirements)
      const data = {
        key: penguinId,
      };

      // Send confirmation to API
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

      // Handle successful confirmation
      const result = await response.json();

      // Show success state
      confirmButton.innerHTML = "✓";
      confirmButton.classList.add("confirmed");

      // Reset after a delay
      setTimeout(() => {
        confirmButton.innerHTML = originalContent;
        confirmButton.style.pointerEvents = "auto";
      }, 3000);
    } catch (error) {
      console.error("Error confirming location:", error);

      // Show error state
      confirmButton.innerHTML = "❌";

      // Reset after a delay
      setTimeout(() => {
        confirmButton.innerHTML = originalContent;
        confirmButton.style.pointerEvents = "auto";
      }, 3000);
    }
  }
}

/**
 * Enables editing of a penguin's location
 * @param penguinId The ID of the penguin to edit
 * @param event The click event
 */
function editLocation(penguinId: number, event: Event): void {
  event.stopPropagation(); // Prevent row dimming

  if (!penguinData || !penguinData[String(penguinId)]) {
    console.error("Cannot edit location: No penguin data available");
    return;
  }

  const specificElement = document.querySelector(`#p${penguinId} #specific`) as HTMLElement;
  if (!specificElement) return;

  // If we're already editing, don't create another form
  if (specificElement.querySelector(".edit-form")) return;

  const currentLocation = penguinData[String(penguinId)].location;
  const originalContent = specificElement.innerHTML;

  // Create and append edit form
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

  // Focus the input
  const inputField = form.querySelector(".location-input") as HTMLInputElement;
  inputField.focus();
  inputField.select();

  // Add event listeners to buttons
  const saveButton = form.querySelector(".save-button") as HTMLButtonElement;
  const cancelButton = form.querySelector(".cancel-button") as HTMLButtonElement;

  saveButton.addEventListener("click", async (e) => {
    e.stopPropagation();
    const newLocation = inputField.value.trim();
    if (newLocation && newLocation !== currentLocation) {
      await updateLocation(penguinId, newLocation);
    } else {
      specificElement.innerHTML = originalContent;
    }
  });

  cancelButton.addEventListener("click", (e) => {
    e.stopPropagation();
    specificElement.innerHTML = originalContent;
  });

  // Handle Enter key on input
  inputField.addEventListener("keyup", async (e) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      const newLocation = inputField.value.trim();
      if (newLocation && newLocation !== currentLocation) {
        await updateLocation(penguinId, newLocation);
      } else {
        specificElement.innerHTML = originalContent;
      }
    } else if (e.key === "Escape") {
      specificElement.innerHTML = originalContent;
    }
  });
}

/**
 * Updates a penguin's location by sending data to the API
 * @param penguinId The ID of the penguin to update
 * @param newLocation The new location text
 */
async function updateLocation(penguinId: number, newLocation: string): Promise<void> {
  const specificElement = document.querySelector(`#p${penguinId} #specific`) as HTMLElement;
  if (!specificElement) return;

  // Store original content to restore on error
  const originalContent = penguinData[String(penguinId)].location;

  // Show loading state
  specificElement.innerHTML = `<span class="loading-indicator">Updating...</span>`;

  try {
    // Prepare the data to send
    const data = {
      key: penguinId,
      location: newLocation,
    };

    // Send update to API
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

    // Handle successful update
    await response.json();

    // Update local data
    penguinData[String(penguinId)].location = newLocation;

    // Update the display with the new container structure
    specificElement.innerHTML = `
      <div class="location-container">
        <div class="location-text">${newLocation}</div>
        <div class="location-actions">
          <span class="edit-icon" onclick="event.stopPropagation(); editLocation(${penguinId}, event)" title="Edit location">✏️</span>
        </div>
      </div>`;

    // Show success notification
    const notification = document.createElement("div");
    notification.className = "update-notification success";
    notification.textContent = "Location updated!";
    document.body.appendChild(notification);

    // Remove notification after delay
    setTimeout(() => {
      notification.remove();
    }, 3000);
  } catch (error) {
    console.error("Error updating location:", error);

    // Restore original content with the new container structure
    specificElement.innerHTML = `
      <div class="location-container">
        <div class="location-text">${originalContent}</div>
        <div class="location-actions">
          <span class="edit-icon" onclick="event.stopPropagation(); editLocation(${penguinId}, event)" title="Edit location">✏️</span>
        </div>
      </div>`;

    // Show error notification
    const notification = document.createElement("div");
    notification.className = "update-notification error";
    notification.textContent = "Failed to update location!";
    document.body.appendChild(notification);

    // Remove notification after delay
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}
