const penguin_site: string = `https://api.w60pengu.in`;
let penguin_data: any;
let penguin_count: number;

// This is just for testing
const perform_fetch: boolean = true;

// Local storage keys
const INFO_BOX_STORAGE_KEY: string = "w60penguins_infobox_state";

type Entry = {
  number: number;
  disguise: string;
  points: string;
  spawn: string;
  specific: string;
  last_updated: string;
  warnings: string;
  requirements: string;
};

/**
 * Main entrypoint of the script
 **/
function start(): void {
  reset_rows();
  refresh();

  // Load info box state from local storage
  loadInfoBoxState();

  // Auto-refresh every 30 seconds
  setInterval(() => {
    refresh();
  }, 30000);
}

/**
 * Loads the info box state from local storage and applies it
 */
function loadInfoBoxState(): void {
  const box = document.getElementById("infoBox");
  const toggle = document.getElementById("infoToggle");

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
  const toggle = document.getElementById("infoToggle");

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
 * This is the function for when the refresh button is clicked
 */
function manual_refresh(): void {
  var button = document.getElementById("refreshButton");

  //Limits manual refreshes to every 10 seconds
  if (button && !button.hasAttribute("disabled")) {
    refresh();
    button.setAttribute("disabled", "true");

    setTimeout(() => {
      button?.removeAttribute("disabled");
    }, 10000);
  }
}

/**
 * Resets or undims all rows
 */
function reset_rows(): void {
  for (let n: number = 1; n < penguin_count + 1; n++) {
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
function dim_row(number: number) {
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
  if (perform_fetch) penguin_data = await fetch_penguin_data(`${penguin_site}/locations`);
  penguin_count = penguin_data ? Object.keys(penguin_data).filter((k) => !isNaN(Number(k))).length : 1;
  clear_old_data(penguin_count);
  build_penguin_table(penguin_count);

  if (penguin_data) {
    for (let n: number = 1; n <= penguin_count; n++) {
      update_penguin(get_penguin_info(n));
    }
  }
}

/**
 * Clears the data for a penguin
 * @param count Number of penguin
 */
function clear_old_data(count: number): void {
  document.querySelector("#error")?.remove();
  for (let i: number = 1; i <= count; i++) {
    let disguise: any = i < penguin_count ? document.querySelector(`#p${i} #row1 tbody tr #disguise`) : document.querySelector(`#p${i} table tr #disguise`);
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
function get_penguin_info(n: number): Entry {
  const data = n < penguin_count ? penguin_data[String(n)] : "";
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

/**
 * Updates an Entry's information
 * @param entry Entry for the penguin/bear to update
 */
function update_penguin(entry: Entry): void {
  const element: string = entry.number < penguin_count ? `#p${entry.number} #row1 tr` : `#p${entry.number} table tbody tr`;
  const disguise_element: any = document.querySelector(`${element} #disguise`);
  const points_element: any = document.querySelector(`${element} #points`);
  const spawn_element: any = document.querySelector(`${element} #spawn`);
  const updated_element: any = document.querySelector(`${element} #updated`);
  const warnings_element: any = document.querySelector(`${element} #warnings`);
  const specific_element: any = entry.number < penguin_count ? document.querySelector(`#p${entry.number} #row2 #specific`) : null;

  if (entry.number < penguin_count) {
    disguise_element.innerHTML = `<img class="disguise" src="./images/${entry.disguise.toLowerCase()}.png">`;
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
    // Gives the 2 point penguin the Back to the Freezer requirement tooltip
    if (entry.number == penguin_count - 1)
      warnings_element.innerHTML += `<span class="req" title="Requires the following quest:\nBack to the Freezer">i</span>`;
    // Gives the ghost penguin the Some Like it Cold and Desert Treasure requirements tooltip
    if (entry.number == penguin_count - 2)
      warnings_element.innerHTML += `<span class="req" title="Requires the following quests:\nSome Like it Cold\nDesert Treasure">i</span>`;
    if (entry.requirements) warnings_element.innerHTML += `<span class="req" title="${entry.requirements}">i</span>`;
    if (entry.warnings) warnings_element.innerHTML += `<span class="war" title="${entry.warnings}">!</span>`;
  } else {
    disguise_element.innerHTML = `<img class="disguise" src="./images/polarbear.png" id="icon">`;
    spawn_element.innerText = `${entry.spawn}`;
    points_element.innerText = 1;
    // Gives the polar bear the Hunt for Red Raktuber requirement tooltip
    warnings_element.innerHTML = `<span class="req" title="Requires the following quest:\nHunt for Red Raktuber">i</span>`;
  }
}

/**
 * Builds the penguin table based on an amount of rows
 * @param row_amount Amount of rows to add
 */
function build_penguin_table(row_amount: number): void {
  const penguins_div: any = document.querySelector(".pengs");
  const error_template: string = `
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
  const penguin_template: string = `
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
  const bear_template: string = `
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
  let row_div: any;

  if (!penguin_data || row_amount === 1) {
    row_div = document.createElement("div");
    add_row(penguins_div, row_div, error_template, "error");
  } else {
    for (let i: number = 1; i <= row_amount; i++) {
      row_div = document.createElement("div");
      row_div.setAttribute("onclick", `dim_row(${i})`);
      // Replace $PID$ placeholder with the actual penguin ID
      const template = i < row_amount ? penguin_template.replace(/\$PID\$/g, i.toString()) : bear_template;
      add_row(penguins_div, row_div, template, `p${i}`);
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
function add_row(penguins_div: any, row_div: any, template: string, id: string): void {
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
async function fetch_penguin_data(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
    }
    return await response.json();
  } catch (error: unknown) {
    setTimeout(() => {
      manual_refresh();
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
  if (!penguin_data || !penguin_data[String(penguinId)]) {
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

  if (!penguin_data || !penguin_data[String(penguinId)]) {
    console.error("Cannot edit location: No penguin data available");
    return;
  }

  const specificElement = document.querySelector(`#p${penguinId} #specific`) as HTMLElement;
  if (!specificElement) return;

  // If we're already editing, don't create another form
  if (specificElement.querySelector(".edit-form")) return;

  const currentLocation = penguin_data[String(penguinId)].location;
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
  const originalContent = penguin_data[String(penguinId)].location;

  // Show loading state
  specificElement.innerHTML = `<span class="loading-indicator">Updating...</span>`;

  try {
    // Prepare the data to send
    const data = {
      key: penguinId,
      location: newLocation,
    };

    // Send update to API
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

    // Handle successful update
    await response.json();

    // Update local data
    penguin_data[String(penguinId)].location = newLocation;

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
