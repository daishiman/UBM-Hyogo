# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 11 (手動 smoke) |
| 下流 | Phase 13 (PR 作成) |
| 状態 | pending |

## 目的

後続実装エージェント（03b / 04* / 08a）と保守者向けに 6 種ドキュメントを生成し、本タスクで決めた契約を **コードを開かずに引き継げる** 状態を作る。

## 6 種成果物

### 1. implementation-guide.md

実装エージェント向けの「これを読めば 02a の repository が呼べる」ガイド。

| 章 | 内容 |
| --- | --- |
| 1. 前提 | apps/api/src/repository/ 配下、D1 binding `DB` |
| 2. 公開 interface | 9 ファイル × 主要関数 signature |
| 3. branded type | `MemberId` / `ResponseId` / `StableKey` の wrap 方法 |
| 4. builder 利用 | `buildPublicMemberProfile` / `buildMemberProfile` / `buildAdminMemberDetailView` の呼び方 |
| 5. 03b sync 連携 | `upsertResponse` / `updateCurrentResponse` / `setConsentSnapshot` の呼び順 |
| 6. 04a/04b/04c 連携 | builder の使い分けと `adminNotes` の渡し方 |
| 7. 08a test 連携 | fixture と verify suite の使い方 |
| 8. やってはいけないこと | 本人本文 update API を作らない、admin から本文を書かない、apps/web から import しない |

### 2. system-spec-update-summary.md

specs/ への影響と更新点まとめ。

| spec | 影響 | 必要な更新 |
| --- | --- | --- |
| 03-data-fetching.md | view merge の章で「builder.ts に集約」と明記推奨 | 軽微 |
| 04-types.md | branded type の運用（`memberId(s)` wrap）を Note 追加推奨 | 軽微 |
| 08-free-database.md | repository が `_shared/db.ts` 経由で D1 アクセス | 既存と整合 |
| 11-admin-management.md | admin context でも本文編集 API を作らない（不変条件 #11）と再確認 | 既存と整合 |

### 3. documentation-changelog.md

```markdown
## 2026-04-26: 02a-parallel-member-identity-status-and-response-repository spec_created

- 追加: doc/02-application-implementation/02a-... 配下 15 files
- 影響: 03b / 04a / 04b / 04c / 08a が並列着手可能
- 不変条件: #4 / #5 / #7 / #11 / #12 / #10 を構造で守る
```

### 4. unassigned-task-detection.md

このタスクの scope 外で「実装が必要だが未割当」の項目を顕在化。

| 項目 | 担当候補 task | 対応 |
| --- | --- | --- |
| `apps/api/src/env.ts`（D1 binding 取得 helper） | 00 foundation または 02c | 2c に依頼推奨 |
| `dependency-cruiser.cjs` 全体 config | 02c | 02c が担当 |
| in-memory D1 fixture loader | 02c | 02c が担当（02a は member fixture を提供） |
| `apps/api/src/route/` の hono router | 04a/04b/04c | 各タスクで実装 |
| `members.attendance` の取得（builder 内） | 02b の `attendance.ts` を 02a builder が import | 02b 完了後に 02a builder が薄く参照 |

### 5. skill-feedback-report.md

このタスクで気づいた skill / template への改善提案。

| 項目 | 提案 |
| --- | --- |
| phase-template-app.md | branded type を扱うタスク用に「型エラーが期待通り出るか」のチェック観点を追加してよい |
| artifacts-template.json | `invariants_touched` の文字列リストを許可（番号のみだと文脈が薄い） |
| README.md 不変条件 #7 | `responseId !== memberId` を「型レベル」で守る、と明記すると 02a で迷いが消える |

### 6. phase12-task-spec-compliance-check.md

phase-template-app.md / phase-meaning-app.md / artifacts-template.json と本タスクの整合確認。

| 項目 | 期待 | 実態 | 判定 |
| --- | --- | --- | --- |
| phase 数 | 13 | 13 | OK |
| 必須セクション | メタ情報 / 目的 / 実行タスク / 参照資料 / 実行手順 / 統合テスト連携 / 多角的チェック観点 / サブタスク管理 / 成果物 / 完了条件 / 100%実行確認 / 次 Phase | 全 phase に存在 | OK |
| Phase 1 追加要素 | true issue / 依存境界 / 価値とコスト / 4 条件 | 存在 | OK |
| Phase 2 追加要素 | Mermaid / env / dependency matrix / module 設計 | 存在 | OK |
| Phase 3 追加要素 | alternative 3 案以上 / PASS-MINOR-MAJOR | 4 案 / PASS | OK |
| Phase 4 追加要素 | verify suite | 存在 | OK |
| Phase 5 追加要素 | runbook + placeholder + sanity check | 存在 | OK |
| Phase 6 追加要素 | failure cases | F/A/E 19 件 | OK |
| Phase 7 追加要素 | AC matrix | 8 AC × 4 軸 | OK |
| Phase 8 追加要素 | Before/After | 5 カテゴリ | OK |
| Phase 9 追加要素 | free-tier + secret hygiene + a11y | 全あり | OK |
| Phase 10 追加要素 | GO/NO-GO | 8 軸 | OK |
| Phase 11 追加要素 | manual evidence | 7 シナリオ | OK |
| Phase 12 追加要素 | 6 種成果物 | このファイル + 5 種 | OK |
| Phase 13 追加要素 | approval gate / local-check / change-summary / PR template | Phase 13 で対応 | TBD |

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

1. 6 種成果物を `outputs/phase-12/` 配下に作成
2. specs/ への影響まとめ → 条件を明記して該当 spec の Note 更新提案を作成（コミットは別 PR）
3. unassigned task を顕在化、担当候補 task に申し送り
4. compliance check を表で記録

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/02-application-implementation/_templates/phase-template-app.md | 整合確認 |
| 必須 | doc/02-application-implementation/_templates/phase-meaning-app.md | Phase 意味 |
| 必須 | doc/02-application-implementation/_templates/artifacts-template.json | metadata 整合 |
| 必須 | Phase 1〜11 outputs | 内容引用 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | implementation-guide が PR description の base に |
| 03b / 04* / 08a | implementation-guide を入口に |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 引き継ぎ完成度 | — | implementation-guide だけで 03b / 04* / 08a が動ける |
| 不変条件 | 全 | implementation-guide の「やってはいけないこと」章で再周知 |
| compliance | — | template との整合 OK |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md | 12 | pending | 8 章 |
| 2 | system-spec-update-summary.md | 12 | pending | 4 spec 影響 |
| 3 | documentation-changelog.md | 12 | pending | エントリ追加 |
| 4 | unassigned-task-detection.md | 12 | pending | 5 件抽出 |
| 5 | skill-feedback-report.md | 12 | pending | 3 提案 |
| 6 | phase12-task-spec-compliance-check.md | 12 | pending | 表 14 行 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | 12 phase 総括 |
| ドキュメント | outputs/phase-12/implementation-guide.md | 8 章 guide |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | 4 spec 影響 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | エントリ |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 5 件 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 3 提案 |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 整合表 |

## 完了条件

- [ ] 6 種成果物全て作成
- [ ] compliance check が全 OK
- [ ] unassigned task が下流 task に申し送り済み

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が completed
- [ ] outputs/phase-12/* 6 種が配置済み
- [ ] artifacts.json の Phase 12 を completed に更新

## 次 Phase

- 次: Phase 13 (PR 作成、user 承認必須)
- 引き継ぎ事項: 6 種成果物
- ブロック条件: compliance check に NG があれば該当 Phase に戻る
