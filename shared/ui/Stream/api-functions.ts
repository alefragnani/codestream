import { HostApi } from "../webview-api";
import { GetDocumentFromMarkerRequestType } from "@codestream/protocols/agent";
import { logError } from "../logger";
import {
	EditorHighlightRangeRequestType,
	EditorHighlightRangeRequest
} from "../ipc/host.protocol.editor";
import { EditorSelectRangeRequestType } from "@codestream/protocols/webview";

export async function getDocumentFromMarker(markerId: string, source?: string) {
	try {
		const response = await HostApi.instance.send(GetDocumentFromMarkerRequestType, {
			markerId: markerId,
			source: source
		});

		return response || undefined;
	} catch (error) {
		logError("Error making request 'GetDocumentFromMarkerRequestType'", {
			message: error.toString()
		});
		return undefined;
	}
}

export async function highlightRange(request: EditorHighlightRangeRequest) {
	try {
		const { success } = await HostApi.instance.send(EditorHighlightRangeRequestType, request);
		return success;
	} catch (error) {
		logError("Error making request 'EditorHighlightRangeRequestType'", {
			message: error.toString()
		});
		return false;
	}
}

export async function moveCursorToLine(markerId: string) {
	const hostApi = HostApi.instance;
	try {
		const response = await getDocumentFromMarker(markerId);

		if (response) {
			// Ensure we put the cursor at the right line (don't actually select the whole range)
			hostApi.send(EditorSelectRangeRequestType, {
				uri: response.textDocument.uri,
				selection: {
					start: response.range.start,
					end: response.range.start,
					cursor: response.range.start
				},
				preserveFocus: true
			});
		}
	} catch (error) {
		// TODO:
	}
}
