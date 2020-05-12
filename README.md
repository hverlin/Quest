<h1 align="center">
QUEST
</h1>

<p align="center">
  ⚔️ Quest is a Unified Engine for Searching Things  ⚔️
</p>

---

*Quest* is a meta-search client that can connect to various applications and sources. It will submit a search query to all the configured services and aggregate the results.

You can connect it to various services like JIRA, Confluence, Google Drive, Dropbox paper, Slack, etc.

![Quest - screenshot](./doc/screenshot.png)

## Features 🚀

- 🔎 Search across many services (see list below). Quickly preview the results.
- 🔓 **Secure and private**: Settings and credentials are encrypted and stored locally. The encryption key is stored in your system's keychain. There are no servers between Quest and the services.
- ⌨️ Usable entirely with the keyboard. You can use the arrow keys to navigate between the results. Use `Cmd(Ctrl) + Shift + Space` to focus the application and start searching!
- 🔧 Customizable: Light and dark modes, column or row layout and custom filters!

## Supported modules
To configure modules, see the following links:
- [Confluence Server](src/modules/confluence/readme.md)
- [Google Drive](src/modules/drive/readme.md)
- [Gmail](src/modules/gmail/readme.md)
- [JIRA Server](src/modules/jira/readme.md)
- [Dropbox Paper](src/modules/paper/readme.md)
- [Phabricator (revision)](src/modules/phab-revision/readme.md)
- [Slack](src/modules/slack/readme.md)
- [Redmine](src/modules/redmine/readme.md)
- [Nextcloud](src/modules/nextcloud/readme.md)

More to come...

## How do I install it?
You can install *Quest* by going to the [releases page](https://github.com/hverlin/Quest/releases).

You will need to configure all the modules you want to connect to. This often means generating an API key in the developer settings of each service. Note that for services that support Oauth (e.g. Gmail, Slack, Google Drive) you can generate one app for your team/organization and share that internally.

Click on the application name in the list above to see how to get instructions on how to configure them.

- Note that the application is not signed yet, so you might need to [allow it to run](https://www.wikihow.com/Install-Software-from-Unsigned-Developers-on-a-Mac).
- Auto-update is not yet available as well for that reason. You will need to check the releases page again to download an updated version of the application.

### Using Brew (recommended on MacOS)
On MacOS, you can also install the application using `brew cask`.
```
brew tap hverlin/quest
brew cask install quest
```

To update the application, run
```
brew cask upgrade quest
```

## Q&A

> Why not use an indexing service such as [Kendra](https://aws.amazon.com/kendra/), [Elastic search](https://www.elastic.co/) or [Algolia](https://www.algolia.com/)?

Quest is very lightweight and easy to install. While it does not provide the same unified experience, it is good enough to search across many services without relying on an expensive setup.

> Which search features are available?

When you connect an application, Quest directly uses that application's search API. That means it cannot support more advanced queries than these services can support.

Right now, it is capable of doing a full-text search or a search with excluded terms (prepend `-` to the term you want to exclude).

Some date filters are also available when the services support it.

> Can I add the same service multiple times?

Yes! For example you can add several Gmail accounts. It also possible to or add several times a module with the same credentials but a different custom filte (e.g., one filter per "space" on Confluence or one filter per "project" on JIRA)

> Can I override the keyboard shortcuts?

Yes, but this a bit advanced. At the bottom of the settings, there is a button called `Edit configuraton`. From there, you can edit the shortcuts and replace the default ones. Don't forget to save and restart the application.

> Do you support `$SERVICE_NAME`?

Most likely not yet. See [Supported Modules](#supported-modules) for a complete list of supported services. 

You can file an issue or make a PR if you would like a particular app to be supported. There are no guides on how to add a new service yet but you can simply copy-paste an existing module and start from there.

## Development

Quest is built with React, Electron and [Blueprint](https://blueprintjs.com).

Make sure to read about [React-query](https://github.com/tannerlinsley/react-query) and [hookstate](https://github.com/avkonst/hookstate) before contributing.

### Requirement for Linux only

We use the package [keytar](http://atom.github.io/node-keytar/) to handle storage of encrypted settings and credentials in your system's keychain.
Currently, this library uses `libsecret` on Linux platform, so you may need to install it before running `npm ci`:
* Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
* Red Hat-based: `sudo yum install libsecret-devel`
* Arch Linux: `sudo pacman -S libsecret`

### Running

Make sure you have a recent version of NodeJS installed (10+).
```
npm ci
npm start
```

Note that a different configuration file is used in development mode.

### Creating an executable
```
npm run make
```
The app will be located in the `/out` directory.

### License 
Licensed under the MIT license.

Icon made by [Pixel perfect](https://www.flaticon.com/authors/pixel-perfect) from www.flaticon.com
