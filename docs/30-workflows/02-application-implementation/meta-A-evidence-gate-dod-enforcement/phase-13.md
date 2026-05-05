# Phase 13: PR 作成 — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 13 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

本仕様書 directory を PR としてまとめるための手順を spec 化する。本タスク内では PR 作成自体は行わず、commit / push / PR は user approval 後に別 phase で実行する。

## 実行タスク

1. PR タイトル / body / labels の draft を spec 化する。完了条件: 70 文字以内のタイトル、Summary / Test plan の body 構造が明記される。
2. 含めるファイル一覧を spec 化する。完了条件: 15 ファイル (index.md / artifacts.json / phase-01〜13.md) が列挙される。
3. user approval gate と branch protection 整合を確認する spec を記述する。完了条件: solo policy / required_status_checks との整合が明記される。

## 参照資料

- index.md
- artifacts.json
- phase-01.md 〜 phase-12.md
- CLAUDE.md (Branch / Governance section)

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- 本タスク内では PR 作成、commit、push を行わない。
- spec が示す手順に従って、後続作業として user approval 後に PR 作成する。

## 統合テスト連携

- 上流: Phase 12 docs
- 下流: 後続 wave の本体タスク close-out で本仕様参照

## 多角的チェック観点

- skill governance
- audit traceability（PR ↔ spec ↔ artifacts.json の整合）
- CI gate 一貫性（required_status_checks が pass する）
- lefthook 軽量性
- 未実装/未実測を PASS と扱わない
- spec のみで完結する

## サブタスク管理

- [ ] PR タイトル / body / labels draft を記述
- [ ] 含めるファイル 15 件を列挙
- [ ] approval gate / branch protection 整合を記述
- [ ] outputs/phase-13/main.md を作成する

## 成果物

- outputs/phase-13/main.md

## 完了条件

- PR タイトル 70 文字以内、body は Summary / Test plan の二章構造で固定される
- 含めるファイル 15 件 (index.md / artifacts.json / phase-01〜13.md) が列挙される
- user approval 前に commit / push / PR を実行しない旨が明記される
- solo policy (required_pull_request_reviews=null) と CI gate との整合が明記される

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 15 ファイルが列挙されている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

本仕様書作成タスクはこの phase で完了。後続の実コード化 (skill / CI / lefthook 各 PR) は Phase 5 runbook を参照する別タスクで実施する。
