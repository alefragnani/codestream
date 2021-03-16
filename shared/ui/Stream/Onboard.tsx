import React, { useState, useEffect } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { CodeStreamState } from "../store";
import { getTeamMembers } from "../store/users/reducer";
import { useDidMount, usePrevious } from "../utilities/hooks";
import { HostApi } from "../webview-api";
import { closePanel, invite, openPanel } from "./actions";
import {
	GetLatestCommittersRequestType,
	GetReposScmRequestType,
	ReposScm
} from "@codestream/protocols/agent";
import { Checkbox } from "../src/components/Checkbox";
import { CSText } from "../src/components/CSText";
import { Button } from "../src/components/Button";
import { Link } from "./Link";
import Icon from "./Icon";
import { confirmPopup } from "./Confirm";
import { Dialog } from "../src/components/Dialog";
import { IntegrationButtons, Provider } from "./IntegrationsPanel";
import { PROVIDER_MAPPINGS } from "./CrossPostIssueControls/types";
import { configureAndConnectProvider } from "../store/providers/actions";
import { ComposeKeybindings } from "./ComposeTitles";
import { CreateCodemarkIcons } from "./CreateCodemarkIcons";
import { getPRLabel, isConnected } from "../store/providers/reducer";
import { TextInput } from "../Authentication/TextInput";
import { FormattedMessage } from "react-intl";
import { isEmailValid } from "../Authentication/Signup";
import { OpenUrlRequestType, WebviewPanels } from "@codestream/protocols/webview";
import { TelemetryRequestType } from "@codestream/protocols/agent";
import { setOnboardStep, setShowFeedbackSmiley } from "../store/context/actions";
import { getTestGroup } from "../store/context/reducer";

const Step = styled.div`
	margin: 0 auto;
	text-align: left;
	position: absolute;
	display: none;
	opacity: 0;
	justify-content: center;
	align-items: center;
	flex-direction: row;
	top: 0;
	left: 0;
	width: 100%;
	min-height: 100vh;
	.body {
		padding: 30px 20px 20px 20px;
		margin-bottom: 30px;
		max-width: 450px;
		pointer-events: none;
	}
	p {
		margin-top: 0.5em;
		color: var(--text-color-subtle);
	}
	h1,
	h2,
	h3 {
		color: var(--text-color-highlight);
		margin: 0 0 0 0;
		text-align: center;
	}
	h1 {
		font-size: 32px;
		margin-bottom: 10px;
		.icon {
			pointer-events: none;
			font-size: 24px;
			line-height: 1;
			display: inline-block;
			opacity: 0.5;
			transform: scale(5);
			animation-duration: 2s;
			animation-timing-function: ease-out;
			animation-name: hoverin;
			animation-fill-mode: forwards;
		}
	}
	h3 {
		font-size: 18px;
		margin-bottom: 10px;
		.icon {
			line-height: 2;
			display: inline-block;
			opacity: 0.5;
			transform: scale(2);
			margin: 0 15px;
		}
	}
	.explainer {
		text-align: center;
		&.left {
			text-align: left;
		}
	}
	&.active {
		animation-duration: 0.75s;
		animation-name: slidein;
		animation-timing-function: ease;
		display: flex;
		opacity: 1;
		.body {
			pointer-events: auto;
		}
		z-index: 10;
	}
	&.ease-down {
		animation-duration: 2s;
		animation-timing-function: ease-out;
		animation-name: easedown;
	}
	&.last-active {
		animation-duration: 0.25s;
		animation-name: slideout;
		animation-timing-function: ease;
		animation-fill-mode: forwards;
		display: flex;
		overflow: hidden;
	}
	b {
		color: var(--text-color-highlight);
	}

	@keyframes easedown {
		from {
			transform: translateY(-30px);
		}
		75% {
			transform: translateY(-30px);
		}
		to {
			transform: translateY(0);
		}
	}

	@keyframes hoverin {
		from {
			transform: scale(400) translateY(15vh);
			opacity: 0;
		}

		75% {
			opacity: 0.1;
		}

		to {
			transform: scale(5) translateY(0);
			opacity: 0.5;
		}
	}

	@keyframes slideout {
		from {
			opacity: 1;
			height: auto;
		}
		99% {
			opacity: 0;
			height: auto;
			transform: scale(0.9);
		}
		to {
			opacity: 0;
			height: 0px;
			transform: scale(0.09);
		}
	}
	@keyframes slidein {
		from {
			opacity: 0;
			transform: scale(1);
		}
		50% {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

export const ButtonRow = styled.div`
	margin-top: 10px;
	flex-wrap: wrap;
	justify-content: flex-start;
	white-space: normal; // required for wrap
	button {
		margin: 10px 10px 0 0;
	}
