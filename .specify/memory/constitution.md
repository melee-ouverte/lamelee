<!--
Sync Impact Report:
- Version change: [TEMPLATE] → 1.0.0
- New constitution initialized from template
- Modified principles: All 5 principles defined from template placeholders
  * [PRINCIPLE_1_NAME] → I. Specification-First
  * [PRINCIPLE_2_NAME] → II. Test-Driven Development (NON-NEGOTIABLE)
  * [PRINCIPLE_3_NAME] → III. Simplicity & YAGNI
  * [PRINCIPLE_4_NAME] → IV. Traçabilité Complète
  * [PRINCIPLE_5_NAME] → V. AI-Optimized Workflow
- Added sections:
  * Quality Standards (from [SECTION_2_NAME])
  * Development Workflow (from [SECTION_3_NAME])
- Removed sections: None (all placeholders filled)
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md - Constitution Check section already references these principles
  ✅ .specify/templates/spec-template.md - Aligned with Specification-First approach
  ✅ .specify/templates/tasks-template.md - TDD ordering already enforced
  ✅ .claude/commands/*.md - All commands reference constitution principles
- Follow-up TODOs: None (all placeholders resolved)
-->

# LaMelee Constitution

## Core Principles

### I. Specification-First
Every feature MUST begin with a complete, business-focused specification before any technical
planning or implementation. Specifications MUST be written for non-technical stakeholders,
focusing on WHAT users need and WHY, with zero implementation details (no tech stack, APIs, or
code structure).

**Rationale**: Clear requirements prevent scope creep and ensure all stakeholders understand
the feature's purpose before resources are committed to development.

### II. Test-Driven Development (NON-NEGOTIABLE)
Tests MUST be written and approved by users before implementation begins. The Red-Green-Refactor
cycle is strictly enforced: tests written → tests fail → implementation → tests pass → refactor.

**Rationale**: TDD ensures code meets requirements, provides living documentation, and prevents
regression. This is non-negotiable as it forms the foundation of quality assurance.

### III. Simplicity & YAGNI
Start with the simplest viable approach. Every complexity deviation (additional projects,
architectural patterns beyond basic needs) MUST be explicitly justified in the Complexity
Tracking section with clear reasoning why simpler alternatives were rejected.

**Rationale**: Complexity compounds maintenance costs and cognitive load. Following YAGNI (You
Aren't Gonna Need It) keeps codebases maintainable and iteration cycles fast.

### IV. Traçabilité Complète
Every implementation artifact MUST trace back to its origin: Code → Tasks → Plan → Spec → User
Input. Each level must reference the previous level explicitly. No orphaned code or requirements.

**Rationale**: Traceability enables impact analysis, change management, and ensures no feature
drift from original requirements.

### V. AI-Optimized Workflow
All templates MUST include executable flows (## Execution Flow sections) with clear gates, error
handling, and placeholders. Agent-specific context files (CLAUDE.md, .github/copilot-instructions.md,
etc.) MUST be kept under 150 lines and updated incrementally during Phase 1 of planning.

**Rationale**: AI coding assistants require structured, parseable templates with explicit decision
points to operate effectively and maintain context efficiency.

## Quality Standards

### Clarification Protocol
- Ambiguities MUST be marked with `[NEEDS CLARIFICATION: specific question]` in specifications
- The /clarify command MUST be executed before /plan if any clarifications remain
- Maximum 5 targeted questions per clarification session
- Answers MUST be immediately integrated back into the specification

### Constitution Compliance
- Constitution Check MUST pass before Phase 0 research begins
- Constitution Check MUST be re-evaluated after Phase 1 design completes
- Any violations MUST be documented in Complexity Tracking with justification
- If no justification is possible, design MUST be simplified

### Test Coverage
- Every contract MUST have a corresponding contract test
- Every entity MUST have model validation
- Every user story MUST have an integration test scenario
- Tests MUST be written before implementation (Phase 3.2 before Phase 3.3)

## Development Workflow

### Phase Gates
1. **Specification Gate**: No [NEEDS CLARIFICATION] markers remain, requirements are testable
2. **Planning Gate**: Constitution Check passes twice (before and after design)
3. **Tasks Gate**: All requirements have corresponding tasks, dependencies are clear
4. **Implementation Gate**: All tests pass, quickstart.md validates successfully

### Branching Strategy
- Feature branches MUST follow naming: `###-feature-name` (e.g., `002-ai-coding-assistant`)
- Each feature MUST have its own directory: `specs/###-feature-name/`
- No direct commits to main branch without completed feature validation

### Documentation Requirements
- Every feature MUST produce: spec.md, plan.md, research.md, data-model.md, quickstart.md, tasks.md
- Contract definitions MUST be in machine-readable format (OpenAPI YAML, GraphQL schema)
- Agent context files MUST be updated during planning, not implementation

## Governance

This constitution supersedes all other development practices and conventions. All code reviews,
feature planning sessions, and architectural decisions MUST verify compliance with these principles.

### Amendment Procedure
1. Proposed changes MUST be documented with rationale and impact analysis
2. Semantic versioning MUST be applied:
   - MAJOR: Breaking changes to governance or principle removal
   - MINOR: New principles or materially expanded guidance
   - PATCH: Clarifications, wording improvements, non-semantic refinements
3. All dependent templates MUST be synchronized (spec-template.md, plan-template.md,
   tasks-template.md, commands/*.md)
4. A Sync Impact Report MUST be generated and embedded as an HTML comment

### Compliance Review
- The /analyze command performs cross-artifact consistency checks
- Constitution violations flagged as CRITICAL MUST be resolved before implementation
- Complexity deviations MUST be justified in the Complexity Tracking section

### Runtime Development Guidance
For day-to-day development guidance, refer to agent-specific files (CLAUDE.md for Claude Code,
.github/copilot-instructions.md for GitHub Copilot, etc.). These files contain recent changes,
tech stack decisions, and project-specific patterns while this constitution defines the
unchanging principles.

**Version**: 1.0.0 | **Ratified**: 2025-09-26 | **Last Amended**: 2025-10-10
