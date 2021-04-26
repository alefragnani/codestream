"use strict";
import { Agent as HttpsAgent } from "https";
import HttpsProxyAgent from "https-proxy-agent";
import { Disposable, Emitter, Event } from "vscode-languageserver";
import {
	Broadcaster,
	BroadcasterStatus,
	BroadcasterStatusType
} from "../../broadcaster/broadcaster";
import { Logger } from "../../logger";
import { ConnectionStatus } from "../../protocol/agent.protocol";
import { log } from "../../system";
import { ConnectionRTMessage, MessageType, RawRTMessage } from "../apiProvider";
import { CodeStreamApiProvider } from "./codestreamApi";

const messageToType: {
	[key: string]:
		| MessageType.Codemarks
		| MessageType.Companies
		| MessageType.MarkerLocations
		| MessageType.Markers
		| MessageType.Posts
		| MessageType.Repositories
		| MessageType.Reviews
		| MessageType.Streams
		| MessageType.Teams
		| MessageType.Users
		| undefined;
} = {
	codemark: MessageType.Codemarks,
	codemarks: MessageType.Codemarks,
	company: MessageType.Companies,
	companies: MessageType.Companies,
	marker: MessageType.Markers,
	markerLocations: MessageType.MarkerLocations,
	markers: MessageType.Markers,
	post: MessageType.Posts,
	posts: MessageType.Posts,
	repo: MessageType.Repositories,
	repos: MessageType.Repositories,
	review: MessageType.Reviews,
	reviews: MessageType.Reviews,
	stream: MessageType.Streams,
	streams: MessageType.Streams,
	team: MessageType.Teams,
	teams: MessageType.Teams,
	user: MessageType.Users,
	users: MessageType.Users
};

export interface BroadcasterEventsInitializer {
	accessToken: string;
	broadcasterToken: string;
	api: CodeStreamApiProvider;
	pubnubSubscribeKey?: string;
	socketCluster?: {
		host: string;
		port: string;
		ignoreHttps?: boolean;
	};
	strictSSL: boolean;
	httpsAgent?: HttpsAgent | HttpsProxyAgent;
}

export class BroadcasterEvents implements Disposable {
	private _onDidReceiveMessage = new Emitter<RawRTMessage>();
	get onDidReceiveMessage(): Event<RawRTMessage> {
		return this._onDidReceiveMessage.event;
	}

	private _disposable: Disposable | undefined;
	private readonly _broadcaster: Broadcaster;
	private _subscribedStreamIds = new Set<string>();

	constructor(private readonly _options: BroadcasterEventsInitializer) {
		this._broadcaster = new Broadcaster(this._options.api, this._options.httpsAgent);
		this._broadcaster.onDidStatusChange(this.onBroadcasterStatusChanged, this);
		this._broadcaster.onDidReceiveMessages(this.onBroadcasterMessagesReceived, this);
	}

	@log()
	async connect(streamIds?: string[]): Promise<Disposable> {
		this._disposable = await this._broadcaster.initialize({
			accessToken: this._options.accessToken,
			pubnubSubscribeKey: this._options.pubnubSubscribeKey,
			socketCluster: this._options.socketCluster,
			authKey: this._options.broadcasterToken,
			userId: this._options.api.userId,
			strictSSL: this._options.strictSSL,
			debug: this.debug.bind(this),
			httpsAgent: this._options.httpsAgent
		});

		const channels: string[] = [
			`user-${this._options.api.userId}`,
			`team-${this._options.api.teamId}`
		];

		// this should be deprecated
		for (const streamId of streamIds || []) {
			channels.push(`stream-${streamId}`);
			this._subscribedStreamIds.add(streamId);
		}

		this._broadcaster.subscribe(channels);

		return this._disposable;
	}

	dispose() {
		if (this._disposable === undefined) return;

		this._disposable.dispose();
		this._disposable = undefined;
	}

	@log()
	subscribeToStream(streamId: string) {
		if (!this._subscribedStreamIds.has(streamId)) {
			this._broadcaster.subscribe([`stream-${streamId}`]);
			this._subscribedStreamIds.add(streamId);
		}
	}

	@log()
	unsubscribeFromStream(streamId: string) {
		if (this._subscribedStreamIds.has(streamId)) {
			this._broadcaster.unsubscribe([`stream-${streamId}`]);
			this._subscribedStreamIds.delete(streamId);
		}
	}

	private onBroadcasterStatusChanged(e: BroadcasterStatus) {
		this.debug("Connection status", e);
		switch (e.status) {
			case BroadcasterStatusType.Connected:
				if (e.reconnected) {
					this._onDidReceiveMessage.fire({
						type: MessageType.Connection,
						data: { reset: false, status: ConnectionStatus.Reconnected }
					} as ConnectionRTMessage);
				}
				break;

			case BroadcasterStatusType.Trouble:
				this._onDidReceiveMessage.fire({
					type: MessageType.Connection,
					data: { status: ConnectionStatus.Reconnecting }
				} as ConnectionRTMessage);
				break;

			case BroadcasterStatusType.Reset:
				// TODO: must fetch all data fetch from the server
				this._onDidReceiveMessage.fire({
					type: MessageType.Connection,
					data: { reset: true, status: ConnectionStatus.Reconnected }
				} as ConnectionRTMessage);
				break;

			case BroadcasterStatusType.Offline:
				this._onDidReceiveMessage.fire({
					type: MessageType.Connection,
					data: { status: ConnectionStatus.Disconnected }
				} as ConnectionRTMessage);
				break;

			case BroadcasterStatusType.Failed:
				// TODO: let the extension know we have trouble?
				// the indicated channels have not been subscribed to, what do we do?
				break;
		}
	}

	private onBroadcasterMessagesReceived(messages: { [key: string]: any }[]) {
		for (const message of messages) {
			this.fireMessage(message);
		}
	}

	private fireMessage(message: { [key: string]: any }) {
		const { requestId, messageId, ...messages } = message;
		for (const [dataType, rawData] of Object.entries(messages)) {
			try {
				const type = messageToType[dataType];
				if (type) {
					const data = CodeStreamApiProvider.normalizeResponse<any>(rawData);
					this._onDidReceiveMessage.fire({
						type: type,
						data: Array.isArray(data) ? data : [data]
					});
				} else {
					Logger.warn(`Unknown message type received from broadcaster: ${dataType}`);
				}
			} catch (ex) {
				Logger.error(ex, `Broadcaster '${dataType}' FAILED`);
			}
		}
	}

	private debug(msg: string, info?: any) {
		if (info === undefined) {
			Logger.logWithDebugParams(`BROADCASTER: ${msg}`);
		} else {
			Logger.logWithDebugParams(`BROADCASTER: ${msg}`, info);
		}
	}
}
