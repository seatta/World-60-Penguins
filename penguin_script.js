"use strict";
const penguin_site = `https://runescape.wiki/w/Penguin_Hide_and_Seek#Current_World_60_Locations`;
const penguin_site_json = `https://api.w60pengu.in/locations`;
let penguin_data;
let penguin_count;
const perform_fetch = true;
function start() {
  reset_rows();
  refresh();
  setInterval(() => {
    refresh();
    console.log("Auto-Reload Triggered!");
  }, 120000);
}
function toggleInfo() {
  const box = document.getElementById("infoBox");
  if (box) {
    box.style.display = box.style.display === "none" ? "block" : "none";
  }
}
function submit_update() {
  window.open(penguin_site);
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
  const entry = document.getElementById(`p${number}`);
  if (entry) {
    if (entry.hasAttribute("dimmed")) {
      entry.removeAttribute("dimmed");
      entry.style.opacity = "1";
    } else {
      entry.setAttribute("dimmed", "");
      entry.style.opacity = "0.2";
    }
  }
}
async function refresh() {
  const now = new Date();
  if (perform_fetch) penguin_data = await fetch_penguin_data(`${penguin_site_json}?_=${now}`);
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
    if (penguin_entry && penguin_entry.hasAttribute("hidden")) penguin_entry.removeAttribute("hidden");
    while (disguise && disguise.hasChildNodes()) disguise.removeChild(disguise.firstChild);
    while (warning && warning.hasChildNodes()) warning.removeChild(warning.firstChild);
  }
}
function get_penguin_info(n) {
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
    disguise_element.innerHTML = `<img class="disguise" src="./images/${entry.disguise.toLowerCase()}.png">`;
    spawn_element.innerText = entry.spawn;
    specific_element.innerText = entry.specific;
    updated_element.innerText = entry.last_updated;
    points_element.innerText = entry.points;
    if (entry.number == penguin_count - 1)
      warnings_element.innerHTML += `<span class="req" title="Requires the following quest:\nBack to the Freezer">i</span>`;
    if (entry.number == penguin_count - 2)
      warnings_element.innerHTML += `<span class="req" title="Requires the following quests:\nSome Like it Cold\nDesert Treasure">i</span>`;
    if (entry.requirements) warnings_element.innerHTML += `<span class="req" title="${entry.requirements}">i</span>`;
    if (entry.warnings) warnings_element.innerHTML += `<span class="war" title="${entry.warnings}">!</span>`;
  } else {
    disguise_element.innerHTML = `<img class="disguise" src="./images/polarbear.png" id="icon">`;
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
    console.log("Creating error div");
    row_div = document.createElement("div");
    add_row(penguins_div, row_div, error_template, "error");
  } else {
    for (let i = 1; i <= row_amount; i++) {
      row_div = document.createElement("div");
      row_div.setAttribute("onclick", `dim_row(${i})`);
      add_row(penguins_div, row_div, i < row_amount ? penguin_template : bear_template, `p${i}`);
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
  } catch (error) {
    setTimeout(() => {
      manual_refresh();
      console.log("Failed To Fetch: Auto-Reload Triggered!");
    }, 10000);
    if (error instanceof Error) {
      console.error("Error fetching data:", error.message);
    } else {
      console.error("Unknown error occurred");
    }
  }
}