`;

const LinkRow = styled.div`
	margin-top: 20px;
	display: flex;
	align-items: center;
	button {
		margin-left: auto;
	}
	a {
		text-decoration: none;
	}
`;

const CenterRow = styled.div`
	margin-top: 20px;
	text-align: center;
`;

const Dots = styled.div<{ steps: number }>`
	display: flex;
	position: absolute;
	top: calc(100vh - 30px);
	left: calc(50vw - ${props => props.steps * 10}px);
	z-index: 11;
	transition: top 0.15s;
`;

const Dot = styled.div<{ selected?: boolean }>`
	width: 10px;
	height: 10px;
	border-radius: 5px;
	margin: 0 5px;
	background: var(--text-color-highlight);
	opacity: ${props => (props.selected ? "1" : "0.2")};
	transition: opacity 0.25s;
`;

const OutlineBox = styled.div`
	width: 100%;
	border: 1px solid var(--base-border-color);
	padding: 50px 0;
`;

const DialogRow = styled.div`
	display: flex;
	padding: 10px 0;
	&:first-child {
		margin-top: -10px;
	}
	.icon {
		color: var(--text-color-info);
		margin-right: 15px;
		flex-shrink: 0;
		flex-grow: 0;
	}
`;

const SkipLink = styled.div`
	cursor: pointer;
	text-align: center;
	margin-top: 30px;
	color: var(--text-color-subtle);
	opacity: 0.75;
	&:hover {
		opacity: 1;
		color: var(--text-color);
	}
`;

const Keybinding = styled.div`
	margin: 20px 0;
	text-align: center;
	transform: scale(1.5);
`;

const Sep = styled.div`
	border-top: 1px solid var(--base-border-color);
	margin: 10px -20px 20px -20px;
`;

const OutlineNumber = styled.div`
	display: flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	width: 30px;
	height: 30px;
	border-radius: 50%;
	margin: 0 10px 0 0;
	font-weight: bold;

	background: var(--button-background-color);
	color: var(--button-foreground-color);
`;

const ExpandingText = styled.div`
	margin: 10px 0;
	position: relative;

	.error-message {
		position: absolute;
		top: 5px;
		right: 5px;
	}

	animation-duration: 0.25s;
	animation-name: expand;
	animation-timing-function: ease;
	animation-fill-mode: forwards;

	@keyframes expand {
		from {
			height: 0px;
		}
		to {
			height: 25px;
		}
	}
