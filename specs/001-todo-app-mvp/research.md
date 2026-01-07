# Research: Todo Application MVP

## Testing Strategy

### Decision
- **Backend**: Use `pytest` for unit and integration tests.
- **Frontend**: Use `jest` and `react-testing-library` for component and integration tests.

### Rationale
- `pytest` is the standard for testing in the Python ecosystem and integrates well with FastAPI.
- `jest` and `react-testing-library` are the standard for testing React applications and are well-supported by the Next.js community.

### Alternatives Considered
- **Backend**: `unittest` (built-in, but more verbose than pytest).
- **Frontend**: `cypress` (E2E testing, could be added later).
