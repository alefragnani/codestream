// modified https://github.com/kpdecker/jsdiff/blob/master/src/patch/parse.js
"use strict";
import { Hunk, ParsedDiff } from "diff";

export interface ParsedDiffPatch extends ParsedDiff {
	hunks: HunkPatch[];
}

interface HunkPatch extends Hunk {
	patch: string;
	additions: number;
	changes: number;
	deletions: number;
}

export class GitPatchParser {
	static parse(uniDiff: string, options?: { strict?: boolean }) {
		const diffstr = uniDiff.split(/\r\n|[\n\v\f\r\x85]/);
		const delimiters = uniDiff.match(/\r\n|[\n\v\f\r\x85]/g) || [];
		const list: any = [];
		let i = 0;

		function parseIndex() {
			const index: ParsedDiff = {
				hunks: []
			};
			list.push(index);

			// Parse diff metadata
			while (i < diffstr.length) {
				const line = diffstr[i];

				// File header found, end parsing diff metadata
				if (/^(\-\-\-|\+\+\+|@@)\s/.test(line)) {
					break;
				}

				// Diff index
				const header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);
				if (header) {
					index.index = header[1];
				}

				i++;
			}

			// Parse file headers if they are defined. Unified diff requires them, but
			// there's no technical issues to have an isolated hunk without file header
			parseFileHeader(index);
			parseFileHeader(index);

			// Parse hunks

			while (i < diffstr.length) {
				const line = diffstr[i];

				if (/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(line)) {
					break;
				} else if (/^@@/.test(line)) {
					index.hunks.push(parseHunk());
				} else if (line && options && options.strict) {
					// Ignore unexpected content unless in strict mode
					throw new Error(`Unknown line ${i + 1} ${JSON.stringify(line)}`);
				} else {
					i++;
				}
			}
		}

		// Parses the --- and +++ headers, if none are found, no lines
		// are consumed.
		function parseFileHeader(index: ParsedDiff) {
			const fileHeader = /^(---|\+\+\+)\s+(.*)$/.exec(diffstr[i]);
			if (fileHeader) {
				const keyPrefix = fileHeader[1] === "---" ? "old" : "new";
				const data = fileHeader[2].split("\t", 2);
				let fileName = data[0].replace(/\\\\/g, "\\");
				if (/^".*"$/.test(fileName)) {
					fileName = fileName.substr(1, fileName.length - 2);
				}
				index[keyPrefix === "old" ? "oldFileName" : "newFileName"] = fileName;
				index[keyPrefix === "old" ? "oldHeader" : "newHeader"] = (data[1] || "").trim();

				i++;
			}
		}

		// Parses a hunk
		// This assumes that we are at the start of a hunk.
		function parseHunk() {
			const chunkHeaderIndex = i;
			const chunkHeaderLine = diffstr[i++];
			const chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);

			const hunk = {
				oldStart: +chunkHeader[1],
				oldLines: typeof chunkHeader[2] === "undefined" ? 1 : +chunkHeader[2],
				newStart: +chunkHeader[3],
				newLines: typeof chunkHeader[4] === "undefined" ? 1 : +chunkHeader[4],
				lines: [] as any[],
				linedelimiters: [] as any[],
				patch: "",
				additions: 0,
				changes: 0,
				deletions: 0
			};

			// Unified Diff Format quirk: If the chunk size is 0,
			// the first number is one lower than one would expect.
			// https://www.artima.com/weblogs/viewpost.jsp?thread=164293
			if (hunk.oldLines === 0) {
				hunk.oldStart += 1;
			}
			if (hunk.newLines === 0) {
				hunk.newStart += 1;
			}

			let addCount = 0;
			let removeCount = 0;
			for (; i < diffstr.length; i++) {
				// Lines starting with '---' could be mistaken for the "remove line" operation
				// But they could be the header for the next file. Therefore prune such cases out.
				if (
					diffstr[i].indexOf("--- ") === 0 &&
					i + 2 < diffstr.length &&
					diffstr[i + 1].indexOf("+++ ") === 0 &&
					diffstr[i + 2].indexOf("@@") === 0
				) {
					break;
				}
				const operation = diffstr[i].length === 0 && i !== diffstr.length - 1 ? " " : diffstr[i][0];

				if (operation === "+" || operation === "-" || operation === " " || operation === "\\") {
					hunk.lines.push(diffstr[i]);
					hunk.linedelimiters.push(delimiters[i] || "\n");

					if (operation === "+") {
						addCount++;
						hunk.additions++;
					} else if (operation === "-") {
						removeCount++;
						hunk.deletions++;
					} else if (operation === " ") {
						addCount++;
						removeCount++;
					}
				} else {
					break;
				}
			}

			// Handle the empty block count case
			if (!addCount && hunk.newLines === 1) {
				hunk.newLines = 0;
			}
			if (!removeCount && hunk.oldLines === 1) {
				hunk.oldLines = 0;
			}

			// Perform optional sanity checking
			if (options && options.strict) {
				if (addCount !== hunk.newLines) {
					throw new Error(
						"Added line count did not match for hunk at line " + (chunkHeaderIndex + 1)
					);
				}
				if (removeCount !== hunk.oldLines) {
					throw new Error(
						"Removed line count did not match for hunk at line " + (chunkHeaderIndex + 1)
					);
				}
			}

			hunk.patch = `${chunkHeaderLine}\n${hunk.lines.join("\n")}`;

			return hunk;
		}

		while (i < diffstr.length) {
			parseIndex();
		}

		return list;
	}
}
