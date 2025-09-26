# SpecKit.md

## Purpose
These rules instruct Amazon Q on how to interact with this repository using the **GitHub Spec Kit** workflow.  
Amazon Q must create and maintain Markdown specification files (`PLAN.md`, `TASKS.md`, `SPEC.md`) by invoking the provided scripts in `.specify/scripts/bash/`.

---

## General Rules
1. All output files must be in **Markdown (`.md`) format**.  
2. The **default language** for all generated text is **English**.  
3. Always preserve the existing structure of a file when updating it.  
4. Never delete sections unless the user explicitly requests it.  
5. Always respect the project’s non-negotiable principles defined in `CONSTITUTION.md`.  
6. Scripts to run are located in `.specify/scripts/bash/` and must be used whenever possible (do not re-implement their logic).  
7. If a script fails or its intent is ambiguous, Amazon Q must **ask clarifying questions** before making changes.  

---

## Commands

### `/plan <spec_id>`
- Purpose: Generate or update the **plan** for a given feature/spec.  
- Execution:
  1. Run `.specify/scripts/bash/check-task-prerequisites.sh`.  
  2. Run `.specify/scripts/bash/update-agent-context.sh <spec_id>`.  
  3. Run `.specify/scripts/bash/setup-plan.sh <spec_id>`.  
- Output: `specs/<spec_id>/plan.md` containing:
  - Context summary  
  - Goals & scope (with MVP focus)  
  - Milestones & deliverables  
  - Dependencies  
  - Risks & mitigation strategies  

### `/tasks <spec_id>`
- Purpose: Generate or update the **tasks** for a given feature/spec.  
- Execution:
  1. Ensure prerequisites are valid.  
  2. Use `.specify/scripts/bash/get-feature-paths.sh <spec_id>` to locate the spec files.  
  3. Create or update `specs/<spec_id>/tasks.md` from `tasks-template.md`.  
- Output: `tasks.md` with:
  - Task breakdown  
  - Assigned roles  
  - Priority & status (Todo/In Progress/Done)  
  - Dependencies between tasks  

### `/spec <spec_id>`
- Purpose: Generate or update the **feature specification**.  
- Execution:
  1. Ensure prerequisites are valid.  
  2. Use `.specify/scripts/bash/create-new-feature.sh <feature_name>` if the feature doesn’t exist.  
  3. Otherwise, update `specs/<spec_id>/spec.md` using `spec-template.md`.  
- Output: `spec.md` with:
  - Feature description  
  - Acceptance criteria  
  - Non-functional requirements (performance, security, accessibility, etc.)  

### `/update <file>`
- Purpose: Update the specified file (`plan.md`, `tasks.md`, or `spec.md`).  
- Rules:
  - Preserve structure and headings.  
  - Only insert or update requested content.  
  - Ask for clarification if the update is ambiguous.  

---

## Integration Rules

### If Amazon Q has shell access
- Commands are executed directly using bash:  
  ```bash
  chmod +x .specify/scripts/bash/*.sh
  .specify/scripts/bash/<script>.sh <args>