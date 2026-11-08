# Architecture decisions

Accepted means the user approved the decision, not that implementation is authorized.
Contract details clarify approved behavior; unresolved implementation choices remain
listed in the specifications. All records below were accepted on 2026-11-08.

| Record | Decision | Status |
| --- | --- | --- |
| [0001](0001-room-scoped-participant-identity.md) | Room-scoped credential and refresh identity | Accepted |
| [0002](0002-single-active-connection.md) | Newest connection takes over; explicit inactive-tab behavior | Accepted; contract clarified |
| [0003](0003-reconnection-and-facilitator-presence.md) | Snapshot recovery, grace period, no automatic promotion | Accepted; contract clarified |
| [0004](0004-single-process-room-concurrency.md) | Singleton per-room asynchronous locks with SQLite | Accepted |
| [0005](0005-publish-under-room-lock.md) | Commit then publish while holding the room lock | Accepted; tradeoff clarified |

New decisions should record context, decision, consequences, status, and supersession
links. Do not silently rewrite accepted decisions when behavior changes.
