/* 
    Is my javascript terrible? Probably! It seems to work though.
*/
const penguin_site = `https://jq.world60pengs.com`
var penguin_API, penguin_data

function start() { 
    reset();
    refresh();
}

function submit_update() { 
    window.open(penguin_site) 
}

function hide_penguin(n) {
    var penguin_entry = document.getElementById(`p${n}`)
    if (penguin_entry.hasAttribute("dimmed")) {
        penguin_entry.removeAttribute("dimmed")
        penguin_entry.style.opacity = "1";
    } else {
        penguin_entry.setAttribute("dimmed", "")
        penguin_entry.style.opacity = "0.2";
    }
}

function reset() {
    for (let n=1; n < 14; n++) {
        var penguin_entry = document.getElementById(`p${n}`)
        penguin_entry.style.opacity = "1";
        if (penguin_entry.hasAttribute("dimmed")) {
            penguin_entry.removeAttribute("dimmed")
        }
    }
}

async function refresh() {
    //I added a timestamp to the end because the API kept pulling a cached version without it
    penguin_API = `https://api.allorigins.win/get?url=${encodeURIComponent(`${penguin_site}/rest/cache/actives.json`)}&t=${Math.round(new Date().getTime() / 1000)}`
    penguin_data = await fetch_penguin_data(penguin_API);
    if (penguin_data) {
        penguin_data = JSON.parse(penguin_data["contents"])
    }
    for (let n=1; n < 14; n++) {
        clear_old_data(n)
        var info = get_penguin_info(n)
        update_penguin(n, info[0], info[1], info[2], info[3], info[4], info[5], info[6]);
    }
    //Auto-refresh every minute
    setTimeout(function() {
        refresh();
    }, 60000);
}

function get_penguin_info(n) {
    var info
    if (!penguin_data) {
        info = [
            "Disguise: Unknown",
            "?",
            "Unknown",
            "Unable to get location",
            "Last Update: Failed",
            "",
            ""
        ]
    } else {
        if (n < 13) {
            var data = penguin_data.Activepenguin[n-1]
            info = [
                data["disguise"],
                data["points"],
                data["name"],
                data["last_location"],
                Math.floor(Math.floor(Math.abs((new Date()/1000) - data["time_seen"]))/60),
                data["warning"],
                data["requirements"]
            ]
            if (info[4] < 1 ) {
                info[4] = "< 1m"
            } else if(info[4] > 60) {
                if ((info[4]/60) > 23) {
                    info[4] = `${Math.floor((info[4]/60)/24)}d ${Math.floor((info[4]/60)%24)}h ${info[4] % 60}m`
                } else {
                    info[4] = `${Math.floor(info[4]/60)}h ${info[4] % 60}m`
                }
            } else {
                info[4] = `${info[4]}m`
            }
        } else {
            info = ["","",penguin_data.Bear[0]["name"],"","","",""]
        }
    }    
    return info
}

function clear_old_data(n) {
    var disguise, warning
    if (n < 12) {
        disguise = document.querySelector(`#p${n} #row1 tr #disguise`)
        warning = document.querySelector(`#p${n} #row1 tr #warnings`)
    } else {
        disguise = document.querySelector(`#p${n} table tr #disguise`)
    }
    while (disguise.hasChildNodes()) {
        disguise.removeChild(disguise.firstChild);
    }
    if (warning) {
        while (warning.hasChildNodes()) {
            warning.removeChild(warning.firstChild);
        }
    }
}

function update_penguin(n, d, p, sn, sp, u, w, r) {
    var disguise, points, spawn, updated, warnings, specific, s1, s2
    if (n < 13) {
        s1 = `#p${n} #row1 tr`
        s2 = `#p${n} #row2 tr`
        disguise = document.querySelector(`${s1} #disguise`)
        points = document.querySelector(`${s1} #points`)
        spawn = document.querySelector(`${s1} #spawn`)
        updated = document.querySelector(`${s1} #updated`)
        warnings = document.querySelector(`${s1} #warnings`)    
        specific = document.querySelector(`${s2} #specific`)

        if(d !== "Disguise: Unknown") {
            disguise.appendChild(document.createElement("img")).setAttribute("class", "disguise")
            disguise.firstChild.setAttribute("src", `./images/${d.toLowerCase()}.png`);
        } else {            
            disguise.innerText = d;
        }
        spawn.innerText = sn;
        specific.innerText = sp;
        updated.innerText = u;
        points.innerText = p;
        if (w) {
            warnings.appendChild(document.createElement("span")).setAttribute("id", `warning_icon`);
            var warning_span = warnings.querySelector("#warning_icon")
            warning_span.setAttribute("title", w);
            warning_span.setAttribute("class", "war");
            warning_span.innerText =  "!";
        }
        if (r) {
            warnings.appendChild(document.createElement("span")).setAttribute("id", `requirement_icon`);
            var requirement_span = warnings.querySelector("#requirement_icon");
            requirement_span.setAttribute("title", r);
            requirement_span.setAttribute("class", "req");
            requirement_span.innerText =  "i";
        }
    } else {
        s1 = `#p${n} table tr`
        disguise = document.querySelector(`${s1} #disguise`)
        points = document.querySelector(`${s1} #points`)
        spawn = document.querySelector(`${s1} #spawn`)
        
        if(d !== "Disguise: Unknown") {
            disguise.appendChild(document.createElement("img")).setAttribute("id", `icon`);
            var icon = disguise.querySelector("#icon")
            icon.setAttribute("class", "disguise")
            icon.setAttribute("src", `./images/polarbear.png`)
            spawn.innerText = `Well in: ${sn}`
            points.innerText = 1
        } else {            
            disguise.innerText = d;
            spawn.innerText = `Unknown`
            points.innerText = "?"
        }
    }
}

async function fetch_penguin_data(url) {
    try{
        return (await fetch(url)).json()
    } catch {
        console.log(`Fetching data from ${url} failed.`)
        return 
    }
}