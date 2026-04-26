# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | magic-link-provider-and-auth-gate-state |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check の 6 種を生成し、本タスクの spec を後続実装タスクが消費できる状態にする。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜこのタスクが必要かを、日常生活の例え話から説明する
- [ ] 専門用語を使う場合は、その場で短く説明する
- [ ] 何を作るかより先に、困りごとと解決後の状態を書く

### Part 2: 開発者・技術者レベル

- [ ] TypeScript の interface / type 定義を記載する
- [ ] API シグネチャ、使用例、エラーハンドリング、エッジケースを記載する
- [ ] 設定可能なパラメータ、定数、実行コマンド、検証コマンドを一覧化する

## 実行タスク

1. implementation-guide.md（apps/web ↔ apps/api 接続図 + 5 状態の UI 結線）
2. system-spec-update-summary.md（specs/ 改訂候補）
3. documentation-changelog.md（本タスクで更新した spec / template）
4. unassigned-task-detection.md（本タスクで触れない責務の洗い出し）
5. skill-feedback-report.md（task-specification-creator skill への feedback）
6. phase12-task-spec-compliance-check.md（template 準拠 chk）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/architecture.md | 接続図 |
| 必須 | outputs/phase-07/ac-matrix.md | AC trace |
| 必須 | outputs/phase-11/main.md | smoke 結果 |
| 参考 | doc/02-application-implementation/_templates/phase-meaning-app.md | Phase 定義 |

## 実行手順

### ステップ 1: implementation-guide.md（中学生レベル → 技術者レベル）

**Part 1（中学生レベル）**
- Magic Link は「アプリのログイン用ワンタイム入場券」
- AuthGateState は「入場前のチェック結果」（5 通り）
- `/no-access` は「専用の門前払いページ」を作らず、ログイン入口で全部出し分ける

**Part 2（技術者レベル）**

| 項目 | 詳細 |
| --- | --- |
| task root | doc/02-application-implementation/05b-parallel-magic-link-provider-and-auth-gate-state |
| key outputs | outputs/phase-02/architecture.md, api-contract.md, outputs/phase-05/runbook.md, outputs/phase-07/ac-matrix.md |
| upstream | 02c (magic_tokens repo), 03b (consent snapshot), 04b (`/me`), 04c (admin gate) |
| downstream | 06a/b/c (画面), 08a (contract test) |
| validation focus | 5 状態 + token lifecycle + レートリミット + `/no-access` 不在 |

### ステップ 2: system-spec-update-summary.md

| spec | 改訂候補 | 理由 |
| --- | --- | --- |
| 02-auth.md | `/auth/gate-state` の追記 | 本タスクで追加した API |
| 06-member-auth.md | レートリミット仕様の追記 | B-02 対応 |
| 13-mvp-auth.md | mail provider の選定方針 | 運用上の制約 |

### ステップ 3: documentation-changelog.md

| 日付 | 変更 | 影響範囲 |
| --- | --- | --- |
| 2026-04-26 | 05b task spec 作成（15 ファイル） | apps/web auth, apps/api auth, magic_tokens |
| 2026-04-26 | `/no-access` 不採用を再確認 | 06a/b/c |
| 2026-04-26 | レートリミット要件を追加 | apps/api |

### ステップ 4: unassigned-task-detection.md

| 未割当責務 | 想定 task | 暫定対応 |
| --- | --- | --- |
| mail provider 監視 dashboard | 09b (cron + monitoring) | 09b で alert を設定 |
| token 履歴の admin 可視化 | 06c admin 拡張 | MVP 範囲外 |
| token 強制無効化 admin UI | 06c 拡張 | MVP 範囲外 |

### ステップ 5: skill-feedback-report.md

| 観点 | feedback |
| --- | --- |
| task-specification-creator | Phase 6 の failure case 命名 (F-XX) を template に組み込み済 |
| invariants 引用 | 不変条件 #1〜#15 を Phase 1〜10 全てに紐付ける運用が機能 |
| 改善提案 | mail provider 等の外部依存は Phase 9 の無料枠表に必ず含める |

### ステップ 6: phase12-task-spec-compliance-check.md

| 項目 | 期待 | 実績 |
| --- | --- | --- |
| 必須セクション 11 種 | 全 phase に含む | OK（Phase 1〜13 すべて） |
| Phase 別追加 | template 通り | OK |
| 不変条件番号引用 | 多角的チェック観点に番号付き | OK |
| outputs path | `outputs/phase-XX/main.md` 必須 | OK |
| user_approval_required | Phase 13 のみ true | OK |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR 本文に implementation-guide の URL を記載 |
| 06a/b/c | implementation-guide を参照して画面実装 |
| 08a | api-contract.md を参照して契約 test 実装 |

## 多角的チェック観点

- 不変条件 #5: implementation-guide で apps/web ↔ apps/api の経路を明示
- 不変条件 #6: GAS prototype を本番仕様に格上げしない（implementation-guide で念押し）
- 不変条件 #9: `/no-access` 不採用を documentation-changelog で再周知
- 不変条件 #10: 無料枠 / mail provider 上限を unassigned で 09b に申し送り

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide | 12 | pending | 中学生 + 技術者 |
| 2 | system-spec-update | 12 | pending | 3 spec |
| 3 | documentation-changelog | 12 | pending | 3 件 |
| 4 | unassigned | 12 | pending | 3 件 |
| 5 | skill-feedback | 12 | pending | 3 観点 |
| 6 | compliance-check | 12 | pending | template 準拠 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 サマリ |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 改訂候補 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割当 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | template 準拠 |
| メタ | artifacts.json | phase 12 status |

## 完了条件

- [ ] 6 種ドキュメント + main.md = 7 ファイルが outputs/phase-12/ に配置
- [ ] compliance-check が全項目 OK
- [ ] changelog が日付付き
- [ ] skill-feedback が 3 観点以上

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- 7 ファイル配置
- 全完了条件にチェック
- 不変条件 #5, #6, #9, #10 への対応が記載
- 次 Phase へ PR 本文の入力を引継ぎ

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: PR 本文に implementation-guide / changelog の URL を含める
- ブロック条件: 6 種ドキュメントが揃っていない場合は進まない