`;

const EMPTY_ARRAY = [];

export const Onboard = React.memo(function Onboard() {
	const dispatch = useDispatch();
	const derivedState = useSelector((state: CodeStreamState) => {
		const { providers } = state;
		const user = state.users[state.session.userId!];

		const connectedProviders = Object.keys(providers).filter(id => isConnected(state, { id }));
		const codeHostProviders = Object.keys(providers)
			.filter(id =>
				[
					"github",
					"github_enterprise",
					"bitbucket",
					"bitbucket_server",
					"gitlab",
					"gitlab_enterprise"
				].includes(providers[id].name)
			)
			.sort((a, b) => {
				return providers[a].name.localeCompare(providers[b].name);
			});
		const connectedCodeHostProviders = codeHostProviders.filter(id =>
			connectedProviders.includes(id)
		);
		const issueProviders = Object.keys(providers)
			.filter(id => providers[id].hasIssues)
			.filter(id => !codeHostProviders.includes(id))
			.sort((a, b) => {
				return providers[a].name.localeCompare(providers[b].name);
			});
		const connectedIssueProviders = issueProviders.filter(id => connectedProviders.includes(id));
		const messagingProviders = Object.keys(providers)
			.filter(id => providers[id].hasSharing)
			.sort((a, b) => {
				return providers[a].name.localeCompare(providers[b].name);
			});
		const connectedMessagingProviders = messagingProviders.filter(id =>
			connectedProviders.includes(id)
		);

		return {
			tourType: "educate", //getTestGroup(state, "onboard") || "educate",
			currentStep: state.context.onboardStep,
			providers: state.providers,
			connectedProviders,
			codeHostProviders,
			connectedCodeHostProviders,
			issueProviders,
			connectedIssueProviders,
			messagingProviders,
			connectedMessagingProviders,
			teamMembers: getTeamMembers(state),
			totalPosts: user.totalPosts || 0,
			isInVSCode: state.ide.name === "VSC",
			isInJetBrains: state.ide.name === "JETBRAINS"
		};
	}, shallowEqual);

	const {
		tourType,
		currentStep,
		connectedCodeHostProviders,
		connectedIssueProviders,
		connectedMessagingProviders
	} = derivedState;

	let NUM_STEPS = 7;
	let CODE_HOSTS_STEP = 1;
	let ISSUE_PROVIDERS_STEP = 2;
	let MESSAGING_PROVIDERS_STEP = 3;
	let CODEMARK_STEP = 5;
	let CONGRATULATIONS_STEP = 6;

	if (tourType === "educate") {
		NUM_STEPS = 7;
		MESSAGING_PROVIDERS_STEP = 2;
		CODE_HOSTS_STEP = 4;
		CONGRATULATIONS_STEP = 6;
		ISSUE_PROVIDERS_STEP = 999;
		CODEMARK_STEP = 999;
	}

	const [lastStep, setLastStep] = useState(currentStep);
	// if we come back into the tour from elsewhere and currentStep is the codemark step, add icons
	const [seenCommentingStep, setSeenCommentingStep] = useState(currentStep === CODEMARK_STEP);
	const previousConnectedCodeHostProviders = usePrevious(derivedState.connectedCodeHostProviders);
	const previousConnectedIssueProviders = usePrevious(derivedState.connectedIssueProviders);
	const previousConnectedMessagingProviders = usePrevious(derivedState.connectedMessagingProviders);
	const previousTotalPosts = usePrevious(derivedState.totalPosts);
	const [showNextMessagingStep, setShowNextMessagingStep] = useState(false);

	useDidMount(() => {
		setTimeout(() => positionDots(), 250);
	});

	// check when you connect to a host provider
	useEffect(() => {
		if (connectedCodeHostProviders.length > (previousConnectedCodeHostProviders || []).length) {
			if (currentStep === CODE_HOSTS_STEP) setStep(currentStep + 1);
		}
	}, [derivedState.connectedCodeHostProviders]);

	useEffect(() => {
		if (connectedIssueProviders.length > (previousConnectedIssueProviders || []).length) {
			if (currentStep === ISSUE_PROVIDERS_STEP) setStep(currentStep + 1);
		}
	}, [derivedState.connectedIssueProviders]);

	useEffect(() => {
		if (connectedMessagingProviders.length > (previousConnectedMessagingProviders || []).length) {
			if (currentStep === MESSAGING_PROVIDERS_STEP) setStep(currentStep + 1);
		}
	}, [derivedState.connectedMessagingProviders]);

	useEffect(() => {
		if (derivedState.totalPosts > (previousTotalPosts || 0)) {
			if (currentStep === CODEMARK_STEP) setStep(CONGRATULATIONS_STEP);
		}
	}, [derivedState.totalPosts]);

	const skip = () => setStep(currentStep + 1);

	const setStep = (step: number) => {
		if (
			tourType === "onboard" &&
			step === CODE_HOSTS_STEP &&
			derivedState.connectedCodeHostProviders.length > 0
		)
			step = 2;
		if (step === NUM_STEPS) {
			dispatch(setOnboardStep(0));
			dispatch(closePanel());
			return;
		}
		if (step === CODEMARK_STEP) setSeenCommentingStep(true);
		setLastStep(currentStep);
		dispatch(setOnboardStep(step));
		setTimeout(() => scrollToTop(), 250);
		setTimeout(() => positionDots(), 250);
	};

	const scrollToTop = () => {
		requestAnimationFrame(() => {
			const $container = document.getElementById("scroll-container");
			if ($container) $container.scrollTo({ top: 0, behavior: "smooth" });
		});
	};

	const positionDots = () => {
		requestAnimationFrame(() => {
			const $active = document.getElementsByClassName("active")[0];
			if ($active) {
				const $dots = document.getElementById("dots");
				if ($dots) $dots.style.top = `${$active.clientHeight - 30}px`;
			}
		});
	};

	const className = (step: number) => {
		if (step === currentStep) return "active";
		if (step === lastStep) return "last-active";
		return "";
	};

	return (
		<>
			{seenCommentingStep && <CreateCodemarkIcons />}
			<div
				id="scroll-container"
				className="onboarding-page"
				style={{
					position: "relative",
					alignItems: "center",
					overflowX: "hidden",
					overflowY: currentStep === 0 ? "hidden" : "auto"
				}}
			>
				<div className="standard-form" style={{ height: "auto", position: "relative" }}>
					<fieldset className="form-body">
						<Step className={`ease-down ${className(0)}`}>
							<div className="body">
								<h1>
									<Icon name="codestream" />
									<br />
									Welcome to CodeStream
								</h1>
								<p className="explainer">
									CodeStream helps you discuss, review, and understand code.
								</p>
								<CenterRow>
									<Button size="xl" onClick={() => setStep(1)}>
										Get Started
									</Button>
								</CenterRow>
							</div>
						</Step>

						{derivedState.tourType === "educate" ? (
							<>
								<ThreeWays className={className(1)} skip={skip} />
								<CodeComments
									className={className(2)}
									skip={skip}
									showNextMessagingStep={showNextMessagingStep}
									setShowNextMessagingStep={setShowNextMessagingStep}
								/>
								<FeedbackRequests className={className(3)} skip={skip} />
								<PullRequests className={className(4)} skip={skip} />
								<InviteTeammates className={className(5)} skip={skip} positionDots={positionDots} />
							</>
						) : (
							<>
								<ConnectCodeHostProvider className={className(1)} skip={skip} />
								<ConnectIssueProvider className={className(2)} skip={skip} />
								<ConnectMessagingProvider
									className={className(3)}
									skip={skip}
									showNextMessagingStep={showNextMessagingStep}
									setShowNextMessagingStep={setShowNextMessagingStep}
								/>
								<InviteTeammates className={className(4)} skip={skip} positionDots={positionDots} />
								<CreateCodemark className={className(CODEMARK_STEP)} skip={skip} />
							</>
						)}

						<Step className={className(CONGRATULATIONS_STEP)}>
							<div className="body">
								<h1>You're good to go!</h1>
								<p className="explainer">
									Next, explore the features, and any time you want to discuss code with your team,
									select it and hit {ComposeKeybindings.comment}
								</p>
								<CenterRow>
									<Button size="xl" onClick={() => setStep(NUM_STEPS)}>
										Open CodeStream
									</Button>
								</CenterRow>
							</div>
						</Step>
					</fieldset>
				</div>
				<Dots
					id="dots"
					steps={
						tourType === "onboard" && connectedCodeHostProviders.length > 0
							? NUM_STEPS - 1
							: NUM_STEPS
					}
				>
					{[...Array(NUM_STEPS)].map((_, index) => {
						const selected = index === currentStep;
						if (
							tourType === "onboard" &&
							index === CODE_HOSTS_STEP &&
							connectedCodeHostProviders.length > 0
						)
							return null;
						return <Dot selected={selected} onClick={() => setStep(index)} />;
					})}
				</Dots>
			</div>
		</>
	);
});

const ThreeWays = (props: { className: string; skip: Function }) => {
	return (
		<Step className={props.className}>
			<div className="body">
				<h3>3 Ways to Collaborate</h3>
				<p className="explainer left">
					CodeStream provides different ways to collaborate depending on where you are in your
					workflow.
				</p>
				<div style={{ margin: "0 0 20px 20px" }}>
					<DialogRow style={{ alignItems: "center" }}>
						<OutlineNumber>1</OutlineNumber>
						<div>
							<b>Code Comments</b> to discuss any block of code at any time
						</div>
					</DialogRow>
					<DialogRow style={{ alignItems: "center" }}>
						<OutlineNumber>2</OutlineNumber>
						<div>
							<b>Feedback Requests</b> to have someone look over your work in progress
						</div>
					</DialogRow>
					<DialogRow style={{ alignItems: "center" }}>
						<OutlineNumber>3</OutlineNumber>
						<div>
							<b>Pull Requests</b> to review and merge completed work
						</div>
					</DialogRow>
				</div>
				<p className="explainer left">Pick and choose those that work best for your team.</p>
				<CenterRow>
					<Button size="xl" onClick={() => props.skip()}>
						Next
					</Button>
				</CenterRow>
			</div>
		</Step>
	);
};

const GIF = (props: { src: string }) => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%"
			}}
		>
			<img style={{ width: "100%" }} src={props.src} />
		</div>
	);
};

const CodeComments = (props: {
	className: string;
	skip: Function;
	showNextMessagingStep: boolean;
	setShowNextMessagingStep: Function;
}) => {
	const derivedState = useSelector((state: CodeStreamState) => {
		const { providers } = state;

		return {
			messagingProviders: Object.keys(providers).filter(id => providers[id].hasSharing),
			img: state.ide.name === "JETBRAINS" ? "CM-JB.gif" : "CM.gif"
		};
	}, shallowEqual);

	return (
		<Step className={props.className}>
			<div className="body">
				<h3>Code Comments</h3>
				<p className="explainer">
					Have a question about some code? Just select the code, click Comment, and ask!
				</p>
				<GIF src={`https://images.codestream.com/onboard/${derivedState.img}`} />
				<br />
				<p className="explainer">
					Connect your messaging service so teams can be notified, and can participate, via Slack or
					Teams.
				</p>
				<IntegrationButtons noBorder noPadding>
					<ProviderButtons
						providerIds={[...derivedState.messagingProviders].reverse()}
						setShowNextMessagingStep={props.setShowNextMessagingStep}
					/>
				</IntegrationButtons>

				{props.showNextMessagingStep ? (
					<CenterRow>
						<Button size="xl" onClick={() => props.skip()}>
							Next
						</Button>
					</CenterRow>
				) : (
					<SkipLink onClick={() => props.skip()}>I'll do this later</SkipLink>
				)}
			</div>
		</Step>
	);
};

