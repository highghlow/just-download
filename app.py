from flask import Flask, render_template, request
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

def load_config():
    if not os.path.exists(CONFIG_LOCATION):
        return DEFAULT_CONFIG
    with open(CONFIG_LOCATION) as f:
        data = json.load(f)
    return data

def save_config(config):
    with open(CONFIG_LOCATION, "w") as f:
        json.dump(config, f)

@app.route("/")
def index():
    print(request)
    return render_template("index.html", config=json.dumps(load_config()))

@app.route("/search")
def search():
    config = load_config()
    query = request.args["q"]

    results = []
    print("Starting search:", query)
    for indexer in config["indexers"]:
        search_url = urllib.parse.urljoin(indexer["url"], "api")
        params = {"t": "search", "q": query, "apikey":indexer.get("api_key")}
        
        response = requests.get(search_url, params=params)
        response.raise_for_status()

        xml_response = ET.fromstring(response.text)
        channel = xml_response[0]
        for item in channel:
            if item.tag != "item":
                continue
            item_info = dict()
            store_text = ["title", "size"]
            store_attr = {"enclosure": "url"}
            store_attr_tag = ["peers", "seeders"]
            for prop in item:
                print(prop.tag, prop.attrib, prop.text)
                if prop.tag in store_text:
                    item_info[prop.tag] = prop.text
                if store_key := store_attr.get(prop.tag):
                    item_info[prop.tag] = prop.attrib[store_key]
                if prop.tag.endswith("}attr") and prop.attrib["name"] in store_attr_tag:
                    item_info[prop.attrib["name"]] = prop.attrib["value"]
            results.append(item_info)
    return results

@app.route("/set-config", methods=["POST"])
def set_config():
    print(request.form)
    config = json.loads(request.form["config"])
    save_config(config)
    return config

@app.route("/download", methods=["POST"])
def download():
    config = load_config()
    torrent_url = request.form["url"]
    
    tconfig = config["transmission"]
    print(torrent_url)
    client = transmission_rpc.Client(host=tconfig["host"], port=tconfig["port"])
    client.add_torrent(torrent_url)
    
    return {"status": "started"}


