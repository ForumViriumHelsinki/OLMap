# Changelog

## [0.2.1](https://github.com/ForumViriumHelsinki/OLMap/compare/olmap-backend-v0.2.0...olmap-backend-v0.2.1) (2025-11-18)

### Bug Fixes

- remove unused db_healthy variable in health check ([1a8031a](https://github.com/ForumViriumHelsinki/OLMap/commit/1a8031a764b04f59e38d887d8d53cefd32a57e88))

## [0.2.0](https://github.com/ForumViriumHelsinki/OLMap/compare/olmap-backend-v0.1.0...olmap-backend-v0.2.0) (2025-11-13)

### Features

- Comprehensive Kubernetes migration and application modernization ([1858272](https://github.com/ForumViriumHelsinki/OLMap/commit/1858272406517f2179d908c5c86a750721ddbfad))
- improve Django backend reliability and configuration ([30fcd88](https://github.com/ForumViriumHelsinki/OLMap/commit/30fcd884a124e5fa14285c3ebf6c49ee538b5148))
- Kubernetes deployment and CI/CD modernization ([6fade0e](https://github.com/ForumViriumHelsinki/OLMap/commit/6fade0e202f584afad1e8cd2423d691e4fdf9bb3))
- migrate from pipenv to uv and add inflection dependency ([2075705](https://github.com/ForumViriumHelsinki/OLMap/commit/2075705da2ab1dc1cb1dad5236dcff3a6da66270))
- modernize codebase and fix CI/CD workflow configuration ([fe438bf](https://github.com/ForumViriumHelsinki/OLMap/commit/fe438bfcfb6f15122cb119bc2e4be23ad53567b8))

### Bug Fixes

- add error handling and data validation to address import migrations ([c9e2e87](https://github.com/ForumViriumHelsinki/OLMap/commit/c9e2e8736e59e38e10f062e7695dde67e0179659))
- add migration for postal_code and set CI=false for build ([3811085](https://github.com/ForumViriumHelsinki/OLMap/commit/3811085bd6cfcf7cd9cd0ac0bc2b6db98be7e11f))
- apply ruff-format to migration file ([68fb100](https://github.com/ForumViriumHelsinki/OLMap/commit/68fb10082c8f2b21c6f3dabcbce2cd62b64da86a))
- make postal_code nullable and disable ESLint in production build ([217799f](https://github.com/ForumViriumHelsinki/OLMap/commit/217799fa6da5f1046816b2bc7b6d967c7ddee778))
- make postal_code nullable in squashed migration ([7c8d1e3](https://github.com/ForumViriumHelsinki/OLMap/commit/7c8d1e37eb0c5bd8313ffee38084dcfb671faca7))
- replace deprecated django-rest-auth with dj-rest-auth and fix test mocks ([8d557e3](https://github.com/ForumViriumHelsinki/OLMap/commit/8d557e3eb02441918009476e0bb08f61ac63f03e))
- resolve CI/CD pipeline failures for Kubernetes migration ([1d74c4a](https://github.com/ForumViriumHelsinki/OLMap/commit/1d74c4afb4aa07068c2cca694e1b2071099c737f))
- resolve major linting issues for CI/CD pipeline ([b032176](https://github.com/ForumViriumHelsinki/OLMap/commit/b03217626035936479cb8951caa8d871b891158e))
- resolve migration conflict by renaming postal_code migration to 0027 ([e2e2b3b](https://github.com/ForumViriumHelsinki/OLMap/commit/e2e2b3bf9c972e78a6d1fcb47a026539f43b1499))
- resolve router basename conflict and ESLint warnings ([43a6c0d](https://github.com/ForumViriumHelsinki/OLMap/commit/43a6c0d8292bf86824ef2769f19cedc75f121aec))
- update serializer is_valid() calls for DRF 3.16.1 compatibility ([f8afaca](https://github.com/ForumViriumHelsinki/OLMap/commit/f8afaca44acacfb516ee2305d2cf92387231cba6))
- update test and remove deprecated NullBooleanField reference ([a6b9797](https://github.com/ForumViriumHelsinki/OLMap/commit/a6b979791dca6d5e60488eb99d750ec67a41bcb4))
