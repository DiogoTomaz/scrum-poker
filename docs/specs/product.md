# Scrum Poker product specification

Status: MVP direction approved on 2026-11-08, with contract clarifications recorded
below. Exact limits and unresolved choices are listed at the end. Implementation
is not yet authorized. See [architecture](architecture.md), [backlog](backlog.md),
and [ADRs](../adr/README.md). These replace the initial proposal.

## Purpose and scope

Scrum Poker lets an Agile team estimate work together while keeping individual
choices private until reveal. Developing with specifications, tests, PR review,
and CI/CD is also a project objective.

The initial experience is guest participation by invitation, with a facilitator
and participants. The creator is facilitator and may vote. Membership identity is
room-scoped and independent of display names or network connections. Invitation
access never grants facilitator authority.

Baseline product details carried forward from the proposal: one active titled round,
fixed deck `1, 2, 3, 5, 8, 13, 21, ?`, manual reveal even with missing votes, and
selection changes until reveal. Confirm these details before SP-003. Accounts,
external trackers, configurable decks, spectators, consensus calculation, history
screens, and host transfer/recovery are outside the first five stories.

## Identity, refresh, and multiple tabs

Approved: store an opaque, room-scoped resume credential in browser `sessionStorage`.
The server stores only its hash, associated with membership and role. Never put
the credential in invitation links, diagnostics, or logs. Return the raw credential
only when issuing it; do not return it in snapshots. Server authentication may use
the submitted raw credential transiently, but must not persist or log it.

Refreshing the page authenticates with that credential and restores the same
participant, saved vote, and facilitator role. Closing a tab does not promise resume
in a later session. Missing/invalid credentials require joining again and do not
recover a facilitator role by name. Browser restore behavior must not be presented
as a durable identity guarantee.

A separately opened tab normally has independent sessionStorage and joins separately.
A duplicated tab may inherit its credential. A credential identifies the same
membership wherever it is presented: the newest authenticated connection takes over.
Exactly one connection is active per membership. Newness means successful registration
under the room lock, not a browser timestamp.

## Superseded-tab contract

On takeover, the server invalidates the old connection generation and sends a
targeted `ParticipantConnectionReplaced` notification. Even if that notification
is lost, the server rejects every later mutation carrying the old generation.

| Condition | HTTP contract | Client behavior |
| --- | --- | --- |
| Valid credential, superseded generation | `409`, `participant_connection_replaced` | Enter inactive state; disable actions; stop automatic reconnect, resume, retries, and queued work. |
| Missing/invalid credential | `401`, `invalid_participant_credential` | Stop retries and show that joining again is required. |
| Authenticated participant lacks required role | `403`, `forbidden` | Explain insufficient permission; do not take over or reload. |
| Current connection, outdated round | `409`, `round_conflict` | Disable mutations, fetch snapshot, then require a fresh user action. |

Inactive UI message: **This participant is active in another tab.** Offer an explicit
**Use this tab** action. Only that user action may register a new connection and
take over again. After takeover, fetch a snapshot before enabling actions. A reload
or forced resync is not the automatic response to supersession: it could cause
endless takeover between tabs. Persist an inactive marker alongside the room's
session state so refreshing a knowingly superseded tab does not automatically
reclaim membership; an explicit action is still required.

Requests already in flight are ordered under the room lock. A command admitted
before takeover may complete; one admitted after takeover must fail. Cancelling
client requests alone is not authorization enforcement.

## Disconnect and facilitator behavior

Disconnecting preserves membership, vote, and role. A short, configurable server-side
grace period delays the visible disconnected indication to avoid refresh flicker.
The configuration name is `Presence:DisconnectGracePeriod`; its default and allowed
range will be chosen and documented in SP-002. It is an implementation setting,
not a product identity timeout, room expiry, or permission extension.

No connection means no actions, even during the grace period. Other connected
participants may continue voting in an active round. Only the facilitator can
reveal or start another round, so these actions wait until the facilitator returns.
There is no automatic promotion. Permanent loss of the facilitator credential may
leave the room blocked; creating another room is the MVP fallback.

Disconnect callbacks and grace timers carry the generation they refer to. They
must not mark a replacement connection disconnected or revoke its authority.

## Synchronization and vote privacy

New and reconnecting clients remain synchronizing with mutations disabled until
they apply an authoritative snapshot for their current connection generation.
Fetch after initial connection, refresh, reconnect, explicit takeover, a revision
gap, or a round/revision conflict. Superseded clients stay inactive instead.

The snapshot contains the room ID and revision, facilitator ID, participant roster
and presence/submission status, the requesting participant's identity/role and
connection generation, current round ID/title/phase, deck, own selection, and
revealed results only when permitted. See [the precise projection and ordering
contract](architecture.md#authoritative-snapshot).

Before reveal, another participant's vote value must be absent from HTTP responses,
SignalR messages, errors, and logs. UI hiding is insufficient. After reveal, show
the committed values and explicitly identify members who did not vote. Starting
the next round never carries previous selections into it.

## Open product decisions

- Confirm the fixed deck, manual early reveal, title requirement, and guest scope
  before the affected product story is ready.
- Choose display-name/title length limits, room capacity, and duplicate-name UX.
- Define room/credential expiry and retention; durable facilitator recovery and
  host transfer remain deferred.
- Decide whether production needs stronger identity than possession of a credential.
  sessionStorage is accessible to page scripts; this MVP does not provide protection
  against compromised same-origin JavaScript.
