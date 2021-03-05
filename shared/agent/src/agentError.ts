"use strict";

export class AgentError extends Error {
	info: any;
	innerError: Error | undefined;

	constructor(message: string, info: any = {}) {
		super(message);
		this.info = info;
	}

	static wrap(ex: Error, message: string, info: any = {}) {
		const wrapped = new AgentError(message, info);
		wrapped.innerError = ex;
		return wrapped;
	}
}

export class ServerError extends AgentError {
	statusCode: number | undefined;

	constructor(message: string, info: any = {}, statusCode?: number) {
		super(message, info);
		this.statusCode = statusCode;
	}
}

export enum ReportSuppressedMessages {
	/* for errors with access tokens, that are probably permanent */
	AccessTokenInvalid = "Access token invalid",
	/* for connection errors, probably related to the url*/
	ConnectionError = "Connection error",
	/* for network errors that are probably temporary */
	NetworkError = "Network error",
	/* OAuth app access restrictions */
	OAuthAppAccessRestrictionError = "OAuth app access restriction error"
}

export class InternalError extends AgentError {
	public suppressReporting: boolean;

	constructor(message: string, info: any = {}) {
		super(message, info);
		this.name = "InternalError";
		this.suppressReporting = true;
	}
}