const FeedbackRequests = (props: { className: string; skip: Function }) => {
	const derivedState = useSelector((state: CodeStreamState) => {
		const { providers } = state;

		return {
			messagingProviders: Object.keys(providers).filter(id => providers[id].hasSharing),
			img: state.ide.name === "JETBRAINS" ? "FR-JB.gif" : "FR.gif"
		};
	}, shallowEqual);

	return (
		<Step className={props.className}>
			<div className="body">
				<h3>Feedback Requests</h3>
				<p className="explainer">
					Get feedback on your changes with no need to commit, push, open a PR, or leave your IDE.
				</p>
				<GIF src={`https://images.codestream.com/onboard/${derivedState.img}`} />
				<br />
				<p className="explainer">
					Your teammates don't need to switch branches or set aside their own work to review your
					changes.
				</p>
				<CenterRow>
					<Button size="xl" onClick={() => props.skip()}>
						Next
					</Button>
				</CenterRow>
			</div>
		</Step>
	);
};

const PullRequests = (props: { className: string; skip: Function }) => {
	const derivedState = useSelector((state: CodeStreamState) => {
		const { providers } = state;

		const connectedProviders = Object.keys(providers).filter(id => isConnected(state, { id }));
		const codeHostProviders = Object.keys(providers)
			.filter(id =>
				[
					"github",
					"github_enterprise",
					"bitbucket",
					"bitbucket_server",
					"gitlab",
					"gitlab_enterprise"
				].includes(providers[id].name)
			)
			.sort((a, b) => {
				return providers[a].name.localeCompare(providers[b].name);
			});
		const connectedCodeHostProviders = codeHostProviders.filter(id =>
			connectedProviders.includes(id)
		);

		return {
			prLabel: getPRLabel(state),
			codeHostProviders,
			connectedCodeHostProviders,
			img1: state.ide.name === "JETBRAINS" ? "PR-GH-JB.gif" : "PR-GH.gif",
			img2: state.ide.name === "JETBRAINS" ? "PR-GLBB-JB.gif" : "PR-GLBB.gif"
		};
	}, shallowEqual);

	if (derivedState.connectedCodeHostProviders.find(id => id.includes("github"))) {
		return (
			<Step className={props.className}>
				<div className="body">
					<h3>Pull Requests</h3>
					<p className="explainer">
						Create and review pull requests from your IDE, with full-file context, and side-by-side
						diffs that allow you to comment anywhere in the file.
					</p>
					<GIF src={`https://images.codestream.com/onboard/${derivedState.img1}`} />
					<br />
					<p className="explainer">
						Your comments sync to GitHub in real time, so you can try out CodeStream before inviting
						your teammates.
					</p>
					<CenterRow>
						<Button size="xl" onClick={() => props.skip()}>
							Next
						</Button>
					</CenterRow>
				</div>
			</Step>
		);
	} else if (derivedState.connectedCodeHostProviders.length > 0) {
		return (
			<Step className={props.className}>
				<div className="body">
					<h3>{derivedState.prLabel["PullRequests"]}</h3>
					<p className="explainer">
						Create {derivedState.prLabel["pullrequests"]} right from your IDE, with no context
						switching.
					</p>
					<GIF src={`https://images.codestream.com/onboard/${derivedState.img2}`} />
					<br />
					<CenterRow>
						<Button size="xl" onClick={() => props.skip()}>
							Next
						</Button>
					</CenterRow>
				</div>
			</Step>
		);
	} else {
		return (
			<Step className={props.className}>
				<div className="body">
					<h3>Pull Requests</h3>
					<p className="explainer">
						Create and review pull requests from your IDE, with full-file context, and side-by-side
						diffs that allow you to comment anywhere in the file.
					</p>
					<GIF src={`https://images.codestream.com/onboard/${derivedState.img1}`} />
					<br />
					<p className="explainer">
						Your comments sync to your code host in real time, so you can try out CodeStream before
						inviting your teammates.
					</p>
					<IntegrationButtons noBorder noPadding>
						<ProviderButtons providerIds={derivedState.codeHostProviders} />
					</IntegrationButtons>
					<SkipLink onClick={() => props.skip()}>I'll do this later</SkipLink>
				</div>
			</Step>
		);
	}
};

