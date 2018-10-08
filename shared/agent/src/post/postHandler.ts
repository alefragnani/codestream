"use strict";

import * as path from "path";
import { Range } from "vscode-languageserver-protocol";
import URI from "vscode-uri";
import { Container } from "../container";
import { Logger } from "../logger";
import {
	CreatePostWithCodeRequest,
	PreparePostWithCodeRequest,
	PreparePostWithCodeResponse
} from "../shared/agent.protocol";
import { CSCreatePostRequestCodeBlock, CSMarkerLocation, CSPost } from "../shared/api.protocol";
import { Iterables, Strings } from "../system";

export namespace PostHandler {
	let lastFullCode = "";

	export async function documentPreparePost({
		textDocument: documentId,
		range,
		dirty
	}: PreparePostWithCodeRequest): Promise<PreparePostWithCodeResponse> {
		const { documents, git } = Container.instance();

		const document = documents.get(documentId.uri);
		if (document === undefined) {
			throw new Error(`No document could be found for Uri(${documentId.uri})`);
		}
		lastFullCode = document.getText();

		const uri = URI.parse(document.uri);

		let authors: { id: string; username: string }[] | undefined;
		let file: string | undefined;
		let remotes: { name: string; url: string }[] | undefined;
		let rev: string | undefined;

		let gitError;
		let repoPath;
		if (uri.scheme === "file") {
			try {
				repoPath = await git.getRepoRoot(uri.fsPath);
				if (repoPath !== undefined) {
					file = Strings.normalizePath(path.relative(repoPath, uri.fsPath));
					if (file[0] === "/") {
						file = file.substr(1);
					}

					rev = await git.getFileCurrentRevision(uri.fsPath);
					const gitRemotes = await git.getRepoRemotes(repoPath);
					remotes = [...Iterables.map(gitRemotes, r => ({ name: r.name, url: r.normalizedUrl }))];

					const gitAuthors = await git.getFileAuthors(uri.fsPath, {
						startLine: range.start.line,
						endLine: range.end.line - 1,
						contents: dirty ? lastFullCode : undefined
					});
					const authorEmails = gitAuthors.map(a => a.email);

					const users = await Container.instance().users.getByEmails(authorEmails);
					authors = [...Iterables.map(users, u => ({ id: u.id, username: u.username }))];
				}
			} catch (ex) {
				gitError = ex.toString();
				Logger.error(ex);
				debugger;
			}
		}

		return {
			code: document.getText(range),
			source:
				repoPath !== undefined
					? {
							file: file!,
							repoPath: repoPath,
							revision: rev!,
							authors: authors || [],
							remotes: remotes || []
					  }
					: undefined,
			gitError: gitError
		};
	}

	export async function documentPost({
		textDocument: documentId,
		location: rangeArray,
		text,
		code,
		source,
		streamId,
		parentPostId,
		mentionedUserIds
	}: CreatePostWithCodeRequest): Promise<CSPost | undefined> {
		const { git } = Container.instance();
		const filePath = URI.parse(documentId.uri).fsPath;
		const fileContents = lastFullCode;

		let codeBlock: CSCreatePostRequestCodeBlock | undefined;
		let commitHashWhenPosted: string | undefined;
		let location: CSMarkerLocation | undefined;
		let backtrackedLocation: CSMarkerLocation | undefined;
		let remotes: string[] | undefined;
		if (rangeArray) {
			const range = Range.create(rangeArray[0], rangeArray[1], rangeArray[2], rangeArray[3]);
			location = Container.instance().markerLocations.rangeToLocation(range);

			if (source) {
				if (source.revision) {
					commitHashWhenPosted = source.revision;
					backtrackedLocation = await Container.instance().markerLocations.backtrackLocation(
						documentId,
						fileContents,
						location
					);
				} else {
					commitHashWhenPosted = (await git.getRepoHeadRevision(source.repoPath))!;
					backtrackedLocation = Container.instance().markerLocations.emptyFileLocation();
				}
				if (source.remotes && source.remotes.length > 0) {
					remotes = source.remotes.map(r => r.url);
				}
			}

			codeBlock = {
				code,
				remotes,
				file: source && source.file,
				location:
					backtrackedLocation &&
					Container.instance().markerLocations.locationToArray(backtrackedLocation)
			};
		}

		try {
			const post = (await Container.instance().posts.createPost({
				streamId,
				text,
				parentPostId,
				codeBlocks: codeBlock && [codeBlock],
				commitHashWhenPosted,
				mentionedUserIds
			})).post;

			if (post.codeBlocks && backtrackedLocation) {
				const meta = backtrackedLocation.meta;
				if (meta && (meta.startWasDeleted || meta.endWasDeleted)) {
					const uncommittedLocation = {
						...location!,
						id: post.codeBlocks[0].markerId
					};

					await Container.instance().markerLocations.saveUncommittedLocation(
						filePath,
						fileContents,
						uncommittedLocation
					);
				}
			}

			return post;
		} catch (ex) {
			debugger;
			return;
		}
	}
}
