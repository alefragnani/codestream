// Provide the PubnubConnection class, which encapsulates communications with Pubnub to receive
// messages in real-time
"use strict";
import { Agent as HttpsAgent } from "https";
import HttpsProxyAgent from "https-proxy-agent";
import Pubnub from "pubnub";
import { Disposable } from "vscode-languageserver";
// import { PubnubHistory, PubnubHistoryInput, PubnubHistoryOutput } from "./pubnubHistory";
import {
	BroadcasterConnection,
	BroadcasterConnectionOptions,
	BroadcasterHistoryInput,
	BroadcasterHistoryOutput,
	BroadcasterStatusType,
	MessageCallback,
	MessageEvent,
	StatusCallback
} from "./broadcaster";
import { PubnubHistory } from "./pubnubHistory";

interface PubnubMessage {
	timetoken: string;
	message: any;
}

interface PubnubBatchHistoryResponse {
	channels: {
		[channel: string]: PubnubMessage[];
	};
}

interface PubnubHistoryResponse {
	messages: PubnubMessage[];
}

// use this interface to initialize the PubnubConnection class
export interface PubnubInitializer {
	subscribeKey: string; // identifies our Pubnub account, comes from pubnubKey returned with the login response from the API
	authKey: string; // unique Pubnub token provided in the login response
	userId: string; // ID of the current user
	debug?(msg: string, info?: any): void; // for debug messages
	httpsAgent?: HttpsAgent | HttpsProxyAgent;
	onMessage: MessageCallback;
	onStatus: StatusCallback;
}

// internal, maintains map of channels and whether they are yet successfully subscribed
interface SubscriptionMap {
	[key: string]: {
		subscribed: boolean;
		withPresence?: boolean;
	};
}

export class PubnubConnection implements BroadcasterConnection {
	private _userId: string | undefined;
	private _pubnub: Pubnub | undefined;
	private _listener: Pubnub.ListenerParameters | undefined;
	private _statusTimeout: NodeJS.Timer | undefined;
	private _logger: (msg: string, info?: any) => void = () => {};
	private _messageCallback: MessageCallback | undefined;
	private _statusCallback: StatusCallback | undefined;
	private _subscriptionMap: SubscriptionMap = {};

	// initialize PubnubConnection and optionally subscribe to channels
	async initialize(options: PubnubInitializer): Promise<Disposable> {
		if (options.debug) {
			this._logger = options.debug;
		}
		this._debug(`Connection initializing...`);

		this._userId = options.userId;
		this._pubnub = new Pubnub({
			authKey: options.authKey,
			uuid: options.userId,
			subscribeKey: options.subscribeKey,
			restore: true,
			logVerbosity: false,
			heartbeatInterval: 30,
			autoNetworkDetection: true,
			proxy: options.httpsAgent instanceof HttpsProxyAgent && options.httpsAgent.proxy
		} as Pubnub.PubnubConfig);

		this._messageCallback = options.onMessage;
		this._statusCallback = options.onStatus;
		this.addListener();

		return {
			dispose: () => {
				this.disconnect();
				this._pubnub!.stop();
			}
		};
	}

	// subscribe to the passed channels
	subscribe(channels: string[], options: BroadcasterConnectionOptions = {}) {
		const unsubscribedChannels: string[] = [];
		const subscribedChannels: string[] = [];
		for (const channel of channels) {
			const subscription = this._subscriptionMap[channel] || {
				subscribed: false,
				withPresence: !!options.withPresence
			};
			if (subscription.subscribed) {
				subscribedChannels.push(channel);
			} else {
				unsubscribedChannels.push(channel);
			}
		}
		if (subscribedChannels.length > 0) {
			this.onStatus({
				status: BroadcasterStatusType.Connected,
				channels: subscribedChannels
			});
		}
		if (unsubscribedChannels.length > 0) {
			this._debug(`Subscribing to ${JSON.stringify(unsubscribedChannels)}, withPresence=${options.withPresence}`);
			this._pubnub!.subscribe({
				channels: unsubscribedChannels,
				withPresence: options.withPresence
			});
		}
	}

	// unsubscribe to the passed channels
	unsubscribe(channels: string[]) {
		this._pubnub!.unsubscribe({ channels });
	}

	// add listeners for Pubnub status updates, messages, and presence updates
	private addListener() {
		this._listener = {
			message: this.onMessage.bind(this),
			status: this.onStatus.bind(this)
		} as Pubnub.ListenerParameters;
		this._pubnub!.addListener(this._listener);
	}

	// remove Pubnub listeners we set up earlier
	private removeListener() {
		if (this._pubnub && this._listener) {
			this._pubnub.removeListener(this._listener);
		}
	}

