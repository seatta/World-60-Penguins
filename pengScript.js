/* 
    Is my javascript terrible? Probably! It seems to work though.
*/
const penguin_site = `https://jq.world60pengs.com`;
var penguin_API, penguin_data;

function start() {
	setup_table();
	reset();
	refresh();
	//Auto-refresh every 2 minutes
	setInterval(function () {
		refresh();
	}, 120000);
}

function submit_update() {
	window.open(penguin_site);
}

function hide_penguin(n) {
	var penguin_entry = document.getElementById(`p${n}`);
	if (penguin_entry.hasAttribute('dimmed')) {
		penguin_entry.removeAttribute('dimmed');
		penguin_entry.style.opacity = '1';
	} else {
		penguin_entry.setAttribute('dimmed', '');
		penguin_entry.style.opacity = '0.2';
	}
}

function reset() {
	for (let n = 1; n < 14; n++) {
		var penguin_entry = document.getElementById(`p${n}`);
		penguin_entry.style.opacity = '1';
		if (penguin_entry.hasAttribute('dimmed')) {
			penguin_entry.removeAttribute('dimmed');
		}
	}
}

function manual_refresh() {
	var button = document.getElementById('refreshButton');
	//Limits manual refreshes to every 10 seconds
	if (!button.hasAttribute('disabled')) {
		refresh();
		button.setAttribute('disabled', 'true');
		setTimeout(function () {
			button.removeAttribute('disabled');
		}, 10000);
	}
}

async function refresh() {
	//I added a timestamp to the end because the API kept pulling a cached version without it
	penguin_API = `https://api.allorigins.win/get?url=${encodeURIComponent(`${penguin_site}/rest/cache/actives.json`)}&t=${Math.round(
		new Date().getTime() / 1000
	)}`;
	penguin_data = await fetch_penguin_data(penguin_API);

	if (penguin_data) {
		penguin_data = JSON.parse(penguin_data['contents']);
	}
	for (let n = 1; n < 14; n++) {
		clear_old_data(n);
		var info = get_penguin_info(n);
		update_penguin(n, info[0], info[1], info[2], info[3], info[4], info[5], info[6]);
	}
}

function get_penguin_info(n) {
	const DEFAULT_INFO = ['', '', 'Failed fetching penguin data', 'Retrying in 10 seconds', '', '', ''];

	if (!penguin_data) {
		return DEFAULT_INFO;
	}

	if (n < 13) {
		const data = penguin_data.Activepenguin[n - 1];
		const timeDiffInMinutes = Math.floor(Math.floor(Math.abs(new Date() / 1000 - data['time_seen'])) / 60);

		const timeString =
			timeDiffInMinutes > 1440
				? `${Math.floor(timeDiffInMinutes / 1440)}d ` + `${Math.floor((timeDiffInMinutes / 60) % 24)}h ` + `${timeDiffInMinutes % 60}m`
				: timeDiffInMinutes > 60
				? `${Math.floor((timeDiffInMinutes / 60) % 24)}h ` + `${timeDiffInMinutes % 60}m`
				: timeDiffInMinutes > 1
				? `${timeDiffInMinutes % 60}m`
				: '<1m';

		return [data['disguise'], data['points'], data['name'], data['last_location'], timeString, data['warning'], data['requirements']];
	} else {
		return ['', '', penguin_data.Bear[0]['name'], '', '', '', ''];
	}
}

function clear_old_data(n) {
	var disguise, warning, penguin_entry;
	if (n < 13) {
		disguise = document.querySelector(`#p${n} #row1 tbody tr #disguise`);
		warning = document.querySelector(`#p${n} #row1 tbody tr #warnings`);
	} else {
		disguise = document.querySelector(`#p${n} table tr #disguise`);
	}
	penguin_entry = document.querySelector(`#p${n}`);
	if (penguin_entry && penguin_entry.hasAttribute('hidden')) {
		penguin_entry.removeAttribute('hidden');
	}
	if (disguise) {
		while (disguise.hasChildNodes()) {
			disguise.removeChild(disguise.firstChild);
		}
	}
	if (warning) {
		while (warning.hasChildNodes()) {
			warning.removeChild(warning.firstChild);
		}
	}
}

function update_penguin(n, d, p, sn, sp, u, w, r) {
	const s1 = n < 13 ? `#p${n} #row1 tr` : `#p${n} table tr`;
	const disguise = document.querySelector(`${s1} #disguise`);
	const points = document.querySelector(`${s1} #points`);
	const spawn = document.querySelector(`${s1} #spawn`);
	const updated = document.querySelector(`${s1} #updated`);
	const warnings = document.querySelector(`${s1} #warnings`);
	const specific = n < 13 ? document.querySelector(`#p${n} #row2 #specific`) : null;

	if (d === '') {
		if (n > 1 && n < 13) {
			document.getElementById(`p${n}`).setAttribute('hidden', 'hidden');
		} else if (n === 2) {
			disguise.innerText = d;
		}
	} else {
		disguise.innerHTML = `<img class="disguise" src="./images/${d.toLowerCase()}.png">`;
	}

	if (n >= 13) {
		if (sn !== '') {
			disguise.innerHTML = `<img class="disguise" src="./images/polarbear.png" id="icon">`;
			spawn.innerText = `Well in: ${sn}`;
			points.innerText = 1;
		} else {
			document.getElementById(`p${n}`).setAttribute('hidden', 'hidden');
		}
	} else {
		spawn.innerText = sn;
		specific.innerText = sp;
		updated.innerText = u;
		points.innerText = p;

		if (w) {
			warnings.innerHTML += `<span class="war" title="${w}">!</span>`;
		}
		if (r) {
			warnings.innerHTML += `<span class="req" title="${r}">i</span>`;
		}
	}
}

function setup_table() {
	const pengsDiv = document.querySelector('.pengs');

	for (let i = 1; i <= 13; i++) {
		const penguinDiv = document.createElement('div');
		penguinDiv.id = `p${i}`;
		penguinDiv.setAttribute('onclick', `hide_penguin(${i})`);

		let tableHTML;

		if (i < 13) {
			tableHTML = `
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
		`;
		} else {
			tableHTML = `
		  <table class="nistable">
			<tr class="bear">
			  <th class="disguise"><small id="disguise"></small></th>
			  <th class="points" id="points"></th>
			  <th class="warnings" id="warnings"></th>
			  <th class="spawn"><small id="spawn"></small></th>
			  <th class="updated"></th>
			</tr>
		  </table>
		`;
		}

		penguinDiv.innerHTML = tableHTML;
		pengsDiv.appendChild(penguinDiv);
	}
}

async function fetch_penguin_data(url) {
	try {
		return (await fetch(url)).json();
	} catch {
		setTimeout(function () {
			manual_refresh();
		}, 10000);
	}
}
