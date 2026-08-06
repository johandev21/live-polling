# Session-Local Participant Identity

Participants join without accounts and receive a browser-backed identity scoped to one session. This preserves instant, low-friction participation while supporting one effective response per participant per poll; identities are not verified across browsers or devices, and display names are not treated as unique identity.

## Considered Options

- Requiring participant accounts was rejected because it adds signup friction to live events and classrooms.
- Matching people across devices was rejected because it would require verified identity without improving the MVP’s core experience.

## Consequences

Participant tokens must be scoped and revocable. The system can limit duplicate responses within one browser identity, but it does not promise strong anti-cheat or person-level uniqueness.
