"use strict";
import * as fs from "fs";
import { ProtocolHandler } from "protocolHandler";
import {
	env,
	ExtensionContext,
	extensions,
	MessageItem,
	Uri,
	version as vscodeVersion,
	window,
	workspace,
	WebviewView,
	WebviewViewProvider,
	WebviewViewResolveContext,
	CancellationToken
} from "vscode";
import { ScmTreeDataProvider } from "views/scmTreeDataProvider";
import { GitExtension } from "./@types/git";
import { SessionStatusChangedEvent } from "./api/session";
import { ContextKeys, GlobalState, setContext } from "./common";
import { Config, configuration, Configuration } from "./configuration";
import { extensionQualifiedId } from "./constants";
import { Container } from "./container";
import { Logger, TraceLevel } from "./logger";
import { FileSystem, Strings, Versions } from "./system";

const extension = extensions.getExtension(extensionQualifiedId)!;
export const extensionVersion = extension.packageJSON.version;

interface BuildInfoMetadata {
	buildNumber: string;
	assetEnvironment: string;
}

export interface WebviewLike {
	notify(): Function;
	dispose(): Function;
	show(): Function;
}

class ColorsViewProvider implements WebviewViewProvider {
	public static readonly viewType = "calicoColors.colorsView";

	private _view?: WebviewView;

	constructor(private readonly _extensionUri: Uri) {}

