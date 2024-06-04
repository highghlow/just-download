const config = JSON.parse(document.getElementById("config").innerText)
const config_target = document.getElementById("config-target");
const config_send = document.getElementById("config-send");
const tracker_list = document.getElementById("tracker-list");

const init_config = () => {
  Array.from(document.getElementsByClassName("config-input")).forEach((elem) => {
    elem.value = eval("config."+elem.dataset.entry);
  });

  config.indexers.forEach((tracker) => {
    add_tracker(tracker.url, tracker.api_key, tracker.use_title_as_description);
  });
}

const save = () => {
  let new_trackers = [];
  Array.from(document.getElementsByClassName("tracker-entry")).forEach((elem) => {
    let url = elem.getElementsByClassName("tracker-url-input").item(0).value;
    let api_key = elem.getElementsByClassName("tracker-api-key-input").item(0).value;
    let tad = elem.getElementsByClassName("tracker-tad-input").item(0).checked;

    if (api_key == "") { api_key = null; }

    new_trackers.push({ url: url, api_key: api_key, use_title_as_description: tad });
  });

  config.indexers = new_trackers;

  Array.from(document.getElementsByClassName("config-input")).forEach((elem) => {
    let val = elem.value;
    if (elem.dataset.int) { val = +val }
    eval("config."+elem.dataset.entry+"=val");
  });
  config_target.innerText = JSON.stringify(config);
  config_send.click();
};

const add_empty_tracker = () => {
  add_tracker("", "", true);
}

const add_tracker = (url, api_key, tad) => {
  let new_tracker = document.createElement("div");



  let url_input_label = document.createElement("span");
  url_input_label.innerText = "Torznab Url:";

  let url_input = document.createElement("input");
  url_input.classList.add("tracker-url-input");
  url_input.value = url;

  new_tracker.appendChild(url_input_label);
  new_tracker.appendChild(url_input);
  new_tracker.appendChild(document.createElement("br"));



  let api_key_input_label = document.createElement("span");
  api_key_input_label.innerText = "Api key (optional):";

  let api_key_input = document.createElement("input");
  api_key_input.classList.add("tracker-api-key-input");
  api_key_input.value = api_key;

  new_tracker.appendChild(api_key_input_label);
  new_tracker.appendChild(api_key_input);
  new_tracker.appendChild(document.createElement("br"));



  let tad_key = "tad-"+Math.round(Math.random()*1000);
  let tad_input_label = document.createElement("label");
  tad_input_label.for = tad_key;
  tad_input_label.innerText = "Use title as description:";

  let tad_input = document.createElement("input");
  tad_input.type = "checkbox";
  tad_input.id = tad_key;
  tad_input.classList.add("tracker-tad-input");
  tad_input.checked = tad;

  new_tracker.appendChild(tad_input_label);
  new_tracker.appendChild(tad_input);
  new_tracker.appendChild(document.createElement("br"));



  let delete_button = document.createElement("button");
  delete_button.innerText = "Remove";
  delete_button.onclick = () => { new_tracker.remove() }
  new_tracker.appendChild(delete_button);

  new_tracker.classList.add("tracker-entry");
  tracker_list.appendChild(new_tracker);
}

init_config();
