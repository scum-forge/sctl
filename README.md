# sctl

A CLI/API exposing the SCUM database in a human friendly way.

## ✨ Why use this?
- 👉 **Human friendly** — designed for humans (easy access to server resources)
- 🚀 **Exposed API** — integrate with your existing tool (e.g. a bot, web interface, etc.)
- 🤝 **Compatibility** — designed with Node.js and Bun support in mind

## 🚀 Usage guide

> [!TIP]
> Please verify the current usage (and all the available commands) using:
> ```shell
> sctl --help
> sctl get --help
> sctl get body-simulation --help
> # ...
> ```

- Get information about the owner of a vehicle:
```shell
sctl get vehicle-owner <id>
```

- Retrieve parsed readable prisoner's body simulation:
```shell
sctl get body-simulation <steam id 64>
```

## 📝 Changelog

Read the [commits](../../commits) for a comprehensive list of changes.

## 📜 License

Licensed under [MIT License](LICENSE).
