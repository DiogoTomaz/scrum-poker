# ADR-0001: Room-scoped participant identity

Status: Accepted, 2026-11-08.

## Context

Connections change during refresh/reconnect. Display names and invitation links
cannot establish membership or facilitator authority.

## Decision

Give each room membership an opaque resume credential. Store it in sessionStorage
under a room-scoped key; store only its hash on the server. Authentication restores
the same participant, saved vote, and facilitator role after refresh. Keep credential
issuance separate from invitation links. Do not put secrets in snapshots or logs.

## Consequences

Guest participation needs no account system. Separate tabs usually have independent
storage, but duplication can copy credentials; [ADR-0002](0002-single-active-connection.md)
defines that case. Tab closure is not a durable resume guarantee. Losing the secret
does not permit recovery by name. Same-origin scripts can access sessionStorage;
expiry, retention, and any stronger production identity remain open.

Contract: [product identity](../specs/product.md#identity-refresh-and-multiple-tabs).