	public async resolveWebviewView(
		webviewView: WebviewView,
		context: WebviewViewResolveContext,
		_token: CancellationToken
	) {
		this._view = webviewView;
		console.log(context);
		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = await this.getHtml();

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case "colorSelected": {
					// window.activeTextEditor?.insertSnippet(new SnippetString(`#${data.value}`));
					break;
				}
			}
		});
	}
	private _html: string | undefined;
	private async getHtml(): Promise<string> {
		// NOTE: if you use workspace.openTextDocument, it will put the webview.html into
		// the lsp document cache, use fs.readFile instead

		if (!Logger.isDebugging && this._html) {
			return this._html;
		}
		this._html = await new Promise<string>((resolve, reject) => {
			fs.readFile(Container.context.asAbsolutePath("webview.html"), "utf8", (err, data) => {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});

		return this._html;
	}

	public addColor() {
		// TODO: add call to reveal

		if (this._view) {
			this._view.webview.postMessage({ type: "addColor" });
		}
	}

	public clearColors() {
		if (this._view) {
			this._view.webview.postMessage({ type: "clearColors" });
		}
	}
}

export async function activate(context: ExtensionContext) {
	const start = process.hrtime();

	Configuration.configure(context);
	Logger.configure(context, configuration.get<TraceLevel>(configuration.name("traceLevel").value));

	let info = await FileSystem.loadJsonFromFile<BuildInfoMetadata>(
		context.asAbsolutePath(`codestream-${extensionVersion}.info`)
	);
	if (info === undefined) {
		info = { buildNumber: "", assetEnvironment: "dev" };
	}

	const edition = env.appName;
	const editionFormat = `${edition.indexOf(" Insiders") > -1 ? " (Insiders)" : ""}`;
	const formattedVersion = `${extensionVersion}${info.buildNumber ? `-${info.buildNumber}` : ""}${
		info.assetEnvironment && info.assetEnvironment !== "prod" ? ` (${info.assetEnvironment})` : ""
	}`;
	Logger.log(
		`CodeStream${editionFormat} v${formattedVersion} in VS Code (v${vscodeVersion}) starting${
			Logger.isDebugging ? " in debug mode" : ""
		}...`
	);

	const git = await gitPath();

	let cfg = configuration.get<Config>();

	if (cfg.serverUrl[cfg.serverUrl.length - 1] === "/") {
		await configuration.updateEffective(
			configuration.name("serverUrl").value,
			cfg.serverUrl.substr(0, cfg.serverUrl.length - 1)
		);

		cfg = configuration.get<Config>();
	}

	await Container.initialize(context, cfg, {
		extension: {
			build: info.buildNumber,
			buildEnv: info.assetEnvironment,
			version: extensionVersion,
			versionFormatted: formattedVersion
		},
		gitPath: git,
		ide: {
			name: "VS Code",
			version: vscodeVersion,
			// Visual Studio Code or Visual Studio Code - Insiders
			detail: edition
		},
		isDebugging: Logger.isDebugging,
		serverUrl: cfg.serverUrl,
		disableStrictSSL: cfg.disableStrictSSL,
		traceLevel: Logger.level
	});

	const scmTreeDataProvider = new ScmTreeDataProvider();
	window.registerTreeDataProvider("scmTreeDataProvider", scmTreeDataProvider);

	context.subscriptions.push(scmTreeDataProvider);

	context.subscriptions.push(Container.session.onDidChangeSessionStatus(onSessionStatusChanged));
	context.subscriptions.push(new ProtocolHandler());
	const provider = new ColorsViewProvider(context.extensionUri);
	context.subscriptions.push(
		window.registerWebviewViewProvider(ColorsViewProvider.viewType, provider)
	);

	const previousVersion = context.globalState.get<string>(GlobalState.Version);
	showStartupUpgradeMessage(context, extensionVersion, previousVersion);
	if (previousVersion === undefined) {
		// show CS on initial install
		await Container.webview.show();
	}

	context.globalState.update(GlobalState.Version, extensionVersion);

	Logger.log(
		`CodeStream${editionFormat} v${formattedVersion} started \u2022 ${Strings.getDurationMilliseconds(
			start
		)} ms`
	);
}

export async function deactivate(): Promise<void> {
	Container.agent.dispose();
}

function onSessionStatusChanged(e: SessionStatusChangedEvent) {
	const status = e.getStatus();
	setContext(ContextKeys.Status, status);
}

let _gitPath: string | undefined;
export async function gitPath(): Promise<string> {
	if (_gitPath === undefined) {
		try {
			const gitExtension = extensions.getExtension("vscode.git");
			if (gitExtension !== undefined) {
				const gitApi = ((gitExtension.isActive
					? gitExtension.exports
					: await gitExtension.activate()) as GitExtension).getAPI(1);
				_gitPath = gitApi.git.path;
			}
		} catch {}

		if (_gitPath === undefined) {
			_gitPath = workspace.getConfiguration("git").get<string>("path") || "git";
		}
	}
	return _gitPath;
}

// Add any versions here that we want to skip for blog posts
const skipVersions = [Versions.from(1, 2)];

async function showStartupUpgradeMessage(
	context: ExtensionContext,
	version: string,
	previousVersion: string | undefined
) {
	// if this is the first install, there is no previous message... don't show
	if (!previousVersion) return;

	if (previousVersion !== version) {
		Logger.log(
			`CodeStream upgraded ${
				previousVersion === undefined ? "" : `from v${previousVersion} `
			}to v${version}`
		);
	}

	const [major, minor] = version.split(".");

	if (previousVersion !== undefined) {
		const [prevMajor, prevMinor] = previousVersion.split(".");
		if (
			(major === prevMajor && minor === prevMinor) ||
			// Don't notify on downgrades
			major < prevMajor ||
			(major === prevMajor && minor < prevMinor)
		) {
			return;
		}
	}

	const compareTo = Versions.from(major, minor);
	if (skipVersions.some(v => Versions.compare(compareTo, v) === 0)) return;

	const actions: MessageItem[] = [{ title: "What's New" } /* , { title: "Release Notes" } */];

	const result = await window.showInformationMessage(
		`CodeStream has been updated to v${version} — check out what's new!`,
		...actions
	);

	if (result != null) {
		if (result === actions[0]) {
			await env.openExternal(
				Uri.parse(
					`https://www.codestream.com/blog/codestream-v${major}-${minor}?utm_source=ext_vsc&utm_medium=popup&utm_campaign=v${major}-${minor}`
				)
			);
		}
		// else if (result === actions[1]) {
		// 	await env.openExternal(
		// 		Uri.parse("https://marketplace.visualstudio.com/items/CodeStream.codestream/changelog")
		// 	);
		// }
	}
}