const ConnectCodeHostProvider = (props: { className: string; skip: Function }) => {
	const derivedState = useSelector((state: CodeStreamState) => {
		const { providers } = state;

		const codeHostProviders = Object.keys(providers).filter(id =>
			[
				"github",
				"github_enterprise",
				"bitbucket",
				"bitbucket_server",
				"gitlab",
				"gitlab_enterprise"
			].includes(providers[id].name)
		);

		return {
			codeHostProviders
		};
	}, shallowEqual);

	return (
		<Step className={props.className}>
			<div className="body">
				<h3>
					<Icon name="mark-github" />
					<Icon name="gitlab" />
					<Icon name="bitbucket" />
					<br />
					Connect to your Code Host
				</h3>
				<p className="explainer">Bring pull requests into your IDE to streamline your workflow</p>
				<Dialog>
					<DialogRow>
						<Icon name="check" />
						<div>Rich create pull request interface w/diff tool</div>
					</DialogRow>
					<DialogRow>
						<Icon name="check" />
						<div>
							Visualize code comments from merged-in pull requests as annotations on your source
							files
						</div>
					</DialogRow>
					<DialogRow>
						<Icon name="check" />
						<div>
							Manage pull requests and conduct code reviews with full source-tree context (GitHub
							only)
						</div>
					</DialogRow>
					<Sep />
					<IntegrationButtons noBorder noPadding>
						<ProviderButtons providerIds={derivedState.codeHostProviders} />
					</IntegrationButtons>
				</Dialog>
				<SkipLink onClick={() => props.skip()}>I'll do this later</SkipLink>
			</div>
		</Step>
	);
};

