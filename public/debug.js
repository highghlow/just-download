let config_elem = document.getElementById("config");
let search_input = document.getElementById("search-query");
let raw_response = document.getElementById("raw-response");
let raw_search_xml = document.getElementById("raw-search-xml");

// Prettify json
function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    var cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
	cls = 'key';
      } else {
	cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}
function prettify(text) {
  let prettified = JSON.stringify(JSON.parse(text), null, 2);
  return syntaxHighlight(prettified);
}

config_elem.innerHTML = prettify(config_elem.textContent);

function search() {
  let query = search_input.value;

  fetch("/search?"+new URLSearchParams({q: query}))
    .then((response) => response.text().then((text) => {
      if (!response.ok) {
	raw_response.textContent = text;
      } else {

	let json = JSON.parse(text);
	raw_response.innerHTML = prettify(text);
	raw_search_xml.replaceChildren();
	
	json.raw.forEach((raw_xml) => {
	  let display_elem = document.createElement("pre");
	  display_elem.textContent = json.raw;
	  raw_search_xml.appendChild(display_elem);
	});
      }
    }),
    (error) => {

    })
}
