"use strict";
import { GitRemoteLike, GitRepository } from "git/gitService";
import * as paths from "path";
import * as qs from "querystring";
import { URI } from "vscode-uri";
import { SessionContainer } from "../container";
import { Logger } from "../logger";
import { Markerish, MarkerLocationManager } from "../managers/markerLocationManager";
import { MAX_RANGE_VALUE } from "../markerLocation/calculator";
import {
	BitbucketBoard,
	BitbucketCard,
	BitbucketCreateCardRequest,
	BitbucketCreateCardResponse,
	CreateThirdPartyCardRequest,
	DocumentMarker,
	FetchThirdPartyBoardsRequest,
	FetchThirdPartyBoardsResponse,
	FetchThirdPartyCardsRequest,
	FetchThirdPartyCardsResponse,
	FetchThirdPartyCardWorkflowRequest,
	FetchThirdPartyCardWorkflowResponse,
	FetchThirdPartyPullRequestCommitsRequest,
	FetchThirdPartyPullRequestCommitsResponse,
	FetchThirdPartyPullRequestRequest,
	FetchThirdPartyPullRequestResponse,
	GetMyPullRequestsRequest,
	GetMyPullRequestsResponse,
	MoveThirdPartyCardRequest,
	MoveThirdPartyCardResponse,
	ThirdPartyProviderCard
} from "../protocol/agent.protocol";
import {
	CodemarkType,
	CSBitbucketProviderInfo,
	CSLocationArray,
	CSReferenceLocation
} from "../protocol/api.protocol";
import { Arrays, log, lspProvider, Strings } from "../system";
import {
	ApiResponse,
	getOpenedRepos,
	getRemotePaths,
	ProviderCreatePullRequestRequest,
	ProviderCreatePullRequestResponse,
	ProviderPullRequestInfo,
	PullRequestComment,
	REFRESH_TIMEOUT,
	ThirdPartyIssueProviderBase,
	ThirdPartyProviderSupportsIssues,
	ThirdPartyProviderSupportsPullRequests
} from "./provider";

interface BitbucketRepo {
	uuid: string;
	full_name: string;
	path: string;
	owner: {
		uuid: string;
		username: string;
		type: string;
	};
	has_issues: boolean;
}

interface BitbucketPermission {
	permission: string;
	repository: BitbucketRepo;
}

interface BitbucketUser {
	uuid: string;
	display_name: string;
	account_id: string;
}

interface BitbucketValues<T> {
	values: T;
	next: string;
}

interface BitbucketPullRequest {
	id: number;
	title: string;
	state: string;
	destination: {
		branch: {
			name: string;
		};
	};
	source: {
		branch: {
			name: string;
		};
	};
	links: {
		html: { href: string };
		comments: {
			href: string;
		};
	};
}

interface BitbucketPullRequestComment {
	id: string;
	user: {
		account_id: string;
		nickname: string;
	};
	content: {
		raw: string;
	};
	created_on: string;
	links: { html: { href: string }; code: { href: string } };
	inline: {
		to?: number;
		from?: number;
		outdated?: boolean;
		path: string;
	};
	pullrequest: {
		id: number;
		title: string;
		links: {
			html: {
				href: string;
			};
		};
	};
}

interface GetPullRequestsResponse extends BitbucketValues<BitbucketPullRequest[]> {}

interface GetPullRequestCommentsResponse extends BitbucketValues<BitbucketPullRequestComment[]> {}

/**
 * BitBucket provider
 * @see https://developer.atlassian.com/bitbucket/api/2/reference/
 */
