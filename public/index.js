let input_field = document.getElementById("search-field");
let search_notice = document.getElementById("search-notice");
let search_results_elem = document.getElementById("search-results");
let indexer_errors_elem = document.getElementById("indexer-errors");

setInterval(update_download_progress, 5000);

input_field.addEventListener("keypress", function(event) {
	if (event.key === "Enter") {
		event.preventDefault();
		document.getElementById("search-button").click();
	}
});

function download(event) {
	console.log(event.target);
	event.target.textContent = "Requesting...";
	
	fetch("/download", {method: "POST", body: new URLSearchParams({url: event.target.dataset.download_url})})
		.then((response) => {
			if (response.ok) {
				event.target.textContent = "Downloading...";
			} else {
				event.target.textContent = "Failed!";
			}
		});

	update_download_progress();
}

function displayDownloadInfo(elem, torrent) {
	let titleElem = document.createElement("span");
	titleElem.classList.add("torrent-title")
	titleElem.textContent = torrent.title;

	let downloadPercentage = document.createElement("span");
	downloadPercentage.classList.add("download-percentage");
	downloadPercentage.textContent = torrent.percent;

	let etaElem = document.createElement("span");
	etaElem.classList.add("eta");
	etaElem.textContent = torrent.eta_text;

	elem.replaceChildren(titleElem, downloadPercentage, etaElem);
}

function update_download_progress() {
	fetch("/progress")
		.then((response) => response.json()
			.then((data) => data.forEach((torrent) => {
				let download_progress_container = document.getElementById("download-progress");
				let display_elem = Array.from(download_progress_container.children).find((elem) => elem.dataset.id == torrent.id);

				if (display_elem == null) {
					display_elem = document.createElement("div");
					display_elem.dataset.id = torrent.id;
					display_elem.dataset.status = torrent.status;
					display_elem.classList = ["download-box"];
					download_progress_container.appendChild(display_elem);
				}

				displayDownloadInfo(display_elem, torrent);
			})),
			// On fail
			(error) => search_notice.textContent = "Failed! ("+error+")")
}
update_download_progress();

function displayErrors(elem, errors) {
	errors.forEach((error) => {
		console.log(error);
		
		let error_elem = document.createElement("p");
		error_elem.textContent = "Indexer " + error.indexer + " failed with code " + error.code;

		elem.appendChild(error_elem);
	})
}

function search() {
	let query = document.getElementById("search-field").value;

	let first_child = search_results_elem.replaceChildren(search_results_elem.firstChild);

	search_notice.textContent = "Searching...";

	fetch("/search?" + new URLSearchParams({q: query}), {method: "GET"})
		.then((response) => response.json())
		.then((data) => {
			search_notice.textContent = "";
			if (data.results.length == 0) { search_notice.textContent = "No results" }

			indexer_errors_elem.replaceChildren();
			displayErrors(indexer_errors_elem, data.errors);

			data.results.forEach((search_result) => {
				let table_row = document.createElement("tr");

				let title_elem = document.createElement("td");
				title_elem.textContent = search_result.title;

				let size_elem = document.createElement("td");
				size_elem.textContent = humanFileSize(search_result.size);

				let seeders_elem = document.createElement("td");
				seeders_elem.textContent = search_result.seeders;

				let peers_elem = document.createElement("td");
				peers_elem.textContent = search_result.peers;

				let download_elem = document.createElement("td");
				let download_button = document.createElement("button");

				download_button.textContent = "Download";
				download_button.dataset.download_url = search_result.enclosure;
				download_button.addEventListener("click", download);

				download_elem.replaceChildren(download_button);

				table_row.replaceChildren(title_elem, size_elem, seeders_elem, peers_elem, download_elem);
				search_results_elem.appendChild(table_row);
			})
		});
}

function humanFileSize(bytes, si=false, dp=1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si 
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10**dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


  return bytes.toFixed(dp) + ' ' + units[u];
}
