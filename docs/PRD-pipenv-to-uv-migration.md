# Product Requirements Document: Pipenv to UV Migration

## Overview

Migrate the OLMap Django backend from Pipenv to UV for Python dependency management.

## Background

- Current dependency management uses Pipenv with Pipfile/Pipfile.lock
- Missing `inflection` dependency causing CI test failures
- UV offers significant performance improvements and better compatibility with modern Python tooling
- Aligns with project modernization goals (Kubernetes migration)

## Goals

1. Migrate from Pipenv to UV without breaking existing functionality
2. Fix the missing `inflection` dependency issue
3. Improve CI/CD pipeline performance with faster dependency installation
4. Modernize Python dependency management tooling

## Non-Goals

- Upgrading Python version (staying on 3.11)
- Changing existing package versions (except adding inflection)
- Modifying frontend dependency management (remains npm)

## Requirements

### Functional Requirements

1. Convert Pipfile to pyproject.toml format
2. Include all existing dependencies with version constraints
3. Add missing `inflection` package dependency
4. Generate uv.lock file for reproducible builds
5. Update CI/CD workflows to use UV instead of Pipenv
6. Maintain compatibility with existing development workflows

### Technical Requirements

1. Use UV 0.1.x or later
2. Python 3.11 compatibility
3. All existing tests must pass
4. CI/CD pipeline must complete successfully
5. Docker development environment must work

### Documentation Requirements

1. Update CLAUDE.md with new UV commands
2. Update README if it references Pipenv
3. Add migration notes for developers

## Implementation Plan

### Phase 1: Local Migration

1. Create pyproject.toml from Pipfile
2. Add inflection dependency
3. Generate uv.lock
4. Test locally with `uv pip install`

### Phase 2: CI/CD Updates

1. Update .github/workflows/ci-cd.yml
2. Replace pipenv commands with uv equivalents
3. Update cache keys for UV

### Phase 3: Documentation

1. Update CLAUDE.md development commands
2. Update any README references
3. Document migration for team

### Phase 4: Cleanup

1. Remove Pipfile and Pipfile.lock
2. Verify all tests pass in CI
3. Update docker-compose if needed

## Success Criteria

- [ ] All CI/CD tests pass
- [ ] Backend starts successfully with UV-installed dependencies
- [ ] Docker development environment works
- [ ] Documentation updated
- [ ] Team can follow new development workflow

## Risks and Mitigations

| Risk                            | Mitigation                                |
| ------------------------------- | ----------------------------------------- |
| UV compatibility issues         | Test thoroughly locally before CI changes |
| Missing transitive dependencies | Use UV's automatic resolution             |
| Team unfamiliarity with UV      | Provide clear documentation               |
| CI/CD cache invalidation        | Update cache keys appropriately           |

## Timeline

- Immediate implementation (single PR)
- Can be completed in current feature branch

## Dependencies

- UV tool availability in CI environment
- No breaking changes to Python package ecosystem

## Open Questions

- Should we also update the Docker image to use UV?
- Do we need a team announcement about the migration?

## References

- [UV Documentation](https://github.com/astral-sh/uv)
- [pyproject.toml specification](https://packaging.python.org/en/latest/specifications/pyproject-toml/)
