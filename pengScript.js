/* 
    Is my javascript terrible? Probably! It seems to work though.
*/

const pengSite = `https://jq.world60pengs.com/`
var pengAPI, pengdata

function start() { 
    reset();
    refresh();
}
function submitUpdate() {
    window.open(pengSite);
}
function hidePeng(n) {
    if (document.getElementById(`p${n}`).hasAttribute("dimmed")) {
        document.getElementById(`p${n}`).removeAttribute("dimmed")
        document.getElementById(`p${n}`).style.opacity = "1";
        document.getElementById(`p${n}`).style.opacity = "1";
    } else {
        document.getElementById(`p${n}`).setAttribute("dimmed", "")
        document.getElementById(`p${n}`).style.opacity = "0.2";
        document.getElementById(`p${n}`).style.opacity = "0.2";
    }
}
function reset() {
    for (let i=1; i < 14; i++) {
        document.getElementById(`p${i}`).style.opacity = "1";
        if (document.getElementById(`p${i}`).hasAttribute("dimmed")){
            document.getElementById(`p${i}`).removeAttribute("dimmed")
        }
    }
}

async function refresh() {
    console.log("Data Updated! " + (Math.round(new Date().getTime() / 1000)))
    //I added a timestamp to the end because the API kept pulling a cached version without it
    pengAPI = `https://api.allorigins.win/get?url=${encodeURIComponent('https://jq.world60pengs.com/rest/cache/actives.json')}&t=${Math.round(new Date().getTime() / 1000)}`
    pengdata = await fetch_penguin_data(pengAPI);
    pengdata = JSON.parse(pengdata["contents"])
    for (let i=1; i < 14; i++) {
        clear_old_data(i)
        var info = get_penguin_info(i)
        update_penguin(i, info[0], info[1], info[2], info[3], info[4], info[5], info[6]);
    }
    //Auto-refresh every minute
    setTimeout(function(){
        refresh();
    }, 60000);
}
function get_penguin_info(number) {
    var info 
    try{
        if (number > 0 && number < 13) {
            info = [
                pengdata.Activepenguin[number-1]["disguise"],
                pengdata.Activepenguin[number-1]["points"],
                pengdata.Activepenguin[number-1]["name"],
                pengdata.Activepenguin[number-1]["last_location"],
                pengdata.Activepenguin[number-1]["time_seen"],
                pengdata.Activepenguin[number-1]["warning"],
                pengdata.Activepenguin[number-1]["requirements"]
            ]
            info[4] = Math.floor((Math.floor((Math.abs((new Date()/1000) - info[4])))/60))
            if (info[4] < 1 ){
                info[4] = "< 1m"
            } else if( info[4] > 60){
                if ((info[4]/60) > 23){
                    info[4] = `${Math.floor((info[4]/60)/24)}d ${Math.floor((info[4]/60)%24)}h ${info[4] % 60}m`
                } else {
                    info[4] = `${Math.floor(info[4]/60)}h ${info[4] % 60}m`
                }
            } else {
                info[4] = `${info[4]}m`
            }
        } else {
            info = ["","",pengdata.Bear[0]["name"],"","",""]
        }
    } catch {
        info = [
            "Disguise: Unknown",
            "?",
            "Unknown",
            "Unable to get location",
            "Last Update: Failed",
            "",
            ""
        ]
    }    
    return [info[0], info[1], info[2], info[3], info[4], info[5], info[6]]
}

function clear_old_data(number) {  
    var list = document.getElementById(`p${number}Dis`);
    while (list.hasChildNodes()) {
        list.removeChild(list.firstChild);
    }
    list = document.getElementById(`p${number}War`);
    while (list.hasChildNodes()) {
        list.removeChild(list.firstChild);
    }
}
function update_penguin(number, disguise, points, spawn, specific, updated, warning, requirements) {    
    if (number !== 13) {
        if(disguise !== "Disguise: Unknown"){
            document.getElementById(`p${number}Dis`).appendChild(document.createElement("img")).setAttribute("id", `p${number}Ico`);
            document.getElementById(`p${number}Ico`).setAttribute("class", "disguise");
            document.getElementById(`p${number}Ico`).setAttribute("src", `./images/${disguise.toLowerCase()}.png`);
        } else {            
        document.getElementById(`p${number}Dis`).innerText = disguise;
        }
        document.getElementById(`p${number}Loc`).innerText = spawn;
        document.getElementById(`p${number}Spe`).innerText = specific;
        document.getElementById(`p${number}Upd`).innerText = updated;
        document.getElementById(`p${number}Poi`).innerText = points;
        if (warning !== "") {
            document.getElementById(`p${number}War`).appendChild(document.createElement("span")).setAttribute("id", `p${number}WarIco`);
            document.getElementById(`p${number}WarIco`).setAttribute("title", warning);
            document.getElementById(`p${number}WarIco`).setAttribute("class", "war");
            document.getElementById(`p${number}WarIco`).innerText =  "!";
        }
        if (requirements !== "") {
            document.getElementById(`p${number}War`).appendChild(document.createElement("span")).setAttribute("id", `p${number}ReqIco`);
            document.getElementById(`p${number}ReqIco`).setAttribute("title", requirements);
            document.getElementById(`p${number}ReqIco`).setAttribute("class", "req");
            document.getElementById(`p${number}ReqIco`).innerText =  "i";
        }
    } else {
        document.getElementById(`p${number}Dis`).appendChild(document.createElement("img")).setAttribute("id", `p${number}Ico`);
        document.getElementById(`p${number}Ico`).setAttribute("class", "disguise");
        document.getElementById(`p${number}Ico`).setAttribute("src", `./images/polarbear.png`);
        document.getElementById(`p${number}Loc`).innerText = `Well in: ${spawn}`
        document.getElementById(`p${number}Poi`).innerText = 1;
    }
}

async function fetch_penguin_data(url) {
	var data = await fetch(url) 
    return data.json()
}