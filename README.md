# Scrum Poker

A collaborative Planning Poker application for Agile teams, with private estimates,
real-time room updates, and facilitator-controlled reveal.

The project also teaches specification-driven, AI-assisted development: turn product
rules into small user stories, behavioral tests, reviewed pull requests, and CI/CD.

**Current status:** Specification phase completed and approved as the documentation
baseline. Implementation has not started. Exact tool versions and remaining
story-level details will be resolved before the relevant implementation work.

## Planned technology stack

- Angular 20+ with standalone components and signals
- .NET 10 Web API and SignalR
- EF Core and SQLite
- Docker Compose and GitHub Actions
- Terraform in a later infrastructure phase

## Specifications and decisions

- [Product specification](docs/specs/product.md)
- [Architecture specification](docs/specs/architecture.md)
- [Backlog and development workflow](docs/specs/backlog.md)
- [Architecture decision records](docs/adr/README.md)
- [Coding agent instructions](AGENTS.md)

## Development roadmap

1. Publish the approved documentation baseline.
2. Complete SETUP-001: select and pin tooling, initialize applications, and establish
   local checks and CI after separate implementation authorization.
3. Deliver SP-001 through SP-005: create/resume rooms, join participants, start
   rounds, submit private estimates, and reveal/start the next round.
4. Add containers and operational readiness, including retention, backups, and
   deployment migration procedures.
5. Select hosting, automate deployment, and introduce Terraform when needed.

There are no application build or run commands yet. They will be documented during
SETUP-001.
