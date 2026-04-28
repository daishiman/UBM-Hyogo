# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-notes-audit-sync-jobs-and-data-access-boundary |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 11 (手動 smoke) |
| 下流 | Phase 13 (PR 作成) |
| 状態 | pending |

## 目的

後続実装エージェント（03a / 03b / 04c / 05a / 05b / 07c / 08a）と保守者向けに 6 種ドキュメントを生成し、本タスクで決めた契約を **コードを開かずに引き継げる** 状態を作る。dep-cruiser + ESLint の boundary tooling 設定と `_shared/` 正本管理の責務を明文化する。

## 6 種成果物

### 1. implementation-guide.md

実装エージェント向けの「これを読めば 02c の repository と boundary tooling が呼べる」ガイド。

| 章 | 内容 |
| --- | --- |
| 1. 前提 | apps/api/src/repository/ 配下、D1 binding `DB`、`_shared/` は 02c が正本 |
| 2. 公開 interface | 5 ファイル × 主要関数 signature（adminUsers / adminNotes / auditLog / syncJobs / magicTokens） |
| 3. branded type | `AdminEmail` / `MagicTokenValue` の wrap 方法、02a の `MemberId` も同 brand.ts |
| 4. append-only / single-use / 状態遷移 | auditLog の UPDATE/DELETE 不在、magicTokens.consume の楽観 lock、syncJobs の ALLOWED_TRANSITIONS |
| 5. 03a / 03b 連携 | `syncJobs.start / succeed / fail` の呼び順、`auditLog.append` を sync 完了時に呼ぶか |
| 6. 04c 連携 | `adminUsers.findByEmail` で role 取得、`adminNotes` CRUD、`auditLog.append` を全 admin 操作に挿入 |
| 7. 05a / 05b 連携 | `adminUsers.findByEmail` で gate、`magicTokens.issue / verify / consume` の TTL / single-use |
| 8. 07c 連携 | `auditLog.append` で workflow 完了を記録、`adminNotes` で軽い注記 |
| 9. 08a test 連携 | fixture と verify suite の使い方、in-memory D1 loader 共通利用 |
| 10. boundary tooling | dep-cruiser config の見方、ESLint rule の追加方法、apps/web から D1 を触らないルール |
| 11. やってはいけないこと | adminNotes を builder の戻り値に混ぜない、auditLog に UPDATE/DELETE を生やさない、apps/web から repository を import しない、magicTokens を multi-use にしない、prototype data.jsx を本番昇格させない |

### 2. system-spec-update-summary.md

specs/ への影響と更新点まとめ。

| spec | 影響 | 必要な更新 |
| --- | --- | --- |
| 02-auth.md | admin gate / Magic Link の repository 経路を明記推奨 | 軽微 |
| 08-free-database.md | repository が `_shared/db.ts` 経由で D1 アクセス、02a/02b/02c の独立性 | 既存と整合 |
| 11-admin-management.md | admin context でも本文編集 API を作らない（不変条件 #11）と再確認、auditLog の append-only を明記 | 既存と整合 |
| 13-mvp-auth.md | `magicTokens.consume` の single-use 実装を明記推奨 | 軽微 |

### 3. documentation-changelog.md

```markdown
## 2026-04-26: 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary implementation NON_VISUAL

- 追加: docs/30-workflows/02c-... 配下の仕様・成果物、apps/api/src/repository 配下の実装・テスト、boundary tooling
- 影響: 03a / 03b / 04c / 05a / 05b / 07c / 08a が並列着手可能
- 不変条件: #5 / #6 / #11 / #12 を構造で守る（lint-boundaries で現行 boundary、API 不在で append-only / 条件付き UPDATE で single-use / ALLOWED_TRANSITIONS + running 条件付き UPDATE で状態遷移）
- 02c は `_shared/` の正本管理者であり、02a / 02b はここから import する
```

### 4. unassigned-task-detection.md

このタスクの scope 外で「実装が必要だが未割当」の項目を顕在化。

| 項目 | 担当候補 task | 対応 |
| --- | --- | --- |
| `apps/api/src/env.ts`（D1 binding 取得 helper） | 00 foundation | 既出ならそのまま、無ければ 02c が `_shared/db.ts` で吸収 |
| `apps/api/src/route/` の hono router | 04c | 04c の責務 |
| `auditLog.metadata` に何を載せるかのガイドライン | 04c / 07c | 各タスクで明文化 |
| Magic Link の HMAC key (`MAGIC_LINK_HMAC_KEY` secret) | 05b | 05b で導入 |
| Magic Link mail 送信（Resend / SES 等） | 05b | 05b で導入 |
| sync 失敗時の admin 通知（Slack / mail） | 09b | 09b の責務 |
| `__fixtures__/` の prod build 除外設定（tsconfig / vitest） | 02c または 00 foundation | 02c で `__fixtures__/` 命名で vitest 専用とし、build 設定を 00 で確認 |

