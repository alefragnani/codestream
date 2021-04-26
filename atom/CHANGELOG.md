# Change Log

## [11.0.4] - 2021-4-22

### Added

- Adds the ability to edit a pending review comment in a GitLab merge request
- Adds a roadblock to indicate that merge request support for GitLab Self Managed requires version 12.10.X or later

### Changed

- Ask user if they want to switch teams when clicking on a permalink for an item owned by a team other than the one you currently have selected
- More efficient use of GitHub api points to prevent users from getting hit with rate-limit errors
- Decrease the number of git operations being performed at extension startup
- When going a quote reply in a pull/merge request, a blank line is automatically inserted before the cursor to prevent entered text from being included in the quote

### Fixed

- Addresses [#514](https://github.com/TeamCodeStream/CodeStream/issues/514) &mdash; Merge request not listed when using proxy
- Addresses [#477](https://github.com/TeamCodeStream/CodeStream/issues/477) &mdash; Add messaging when not all files in a large MR will be listed
- Fixes an issue where the issue you select via Start Work in one team, also appears in the Work In Progress section for all of your teams
- Fixes an error when creating a pull request
- Fixes an issue with the Open File buttons in the Changed Files section of a feedback request not working
- Fixes an issue with creating a pull request on Bitbucket
- Fixes an issue where collapsing/expanding sections in the Pull Requests section would cause all queries to refresh
- Fixes an issue where clicking on a mention in a merge request opens a blank page
- Fixes an issue where a local-changes warning would be shown when creating a pull request when there's weren't any local changes in the selected repository

## [11.0.3] - 2021-4-12

- Addresses [#486](https://github.com/TeamCodeStream/CodeStream/issues/486) &mdash; Unexpected error clicking on a merge request after update to 11.0

## [11.0.2] - 2021-4-12

### Changed

- List of PRs in the Pull Requests section automatically refreshes after reconnecting to a previously disconnected service

### Fixed

- Addresses [#488](https://github.com/TeamCodeStream/CodeStream/issues/488) &mdash; Can't save custom MR query
- Addresses [#486](https://github.com/TeamCodeStream/CodeStream/issues/486) &mdash; Unexpected error clicking on a merge request after update to 11.0
- Addresses [#483](https://github.com/TeamCodeStream/CodeStream/issues/483) &mdash; Error loading git info when trying to ammend a feedback request
- Addresses [#482](https://github.com/TeamCodeStream/CodeStream/issues/482) &mdash; Gitlab open merge request error field 'approvalsRequired'
- Fixes field 'stages' doesn't exist on type 'Pipeline' on GitLab Self-Managed 13.2.3
- Fixes field 'currentUser' doesn't exist on type 'Query' on GitLab Self-Managed 12.X and below
- Fixes field 'approvalsLeft' doesn't exist on type 'MergeRequest'
- Fixes field 'id' doesn't exist on type 'User' on GitLab Self-Managed 12.X and below
- Addresses [#470](https://github.com/TeamCodeStream/CodeStream/issues/470) &mdash; Shouldn't be able to submit review with zero pending comments
- Fixes an issue with the Template dropdown incorrectly being displayed when creating a PR on GitHub
- Fixes an issue with the display of the "source branch is X commit behind the target branch" copy in a merge request
- Fixes an issue with line breaks getting lost in the description of a feedback request
- Fixes an issue where you can't dismiss a feedback request when opening it via a toast notification on top of an open pull request
- Fixes an error clicking on the Files Changed tab of a pull request

## [11.0.1] - 2021-4-7

### Added

- Adds support for [managing and reviewing GitLab merge requests](http://www.codestream.com/blog/codestream-11-0-manage-gitlab-merge-requests-code-reviews-and-issues-in-vscode-jetbrains)
- Adds blue unread-message badges in the Feedback Requests and Codemarks sections when there are new replies

### Changed

- Replaced the "Reject" button in feedback requests with "Request Changes"
- Renamed the "Needs Works" section in Feedback Requests to "Changes Requested"

### Fixed

- Fixes an issue that would cause blue badges to appear for codemarks/feedback requests even if they didn't have unread replies
- Fixes an issue where Cmd + Enter submits a feedback request with no changes selected
- Fixes an issue where you'd get prompted to review changes after changing branches
- Fixes an issue where the Linear integration wasn't recognizing multiple teams
- Fixes an issue where the assignees list wasn't complete when creating an issue on GitLab
- Fixes an issue with an extraneous entry appearing in the branch dropdowns when creating a pull request
- Fixes an issue with Shift+Click not working on Windows when trying to select a range of commits to review in a pull request
- Fixes an issue with the Feedback menu item under the headshot menu not working

## [10.7.2] - 2021-3-23

### Changed

- Toast notifications for commits are shown even if a feedback request already exists for the given commmit, as long as the feedback request is still open
- The heading of the Codemarks section now shows the number of open codemarks when the section is collapsed

### Fixed

- Fixes an unexpected error when clicking on the Files Changed tab in a pull request

## [10.7.1] - 2021-3-17

### Added

- Adds the ability to set up the Jira Server (v8.14.0 or later) integration using an API token
- Ability to create a pull request against a fork on GitHub Enterprise

### Changed

- Local changes now only block creation of a pull request when done in the context of a feedback request, otherwise it's just a warning
- When creating a pull request, if the diff is huge it is now not displayed by default
- Minor change to the navigation in the sign up/in flow when authenticating via a 3rd party
- UX improvement to the Notification Settings page
- When a teammate proactively creates a feedback request to review a commit of yours, you are now shown as the code author for that feedback request and it will appear in the "Open" section of the Feedback Requests section

### Fixed

- Addresses [#348](https://github.com/TeamCodeStream/CodeStream/issues/348) &mdash; Fixes an issue with checking out to a pull request's branch when the repo name included upper case letters
- Fixes an issue that would result in an unexpected error when clicking on a feedback request

## [10.7.0] - 2021-3-9

### Added

- Adds toast notifications prompting you to review new commits from a teammate after you do a pull
- Adds the ability to review changes in a pull request since your last review, or for a specific range of commits

### Changed

- When you resovle a codemark the modal is now automatically closed
- When creating a feedback request from an auto-prompt, the first line of the commit message is used as the FR title and anything after a newline character goes into the description
- Moved repository/branch information into the header of feedback requests
- Improved support for SSH aliases to prevent "The git repository for this review is not currently open in the IDE" messages from incorrecly being displayed

### Fixed

- Fixes an issue with the you-don't-have-this-file warning, when you view a codemark in a file that doesn't exist in your branch, not persisting
- Addresses [#406](https://github.com/TeamCodeStream/CodeStream/issues/406) &mdash; Inject as comment inserts at wrong marker location
- Addresses [#338](https://github.com/TeamCodeStream/CodeStream/issues/338) &mdash; multiline code break (newline) markdown not rendering inside code block syntax
- Fixes an issue with attaching files via copy-and-paste
- Fixes an issue with codemarks created on Windows showing a diff for the codeblock when there wasn't one
- Fixes an issue where pull_request_template.md files in uppercase weren't being recognized when creating a PR
- Fixes an issue with the inline display of images with a ? in the file name

## [10.6.1] - 2021-2-26

### Added

- Addresses [#411](https://github.com/TeamCodeStream/CodeStream/issues/411) &mdash; Case sensitive branch names

### Changed

- Even if Line Number is the selected sort, the sorting of the Codemarks section is always Date unless Current File is the selected filter

### Fixed

- Fixes an issue with connecting on on-prem services, such as GitHub Entperise and Bitbucket Server
- Addresses [#408](https://github.com/TeamCodeStream/CodeStream/issues/408) &mdash; Codemark not showing code block with Russian characters
- Fixes an issue when clicking on icons in the editor gutter for pull request comments from Bitbucket or GitLab
- Fixes an issue with viewing diffs for pull requests from forks
- Fixes an issue where manually entering triple backticks when adding a code block to a post breaks the formatting of the post
- Fixes an issue where the contents of the Codemarks section would unecessarily reload when switching files within the same repo
- Fixes an issue when clicking to see git diff in review window would trigger an undefined error

## [10.6.0] - 2021-2-19

### Added

- Adds the ability to review a pull request by a specific commit
- Adds a new onboarding tour focussed on educating new users on CodeStream's key features
- Adds a "Shared To" section to codemarks and feedback requests indicating when the item was shared to Slack
- Adds an [automated post to Slack](https://www.codestream.com/blog/codestream-10-6-discussion-resolutions-published-to-slack) when a shared codemark or feedback request has been resolved- Adds the feedback request title to the toast notification when the request is approved, rejected ot reopened

### Fixed

- Fixes an issue with “disable strict SSL” setting not working for self-hosted services
- Fixes an issue with an HTTPS-Required popup incorrectly showing for new on-prem installations
- Addresses [#388](https://github.com/TeamCodeStream/CodeStream/issues/388) &mdash; Codemark issue with filenames containing "+" char
- Fixes an unexpected error when clicking on a pull request
- Fixes an issue with the count in the heading of the Coedmarks section being incorrect when filter isn't set to the current file
- Fixes an issue commenting in a pull request in a file in a folder that doesn't exist in your current branch 
- Fixes an issue with the Slack integration not appearing as a green tile on the Integrations page immediately after connecting
- Fixes an issue with the Locate button not working in a feedback request when you don't have the given repo open
- Fixes an issue with commenting on code in files that are symlinks

## [10.5.1] - 2021-2-10

### Fixed

- Fixes an issue that caused an 'Unexpected Error' screen on sign-in

## [10.5.0] - 2021-2-9

### Added

- Adds checkbox to the Notifications page to control the new Feedback Request Reminder email notification

### Changed

- Comment codemarks can now be resolved
- The Codemarks section of the sidebar breaks out codemarks by status (open, resolved, archived) with new colors for each
- Default filters on the Search page are now Open Issues, Open Code Comments, and Open Feedback Requests, and is:open / is:closed advanced syntax now includes comment codemarks
- CodeStream on-prem customers can now connect to Jira's cloud service using API tokens instead of OAuth

### Fixed

- Fixes issue that prevented pull request creation on github.io repositories
- Fixes an issue with invitation codes for on-prem customers not correctly setting the CodeStream server URL for the invitee
- Fixes an issue when commenting on a pull request that has been sitting open for more than an hour
- Fixes a formatting issue with issues created on Asana

## [10.4.3] - 2021-2-6

### Fixed

- Addresses [#392](https://github.com/TeamCodeStream/CodeStream/issues/392) &mdash; Codemark not showing code block when created from Windows 

## [10.4.2] - 2021-1-29

### Added

- Adds a new tree view in the Changed Files section of feedback requests

### Changed

- Stop sending toast notifications for closed pull requests

### Fixed

- Fixes an issue with commenting in a feedback request in a file with an @ in the name
- Fixes an issue preventing you from being able to edit a feedback request
- Fixes an issue creating an issue codemark on GitLab cloud

## [10.4.1] - 2021-1-26

### Added

- Adds the ability to attach files to a feedback request, or to a reply
- Adds support for custom queries for Jira Server in the Issues section

### Changed

- Automatically populate all reviewer slots in a feedback request, going to recent committers if necessary, if one of the "authorship" assignment options is selected

### Fixed

- Addresses [#380](https://github.com/TeamCodeStream/CodeStream/issues/380) &mdash; Viewing a PR with status checks on GitHub Enterprise generates an error 
- Addresses [#376](https://github.com/TeamCodeStream/CodeStream/issues/376) &mdash; Can't exit preview mode when creating a feedback request
- Fixes an issue where you'd end up in an infinite "Fetching repo..." loop trying to create an issue on Bitbucket
- Fixes an issue creating a permalink when in a WSL environment

## [10.4.0] - 2021-1-19

### Added

- Adds support for [file attachments](https://www.codestream.com/blog/codestream-10-4-file-attachments-github-status-checks) when creating comment or issue codemarks
- Adds support for GitHub status checks in pull requests rendered in CodeStream
- When selecting a Linear issue to start work, the branch name associated with the issue is used
- Adds the ability to pull the latest, if the base branch is behind origin, when previewing diffs while creating a pull request

### Changed

- Prevent the creation of codemarks when in a preview diff while submitting a feedback request

### Fixed

- Addresses [#353](https://github.com/TeamCodeStream/CodeStream/issues/353) &mdash; Codemark glyphs do not show up in WSL environment
- Fixes an issue where starting work on an issue creates a feature branch against the wrong base
- Fixes a data integrity issue that led to a small group of users getting an error clicking on a codemark
- Fixes with the fetching of too much history data from PubNub if client clock is inaccurately set
- Performance improvements
- Fixes an issue with feedback requests assigned to you not appearing in the Approved or Needs Work sections without a reload

## [10.3.0] - 2021-1-8

### Added

- Adds a new integration with the Linear issue-tracking service
- Adds an [integration with GitLens](https://medium.com/teamcodestream/how-we-extended-gitlens-pull-request-functionality-in-visual-studio-code-f4dbecbea4c2) which allows you to create and view pull requests using CodeStream

### Fixed

- Addresses [#364](https://github.com/TeamCodeStream/CodeStream/issues/364) &mdash; Copy button in PR is copying the base branch name instead of the compare branch
- Fixes an issue where the Open File button in the Tree View of the list of files in a PR wouldn't open the correct file if sections of the tree were collapsed

## [10.2.2] - 2020-12-30

### Added

- Split the Feedback Requests section of the sidebar into sections for Open, Approved and Needs Work 
- When selecting a ticket to start work, added an option to pull latest if base branch is behind origin
- Added the ability to set a default base branch per repo when creating a feature branch  

## [10.2.1] - 2020-12-23

### Added

- Adds a new onboarding flow for some users that guides them through the setup of integrations and creating their first code comment
- Adds support for remotes using SSH aliases

### Changed

- When creating a feedback request only commits from current user are checked by default, and only if they include the most recent commit
- The list in the Pull Requests section automatically updates when you open, close or merge a pull request from CodeStream
- The hovers for icons in the editor gutter now make it clear if the discussion was a comment, issue, feedback request or pull request
- Optimization of git operations to gather commits when creating a feedback request

### Fixed

- Fixes an issue where CodeStream would repeatedly reload
- Fixes an issue that would create an error when clicking on a feedback request due to bad data

## [10.2.0] - 2020-12-17

### Added

- Adds new onboarding settings for team admins that allow people to join teams based on repository access, and allow admins to restrict integration and authentication options
- Adds a warning if you have local changes when trying to create a pull request
- Adds new gear menu to header of the My Team section to access team settings and administration

### Fixed

- Fixes an issue where some users would run into GitHub rate limiting issues when working with pull requests
- Fixes an issue where the markdown preview for commenting in a pull request was always empty
- Fixes an issue where adding multiple code blocks to a codemark would result in some not getting added
- Fixes an issue where a GitHub disconnect banner would incorrectly appear due to lack of internet connectivity

## [10.1.2] - 2020-12-4

### Added

- Adds the "Outdated" label to comments on outdated code displayed in a pull request
- Improved diff creation for feedback requests so that you should rarley see the “a commit required to perform this review was not found in the local repository” message

### Fixed

- Fixes an issue where multiple lines of code displayed in a code fence were collapsed down to a single line
- Fixes an issue where Start Work would break if selected a CodeStream issue and the branch template used only {id}
- Fixes an issue where a feedback request couldn't be submitted against a brand new repo with a single commit
- Fixes an issue with the "show instructions" link at the bottom of a feedback request that has replies
- Fixes an off-by-1 issue in the display of comments on the Conversation tab in pull requests

## [10.1.1] - 2020-11-25

### Fixed

- Fixes an issue that prevented you from starting a review when commenting in a pull request

## [10.1.0] - 2020-11-24

### Added

- Add an integration with Clubhouse that allows you to create stories and see your backlog
- Adds the ability to create a GitHub pull request across forks

### Changed

- Improves the UX on the form to submit a review in a pull request by making it clear that the Cancel button is for cancelling the review, and not dismissing the form
- Clarifies that when commenting on code outside of the changeset in a pull request, while a review is pending, the comment is added at the PR level and not included in the review


### Fixed

- Fixes an issue where the icons for pull request comments would be displayed on the wrong line in the gutter of the diff
- Fixes an issue that would result in an error trying to view a pull request
- Addresses [#296](https://github.com/TeamCodeStream/CodeStream/issues/296) &mdash; "Error 401: Unauthorized" when opening a PR on GitLab Self Managed
- Fixes an issue where the viewed status of files in the pull request would get reset after adding a comment
- Fixes an issue that prevented the creation of single pull request comments with certain GitHub Enterprise instances
- Fixes an issue where files would not be displayed in tree view of a pull request if the folder name was a superset of another folder name

## [10.0.5] - 2020-11-13

### Added

- Adds the ability to react to a comment, issue or feedback request, whereas you previously could only react to a reply

### Changed

- Changed the default branch name template to just use the issue's title
- Clicking on an icon in the gutter of a pull-request diff now scrolls you to the corresponding comment
- Improved logic for naming repositories to prioritize upstream and origin remotes

### Fixed

- Fixes an issue that prevented pull request comments from being displayed immediately as icons in the diff gutter
- Fixes an issue that would prevent you from viewing a pull request that had a team as a reviewer
- Fixes an issue that would generate an error if you reloaded while configuring an on-prem issue tracking/code hosting service

## [10.0.4] - 2020-11-13

### Added

- Adds the ability to mention GitHub collaborators when commenting on a pull request
- Adds typeahead search when selecting branches for a new pull request

### Changed

- After creating a pull request, when you then close it you are brought to the CodeStream sidebar instead of back to the Open a Pull Request page 
- Provide more guidance for users trying to sign up/in with GitLab regarding the need to have a public primary email on GitLab
- The "Work in Progress" section is now more performant, with reduced api requests

### Fixed

- Addresses [#322](https://github.com/TeamCodeStream/CodeStream/issues/322) &mdash; When creating a pull request on GitLab or Bitbucket, CodeStream would try to open it in the IDE instead of on the appropriate service
- Addresses [#315](https://github.com/TeamCodeStream/CodeStream/issues/315) &mdash; Creating a PR on GitLab Self-Managed switches base branch with compare branch
- Fixes an issue trying to view a pull request in a repo with more than 100 open or merged pull requests
- Fixes an issue where our polling for updates to a pull request would trigger an error when the user comes back from beign offline
- Fixes an issue with Open Local File not working from the Files Changed tab in a pull request
- Fixes an issue that would prevent you from creating a pull request if you had repos from both GitHub and GitHub Entperise open in your IDE

## [10.0.3] - 2020-11-5

### Added

- Adds support for Azure DevOps issue tracking in the Issues section of the CodeStream pane

### Changed

- After creating a pull request on GitHub Enterprise you are now taken right into the newly created pull request on CodeStream
- Toast notifications for when you're added as a reviewer or assignee to a pull request are now not limited to open pull requests
- Better messaging when you try to create a pull request with no repositories open
- Updated Slack app to use Slack's new granular permissions

### Fixed

- Fixes an issue where pull requests from older versions of GitHub Enterprise wouldn't load
- Fixes an issue where the list of projects and the list of assignees where not list alphabetically when creating an issue on Azure DevOps
- Fixes an issue where you'd receive a toast notification when assiging a pull request to yourself
- Fixes an issue where the default notifications settings weren't being reflected on the Notifications page for new users
- Fixes an issue where the editing of a range in a mult-range codemark caused a change in the ordering of the ranges
- Fixes an issue with some modals having two "X"s to dismiss
- Fixes an issue with ESC not properly dismissing modals/pages
- Fixes an issue where certain actions would inappropriately land you in spatial view

## [10.0.2] - 2020-10-28

### Added

- Adds the ability, in a codemark with multiple code blocks, to intersperse the blocks of code in the codemark text by refencing them with `[#1]`

### Changed

- Changed reference to "requested a review" in activity feed to "requested feedback"
- Replaces "upgrade" link under headshot menu with sales@codestream.com for on-prem customers
- Improve performance and reduce memory usage by caching some expensive git operations

### Fixed

- Addresses [#301](https://github.com/TeamCodeStream/CodeStream/issues/301) &mdash; Creating Feedback Request fails
- Fixes an issue where, after adding a code comment in a pull request, the icon in the diff gutter would not appear immediately
- Fixes an issue where creating a pull request or feedback request from the WIP section didn't default to the correct repo
- Fixes an issue with "/dev/null" entries appearing in list of files when creating a pull request
- Fixes an issue with the Pull Requests section not immediately appearing if you open a GitHub or GitHub Enterprise repository

## [10.0.1] - 2020-10-16

### Fixed

- Fixes an issue where authentication with your code host would seem to fail if you didn't have a repo from that code host open in your IDE

## [10.0.0] - 2020-10-15

### Added

- Adds the ability to submit a review in a pull request without having to first start a review via a code comment
- Code Reviews have been renamed Feedback Requests to better reflect the fact that they are more informal, and are used more frequently, to get feedback on your work in progress throughout the development process
- Adds the ability to jump to your local version of a file from any comment in a pull request
- Adds two new ways to view changes in a pull request. Tree view, which is similar to the current List view, but organizes the files as they’d appear in a source tree. And Diff Hunks view, which is the same view you’re used to seeing on GitHub. List and Tree view provide full-file context, whereas Diff Hunks shows just the lines that changed.
- In any of the three views, mark any file as not viewed if you want to indicate to yourself that you need to come back to it again
- Adds a new Data Export tool, for team admins only, that dumps all code comments (including those done in a feedback request) in CSV format

### Changed

- All-new tree based UI persistently exposes everything you need access to, and everything you need to do
- The interface for commenting on code has been improved so that you’re clear on what code block, if any, has been selected. It’s also easier to add additional ranges.
- When there’s a diff between the code in a codemark and the version you have locally, the original version, the current version, and a diff are all included in the codemark. No need to open a separate diff.
- The Pull Requests section of the sidebar now includes a “Recent” section that shows you your five most recently created PRs, regardless of their current state.
- When reviewing a pull request and commenting on code that isn't part of the changeset, it's now clear that the comment will be added as a PR-level comment and not as part of the review (due to GitHub's limitations)
- When in spatial view of codemarks, there are now clearer indicators of when there are other codemarks above or below the fold

### Fixed

- Fixes an issue where the Work in Progress section would not update unless you first visited the Team tab

## [9.1.0] - 2020-10-6

### Changed

- Implemented Google's diff-match-patch as a fallback for maintaining the location of all markers and pull-request comments

### Fixed

- Fixes an issue with long delays in opening diffs in a code review
- Fixes an issue where the status of viewed files in a PR would get reset if you cancelled the submission of a comment
- Fixes an issue with codemarks being displayed at the top of a file rather than their correct location
- Fixes an issue preventing users from creating pull request comments on the last line of a file
- Fixes an issue that prevented you from closing a pull request from CodeStream
- Fixes an issue where you couldn't open a pull request diff immediately after opening the repo
- Fixes an issue where the "Rebase & merge" button in a PR wouldn't work without a reload

## [9.0.2] - 2020-9-28

### Fixed

- Fixes an issue with the GitHub Enterprise configuration step being skipped when connecting from the Pull Requests section of the Tasks tab
- Fixes an issue where you'd get an error about not having the repo open, when you actually did, when trying to comment on a pull request

## [9.0.1] - 2020-9-23

### Added

- Better error handling for the GitHub pull-request integration, particularly around OAuth issues
- Adds support for Kerberos when creating pull requests from CodeStream
- Pull requests now reflect require-reviewers status

### Changed

- Removed the 5-person team size limit for companies on CodeStream's Free plan

### Fixed

- Fixes an issue where the icon would not appear in the editor gutter right away for a newly created codemark
- Fixes an issue with opening a PR from a repo that you no longer have locally
- Fixes an issue with the caching of GitHub access tokens

## [9.0.0] - 2020-9-17

### Added

- Adds support for GitHub templates when creating a pull request
- Adds the ability to create custom GitHub queries to control which pull requests are displayed on the Tasks tab
- Adds the ability to quickly name a code review or pull request based on ticket name, branch name or commit message

### Changed

- Display of pull requests on the Tasks tab is now broken into sections for Waiting on My Review, Assigned to Me, and Created by Me
- By default, only pull requests associated with repos you have open in your IDE are display, but you also have the ability to show all pull requests
- Allows for the selection of remote branches when creating a PR
- On the Search tab you can now use multiple `tag` arguments to create an AND query
- When the Current File tab is in list view, multi-range codemarks are now only listed once
- When creating a codemark, we now remember the last state of the checkbox(es) for any non-member notifications
- Move cloud authentication options to the top of the signup page

### Fixed

- Fixes an issue with creating codemarks in cshtml files
- Fixes an issue with creating codemarks in a file in a renamed folder on the file system with a new name that varies only by case
- Fixes an issue where the position of codemarks could not be determined

## [8.3.7] - 2020-9-9

### Added

- Adds support for GitHub Enterprise to the new Pull Request integration (beta)
- Adds new keyboard shortcuts for creating pull/merge requests

### Fixed

- Fixes an issue with the repo matching strategy when viewing file diffs in a pull request 
- Fixes an issue with an unexpected error when opening certain PRs
- Fixes an issue with CodeStream not correctly recognizing that you're already connected to GitHub when creating a PR
- Fixes an issue where, after opening a new repo, the list of repos didn't updating automatically when starting work on a ticket, creating a PR, or requesting a code review

## [8.3.6] - 2020-9-2

### Fixed

- Fixes an issue with codemarks not appearing on the Current File tab in certain instances

## [8.3.5] - 2020-9-1

### Added

- Adds support for managing GitHub (cloud only) pull requests and doing PR-based code reviews (BETA)

## [8.3.4] - 2020-8-27

### Fixed

- Fixes an issue related to certain upper-case paths

## [8.3.3] - 2020-8-21

### Fixed

- Fixes an issue with certain scenarios not suggesting appropriate default reviewers using the "authorship" model

## [8.3.2] - 2020-8-13

### Fixed

- Addresses [#224](https://github.com/TeamCodeStream/CodeStream/issues/234) &mdash; Bug with Code range function
- Fixes an issue with the handling of invalid Jira queries
- Fixes an issue with the display of newlines in comments when amending a code review
- Fixes an issue with the handling of renamed files in a code review
- Fixes an issue when editing a codemark with no code block

## [8.3.1] - 2020-8-6

### Fixed

- Fixes an issue where lower case paths were being used in git operations

## [8.3.0] - 2020-8-3

### Added

- Adds the ability to sign into CodeStream with GitLab and Bitbucket
- Adds the ability to jump to a file from the Changed Files section of a code review, in addition to opening the diff
- Adds the ability to upgrade to a paid plan from under the ellipses menu

### Changed

- Team admin capabilities have been relocated to under the ellipses menu for easier access
- Code review progress now survives a reload of your IDE, and is tracked separately for each review update

### Fixed

- Fixes an issue with creating a pull request in projects located inside a subgroup
- Fixes an issues with renamed files in a code review

## [8.2.0] - 2020-7-21

### Added

- Adds the ability to create custom JQL queries to filter the list of Jira tickets
- Adds self-serve payments when subscribing to CodeStream
- Adds a spinner/indicator when diffs are being calculated as a result of new commits being added to a code review

### Changed

- Improved UX when creating a Jira ticket from CodeStream
- Jira tickets now use approropriate icons based on the ticket type
- Improved "start work" UX, particularly around creating a branch
- When creating a blame map (team admins only) you can now select from a drop-down list of emails
- Improved the display of modals throughout the service
- Search box is not displayed in the "What are you working on?" section if there are no tickets listed
- Restructured the initial landing page in the extension to make things clearer for people signing up

### Fixed

- Fixes an issue where you weren't able to adjust notification settings if your on-prem installation didn't have outbound email configured
- Fixes an issue where illegal characters weren't being stripped out of the name when creating a branch 

## [8.1.3] - 2020-7-16

### Added

- Adds the ability to specify your time zone via your Profile page

### Fixed

- Fixes an issue where diffs would be missing when amending a review with pushed commits
- Fixes an issue with extraneous blank lines getting added to code blocks in comments on a code review
- Addresses [#208](https://github.com/TeamCodeStream/CodeStream/issues/208) &mdash;[Object object] error when trying to submit a large review
- Fixes an issue that would allow you to submit a code review before the list of changed files updated based on changes to the selection of commits
- Fixes the broken "skip this" link in the "What are you working on?" section of the Tasks tab

## [8.1.2] - 2020-7-9

### Added

- Adds the ability to update your status on Slack when selecting a task to start work on
- Adds the ability to create pull requests in Bitbucket Server
- Adds the ability to select tickets from Jira and Jira Server, and update their statuses when you start work
- Adds a dismissable banner when CodeStream is set up in an editor group instead of its own pane
- Adds ticket status to the display of tickets in "What are you working on?"
- Adds the display of local commits to the Work In Progress section of the Tasks tab

### Changed

- Changed the name of the Work Items tab to Tasks
- Changed the UI for selecting commits to be included in a code review to make it clear that they have to be sequential
- Removed the ability to set a keybinding for individual codemarks
- Improved the UI for selecting a base branch when creating a feature branch from CodeStream
- Reviews in the Open Reviews section of the Tasks tab are now displayed in descending order

### Fixed

- Fixes an issue with a source file opening when you hover over a code block in the activity, while CodeStream resides in the editor group
- Fixes an issue with creating a codemark when opening the form while the permalink form is still in view
- Fixes an issue with the Loading spinner display when connecting to an issue tracking service via the Tasks tab
- Fixes an issue where the board/list dropdowns didn't have a default selection when creating an issue on Trello
- Fixes an issue where the form to amend a review would not be displayed fully in view
- Fixes an issue where the blue + button was sometimes still accessible when a modal was being displayed

## [8.1.1] - 2020-7-3

### Added

- Adds the ability to search tickets in the "What are you working on" section of Work Items
- Adds the ability to create an ad-hoc work item or create a ticket on your issue-tracking service
- Adds a button to refresh the list of tickets from your issue tracking service

### Changed

- Simplified the form for creating branch templates for team admins
- The Open Reviews section on the Work Items tab now includes reviews that you requested in additon to reviews assigned to you

### Fixed

- Fixes an issue with a banner not being displayed when you have no connectivity
- Fixes an issue with the wrapping of your status display on the Team tab

## [8.1.0] - 2020-7-1

### Added

- Adds a new Work Items tab that summarizes everything on your plate, including open code reviews, your work in progress, and your backlog from your issue tracker

### Changed

- The + menu has moved from the top navigation to the bottom-right of the CodeStream pane

## [8.0.0] - 2020-6-22

### Added

- Adds the ability to "start work" by selecting a ticket (Trello, Jira, etc.), moving it to the appropriate in-progress state, and automatically creating a feature branch
- Adds support for creating PRs in Bitbucket (cloud)
- Adds the ability to create add an upstream branch when creating a PR

## [7.4.2] - 2020-6-20

### Added

- Adds a more granular Help submenu 

## [7.4.1] - 2020-6-9

### Fixed

- Fixes an issue where the current user would be added as a suggested reviewer in a code review

## [7.4.0] - 2020-6-8

### Added

- Adds the ability to notify people via email about codemarks or code review assignments, even if they aren't yet on your CodeStream team

### Changed

- Icons for creating codemarks now appear when you hover in the gutter, or select code in your editor, on most top-level pages and not just on the Current File tab
- Change request titles at the top of a code review now link to the referenced codemark isntead of marking the request complete
- Entry of invite codes is now on the initial page in the extension to make it easier for teammates to join

### Fixed

- Fixes an issue where opening a code review via permalink or from Slack would result in an error in the IDE

## [7.3.0] - 2020-5-29

### Added

- Adds the ability to ammend a code review with new code changes

### Fixed

- Addresses [#195](https://github.com/TeamCodeStream/CodeStream/issues/195) &mdash; .codestreamignore should accept directory/wildcard/regex exclusions

## [7.2.6] - 2020-5-22

### Fixed

- Fixes an issue that prevented signup via GitHub

## [7.2.5] - 2020-5-21

### Added

- Adds support for authentication with Okta for CodeStream On-Prem installations

## [7.2.4] - 2020-5-19

### Added

- Adds the ability to react to posts with emoji
- Adds the display of the server URL to the bottom of the initial page in the extension, for the benefit of on-prem installations

### Changed

- Expose strictSSL requirement setting for Cloud installations
- Improved display of nested replies in a code review's thread

### Fixed

- Fixes an issue where reviews of uncommitted changes in branches containing unpushed commits include the changes from those commits
- Fixes several performance issues associated with the git watcher
- Fixes an issue with flashing headshots on the Search tab when the editor is scrolled

## [7.2.2] - 2020-5-15

### Changed

- Team tab now provides invite codes for on-prem installations running without outbound email
- PR toggle on the Current File tab is suppressed for on-prem installations not using https

### Fixed

- Addresses [#187](https://github.com/TeamCodeStream/CodeStream/issues/187) &mdash; Git error with empty file
- Addresses [#158](https://github.com/TeamCodeStream/CodeStream/issues/187) &mdash; Can't paste HTML tags
- Fixes an issue where editing a reply removed any formatting
- Fixes an issue where pasted HTML would get rendered in a reply
- Fixes an issue with the display of the account settings modals

## [7.2.1] - 2020-5-6

### Added

- Adds new profile pages, accessible by clicking on headshots throughout CodeStream

### Changed

- If you don't have a given repo open when performing a code review you are now able to locate it on disk
- Warning about not having a commit when performing a code review now automatically goes away once you get the commit
- Code review form now automatically recognizes when files are stages or commits are pushed

### Fixed

- Addresses [#181](https://github.com/TeamCodeStream/CodeStream/issues/181) &mdash; Prevent spawning of external git diff tools
- Fixes an issue with repo selection not always being correct the very first time you request a code review
- Fixes an issue where warning about unsaved changes when requesting a code review only display on Windows
- Fixes issues with Esc not always closing various modals and panels
- Fixes an issue with the default code review title not updating when you switched repos
- Fixes an issue where a code review would incorrectly indicate that it included uncommitted local changes

## [7.2.0] - 2020-4-28

### Added

- Adds the ability to require all reviewers assigned to a code review to approve it individually
- Adds the ability for admins to control code review approval requirements
- Adds the ability for adds to control if/how reviewers are suggested for code reviews

### Changed

- The status dropdown and ellipses menu for a code review or issue codemark in the activity feed have been consolidated
- Headshots for issue and code review assignees are now displayed at the right side of activity feed entries
- Truncates the display of the review title when viewing a code review diff
- Updated copy on first extension page to clarify the Create vs Join team choice
- Increased the contrast of menu backgrounds for easier visibility

### Fixed

- Addresses [#178](https://github.com/TeamCodeStream/CodeStream/issues/178) &mdash; Incorrect Jira URL
- Fixes an issue with permanently excluded files appearing in a code review
- Fixes an issue with new or deleted files not being identified as such in code reviews
- Fixes an issue with the ellipses menu missing for closed code reviews
- Fixes an issue where long code review names would render poorly
- Fixes an issue where live-view hovers on the Team tab wouldn't handle large amounts of content

## [7.1.1] - 2020-4-20

### Fixed

- Fixes an issue that omitted the number of changes for modified files in certain code reviews

## [7.1.0] - 2020-4-20

### Added

- Adds new integrations with GitHub Enterprise and GitLab Self-Managed that leverage personal access tokens and no longer require your instance to be publicly accessible
- Adds the ability to send invitation codes on your own in case CodeStream invitation emails are being blocked by your organization
- Adds a way to clear the search box on the Filter & Search tab
- Adds the ability to remove a previously connected Jira Server host

### Changed

- General UI improvements to code reviews, including a warning about open change requests, clearer button copy, etc.

### Fixed

- Fixes an issue where the Submit button on the codemark form was not responsive
- Fixes an issue where new files are still listed in "modified files" even if saved and staged changes are not selected
- Fixes an issue where canceling a review results in the re-rendering of the review form

## [7.0.2] - 2020-4-14

### Fixed

- Fixes an issue with codemarks not appearing in the Current File view for uncommitted files

## [7.0.1] - 2020-4-10

### Added

- Adds the ability to change your email address
- Adds a new guided tour for new users
- Adds a new consolidated Integrations page, simplifying the ellipses menu
- Adds the ability to add a profile photo by specifying a URL
- Adds the ability to remove an invited user from the team
- Adds a list of suggested invitees based on git commit history (for team admins only)

### Changed

- Creating a codemark via the plus menu will now recognize if you have a block of code selected in the editor

### Fixed

- Fixes an issue with assignees not being added to tickets created on Jira
- Fixes an issue with sharing very large posts to Slack

## [7.0.0] - 2020-4-3

### Added

- Code review functionality is no longer in private beta and is now available for all teams
- Adds new "Live View" of what your teammates are working, including warnings about potential merge conflicts
- Adds warnings to the top of the Current File view when a teammate is editing the same file or if there's a potential merge conflict
- Addresses [#162](https://github.com/TeamCodeStream/CodeStream/issues/162) &mdash; Adds admin capabilities and team settings
- Adds the ability for an admin to rename the team
- Adds the ability for an admin to assign/remove admin privileges
- Adds the ability for an admin to remove people from the team
- Adds the ability for an admin to control Live View usage for the team
- Adds the ability for users to change their username
- Adds the ability for users to change their full name
- Adds the ability for users to cancel their accounts

### Changed

- Changes status bar entry from "Sign in..." to "CodeStream" when user is signed out
- Prevents the creation of codemarks when viewing a non-code review diff

### Fixed

- Fixes [#160](https://github.com/TeamCodeStream/CodeStream/issues/160) &mdash; Blank CodeStream pane after starting up VSC
- Fixes [#166](https://github.com/TeamCodeStream/CodeStream/issues/166) &mdash; Error creating codemarks
- Fixes [#168](https://github.com/TeamCodeStream/CodeStream/issues/168) &mdash; Can't post issues to GitHub
- Fixes an issue with the diff for a new file added to a code review being blank

## [6.5.1] - 2020-4-1

### Fixed

- Fixes an issue receiving real-time events for on-prem customers

## [6.5.0] - 2020-3-31

### Added

- Adds the ability to sign into CodeStream with GitHub

## [6.4.0] - 2020-3-27

### Added

- Adds the ability to email and desktop notifications on/off separately
- Adds confirmation message after submitting a code review, or a codemark with no associated code block

### Changed

- When viewing a codemark the entire code block is now clickable and will open the given file

## [6.3.3] - 2020-3-24

### Added

- Mentions on CodeStream now flow through to Slack if there's a match on email address or username

### Fixed

- Fixes an issue with the Compare and Apply buttons not appearing right away when there's a diff

## [6.3.2] - 2020-3-19

### Fixed

- Fixes an issue with codemarks getting created without a code block when the file path included Cyrillic characters
- Fixes an issue with codemarks getting created without a code block when the team contained replies from Slack users that weren't a member of the team

## [6.3.1] - 2020-3-17

### Fixed

- Fixes an issue with the "Open & Assigned to Me" filter not including issue codemarks

## [6.3.0] - 2020-3-10

### Added

- Adds the ability to create an issue not connected to a block of code via the + menu in the global nav

### Changed

- More robust Filter & Search tab with an improved UI, [advanced search syntax](https://github.com/TeamCodeStream/CodeStream/wiki/Filter-and-Search), and the ability to save custom filters
- More readable activity feed UI, with author/action separated out from each card

### Fixed

- Fixes an issue sharing to Slack when there are spaces in the remote URL

## [6.2.1] - 2020-2-26

### Changed

- Shortened the gutter marker tool tips to 80 characters max

## [6.2.0] - 2020-2-19

### Added

- Adds the ability to share codemarks to Microsoft Teams

### Fixed

- Fixes an issue with access tokens expiring for the Jira integration

## [6.1.0] - 2020-2-3

### Added

- Adds the ability to create additional CodeStream teams from the ellipses menu in the top nav

### Changed

- The pull-request integrations will now display comments from open PRs if you are on either the source or destination branches

## [6.0.1] - 2020-1-27

### Fixed

- Fixes [#146](]https://github.com/TeamCodeStream/CodeStream/issues/146) &mdash; Unclear that duplicated shortcut label means keychord
- Fixes an issue that could lead to degraded IDE performance when CodeStream is opened with very large source files
- Fixes an issue where the compose menu in the CodeStream pane would not persist if you switched files while code was selected

## [6.0.0] - 2020-1-14

### Added

- Adds a new Activity Feed to notify you about new codemarks and new replies to codemarks
- Adds the ability for CodeStream teams to optionally share codemarks to Slack, without requiring broad access to your workspace
- Adds the ability to share any existing codemark, including those created by teammates, to Slack
- Adds the ability to reply to codemarks from Slack via a "View Discussion & Reply" button
- Adds the ability to specify a default sharing destination on Slack per repo (look for gear menu at top of the channel-selection dropdown)
- Adds new codemark-centric email notifications, which allow you to post replies by simply replying to the email
- Adds new notification settings under the ellipses menu in the top nav
- Adds the ability to manually follow/unfollow individual codemarks to control notifications
- Adds the ability to create a codemark via the "+" button in the top nav, where the code block is optional
- Adds a new Team tab to the top nav where you can invite teammates and see those already on the team
- Adds repo name to the display of codemarks

### Changed

- Assignment of an issue (excluding those shared externally) is now treated like a mention so that the assignee is notified

### Fixed

- Fixes [#139](]https://github.com/TeamCodeStream/CodeStream/issues/139) &mdash; GitHub PR comments not showing up

## [5.2.5] - 2019-12-20

### Fixed

- Fixes an issue with repo matching on startup

## [5.2.4] - 2019-12-19

### Added

- Adds a roadblock to let people know when CodeStream can't connect due to possible proxy issues

### Changed

- The form to create a codemark is now keyboard navigable

### Fixed

- Fixes an issue with creating codemarks that include blank line at the end of a file
- Fixes a broken link on the form to configure the GitLab Self-Managed integration

## [5.2.3] - 2019-11-27

### Added

- Adds support for self-signed SSL certificates for CodeStream On-Prem
- Adds display of CodeStream version number at the bottom of the ellipses menu

### Fixed

- Fixes an issue with very large codemarks not being displayed on Slack
- Fixes an issue with "Open on GitHub" buttons not accounting for .com-githubHandle remote syntax

## [5.2.2] - 2019-11-19

### Added

- Adds support for merge request comments from GitLab via the "PR" toggle on the Current File tab

### Changed

- When you cancel the creation of a codemark you are now prompted to confirm the action<
- By default, codemarks are now displayed as glyphs in the editor even when the Current File tab is selected

### Fixed

- Fixes an issue with the display of codemarks, as well as the codemark creation form, near the bottom of a file
- Fixes an issue where Slack DMs sometimes weren't available for sharing a codemark

## [5.2.0] - 2019-11-6

### Changed

- Repo matching logic now also includes commit hashes to better handle scenarios where teammates don't have a common remote URL for the same repo

### Fixed

- Fixes an issue where the codemark compose form and the newly-created codemark would briefly appear at the same time
- Fixes an issue where the current codemark was available for selection as a related codemark

## [5.1.0] - 2019-10-30

### Added

- Adds "Open in IDE", "Open on Web" and "Open on GitHub" (or Bitbucket/GitLab) links to issues created in external issue-tracking services (Jira, Trello, etc.)
- Adds the ability to manually reposition a codemark in cases where its location isn't automatically updated based on changes to the code

### Changed

- Changed the "Open on CodeStream" button in posts to Slack / MS Teams to "Open on Web"
- Improvements on codemark location calulation
- The standard font size in the CodeStream tab will match that of the tree-view and status bar

### Fixed

- Fixes an issue with editing replies
- Fixes an issue with the dropdowns for Author and Branch on the Search tab not working
- Fixes an issue with the formatting of code blocks in issues created on YouTrack
- Fixes an issue where the "Open in IDE" button, for codemarks with multiple locations, would always open to the first location
- Fixes issues with "Open in IDE" from codemark pages in Firefox

## [5.0.1] - 2019-10-18

### Fixed

- Fixes an issue with codemarks disappearing after a commit

## [5.0.0] - 2019-10-16

### Added

- Add the ability to have multiple blocks of code, even across files/repos, associated with a single codemark
- Adds the ability to create issues on GitLab Enterprise

### Changed

- Codemarks can now be created and shared with your teammates even if you have unpushed commits
- Archived codemarks and resolved issues are now both controlled by the Archived filter on the Current File tab

### Fixed

- Fixes an issue where assignee wasn't being set correctly for issues created on GitLab
- Fixes an issue with the Asana integration where tasks weren't getting created

## [4.0.1] - 2019-10-2

### Added

- Adds the ability to filter codemarks on the Search tab by author, branch or commit

### Fixed

- Fixes an issue with changing issue-tracking services via the dropdown on the codemark form

## [4.0.0] - 2019-10-1

### Added

- Comments on merged-in pull requests from either GitHub or Bitbucket are now displayed right alongside the code blocks they refer to
- The ability to inject a codemark as an inline comment now has an option to include replies

### Fixed

- Fixes an issue where an issue codemark with a blank description would not get posted to Slack
- Fixes an issue where automated closed/opened messages for issue codemarks were not getting posted to Slack
- Fixes the sort order of Jira projects so that they are in alphabetical order
- Fixes an issue where the ability to star a reply was missing for Slack-connected teams
- Fixes an issue where Slack desktop notifications for codemarks would not include any content

## [3.0.1] - 2019-9-20

### Added

- Adds options to codemarks shared on Microsoft Teams to open a codemark on the web, in your IDE or, in the case of issues, on the issue-tracking service
- Adds new tophat to display of codemarks when the referenced code has been deleted

### Changed

- The bookmark codemark type has been removed, to be brought back at a future date

### Fixed

- Fixes [#117](]https://github.com/TeamCodeStream/CodeStream/issues/117) &mdash; Deleting codemark from Search tab causes unexpected error
- Fixes [#116](]https://github.com/TeamCodeStream/CodeStream/issues/116) &mdash; Creating codemark takes you out of List view
- Fixes [#115](]https://github.com/TeamCodeStream/CodeStream/issues/115) &mdash; Tab then enter discards codemark
- Fixes an issue with incorrect range being selected when code highlighted from the bottom up, and context menu used to create codemark
- Fixes an issue with permalinks being displayed on the Search tab

## [3.0.0] - 2019-9-17

### Added

- Adds a "Copy link" menu option for all codemarks so that they can be shared anywhere at any time
- Adds new web-based codemark pages to display codemarks shared via link
- Adds options to codemarks shared on Slack to open a codemark on the web, in your IDE or, in the case of issues, on the issue-tracking service
- When opening a codemark in your IDE from Slack or the web, if you don't happen to have the given repo open, CodeStream will still open the file for you automatically if you've ever opened that repo while signed into CodeStream. If not, we'll prompt you to open the repo, and we'll remember the location so you don't have to do that again.
- Adds a team switcher under the ellipses menu to switch between all of your CodeStream teams
- For on-prem installations, adds a check to make sure that the version of the API server running is compatible with the extension

### Fixed

- Fixes a rate limiting issue experienced by certain teams authenticating with Microsoft Teams
- Fixes an issue with deleting replies to a codemark
- Fixes an issue with syncing with YouTrack after authenticating
- Fixes an issue where a codemark created against unsaved code would not appear immediately

## [2.1.2] - 2019-9-9

### Added

- Addresses [#79](]https://github.com/TeamCodeStream/CodeStream/issues/79) &mdash; Adds branch info to codemark display when there's a diff
- Adds the ability to inject a codemark as an inline comment

### Fixed

- Fixes a rate limiting issue experienced by certain teams authenticating with Microsoft Teams
- Fixes an issue where replies to a codemark in a Slack-connected team would briefly appear twice
- Fixes an issue where there was no confirmation message when adding a user to a channel via slash command

## [2.1.0] - 2019-8-20

### Added

- Adds more robust tagging functionality, allowing you to create tags with any color / text label combination
- Adds the ability to link parts of your codebase by adding "related" codemarks to a parent codemark, and then using the links to jump around the codebases

### Changed

- Improved display of collapsed codemarks to make it easy to see tags, assignees, linked issues (i.e., on an external service like Jira), and the presence of replies or related codemarks
- All new cleaner display of expanded codemarks, with replies now displayed in descending order (i.e., most recent first)
- Consistent display of codemarks across all areas of CodeStream
- Smoother scrolling of codemarks in the CodeStream pane

### Fixed

- Fixes an issue with the positioning of the codemark form when creating a codemark at the bottom of the viewport
- Fixes an issue with not being able to change issue-tracking selection once Azure DevOps has been selected
- Fixes an issue with password reset in CodeStream on-prem

## [2.0.0] - 2019-8-1

### Added

- Adds issue-tracking integrations with Jira Server and GitHub Enterprise

### Changed

- Updates the UI for creating issues on external issue tracking services to allow you to be connected to multiple services at once and change the selection on an issue by issue basis
- Codemarks now appear immediately upon submission
- Trailing slashes are stripped off of the Server URL setting for on-prem installations

### Fixed

- Fixes an issue with not all DMs from Slack appearing in the conversation selector when creating a codemark
- Fixes an issue with a lack of notification when viewing a codemark in a file you don't have

## [1.3.4] - 2019-7-26

### Added

- Adds roadblocks when your extension is behind either a required or suggested version of CodeStream

### Fixed

- Fixes [#71](]https://github.com/TeamCodeStream/CodeStream/issues/71) &mdash; You can edit channel selection when editing via thread view

## [1.3.2] - 2019-7-16

### Changed

- Added a "Back" link below the password-reset form in case you change your mind

### Fixed

- Fixes [#70](]https://github.com/TeamCodeStream/CodeStream/issues/70) &mdash; Once joined more than one channel, I can't choose into which channel a comment should go to anymore
- Fixes an issue with repos managed by Bitbucket Server incorrectly being identified as being managed by Bitbucket cloud
- Fixes scrolling issues when creating and viewing longer codemarks

## [1.3.1] - 2019-7-10

### Added

- Password reset. Sorry it took so long!
- Enforcement of CodeStream's 30-day free trial, and 5-member limit for teams on the free plan

### Changed

- Optimizations to ipc between our processes and plugin startup

### Fixed

- Fixes an issue where scrolling in the CodeStream pane with the compose modal open would lose any information already entered
- Fixes an issue where a codemark could get posted as a reply to another codemark if you had thread view open
- Fixes a spacing issue on the Sign In page
- Fixes an issue with new UI not being applied to email confirmation and Team Name pages
- Fixes rendering issues with certain Slack bots when using Slack real-time channels

## [1.3.0] - 2019-6-26

### Added

- New Microsoft Teams integration allows you to share codemarks in your organization's existing channels. [Learn more.](https://www.codestream.com/blog/codestream-1-3)
- New Slack integration that reduces the amount of Slack that appears in CodeStream, with the full Channels tab now being optional

### Changed

- Updated the UI of CodeStream's signup flow
- Asana projects are now listed in alphabetical order for selection

### Fixed

- Fixes an issue with code blocks in Trello cards not rendering properly, and not including the line numbers

## [1.2.0] - 2019-6-14

### Added

- Adds the ability to compare the code associated with a codemark to your local version of the file, or to apply the change

### Changed

- The Invite People page now only shows teammates from your Slack workspace that have signed up for CodeStream

### Fixed

- Fixes an issue that would cause an error when opening a Slack channel with Japanese characters in the name
- Fixes an issue where hovering over an expanded codemark wouldn't highlight the corresponding code block in the editor
- Fixes an issue with text in backticks not rendering properly
- Fixes an issue with new lines being displayed as html in posts on Slack
- Fixes an issue with new lines in codemark text causing display issues on the Search tab
- Fixes an issue with the Asana integration that was preventing projects from being listed
- Fixes an issue with invitation codes incorrectly expiring after 10 minutes
- Fixes an issue with editing a reply from a codemark's thread view

## [1.1.0] - 2019-6-4

### Changed

- Signup flow is now based in the IDE instead of on the web
- For CodeStream teams, invitations are now code-based allowing for quicker signup
- For Slack teams, invitation URLs have been simplified
- Clicking on a codemark in the editor gutter opens the codemark in the Current File tab in CodeStream

### Fixed

- Fixes [#60](]https://github.com/TeamCodeStream/CodeStream/issues/60) &mdash; can't delete codemark in vscode
- Fixes [#57](https://github.com/TeamCodeStream/CodeStream/issues/57) &mdash; Cygwin git support
- Fixes an issue with bookmark titles not being displayed on Slack
- Fixes an issue with code snippets added to a codemark via markdown not rendering

## [1.0.3] - 2019-5-22

### Fixed

- Fixes an issue where a new codemark sometimes wouldn't appear right away
- Fixes an issue where git repos with remote URLs containing port numbers would prevent codemarks from being displayed properly
- Fixes [#61](https://github.com/TeamCodeStream/CodeStream/issues/61) &mdash; Formatting issues with codemarks

## [1.0.2] - 2019-5-15

### Added

- Adds an integration with YouTrack issue tracking

## [1.0.0] - 2019-05-13

### Added

- Initial beta release for the Atom marketplace