@lspProvider("bitbucket")
export class BitbucketProvider extends ThirdPartyIssueProviderBase<CSBitbucketProviderInfo>
	implements ThirdPartyProviderSupportsIssues, ThirdPartyProviderSupportsPullRequests {
	private _bitbucketUserId: string | undefined;
	private _knownRepos = new Map<string, BitbucketRepo>();
	private _reposWithIssues: BitbucketRepo[] = [];

	get displayName() {
		return "Bitbucket";
	}

	get name() {
		return "bitbucket";
	}

	get headers() {
		return {
			Authorization: `Bearer ${this.accessToken}`,
			"Content-Type": "application/json"
		};
	}

	getPRExternalContent(comment: PullRequestComment) {
		return {
			provider: {
				name: this.displayName,
				icon: this.name,
				id: this.providerConfig.id
			},
			subhead: `#${comment.pullRequest.id}`,
			actions: [
				{
					label: "Open Comment",
					uri: comment.url
				},
				{
					label: `Open Merge Request #${comment.pullRequest.id}`,
					uri: comment.pullRequest.url
				}
			]
		};
	}

	async onConnected() {
		this._bitbucketUserId = await this.getMemberId();
		this._knownRepos = new Map<string, BitbucketRepo>();
	}

	@log()
	async getBoards(request?: FetchThirdPartyBoardsRequest): Promise<FetchThirdPartyBoardsResponse> {
		void (await this.ensureConnected());

		const openRepos = await getOpenedRepos<BitbucketRepo>(
			r => r.domain === "bitbucket.org",
			p => this.get<BitbucketRepo>(`/repositories/${p}`),
			this._knownRepos
		);

		let boards: BitbucketBoard[];
		if (openRepos.size > 0) {
			const bitbucketRepos = Array.from(openRepos.values());
			boards = bitbucketRepos
				.filter(r => r.has_issues)
				.map(r => ({
					id: r.uuid,
					name: r.full_name,
					apiIdentifier: r.full_name,
					path: r.path,
					singleAssignee: true // bitbucket issues only allow one assignee
				}));
		} else {
			let bitbucketRepos: BitbucketRepo[] = [];
			try {
				let apiResponse = await this.get<BitbucketValues<BitbucketPermission[]>>(
					`/user/permissions/repositories?${qs.stringify({
						fields: "+values.repository.has_issues"
					})}`
				);
				bitbucketRepos = apiResponse.body.values.map(p => p.repository);
				while (apiResponse.body.next) {
					apiResponse = await this.get<BitbucketValues<BitbucketPermission[]>>(
						apiResponse.body.next
					);
					bitbucketRepos = bitbucketRepos.concat(apiResponse.body.values.map(p => p.repository));
				}
			} catch (err) {
				Logger.error(err);
				debugger;
			}
			bitbucketRepos = bitbucketRepos.filter(r => r.has_issues);
			this._reposWithIssues = [...bitbucketRepos];
			boards = bitbucketRepos.map(r => {
				return {
					...r,
					id: r.uuid,
					name: r.full_name,
					apiIdentifier: r.full_name,
					singleAssignee: true // bitbucket issues only allow one assignee
				};
			});
		}

		return { boards };
	}

	// FIXME -- implement this
	async getCardWorkflow(
		request: FetchThirdPartyCardWorkflowRequest
	): Promise<FetchThirdPartyCardWorkflowResponse> {
		return { workflow: [] };
	}

	@log()
	async getCards(request: FetchThirdPartyCardsRequest): Promise<FetchThirdPartyCardsResponse> {
		void (await this.ensureConnected());

		const cards: ThirdPartyProviderCard[] = [];
		if (this._reposWithIssues.length === 0) await this.getBoards();
		await Promise.all(
			this._reposWithIssues.map(async repo => {
				const { body } = await this.get<{ uuid: string; [key: string]: any }>(
					`/repositories/${repo.full_name}/issues`
				);
				// @ts-ignore
				body.values.forEach(card => {
					cards.push({
						id: card.id,
						url: card.links.html.href,
						title: card.title,
						modifiedAt: new Date(card.updated_on).getTime(),
						tokenId: card.id,
						body: card.content ? card.content.raw : ""
					});
				});
			})
		);
		return { cards };
	}

	@log()
	async createCard(request: CreateThirdPartyCardRequest) {
		void (await this.ensureConnected());

		const data = request.data as BitbucketCreateCardRequest;
		const cardData: { [key: string]: any } = {
			title: data.title,
			content: {
				raw: data.description,
				markup: "markdown"
			}
		};
		if (data.assignee) {
			cardData.assignee = { uuid: data.assignee.uuid };
		}
		const response = await this.post<{}, BitbucketCreateCardResponse>(
			`/repositories/${data.repoName}/issues`,
			cardData
		);
		let card = response.body;
		let issueResponse;
		try {
			const strippedPath = card.links.self.href.split(this.baseUrl)[1];
			issueResponse = await this.get<BitbucketCard>(strippedPath);
		} catch (err) {
			Logger.error(err);
			return card;
		}
		card = issueResponse.body;
		card.url = card.links.html!.href;
		return card;
	}

	@log()
	async moveCard(request: MoveThirdPartyCardRequest): Promise<MoveThirdPartyCardResponse> {
		return { success: false };
	}

	private async getMemberId() {
		const userResponse = await this.get<{ uuid: string; [key: string]: any }>(`/user`);

		return userResponse.body.uuid;
	}

	@log()
	async getAssignableUsers(request: { boardId: string }) {
		void (await this.ensureConnected());

		try {
			const repoResponse = await this.get<BitbucketRepo>(`/repositories/${request.boardId}`);
			if (repoResponse.body.owner.type === "team") {
				let members: BitbucketUser[] = [];
				let apiResponse = await this.get<BitbucketValues<BitbucketUser[]>>(
					`/users/${repoResponse.body.owner.username}/members`
				);
				members = apiResponse.body.values;
				while (apiResponse.body.next) {
					apiResponse = await this.get<BitbucketValues<BitbucketUser[]>>(apiResponse.body.next);
					members = members.concat(apiResponse.body.values);
				}

				return {
					users: members.map(u => ({ ...u, id: u.account_id, displayName: u.display_name }))
				};
			} else {
				const userResponse = await this.get<BitbucketUser>("/user");
				const user = userResponse.body;
				return { users: [{ ...user, id: user.account_id, displayName: user.display_name }] };
			}
		} catch (ex) {
			Logger.error(ex);
			return { users: [] };
		}
	}

	@log()
	getPullRequest(
		request: FetchThirdPartyPullRequestRequest
	): Promise<FetchThirdPartyPullRequestResponse> {
		throw new Error("Method not implemented.");
	}

	@log()
	getPullRequestCommits(
		request: FetchThirdPartyPullRequestCommitsRequest
	): Promise<FetchThirdPartyPullRequestCommitsResponse> {
		throw new Error("Method not implemented.");
	}

	@log()
	getMyPullRequests(
		request: GetMyPullRequestsRequest
	): Promise<GetMyPullRequestsResponse[][] | undefined> {
		throw new Error("Method not implemented.");
	}

	@log()
	getPullRequestDocumentMarkers({
		uri,
		repoId,
		streamId
	}: {
		uri: URI;
		repoId: string | undefined;
		streamId: string;
	}): Promise<DocumentMarker[]> {
		return super.getPullRequestDocumentMarkersCore({ uri, repoId, streamId });
	}

	async getRemotePaths(repo: any, _projectsByRemotePath: any) {
		// TODO don't need this ensureConnected -- doesn't hit api
		await this.ensureConnected();
		const remotePaths = await getRemotePaths(
			repo,
			this.getIsMatchingRemotePredicate(),
			_projectsByRemotePath
		);
		return remotePaths;
	}

	protected getOwnerFromRemote(remote: string): { owner: string; name: string } {
		// HACKitude yeah, sorry
		const uri = URI.parse(remote);
		const split = uri.path.split("/");
		const owner = split[1];
		const name = split[2].replace(".git", "");
		return {
			owner,
			name
		};
	}

	async createPullRequest(
		request: ProviderCreatePullRequestRequest
	): Promise<ProviderCreatePullRequestResponse | undefined> {
		void (await this.ensureConnected());

		try {
			const repoInfo = await this.getRepoInfo({ remote: request.remote });
			if (repoInfo && repoInfo.error) {
				return {
					error: repoInfo.error
				};
			}
			const { owner, name } = this.getOwnerFromRemote(request.remote);
			const createPullRequestResponse = await this.post<
				BitBucketCreatePullRequestRequest,
				BitBucketCreatePullRequestResponse
			>(`/repositories/${owner}/${name}/pullrequests`, {
				source: { branch: { name: request.headRefName } },
				destination: { branch: { name: request.baseRefName } },
				title: request.title,
				description: this.createDescription(request)
			});

			const title = `#${createPullRequestResponse.body.id} ${createPullRequestResponse.body.title}`;
			return {
				url: createPullRequestResponse.body.links.html.href,
				title: title
			};
		} catch (ex) {
			Logger.error(ex, `${this.displayName}: createPullRequest`, {
				remote: request.remote,
				head: request.headRefName,
				base: request.baseRefName
			});
			let message = ex.message;
			if (message.indexOf("credentials lack one or more required privilege scopes") > -1) {
				message +=
					"\n\nYou may need to disconnect and reconnect your Bitbucket for CodeStream integration to create your first Pull Request.";
			}
			return {
				error: {
					type: "PROVIDER",
					message: `${this.displayName}: ${message}`
				}
			};
		}
	}

	async getRepoInfo(request: { remote: string }): Promise<any> {
		try {
			const { owner, name } = this.getOwnerFromRemote(request.remote);
			const repoResponse = await this.get<BitBucketRepo>(`/repositories/${owner}/${name}`);
			const pullRequestResponse = await this.get<BitBucketPullRequest>(
				`/repositories/${owner}/${name}/pullrequests?state=OPEN`
			);
			let pullRequests: ProviderPullRequestInfo[] = [];
			if (pullRequestResponse && pullRequestResponse.body && pullRequestResponse.body.values) {
				pullRequests = pullRequestResponse.body.values.map(_ => {
					return {
						id: _.id,
						url: _.links!.html!.href,
						baseRefName: _.destination.branch.name,
						headRefName: _.source.branch.name
					};
				});
			}
			return {
				id: repoResponse.body.uuid,
				defaultBranch:
					repoResponse.body &&
					repoResponse.body.mainbranch &&
					repoResponse.body.mainbranch.name &&
					repoResponse.body.mainbranch.type === "branch"
						? repoResponse.body.mainbranch.name
						: undefined,
				pullRequests: pullRequests
			};
		} catch (ex) {
			Logger.error(ex, `${this.displayName}: getRepoInfo`, {
				remote: request.remote
			});
			return {
				error: {
					type: "PROVIDER",
					message: `${this.displayName}: ${ex.message}`
				}
			};
		}
	}

	private _commentsByRepoAndPath = new Map<
		string,
		{ expiresAt: number; comments: Promise<PullRequestComment[]> }
	>();

	private _isMatchingRemotePredicate = (r: GitRemoteLike) => r.domain === "bitbucket.org";
	getIsMatchingRemotePredicate() {
		return this._isMatchingRemotePredicate;
	}

	@log()
	async getCommentsForPath(
		filePath: string,
		repo: GitRepository
	): Promise<PullRequestComment[] | undefined> {
		const cc = Logger.getCorrelationContext();

		try {
			const relativePath = Strings.normalizePath(paths.relative(repo.path, filePath));
			const cacheKey = `${repo.path}|${relativePath}`;

			const cachedComments = this._commentsByRepoAndPath.get(cacheKey);
			if (cachedComments !== undefined && cachedComments.expiresAt > new Date().getTime()) {
				// NOTE: Keep this await here, so any errors are caught here
				return await cachedComments.comments;
			}

			const remotePath = await getRemotePaths(
				repo,
				this.getIsMatchingRemotePredicate(),
				this._knownRepos
			);

			const commentsPromise: Promise<PullRequestComment[]> =
				remotePath != null
					? this._getCommentsForPathCore(filePath, relativePath, remotePath)
					: Promise.resolve([]);
			this._commentsByRepoAndPath.set(cacheKey, {
				expiresAt: new Date().setMinutes(new Date().getMinutes() + REFRESH_TIMEOUT),
				comments: commentsPromise
			});

			// Since we aren't cached, we want to just kick of the request to get the comments (which will fire a notification)
			// This could probably be enhanced to wait for the commentsPromise for a short period of time (maybe 1s?) to see if it will complete, to avoid the notification roundtrip for fast requests
			return undefined;
		} catch (ex) {
			Logger.error(ex, cc);
			return undefined;
		}
	}

	private async _getCommentsForPathCore(
		filePath: string,
		relativePath: string,
		remotePaths: string[]
	) {
		const comments = [];

		for (const remotePath of remotePaths) {
			const pullRequestsResponse = await this.get<GetPullRequestsResponse>(
				`/repositories/${remotePath}/pullrequests?${qs.stringify({ q: "comment_count>0" })}`
			);

			const prComments = (
				await Promise.all(
					pullRequestsResponse.body.values.map(pr => this._getPullRequestComments(pr, relativePath))
				)
			).reduce((group, current) => group.concat(current), []);

			comments.push(...prComments);
		}

		// If we have any comments, fire a notification
		if (comments.length !== 0) {
			void SessionContainer.instance().documentMarkers.fireDidChangeDocumentMarkers(
				URI.file(filePath).toString(),
				"codemarks"
			);
		}

		return comments;
	}

	private async _getPullRequestComments(
		pr: BitbucketPullRequest,
		filePath: string
	): Promise<PullRequestComment[]> {
		const comments: PullRequestComment[] = [];
		let nextPage: string | undefined = pr.links.comments.href.replace(this.baseUrl, "");

		while (nextPage) {
			const commentsResponse: ApiResponse<GetPullRequestCommentsResponse> = await this.get(
				`${nextPage}?${qs.stringify({
					q: `inline.path="${filePath}"`,
					fields:
						"values.inline.*,values.content.raw,values.user.nickname,values.user.account_id,values.links.html.href,values.created_on,values.links.code.href,values.id"
				})}`
			);
			comments.push(
				...Arrays.filterMap(commentsResponse.body.values, comment => {
					if (comment.inline.outdated) return undefined;

					const [source, destination] = comment.links.code.href
						.match(/\:([^\/][\d\S]+)\?/)![1]
						.split("..");

					const [commit, line] = comment.inline.from
						? [destination, comment.inline.from]
						: [source, comment.inline.to];

					if (line == null) return undefined;

					return {
						commit,
						id: comment.id,
						text: comment.content.raw,
						code: "",
						author: { ...comment.user, id: comment.user.account_id },
						line: Number(line),
						path: comment.inline.path,
						url: comment.links.html.href,
						createdAt: new Date(comment.created_on).getTime(),
						pullRequest: {
							id: pr.id,
							title: pr.title,
							url: pr.links.html.href,
							isOpen: pr.state === "OPEN",
							targetBranch: pr.destination.branch.name,
							sourceBranch: pr.source.branch.name
						}
					};
				})
			);

			if (commentsResponse.body.next) {
				nextPage = commentsResponse.body.next.replace(this.baseUrl, "");
			} else {
				nextPage = undefined;
			}
		}
		return comments;
	}
}

interface BitBucketCreatePullRequestRequest {
	source: {
		branch: {
			name: string;
		};
	};

	destination: {
		branch: {
			name: string;
		};
	};
	title: string;
	description?: string;
}

interface BitBucketCreatePullRequestResponse {
	id: string;
	links: { html: { href: string } };
	number: number;
	title: string;
}

interface BitBucketRepo {
	uuid: string;
	mainbranch?: {
		name?: string;
		type?: string;
	};
}

interface BitBucketPullRequest {
	values: {
		id: string;
		source: {
			branch: {
				name: string;
			};
		};

		destination: {
			branch: {
				name: string;
			};
		};
		links: { html: { href: string } };
	}[];
}
