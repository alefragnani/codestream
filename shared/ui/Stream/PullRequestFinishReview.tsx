import React, { useState, useReducer } from "react";
import {
	FetchThirdPartyPullRequestPullRequest,
	ExecuteThirdPartyTypedType
} from "../protocols/agent/agent.protocol.providers";
import { PRCommentCard, ButtonRow } from "./PullRequestComponents";
import MessageInput from "./MessageInput";
import { RadioGroup, Radio } from "../src/components/RadioGroup";
import { useDispatch, useSelector } from "react-redux";
import { CodeStreamState } from "../store";
import { CSMe } from "../protocols/agent/api.protocol.models";
import { HostApi } from "..";
import { Button } from "../src/components/Button";
import Tooltip from "./Tooltip";
import { api } from "../store/providerPullRequests/actions";
import { replaceHtml } from "../utils";

export const PullRequestFinishReview = (props: {
	pr: FetchThirdPartyPullRequestPullRequest;
	mode: "dropdown" | "timeline";
	fetch: Function;
	setIsLoadingMessage: Function;
	setFinishReviewOpen?: Function;
}) => {
	const dispatch = useDispatch();
	const derivedState = useSelector((state: CodeStreamState) => {
		const currentUser = state.users[state.session.userId!] as CSMe;
		const team = state.teams[state.context.currentTeamId];
		return {
			reviewsState: state.reviews,
			currentUser,
			currentPullRequestId: state.context.currentPullRequest
				? state.context.currentPullRequest.id
				: undefined,
			composeCodemarkActive: state.context.composeCodemarkActive,
			team
		};
	});

	const [reviewText, setReviewText] = useState("");
	const [submittingReview, setSubmittingReview] = useState(false);
	const [reviewType, setReviewType] = useState<"COMMENT" | "APPROVE" | "REQUEST_CHANGES">(
		"COMMENT"
	);
	const [isPreviewing, setIsPreviewing] = useState(false);

	const { pr, mode, fetch, setIsLoadingMessage, setFinishReviewOpen } = props;

	const submitReview = async e => {
		setIsLoadingMessage("Submitting Review...");
		setSubmittingReview(true);
		HostApi.instance.track("PR Review Finished", {
			Host: pr.providerId,
			"Review Type": reviewType
		});
		await dispatch(
			api("submitReview", {
				eventType: reviewType,
				text: replaceHtml(reviewText)
			})
		);
		setFinishReviewOpen && setFinishReviewOpen(false);
		return fetch();
	};

	const cancelReview = async (e, id) => {
		setIsLoadingMessage("Canceling Review...");
		await dispatch(
			api("deletePullRequestReview", {
				pullRequestReviewId: id
			})
		);
		setFinishReviewOpen && setFinishReviewOpen(false);
		fetch();
	};

	const pendingCommentCount =
		pr && pr.pendingReview && pr.pendingReview.comments ? pr.pendingReview.comments.totalCount : 0;

	return (
		<PRCommentCard className={`add-comment finish-review-${mode}`}>
			<div
				style={{
					margin: "5px 0 15px 0",
					border: isPreviewing ? "none" : "1px solid var(--base-border-color)"
				}}
			>
				<MessageInput
					autoFocus
					multiCompose
					text={reviewText}
					placeholder="Leave a comment"
					onChange={setReviewText}
					onSubmit={submitReview}
					setIsPreviewing={value => setIsPreviewing(value)}
				/>
				<div style={{ clear: "both" }}></div>
			</div>
			{!isPreviewing && (
				<RadioGroup
					name="approval"
					selectedValue={reviewType}
					onChange={value => setReviewType(value)}
				>
					<Radio value={"COMMENT"}>
						Comment
						<div className="subtle">Submit general feedback without explicit approval.</div>
					</Radio>
					<Radio disabled={pr.viewerDidAuthor} value={"APPROVE"}>
						<Tooltip
							title={
								pr.viewerDidAuthor
									? "Pull request authors can't approve their own pull request"
									: ""
							}
							placement="top"
						>
							<span>
								Approve
								<div className="subtle">Submit feedback and approve merging these changes. </div>
							</span>
						</Tooltip>
					</Radio>
					<Radio disabled={pr.viewerDidAuthor} value={"REQUEST_CHANGES"}>
						<Tooltip
							title={
								pr.viewerDidAuthor
									? "Pull request authors can't request changes on their own pull request"
									: ""
							}
							placement="top"
						>
							<span>
								{" "}
								Request Changes
								<div className="subtle">Submit feedback that must be addressed before merging.</div>
							</span>
						</Tooltip>
					</Radio>
				</RadioGroup>
			)}
			{!isPreviewing && (
				<ButtonRow>
					<Button isLoading={submittingReview} onClick={submitReview}>
						Submit<span className="wide-text"> review</span>
					</Button>
					{pendingCommentCount > 0 && (
						<Button variant="secondary" onClick={e => cancelReview(e, pr.pendingReview.id)}>
							Cancel review
						</Button>
					)}
					<div className="subtle" style={{ margin: "10px 0 0 10px" }}>
						{pendingCommentCount} pending comment{pendingCommentCount == 1 ? "" : "s"}
					</div>
				</ButtonRow>
			)}
		</PRCommentCard>
	);
};
