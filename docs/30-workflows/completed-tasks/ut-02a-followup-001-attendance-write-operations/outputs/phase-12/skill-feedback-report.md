# Phase 12 Skill Feedback Report

## テンプレ改善

- `spec_drafted` は task-specification-creator の標準状態語彙ではないため、implementation close-out では `implemented-local` へ統一する。

## ワークフロー改善

- 既存実装が存在する follow-up は、新規実装仕様にせず resolved-by-existing implementation close-out として扱う。
- Phase 11 の placeholder は `completed` ではなく `contract_only_not_executed` とし、local test evidence と runtime curl/UI evidence を分離する。

## ドキュメント改善

- `outputs/phase-12/` strict 7 files と root / outputs artifacts parity を Phase 0 で先に確認する。
- source unassigned と親 workflow の `unassigned-task-detection.md` は close-out root へ同時に誘導し、historical stub と current root を並存させる。