### 5. skill-feedback-report.md

このタスクで気づいた skill / template への改善提案。

| 項目 | 提案 |
| --- | --- |
| phase-template-app.md | boundary tooling（dep-cruiser / ESLint）を扱うタスク用に「意図的 violation snippet で error 検出」のチェック観点を Phase 9 / 11 に追加してよい |
| artifacts-template.json | `boundary_tooling_introduced` の文字列リストを許可（dep-cruiser config / ESLint rule の正本管理者を機械可読化） |
| README.md 不変条件 #5 | 「dep-cruiser + ESLint の二重防御」と明記すると 02c で迷いが消える |
| README.md 不変条件 #12 | 「adminNotes は builder の引数で受け取る、戻り値に含めない」を明記 |

### 6. phase12-task-spec-compliance-check.md

phase-template-app.md / phase-meaning-app.md / artifacts-template.json と本タスクの整合確認。

| 項目 | 期待 | 実態 | 判定 |
| --- | --- | --- | --- |
| phase 数 | 13 | 13 | OK |
| 必須セクション | メタ情報 / 目的 / 実行タスク / 参照資料 / 実行手順 / 統合テスト連携 / 多角的チェック観点 / サブタスク管理 / 成果物 / 完了条件 / 100%実行確認 / 次 Phase | 全 phase に存在 | OK |
| Phase 1 追加要素 | 真の論点 / 依存境界 / 価値とコスト / 4 条件 | 存在 | OK |
| Phase 2 追加要素 | Mermaid / env / dependency matrix / module 設計 / boundary tooling 案 | 存在 | OK |
| Phase 3 追加要素 | alternative 3 案以上 / PASS-MINOR-MAJOR | 5 案 / PASS | OK |
| Phase 4 追加要素 | verify suite + boundary test | 存在 | OK |
| Phase 5 追加要素 | runbook + placeholder + sanity check + dep-cruiser + ESLint config | 存在 | OK |
| Phase 6 追加要素 | failure cases | F/A/AP/E 26 件 | OK |
| Phase 7 追加要素 | AC matrix | 11 AC × 4 軸 | OK |
| Phase 8 追加要素 | Before/After + boundary tooling DRY | 6 カテゴリ | OK |
| Phase 9 追加要素 | free-tier + secret hygiene + a11y + boundary tooling 自己検証 | 全あり | OK |
| Phase 10 追加要素 | GO/NO-GO | 9 軸 | OK |
| Phase 11 追加要素 | manual evidence | 8 シナリオ | OK |
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
| 03a / 03b / 04c / 05a / 05b / 07c / 08a | implementation-guide を入口に |
| 02a / 02b | `_shared/` 正本が 02c であることを再周知 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 引き継ぎ完成度 | — | implementation-guide だけで 03a / 03b / 04c / 05a / 05b / 07c / 08a が動ける |
| 不変条件 | 全 | implementation-guide の「やってはいけないこと」章で再周知（adminNotes 混入 / auditLog UPDATE / apps/web import / magicTokens multi-use / prototype 昇格） |
| compliance | — | template との整合 OK |
| 02a/02b 共有 | — | `_shared/` 正本が 02c で書面合意 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md | 12 | pending | 11 章 |
| 2 | system-spec-update-summary.md | 12 | pending | 4 spec 影響 |
| 3 | documentation-changelog.md | 12 | pending | エントリ追加 |
| 4 | unassigned-task-detection.md | 12 | pending | 7 件抽出 |
| 5 | skill-feedback-report.md | 12 | pending | 4 提案 |
| 6 | phase12-task-spec-compliance-check.md | 12 | pending | 表 14 行 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | 12 phase 総括 |
| ドキュメント | outputs/phase-12/implementation-guide.md | 11 章 guide |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | 4 spec 影響 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | エントリ |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 7 件 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 4 提案 |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 整合表 |

## 完了条件

- [ ] 6 種成果物全て作成
- [ ] compliance check が全 OK
- [ ] unassigned task が下流 task に申し送り済み
- [ ] `_shared/` 正本管理の責務（02c）が明記

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が completed
- [ ] outputs/phase-12/* 6 種が配置済み
- [ ] artifacts.json の Phase 12 を completed に更新

## 次 Phase

- 次: Phase 13 (PR 作成、user 承認必須)
- 引き継ぎ事項: 6 種成果物 + `_shared/` 正本明記
- ブロック条件: compliance check に NG があれば該当 Phase に戻る
