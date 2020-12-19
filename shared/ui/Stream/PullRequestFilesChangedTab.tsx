import React, { useState, useEffect } from "react";
import { useDidMount } from "../utilities/hooks";
import { useSelector, useDispatch } from "react-redux";
import { CodeStreamState } from "../store";
import { FileStatus } from "@codestream/protocols/api";
import { LoadingMessage } from "../src/components/LoadingMessage";
import { getPullRequestFiles } from "../store/providerPullRequests/actions";
import { PullRequestFilesChangedList } from "./PullRequestFilesChangedList";
import { HostApi } from "../webview-api";
import { FetchThirdPartyPullRequestPullRequest } from "@codestream/protocols/agent";

const STATUS_MAP = {
	modified: FileStatus.modified
};

export const PullRequestFilesChangedTab = (props: {
	pr: FetchThirdPartyPullRequestPullRequest;
	fetch: Function;
	setIsLoadingMessage: Function;
}) => {
	const { pr } = props;
	const dispatch = useDispatch();
	const derivedState = useSelector((state: CodeStreamState) => {
		return {
			providerPullRequests: state.providerPullRequests.pullRequests,
			pullRequestFilesChangedMode: state.preferences.pullRequestFilesChangedMode || "files",
			currentPullRequestId: state.context.currentPullRequest
				? state.context.currentPullRequest.id
				: undefined
		};
	});

	const [isLoading, setIsLoading] = useState(true);
	const [filesChanged, setFilesChanged] = useState<any[]>([]);

	const _mapData = data => {
		const filesChanged = data.map(_ => {
			return {
				..._,
				linesAdded: _.additions,
				linesRemoved: _.deletions,
				file: _.filename,
				sha: _.sha,
				status: STATUS_MAP[_.status]
			};
		});
		filesChanged.sort((a, b) => a.file.localeCompare(b.file));
		setFilesChanged(filesChanged);
		setIsLoading(false);
	};

	useEffect(() => {
		// re-render if providerPullRequests changes
		(async () => {
			const data = await dispatch(
				getPullRequestFiles(pr.providerId, derivedState.currentPullRequestId!)
			);
			_mapData(data);
		})();
	}, [derivedState.providerPullRequests]);

	useDidMount(() => {
		setIsLoading(true);
		(async () => {
			const data = await dispatch(
				getPullRequestFiles(pr.providerId, derivedState.currentPullRequestId!)
			);
			_mapData(data);
		})();
	});

	if (isLoading)
		return (
			<div style={{ marginTop: "100px" }}>
				<LoadingMessage>Loading Changed Files...</LoadingMessage>
			</div>
		);

	if (!filesChanged || !filesChanged.length) return null;
	return (
		<div style={{ position: "relative", margin: "0 0 20px 20px" }}>
			<PullRequestFilesChangedList
				pr={pr}
				filesChanged={filesChanged}
				repositoryName={pr.repository.name}
				baseRef={pr.baseRefOid}
				baseRefName={pr.baseRefName}
				headRef={pr.headRefOid}
				headRefName={pr.headRefName}
				isLoading={isLoading}
				fetch={props.fetch!}
				setIsLoadingMessage={props.setIsLoadingMessage!}
			/>
		</div>
	);
};
