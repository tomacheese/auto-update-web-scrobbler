# auto-update-web-scrobbler

Synchronize [Web Scrobbler](https://web-scrobbler.com/) LevelDB file with [tomacheese/fetch-youtube-bgm](https://github.com/tomacheese/fetch-youtube-bgm).

## Features

- When playing a YouTube video, the title and artist set in fetch-youtube-bgm will correctly scrobble.
- It has a synchronization feature with fetch-youtube-bgm, so changes made in either fetch-youtube-bgm or Web Scrobbler will be correctly merged with the registration information.
- ⚠️ Due to LevelDB specifications, data cannot be updated while the browser is running.

## Prerequisite

- Supported operating system
  - Windows 64 bit (Tested with Windows 11 23H2)
  - macOS (Not tested)
  - Ubuntu (Not tested)
- Chrome (but any browser that can install Chrome extensions can be used)
  - The extension [Web Scrobbler](https://chromewebstore.google.com/detail/web-scrobbler/hhinaapppaileiechjoiifaancjggfjm) must be installed and in use.
- Node.js Runtime

## Installation

### 1. Download and extract the package Zip for your OS

Download the appropriate Zip file for your OS from the [release page](https://github.com/tomacheese/auto-update-web-scrobbler/releases).

- Windows: `auto-update-web-scrobbler_v{X.Y.Z}-ubuntu.zip`
- macOS: `auto-update-web-scrobbler_v{X.Y.Z}-ubuntu.zip`
- Ubuntu: `auto-update-web-scrobbler_v{X.Y.Z}-ubuntu.zip`

After downloading, extract the file to a folder of your choice.

### 2. Create a configuration file

Create `data/config.json` and write the following JSON. Note that the strings enclosed in `<` and `>` should be replaced with the correct ones.

- `<fetch-youtube-bgm server url>`: Enter the URL where [tomacheese/fetch-youtube-bgm](https://github.com/tomacheese/fetch-youtube-bgm) is running.
  - Access `<fetch-youtube-bgm server url>/api/tracks` and verify that the track information list is displayed correctly in JSON format.
- `<extension settings folder path>`: Specify the configuration folder for the Web Scrobbler extension. Backslashes (`\`) should be escape (`\\`).
  - Default Folder in Chrome on Windows: `C:\Users\USERNAME\AppData\Local\Google\Chrome\User Data\Default\Local Extension Settings\hhinaapppaileiechjoiifaancjggfjm\`
  - Multiple folder paths can be specified.

```json
{
  "server": "<fetch-youtube-bgm server url>",
  "browser": {
    "levelDbPath": [
      "<extension settings folder path>"
    ]
  }
}
```

### 3. Run index.js

Execute the following command to run `index.js

```shell
node index.js
```

If you get the following error here, please review it.

- `Cannot find module '.../node.napi.node'`
  - In Windows and Ubuntu environments, the [N-API](https://nodejs.org/api/n-api.html) is a dependency; store the `prebuilds` folder in the zip file in the same folder as `index.js`.
- `Failed to update Config path not found`
  - There does not seem to be a configuration file in the correct location. Please create a `data` folder and create `config.json` in it.
- `Failed to update ({"code":"ECONNREFUSED"...`
  - The URL of the fetch-youtube-bgm server seems to be incorrect.
- `Failed to update ENOENT: no such file or directory, lstat ...`
  - The configuration folder path for the Web Scrobbler extension may be incorrect.
- `Failed to open database Database is not open`, `LevelDB is not writable. Skip: ...`
  - The Web Scrobbler extension configuration file cannot be opened because the browser is still open. Please close your browser.

### 4. Set up automatic synchronization at computer startup

Create the file `UpdateWebScrobbler.vbs` and write the following:

```vbs
Set ws = CreateObject("Wscript.Shell")
ws.run "cmd /c node index.js", 0, False
```

Please put a shortcut to the vbs file you created in your startup (`shell:startup`).

## License

The license for this project is [MIT License](LICENSE).
