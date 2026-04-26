# 00-serial-architecture-and-scope-baseline - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| ディレクトリ | doc/00-serial-architecture-and-scope-baseline |
| Wave | 0 |
| 実行種別 | serial |
| 作成日 | 2026-04-23 |
| 担当 | strategy/docs |
| タスク種別 | docs-only |
| 状態 | Phase 12 完了（PR未着手） |

## 目的

task-specification-creator と aiworkflow-requirements を同時に満たす初期インフラの基準線を固定する。Cloudflare Pages を web、Cloudflare Workers を API、Cloudflare D1 を canonical DB、Google Sheets を入力源として扱う。

## スコープ

### 含む
- feature -> dev -> main の branch / environment を固定する
- apps/web と apps/api の責務境界を固定する
- Google Sheets input / D1 canonical の判断を formalize する
- 初回スコープ外項目を明示する

### 含まない
- 実コード実装
- 本番デプロイ
- 通知基盤の先行導入

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | なし | この task 開始前に必要 |
| 下流 | Wave 1 全 task / 02-serial-monorepo-runtime-foundation / 03-serial-data-source-and-storage-contract | この task の成果物を参照 |
| 並列 | なし | 同 Wave で独立実行可能 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1-13 と品質基準 |
| 必須 | .claude/skills/aiworkflow-requirements/SKILL.md | 仕様参照の入口 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | Pages / Workers / D1 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | apps/web / apps/api / integrations 分離 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | feature -> dev -> main |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare / GitHub / 1Password 分離 |
| 参考 | User request on 2026-04-23 | Sheets 入力・無料運用・インフラ先行 |

## 受入条件 (AC)

- AC-1: web / api / db / input source の責務境界が一意に説明できる
- AC-2: feature -> dev -> main と local / staging / production の対応表が確定している
- AC-3: Google Sheets input / D1 canonical の判断根拠が残っている
- AC-4: scope 外項目と未タスク候補が分離されている
- AC-5: 価値性 / 実現性 / 整合性 / 運用性の4条件を PASS と判定できる

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01 |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02 |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03 |
| 4 | 事前検証手順 | phase-04.md | completed | outputs/phase-04 |
| 5 | セットアップ実行 | phase-05.md | completed | outputs/phase-05 |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06 |
| 7 | 検証項目網羅性 | phase-07.md | completed | outputs/phase-07 |
| 8 | 設定 DRY 化 | phase-08.md | completed | outputs/phase-08 |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09 |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10 |
| 11 | 手動 smoke test | phase-11.md | completed | outputs/phase-11 |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12 |
| 13 | PR作成 | phase-13.md | pending | outputs/phase-13 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/baseline-inventory.md | 正本仕様とユーザー要求の棚卸し |
| ドキュメント | outputs/phase-02/canonical-baseline.md | 採用構成の基準線 |
| ドキュメント | outputs/phase-02/decision-log.md | 採用/非採用理由 |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part1/Part2 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec sync 判断 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 更新履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill へのフィードバック |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 準拠確認 |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Pages | Web hosting | 無料枠 |
| Cloudflare Workers | API backend | 無料枠 |
| Cloudflare D1 | canonical DB | 無料枠 |
| Google Sheets | 入力源 | 無料 |
| GitHub | branch / review / CI | 無料 |

## Secrets 一覧（このタスクで導入）

なし。初期仕様 task のため、新規 secret は導入しない。

## ローカル環境ガード

- Workspace-local `.env*`, `.env.local`, `.env.example`, and other dotfiles are operational artifacts only.
- それらがこの index や skill refs と矛盾する場合は、正本として扱わない。

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の same-wave sync ルールが破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-infra.md
- Legacy snapshot: 未作成（必要なら別 archive task で作成）
