# Just. Download!
Simply search and download movies, games, books, etc. from your favourite torrent indexer!

## Quickstart
Run the app with docker (set config):

```bash
docker run -p 5000:5000 --env CONFIG="<your-config>" ghcr.io/highghlow/just-download
```

Or store the config file on disk:
```bash
docker run -p 5000:5000 -v ./config:/config --env CONFIG_LOCATION="/config/config.json" ghcr.io/highghlow/just-download
```

## Configuration

App configuration is done by either writing it to the `CONFIG` environment variable or `config.json` in the app's working directory

The config file should have this format:
```json
{
  "indexers": [
    {
      "url": "https://torznab_url",
      "api_key": "optional"
    },
    "..."
  ],
  "transmission": {
    "host": "127.0.0.1",
    "port": "9091",
    "username": "optional",
    "password": "optional"
  }
}
```