const ConnectIssueProvider = (props: { className: string; skip: Function }) => {
	const derivedState = useSelector((state: CodeStreamState) => {
		const { providers } = state;

		const codeHostProviders = Object.keys(providers).filter(id =>
			[
				"github",
				"github_enterprise",
				"bitbucket",
				"bitbucket_server",
				"gitlab",
				"gitlab_enterprise"
			].includes(providers[id].name)
		);
		const issueProviders = Object.keys(providers)
			.filter(id => providers[id].hasIssues)
			.filter(id => !codeHostProviders.includes(id));

		return {
			issueProviders
		};
	}, shallowEqual);

	return (
		<Step className={props.className}>
			<div className="body">
				<h3>
					<Icon name="jira" />
					<Icon name="trello" />
					<Icon name="asana" />
					<br />
					Connect to your Issue Tracker
				</h3>
				<p className="explainer">Grab tickets and get to work without breaking flow</p>
				<Dialog>
					<DialogRow>
						<Icon name="check" />
						<div>View a list of outstanding tasks assigned to you with custom queries</div>
					</DialogRow>
					<DialogRow>
						<Icon name="check" />
						<div>
							One-click to update task status, create a branch, and update your status on Slack
						</div>
					</DialogRow>
					<DialogRow>
						<Icon name="check" />
						<div>
							Enrich the context of code discussion, pull requests, and feedback requests by
							including ticket information
						</div>
					</DialogRow>
					<Sep />
					<IntegrationButtons noBorder noPadding>
						<ProviderButtons providerIds={derivedState.issueProviders} />
					</IntegrationButtons>
				</Dialog>
				<SkipLink onClick={() => props.skip()}>I'll do this later</SkipLink>
			</div>
		</Step>
	);
};

const ConnectMessagingProvider = (props: {
	className: string;
	skip: Function;
	showNextMessagingStep: boolean;
	setShowNextMessagingStep: Function;
}) => {
	const derivedState = useSelector((state: CodeStreamState) => {
		const { providers } = state;

		return {
			messagingProviders: Object.keys(providers).filter(id => providers[id].hasSharing)
		};
	}, shallowEqual);

	return (
		<Step className={props.className}>
			<div className="body">
				<h3>
					<Icon name="slack" />
					<Icon name="msteams" />
					<br />
					Connect to Slack or MS Teams
				</h3>
				<p className="explainer">Ask questions or make suggestions about any code in your repo</p>
				<Dialog>
					<DialogRow>
						<Icon name="check" />
						<div>
							Discussing code is as simple as: select the code, type your question, and share to a
							channel or DM
						</div>
					</DialogRow>
					<DialogRow>
						<Icon name="check" />
						<div>Code authors are automatically at-mentioned based on git blame info</div>
					</DialogRow>
					<DialogRow>
						<Icon name="check" />
						<div>
							Conversation threads are tied to code locations across branches and as new code merges
							in
						</div>
					</DialogRow>
					<Sep />
					<IntegrationButtons noBorder noPadding>
						<ProviderButtons
							providerIds={[...derivedState.messagingProviders].reverse()}
							setShowNextMessagingStep={props.setShowNextMessagingStep}
						/>
					</IntegrationButtons>
				</Dialog>
				{props.showNextMessagingStep ? (
					<CenterRow>
						<Button size="xl" onClick={() => props.skip()}>
							Next
						</Button>
					</CenterRow>
				) : (
					<SkipLink onClick={() => props.skip()}>I'll do this later</SkipLink>
				)}
			</div>
		</Step>
	);
};

