# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |

## 目的

Phase 2 の設計が「真の論点 5 リスク同時封じ」を満たすかを代替案比較・PASS/MINOR/MAJOR 判定で検証し、Phase 4 以降への着手可否ゲートを確定する。

## 実行タスク

1. Phase 2 の採用案と代替案を比較する。
2. 一律 80% / package 別差分 / monorepo 集約 / Codecov 単独 / 差分テスト / 単一 PR の各案を PASS/MINOR/MAJOR で判定する。
3. 真の論点 5 リスク、ユーザー決定、アーキテクチャ整合、段取り安全性、監査性をレビューする。
4. Phase 4 以降の NO-GO 条件とレビュー指摘 R-1〜R-4 を確定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/coverage-80-enforcement/phase-01.md` | 要件・ユーザー決定 |
| 必須 | `docs/30-workflows/coverage-80-enforcement/phase-02.md` | 設計案・トポロジ・I/O 仕様 |
| 必須 | `docs/30-workflows/coverage-80-enforcement/index.md` | AC-1〜AC-14 |
| 必須 | `.claude/skills/task-specification-creator/references/quality-gates.md` | レビューゲート |

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 4 | 採用案 A と NO-GO 条件をテスト戦略へ渡す |
| Phase 6 | R-1〜R-4 と fail path を異常系検証へ渡す |
| Phase 10 | 最終レビューで再評価する 4 条件と blocker 候補を渡す |
| Phase 12 | MINOR / 将来移行項目を unassigned-task detection へ渡す |

## 代替案比較

### 代替案 A: 全 package 一律 80%（採用）

- **概要**: lines / branches / functions / statements すべて 80% を全 package に強制
- 価値: シンプルでルールが明快。新規 package も自動的に 80% 必須
- コスト: 既存 `apps/web` / `packages/*` のテスト不足が顕在化（baseline で計測）
- 整合: ユーザー決定事項と一致
- 判定: **PASS**（採用）

### 代替案 B: package 別差分閾値（apps=80% / packages=65%）

- **概要**: aiworkflow-requirements 既存正本の踏襲（desktop 80% / shared 65%）
- 価値: 既存テスト不足の影響を最小化
- コスト: 「shared が pkg 横断的に使われ品質劣化が広範囲」リスクを内包
- 整合: ユーザー決定（一律 80%）と矛盾
- 判定: **MAJOR**（不採用）

### 代替案 C: monorepo 集約 coverage（全体平均 80%）

- **概要**: 全ファイルを集約した単一 metrics で 80% 判定
- 価値: 設定が極めてシンプル
- コスト: 大きな package が小さな package を打ち消し、品質劣化を見逃す
- 整合: package 別の責任分離原則に反する
- 判定: **MAJOR**（不採用）

### 代替案 D: Codecov 単独依存（ローカル script 不採用）

- **概要**: Codecov の status check に丸投げ、`coverage-guard.sh` は作らない
- 価値: 実装コスト最小
- コスト: ローカル auto-loop が成立せず、push 後に初めて未達発覚 → 開発体験悪化
- 整合: ユーザー要件「commit / push 時に 80% 担保」と矛盾
- 判定: **MAJOR**（不採用）

### 代替案 E: Turborepo / Nx の cache を活用した差分テスト

- **概要**: 変更影響範囲のみテストして時間短縮
- 価値: 大規模時の実行時間最適化
- コスト: 現状 monorepo は Turborepo 未導入。導入コストが本タスクに付帯すると scope 肥大
- 整合: 将来の拡張余地として保留
- 判定: **MINOR → 将来移行**（本タスクは `--changed` flag で部分代替）

### 代替案 F: 1 PR で全部済ます（鶏卵問題回避なし）

- **概要**: 仕組み導入 + テスト追加 + hard gate を単一 PR
- 価値: 段取り単純
- コスト: PR 規模が肥大しレビュー困難。失敗時の rollback 範囲も大
- 整合: solo 運用でも段階導入のほうが安全
- 判定: **MINOR**（不採用、3 段階 PR を採用）

## 着手可否ゲート判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 真の論点（5 リスク同時封じ） | PASS | 鶏卵 / monorepo 集計 / exclude / 切替忘却 / codecov 二重正本すべて Phase 2 で受け皿あり |
| 4 条件評価 | PASS | 価値性 / 実現性 / 整合性 / 運用性 すべて PASS |
| ユーザー決定との整合 | PASS | 一律 80% / PR 必須 / 新規 script / commit-push 時 80% 担保 / 計測タスク差し込み すべて反映 |
| アーキテクチャ整合 | PASS | 不変条件 #5、branch 戦略、solo 運用ポリシーと矛盾なし |
| 段取りの安全性 | PASS | 3 段階 PR で鶏卵問題を回避 |
| 監査性 | PASS | coverage artifact upload + Phase 11 baseline-summary で証跡化 |

**総合判定: PASS — Phase 4 以降に進行可**

## NO-GO 条件（重複明記 3/3）

以下に該当する場合、Phase 4 へ進めない:

1. UT-GOV-004（required_status_checks contexts 同期）が PR③ 実施時点で未完了 → 一時的に `coverage-gate` を contexts 登録せず Phase 13 で再評価
2. baseline 計測（T0 / Phase 11）で `apps/web` / `packages/shared` のいずれかが 30% を下回る → PR② を細分化（package×metric 単位）
3. vitest v8 provider が Cloudflare Workers 環境（apps/api）で動作しない → vitest workspace + miniflare 統合を Phase 5 で再設計

## 苦戦想定の Phase 紐付き再確認

| # | 苦戦想定 | Phase 2 §該当 | Phase 6 / 11 連携 |
| --- | --- | --- | --- |
| 1 | 鶏卵問題 | §3 段階 PR 段取り | Phase 13 PR① runbook |
| 2 | monorepo 集計困難 | §coverage-guard.sh I/O 仕様 | Phase 6 異常系（部分集計欠落） |
| 3 | Edge runtime exclude | §vitest.config.coverage.exclude | Phase 11 baseline で再評価 |
| 4 | OS 依存（jq / bash） | §OS / 依存前提 | Phase 12 README 反映 |
| 5 | soft→hard 切替忘却 | §3 段階 PR 段取り | Phase 12 unassigned-task / Phase 13 PR③ |
| 6 | codecov.yml 二重正本 | §ファイル変更計画 | Phase 12 同期手順 |
| 7 | pre-push 遅延 | §lefthook.yml 更新仕様 (`--changed`) | Phase 11 計測 |

## 4 条件再評価（最終）

| 観点 | 判定 | コメント |
| --- | --- | --- |
| 価値性 | PASS | 80% 未満の merge を構造 block。auto-loop で開発体験も向上 |
| 実現性 | PASS | 既存技術範囲。3 段階 PR で導入コストを段階化 |
| 整合性 | PASS | 不変条件 / CLAUDE.md / aiworkflow-requirements とすべて整合 |
| 運用性 | PASS | coverage-guard.sh の stderr 出力 + Phase 12 unassigned-task で切替期限可視化 |

## レビュー指摘・対応

| # | 指摘 | 対応 |
| --- | --- | --- |
| R-1 | `apps/web` の Next.js page を exclude にすると実質的なカバレッジが下がる | Phase 11 baseline で再評価。E2E（Playwright）導入は別タスクで検討（unassigned-task 候補） |
| R-2 | `coverage-guard.sh` の jq 依存が macOS / GitHub Actions で異なる | Phase 5 で `jq --version` 確認ステップを runbook に組み込み |
| R-3 | `--changed` モードは新規 package の検出が漏れる可能性 | Phase 2 で「フル実行モードを CI / 週次で必ず走らせる」運用を追加 |
| R-4 | hard gate 化時に既存 PR が一斉に block される可能性 | PR③ merge 前にすべての open PR を rebase + coverage 確認する手順を Phase 13 PR③ runbook に明記 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 設計レビュー主成果物（代替案比較 / 着手可否判定 / NO-GO 条件） |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 代替案 A〜F が全件比較・判定済み
- [x] 着手可否ゲートが PASS
- [x] NO-GO 条件 3 件が明記されている（3 重明記の 3 箇所目）
- [x] 苦戦想定 1〜7 すべての Phase 2 紐付きが再確認済み
- [x] 4 条件再評価が全 PASS
- [x] レビュー指摘 R-1〜R-4 に対応方針あり

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用案: 全 package 一律 80% + 3 段階 PR + coverage-guard.sh
  - 不採用案の理由（B〜F）はテスト戦略では再検討しない
  - レビュー指摘 R-1〜R-4 を Phase 4 以降のテストケース / 運用手順に反映
- ブロック条件:
  - 代替案判定にユーザー差し戻しが入った場合は Phase 1 に戻す
