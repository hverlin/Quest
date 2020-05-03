<h1 align="center">
QUEST
</h1>

<p align="center">
  ⚔️ Quest is a Unified Engine for Searching Things  ⚔️
</p>

---

## Introduction
*Quest* is a meta-search client that can connect to various applications and sources. It will submit a search query to all the configured services and aggregate the results.

You can connect it to various services like JIRA, Confluence, Google Drive, Dropbox paper, Slack, etc.

---
- Settings and credentials are encrypted and stored locally. The encryption key is stored in your system's keychain.
- You will need to configure all the modules you want to connect to.
- Built with React, Electron and [Blueprint](https://blueprintjs.com)

## Supported modules
See the following links for more information on how to configure them.
- [Confluence Server](src/modules/confluence/readme.md)
- [Google Drive](src/modules/drive/readme.md)
- [Gmail](src/modules/gmail/readme.md)
- [JIRA Server](src/modules/jira/readme.md)
- [Dropbox Paper](src/modules/paper/readme.md)
- [Phabricator (revision)](src/modules/phab-revision/readme.md)
- [Slack](src/modules/slack/readme.md)
- [Redmine](src/modules/redmine/readme.md)

More to come...

## Download
You can install *Quest* by going to the [releases page](https://github.com/hverlin/Quest/releases).

## Development

### Requirement for Linux only

We use the package [keytar](http://atom.github.io/node-keytar/) to handle storage of encrypted settings and credentials in your system's keychain.
Currently, this library uses `libsecret` on Linux platform, so you may need to install it before running `npm ci`:
* Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
* Red Hat-based: `sudo yum install libsecret-devel`
* Arch Linux: `sudo pacman -S libsecret`

### Running
```
npm ci
npm start
```

### Creating an executable
```
npm run make
```

### License 
Licensed under the MIT license.

Icon made by [Pixel perfect](https://www.flaticon.com/authors/pixel-perfect) from www.flaticon.com