const InviteTeammates = (props: { className: string; skip: Function; positionDots: Function }) => {
	const dispatch = useDispatch();
	const derivedState = useSelector((state: CodeStreamState) => {
		const team = state.teams[state.context.currentTeamId];
		const dontSuggestInvitees = team.settings ? team.settings.dontSuggestInvitees || {} : {};

		return {
			providers: state.providers,
			dontSuggestInvitees,
			teamMembers: getTeamMembers(state)
		};
	}, shallowEqual);

	const [numInviteFields, setNumInviteFields] = useState(1);
	const [inviteEmailFields, setInviteEmailFields] = useState<string[]>([]);
	const [inviteEmailValidity, setInviteEmailValidity] = useState<boolean[]>(
		new Array(50).fill(true)
	);
	const [sendingInvites, setSendingInvites] = useState(false);
	const [skipSuggestedField, setSkipSuggestedField] = useState<{ [email: string]: boolean }>({});
	const [suggestedInvitees, setSuggestedInvitees] = useState<any[]>([]);

	useDidMount(() => {
		getSuggestedInvitees();
	});

	const getSuggestedInvitees = async () => {
		const result = await HostApi.instance.send(GetLatestCommittersRequestType, {});
		const committers = result ? result.scm : undefined;
		if (!committers) return;

		const { teamMembers, dontSuggestInvitees } = derivedState;
		const suggested: any[] = [];
		Object.keys(committers).forEach(email => {
			if (teamMembers.find(user => user.email === email)) return;
			if (dontSuggestInvitees[email.replace(/\./g, "*")]) return;
			suggested.push({ email, fullName: committers[email] || email });
		});
		setSuggestedInvitees(suggested);
		if (suggested.length === 0) setNumInviteFields(3);
	};

	const confirmSkip = () => {
		confirmPopup({
			title: "Skip this step?",
			message:
				"CodeStream is more powerful when you collaborate. You can invite team members at any time, but don’t hoard all the fun.",
			centered: false,
			buttons: [
				{ label: "Go Back", className: "control-button" },
				{
					label: "Skip Step",
					action: () => props.skip(),
					className: "secondary"
				}
			]
		});
	};

	const addInvite = () => {
		setNumInviteFields(numInviteFields + 1);
		setTimeout(() => props.positionDots(), 250);
	};

	const onInviteEmailChange = (value, index) => {
		const invites = [...inviteEmailFields];
		invites[index] = value;
		setInviteEmailFields(invites);
	};

	const onInviteValidityChanged = (field: string, validity: boolean) => {
		const inviteMatches = field.match(/^invite-(\d+)/);
		if (inviteMatches) {
			const invalid = [...inviteEmailValidity];
			invalid[inviteMatches[1]] = validity;
			setInviteEmailValidity(invalid);
		}
	};

	const inviteEmail = async (email: string, method: "Onboarding" | "Onboarding Suggestion") => {
		if (email) {
			await dispatch(invite({ email, inviteType: method }));
			HostApi.instance.track("Teammate Invited", {
				"Invitee Email Address": email,
				"Invitation Method": method
			});
		}
	};

	const sendInvites = async () => {
		setSendingInvites(true);

		let index = 0;
		while (index <= suggestedInvitees.length) {
			if (suggestedInvitees[index]) {
				const email = suggestedInvitees[index].email;
				if (!skipSuggestedField[email]) await inviteEmail(email, "Onboarding Suggestion");
			}
			index++;
		}

		index = 0;
		while (index <= numInviteFields) {
			await inviteEmail(inviteEmailFields[index], "Onboarding");
			index++;
		}

		setSendingInvites(false);
		props.skip();
	};

	return (
		<Step className={props.className}>
			<div className="body">
				<h3>Invite your team</h3>
				<p className="explainer">We recommend exploring CodeStream with your team</p>
				<Dialog>
					{suggestedInvitees.length > 0 && (
						<>
							<p className="explainer left">Suggestions below are based on your git history</p>
							{suggestedInvitees.map(user => {
								return (
									<Checkbox
										name={user.email}
										checked={!skipSuggestedField[user.email]}
										onChange={() => {
											setSkipSuggestedField({
												...skipSuggestedField,
												[user.email]: !skipSuggestedField[user.email]
											});
										}}
									>
										{user.fullName}{" "}
										<CSText as="span" muted>
											{user.email}
										</CSText>
									</Checkbox>
								);
							})}
						</>
					)}
					{[...Array(numInviteFields)].map((_, index) => {
						return (
							<ExpandingText className="control-group">
								<TextInput
									name={`invite-${index}`}
									autoFocus={index === numInviteFields - 1}
									placeholder="name@example.com"
									value={inviteEmailFields[index] || ""}
									onChange={value => onInviteEmailChange(value, index)}
									onValidityChanged={onInviteValidityChanged}
									validate={inviteEmailFields[index] ? isEmailValid : () => true}
								/>
								{!inviteEmailValidity[index] && (
									<small className="error-message">
										<FormattedMessage id="login.email.invalid" />
									</small>
								)}
							</ExpandingText>
						);
					})}
					<LinkRow style={{ minWidth: "180px" }}>
						<Link onClick={addInvite}>+ Add more</Link>
						<Button isLoading={sendingInvites} onClick={sendInvites}>
							Send invites
						</Button>
					</LinkRow>
				</Dialog>
				<SkipLink onClick={confirmSkip}>I'll do this later</SkipLink>
			</div>
		</Step>
	);
};

