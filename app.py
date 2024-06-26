from flask import Flask, redirect, render_template, send_from_directory, request
import requests
import urllib.parse
import os
import json
import xml.etree.ElementTree as ET
import transmission_rpc
import html

app = Flask(__name__)
CONFIG_LOCATION = os.environ.get("CONFIG_LOCATION", "./config.json")
DEFAULT_CONFIG = json.loads(os.environ.get("CONFIG", "{}"))

LOCK_TRANSMISSION_CONFIG = "LOCK_TRANSMISSION_CONFIG" in os.environ.keys()

def load_config():
    if not os.path.exists(CONFIG_LOCATION):
        return DEFAULT_CONFIG
    with open(CONFIG_LOCATION) as f:
        data = json.load(f)
    return data

def save_config(config):
    with open(CONFIG_LOCATION, "w") as f:
        json.dump(config, f)

def make_transmission_client(config):
    tconfig = config["transmission"]
    return transmission_rpc.Client(host=tconfig["host"], port=tconfig["port"], username=tconfig.get("username"), password=tconfig.get("password"))

@app.route("/")
def index():
    return render_template("index.html", config=json.dumps(load_config()))

@app.route("/debug")
def debug():
    return render_template("debug.html", config=json.dumps(load_config()))

@app.route("/config")
def config():
    return render_template("config.html", config=json.dumps(load_config()), lock_transmission=LOCK_TRANSMISSION_CONFIG)

@app.route("/search")
def search():
    config = load_config()
    query = request.args["q"]

    results = []
    indexer_errors = []
    raw_responses = []
    print("Starting search:", query)
    for iid, indexer in enumerate(config["indexers"]):
        search_url = urllib.parse.urljoin(indexer["url"], "api")
        params = {"t": "search", "q": query, "apikey":indexer.get("api_key")}
        
        try:
            response = requests.get(search_url, params=params, timeout=indexer.get("timeout"))
        except (requests.exceptions.ConnectionError, requests.exceptions.ReadTimeout) as e:
            indexer_errors.append({
                "code": -1,
                "description": str(e),
                "indexer": iid
            })
            raw_responses.append(str(e))
            continue

        raw_responses.append(response.text)

        xml_response = ET.fromstring(response.text)
        if not response.ok:
            error = xml_response.attrib
            indexer_errors.append({
                "code": error["code"],
                "description": error["description"],
                "indexer": iid
            })
            continue

        channel = xml_response[0]
        for item in channel:
            if item.tag != "item":
                continue
            item_info = dict()
            store_text = ["title", "size", "link", "description"]
            store_attr = ["peers", "seeders"]
            for prop in item:
                if prop.tag in store_text:
                    item_info[prop.tag] = prop.text
                if prop.tag.endswith("}attr") and prop.attrib["name"] in store_attr:
                    item_info[prop.attrib["name"]] = prop.attrib["value"]

            if indexer["use_title_as_description"]:
                item_info["description"] = item_info["title"]

            results.append(item_info)
    return {"results": results, "errors": indexer_errors, "raw": raw_responses}

@app.route("/progress")
def download_progress():
    config = load_config()
    try:
        client = make_transmission_client(config)
        downloads = client.get_torrents()
    except (transmission_rpc.error.TransmissionError, json.decoder.JSONDecodeError) as e:
        return ({"error": str(e), "downloads": []}, 500)

    result = []

    for torrent in downloads:
        download_info = {
            "id": torrent.hashString,
            "title": torrent.get_files()[0].name.split("/")[0],
            "download_rate": torrent.rate_download,
            "upload_rate": torrent.rate_upload,
            "status": str(torrent.status),
            "eta": torrent.eta.total_seconds() if torrent.eta is not None else None,
            "eta_text": torrent.format_eta() if torrent.eta is not None else None,
            "peers_connected": torrent.peers_connected,
            "peers_found": sum(torrent.peers_from.values()),
            "percent": round(torrent.percent_done * 100, 1)
        }
        result.append(download_info)

    return result

@app.route("/set-config", methods=["POST"])
def set_config():
    print("Config:", request.form["config"])
    config = json.loads(request.form["config"])
    save_config(config)
    return redirect(request.form.get("backlink", "/"))

@app.route("/download", methods=["POST"])
def download():
    config = load_config()
    torrent_url = request.form["url"]
    
    print(torrent_url)
    client = make_transmission_client(config)
    client.add_torrent(torrent_url, download_dir=config["transmission"].get("download_dir"))
    
    return {"status": "started"}

@app.route("/public/<path:path>")
def public_files(path):
    return send_from_directory("public", path)
