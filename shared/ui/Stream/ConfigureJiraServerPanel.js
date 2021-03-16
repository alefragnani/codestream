import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { closePanel, openPanel } from "./actions";
import { configureProvider } from "../store/providers/actions";
import { setIssueProvider } from "../store/context/actions";
import CancelButton from "./CancelButton";
import Button from "./Button";
import { PROVIDER_MAPPINGS } from "./CrossPostIssueControls/types";

export class ConfigureJiraServerPanel extends Component {
	initialState = {
		baseUrl: "",
		baseUrlTouched: false,
		token: "",
		tokenTouched: false,
		formTouched: false
	};

	state = this.initialState;

	componentDidMount() {
		const el = document.getElementById("configure-provider-initial-input");
		el && el.focus();
	}

	onSubmit = e => {
		e.preventDefault();
		if (this.isFormInvalid()) return;
		const { providerId } = this.props;
		const { token, baseUrl } = this.state;

		let url = baseUrl.trim().toLowerCase();
		url = url.match(/^http/) ? url : `https://${url}`;
		url = url.replace(/\/*$/g, "");

		// configuring is as good as connecting, since we are letting the user
		// set the access token ... sending the fourth argument as true here lets the
		// configureProvider function know that they can mark Kora as connected as soon
		// as the access token entered by the user has been saved to the server
		this.props.configureProvider(
			providerId,
			{ token, baseUrl: url },
			true,
			this.props.originLocation
		);

		this.props.closePanel();
	};

	renderError = () => {};

	onBlurToken = () => {
		this.setState({ tokenTouched: true });
	};

	renderTokenHelp = () => {
		const { token, tokenTouched, formTouched } = this.state;
		if (tokenTouched || formTouched)
			if (token.length === 0) return <small className="error-message">Required</small>;
	};

	onBlurBaseUrl = () => {
		this.setState({ baseUrlTouched: true });
	};

	renderBaseUrlHelp = () => {
		const { baseUrl, baseUrlTouched, formTouched } = this.state;
		if (baseUrlTouched || formTouched) {
			if (baseUrl.length === 0) return <small className="error-message">Required</small>;
		}
	};

	onBlurBaseUrl = () => {
		this.setState({ baseUrlTouched: true });
	};

	renderBaseUrlHelp = () => {
		const { baseUrl, baseUrlTouched, formTouched } = this.state;
		if (baseUrlTouched || formTouched) {
			if (baseUrl.length === 0) return <small className="error-message">Required</small>;
		}
	};

	tabIndex = () => {};

	isFormInvalid = () => {
		return this.state.baseUrl.length === 0 || this.state.token.length === 0;
	};

	handleOldJiraServerClick = e => {
		this.props.closePanel();
		this.props.openPanel(`configure-provider-jiraserverold-jiraserver/enterprise-JiraServerPanel`);
	};

	render() {
		const { providerId } = this.props;
		const inactive = false;
		const { name } = this.props.providers[providerId] || {};
		const providerName = PROVIDER_MAPPINGS[name] ? PROVIDER_MAPPINGS[name].displayName : "";
		const placeholder = "https://myteam.atlassian.net";
		const getUrl = PROVIDER_MAPPINGS[name] ? PROVIDER_MAPPINGS[name].getUrl : "";
		return (
			<div className="panel configure-provider-panel">
				<form className="standard-form vscroll" onSubmit={this.onSubmit}>
					<div className="panel-header">
						<CancelButton onClick={this.props.closePanel} />
						<span className="panel-title">Configure {providerName}</span>
					</div>
					<fieldset className="form-body" disabled={inactive}>
						<p style={{ textAlign: "center" }} className="explainer">
							<a onClick={this.handleOldJiraServerClick}>Click here</a> if your organization uses a
							version of Jira Server older than v8.14.0, which does not support API tokens.
						</p>
						<br />
						{this.renderError()}
						<div id="controls">
							<div id="configure-jira-controls" className="control-group">
								<label>
									<strong>{providerName} Base URL</strong>
								</label>
								<label>Please provide the URL used by your team to access Jira Server.</label>
								<input
									className="input-text control"
									type="text"
									name="baseUrl"
									tabIndex={this.tabIndex()}
									value={this.state.baseUrl}
									onChange={e => this.setState({ baseUrl: e.target.value })}
									onBlur={this.onBlurBaseUrl}
									required={this.state.baseUrlTouched || this.state.formTouched}
									placeholder={placeholder}
									required={true}
									id="configure-provider-initial-input"
								/>
								{this.renderBaseUrlHelp()}
							</div>
							<br />
							<div id="token-controls" className="control-group">
								<label>
									<strong>{providerName} API token</strong>
								</label>
								<label>
									Please provide an{" "}
									<a href="https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html">
										API token
									</a>{" "}
									we can use to access your Jira Server projects and issues.
								</label>
								<input
									className="input-text control"
									type="text"
									name="token"
									tabIndex={this.tabIndex()}
									value={this.state.token}
									onChange={e => this.setState({ token: e.target.value })}
									onBlur={this.onBlurToken}
									required={this.state.tokenTouched || this.state.formTouched}
								/>
								{this.renderTokenHelp()}
							</div>
							<div className="button-group">
								<Button
									id="save-button"
									className="control-button"
									tabIndex={this.tabIndex()}
									type="submit"
									loading={this.state.loading}
								>
									Submit
								</Button>
								<Button
									id="discard-button"
									className="control-button cancel"
									tabIndex={this.tabIndex()}
									type="button"
									onClick={this.props.closePanel}
								>
									Cancel
								</Button>
							</div>
						</div>
					</fieldset>
				</form>
			</div>
		);
	}
}

const mapStateToProps = ({ providers, users, session }) => {
	const currentUser = users[session.userId];
	return { providers, currentUser };
};

export default connect(mapStateToProps, {
	closePanel,
	configureProvider,
	openPanel,
	setIssueProvider
})(injectIntl(ConfigureJiraServerPanel));