const CreateCodemark = (props: { className: string; skip: Function }) => {
	const [openRepos, setOpenRepos] = useState<ReposScm[]>(EMPTY_ARRAY);

	useDidMount(() => {
		fetchOpenRepos();
	});

	const fetchOpenRepos = async () => {
		const response = await HostApi.instance.send(GetReposScmRequestType, {
			inEditorOnly: true,
			includeCurrentBranches: true,
			includeProviders: true
		});
		if (response && response.repositories) {
			setOpenRepos(response.repositories);
		}
	};

	return (
		<Step className={props.className}>
			<div className="body">
				<h3>Discuss any code, anytime</h3>
				<p className="explainer">
					Discuss code in a pull request, a feedback request, or to ask a question or make a
					suggestion about any part of your code base.
				</p>
				<Dialog>
					<div
						style={{
							textAlign: "center",
							margin: "0 0 10px 0",
							fontSize: "larger",
							color: "var(--text-color-highlight)"
						}}
					>
						Try sharing a code comment with your team:
					</div>
					{openRepos.length === 0 ? (
						<>
							<DialogRow style={{ alignItems: "center" }}>
								<OutlineNumber>1</OutlineNumber>
								<div>Open a repository in your editor</div>
							</DialogRow>
							<DialogRow style={{ alignItems: "center" }}>
								<OutlineNumber>2</OutlineNumber>
								<div>Select a range in a source file</div>
							</DialogRow>
							<DialogRow style={{ alignItems: "center" }}>
								<OutlineNumber>3</OutlineNumber>
								<div>Click the comment icon or type the keybinding:</div>
							</DialogRow>
						</>
					) : (
						<>
							<DialogRow style={{ alignItems: "center" }}>
								<OutlineNumber>1</OutlineNumber>
								<div>Select a range in your editor</div>
							</DialogRow>
							<DialogRow style={{ alignItems: "center" }}>
								<OutlineNumber>2</OutlineNumber>
								<div>Click the comment icon or type the keybinding:</div>
							</DialogRow>
						</>
					)}
					<Keybinding>{ComposeKeybindings.comment}</Keybinding>
				</Dialog>
				<SkipLink onClick={() => props.skip()}>I'll try this later</SkipLink>
			</div>
		</Step>
	);
};

const ProviderButtons = (props: { providerIds: string[]; setShowNextMessagingStep?: Function }) => {
	const dispatch = useDispatch();
	const derivedState = useSelector((state: CodeStreamState) => {
		const { providers } = state;
		const connectedProviders = Object.keys(providers).filter(id => isConnected(state, { id }));

		return {
			providers: state.providers,
			connectedProviders
		};
	}, shallowEqual);

	return (
		<>
			{props.providerIds.map(providerId => {
				const provider = derivedState.providers[providerId];
				const providerDisplay = PROVIDER_MAPPINGS[provider.name];
				const connected = derivedState.connectedProviders.includes(providerId);
				if (providerDisplay) {
					return (
						<Provider
							key={provider.id}
							variant={connected ? "success" : undefined}
							onClick={() => {
								if (connected) return;
								if (provider.id == "login*microsoftonline*com") {
									HostApi.instance.send(OpenUrlRequestType, {
										url: "https://docs.codestream.com/userguide/features/msteams-integration"
									});
									HostApi.instance.send(TelemetryRequestType, {
										eventName: "Messaging Service Connected",
										properties: {
											Service: provider.name,
											"Connection Location": "Onboard"
										}
									});
									if (props.setShowNextMessagingStep) props.setShowNextMessagingStep(true);
									return;
								}
								dispatch(configureAndConnectProvider(provider.id, "Onboard"));
							}}
						>
							<Icon name={providerDisplay.icon} />
							{providerDisplay.displayName}
						</Provider>
					);
				} else return null;
			})}
		</>
	);
};