	// when a message is received from Pubnub...
	private onMessage(event: Pubnub.MessageEvent) {
		const receivedAt = this.timetokenToTimeStamp(event.timetoken);
		this._debug(`Message received on ${event.channel} at ${receivedAt}`);
		const messageEvent: MessageEvent = {
			receivedAt,
			message: event.message
		};
		if (this._messageCallback) {
			this._messageCallback(messageEvent);
		}
	}

	// respond to a Pubnub status event
	private onStatus(status: Pubnub.StatusEvent | any) {
		this._debug(`Pubnub status received (category=${status.category} operation=${status.operation})`);
		this._debug(`Subscribed channels: ${status.subscribedChannels}`);
		if ((status as any).error && status.operation === Pubnub.OPERATIONS.PNUnsubscribeOperation) {
			// ignore any errors associated with unsubscribing
			return;
		} else if (
			!(status as any).error &&
			status.operation === Pubnub.OPERATIONS.PNSubscribeOperation &&
			status.category === Pubnub.CATEGORIES.PNConnectedCategory
		) {
			this.setConnected(status.subscribedChannels);
		} else if (
			(status as any).error &&
			status.category === Pubnub.CATEGORIES.PNAccessDeniedCategory
		) {
			// an access denied message, in direct response to a subscription attempt
			let response;
			try {
				response = JSON.parse((status as any).errorData.response.text);
			} catch (error) {
				// this is really a total failsafe, but if we can't determine the payload
				// for some reason, we assume the worst
				this._debug("Could not parse AccessDenied response");
				this.reset();
				return;
			}
			this.subscriptionFailure(response.payload.channels || []);
		} else if (
			(status as any).error &&
			(status.operation === Pubnub.OPERATIONS.PNHeartbeatOperation ||
				status.operation === Pubnub.OPERATIONS.PNSubscribeOperation)
		) {
			// a network error of some kind, make sure we are truly connected
			this.netHiccup();
		}
	}

	// set the given channels as successfully subscribed to, and if we're subscribed to
	// all channels that have been requested, catch up on any missed history and emit
	// a Connected event when done
	private setConnected(channels: string[]) {
		if (this._statusCallback) {
			this._statusCallback({
				status: BroadcasterStatusType.Connected,
				channels
			});
		}
	}

	private reset() {
		if (this._statusCallback) {
			this._statusCallback({
				status: BroadcasterStatusType.Reset
			});
		}
	}

	async confirmSubscriptions(channels: string[]): Promise<string[]> {
		// look for the occupants of the given channels, and if we are not among
		// them, something has gone wrong and we must resubscribe
		let response: Pubnub.HereNowResponse;
		let gotError = false;
		try {
			this._debug("Confirming subscription to: " + JSON.stringify(channels));
			response = await this._pubnub!.hereNow({
				channels,
				includeUUIDs: true
			} as Pubnub.HereNowParameters);
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this._debug("Error confirming subscriptions: " + message);
			gotError = true;
		}
		let troubleChannels: string[] = [];
		if (gotError || !response! || !response!.channels) {
			troubleChannels = channels;
		} else {
			troubleChannels = channels.filter(channel => {
				return (
					!response.channels[channel] ||
					!response.channels[channel].occupants.find(occupant => occupant.uuid === this._userId)
				);
			});
		}
		return troubleChannels;
	}

	fetchHistory(options: BroadcasterHistoryInput): Promise<BroadcasterHistoryOutput> {
		return new PubnubHistory().fetchHistory({
			pubnub: this._pubnub!,
			...options
		});
	}

	private async netHiccup() {
		if (this._statusCallback) {
			this._statusCallback({
				status: BroadcasterStatusType.NetworkProblem
			});
		}
	}

	disconnect() {
		this.removeListener();
		if (this._statusTimeout) {
			clearTimeout(this._statusTimeout!);
		}
	}

	reconnect() {
		(this._pubnub! as any).reconnect();
	}

	private async subscriptionFailure(channels: string[]) {
		if (this._statusCallback) {
			this._statusCallback({
				status: BroadcasterStatusType.Failed,
				channels
			});
		}
	}

	// convert from unix timestamp to stringified Pubnub time token
	private timestampToTimetokenStringified(timestamp: number): string {
		return (timestamp * 10000).toString();
	}

	// convert from Pubnub time token to unix timestamp
	private timetokenToTimeStamp(timetoken: string): number {
		return Math.floor(parseInt(timetoken, 10) / 10000);
	}

	_debug(msg: string, info?: any) {
		this._logger(`PUBNUB: ${msg}`, info);
	}
}
