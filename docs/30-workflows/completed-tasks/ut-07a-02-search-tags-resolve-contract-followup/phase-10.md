# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07a-02-search-tags-resolve-contract-followup |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビューゲート |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-01 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動テスト検証) |
| 状態 | completed |
| Source Issue | #297 |
| Gate | MAJOR 判定の場合は Phase 1〜8 のいずれかに戻る |

---

## 目的

Phase 1〜9 の成果物を集約し、本タスクが
「apps/web admin client の `resolveTagQueue` 型が正本契約に整合し、08a contract test が confirmed / rejected / validation / idempotent の 4 ケースを pass し、正本仕様 ↔ implementation-guide ↔ apps/web ↔ apps/api の 4 層 drift が解消した」
という Issue #297 の受入条件を満たしているかを最終評価し、GO / NO-GO を確定する。
solo dev policy のため self-review を正本とし、CODEOWNERS による必須レビュアーは存在しない。

---

## 実行タスク

1. GO/NO-GO 判定基準表を作成し、Phase 1〜9 の成果物 / 判定を投入
2. Phase 1 の 4 条件（価値性・実現性・整合性・運用性）の最終判定を確定
3. Blocker 一覧を作成し、未解消ブロッカーがある場合は戻り Phase を明示
4. review checklist（Phase 2 追従対象表 6 ファイルの達成度 / `spec_created` → `completed` 化条件）を埋める
5. Self-review を実施し approver セクションに記録（CODEOWNERS 該当なし）
6. Phase 11 への引き継ぎ条件を確定

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-01.md | 4 条件仮判定 / AC-1〜AC-7 |
| 必須 | phase-02.md | 追従対象表 6 ファイル |
| 必須 | phase-03.md | 採用案 A / Blocker B-1〜B-3 |
| 必須 | phase-07.md | AC マトリクス / 未カバー領域 |
| 必須 | phase-08.md | DRY 化結果 |
| 必須 | phase-09.md | Quality Gate Q-1〜Q-9 |
| 参考 | CLAUDE.md | solo dev policy / branch protection |

---

## GO / NO-GO 判定基準表

| # | 判定項目 | 入力 Phase | 期待値 | 実測 | 判定 |
| --- | --- | --- | --- | --- | --- |
| G-1 | AC-1〜AC-7 がすべて「達成 / 部分達成」| Phase 7 | 「未達」0 件 | TBD | pending |
| G-2 | 既存 contract test 100% green | Phase 9 (Q-3) | 0 red | TBD | pending |
| G-3 | 新規 contract ケース 4 件以上追加 | Phase 7 / 9 | confirmed / rejected / validation / idempotent | TBD | pending |
| G-4 | typecheck / lint pass | Phase 9 (Q-1, Q-2) | 0 error | TBD | pending |
| G-5 | shared package 循環依存 0 件 | Phase 9 (Q-5) | 0 件 | TBD | pending |
| G-6 | Free-tier 影響 ±0 | Phase 9 (Q-7) | Workers / D1 / KV / R2 すべて ±0 | TBD | pending |
| G-7 | Secret 追加 0 件 | Phase 9 (Q-8) | 追加 0 件 | TBD | pending |
| G-8 | 4 層 drift（spec ↔ guide ↔ web ↔ api）| Phase 7 (AC-6 / AC-7) | Phase 12 で最終確定 | 部分達成 | conditional |
| G-9 | DRY 化（重複 D-1〜D-4 が hit 1 件）| Phase 8 | hit 1 件 | TBD | pending |
| G-10 | Blocker B-1〜B-3 解消 | Phase 3 | 解消済 | TBD | pending |

> G-8 は AC-6 / AC-7 に関するもので、Phase 12（ドキュメント更新）の完了をもって最終達成。本 Phase では「conditional GO」として扱う。

---

## 4 条件 最終判定

| 条件 | Phase 1 仮判定 | Phase 10 最終判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | PASS | PASS | client / test を正本契約に揃え regression を排除（Phase 7 AC マトリクス達成） |
| 実現性 | TBD | PASS（実測） | drift inventory が Phase 1 で確定し、Phase 5 で全件追従済 |
| 整合性 | PASS | PASS | 07a 本体 / UT-07A-03 と scope 重複なし（Phase 1 依存境界 + Phase 8 DRY） |
| 運用性 | PASS | PASS | 契約伝播のみで本体に影響しない / 失敗時の差し戻し経路明確 |

---

## Blocker 一覧（最終）

| # | 内容 | 元 Phase | 状態 | 解消 evidence |
| --- | --- | --- | --- | --- |
| B-1 | `packages/shared` 配下の admin schema 配置慣習 | Phase 3 | 解消 | Phase 5 で `packages/shared/src/schemas/admin/tag-queue-resolve.ts` を新設し先例化 |
| B-2 | 07a Phase 12 implementation-guide の discriminated union 採用済 | Phase 3 | 解消 | Phase 1 の上流 AC 引き継ぎ確認で達成 |
| B-3 | 08a contract test 物理位置の確定 | Phase 3 | 解消 | Phase 4 で `apps/api/test/contract/admin-tags-queue-resolve.test.ts` に確定 |
| B-4 | contract test の red 残存 | 新規候補 | TBD | Phase 9 Q-3 が all green であること |
| B-5 | 上流 07a への regression | 新規候補 | TBD | 既存 contract test 100% green が Phase 9 Q-3 で確認 |
| B-6 | shared schema 循環依存 | 新規候補 | TBD | Phase 9 Q-5 が 0 件 |

---

## Review Checklist（追従対象表 6 ファイル / Phase 2 ベース）

| # | ファイル / モジュール | 期待状態 | 達成 |
| --- | --- | --- | --- |
| R-1 | `docs/00-getting-started-manual/specs/12-search-tags.md` | alias 表セクション追加 | Phase 12 で確定（本 Phase は conditional） |
| R-2 | `apps/api/src/routes/admin/tags/queue/.../resolve.ts` | 変更なし（参照のみ） | Phase 5 / 9 で確認 |
| R-3 | `packages/shared/src/schemas/admin/tag-queue-resolve.ts` | discriminated union zod schema export | Phase 5 / 8 / 9 |
| R-4 | `apps/web/src/lib/api/admin.ts` の `resolveTagQueue` | discriminated union 引数型 | Phase 5 / 8 / 9（typecheck）|
| R-5 | `apps/api/test/contract/admin-tags-queue-resolve.test.ts` | 4 ケース + 異常系 | Phase 5 / 6 / 7 / 9 |
| R-6 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` / `architecture-admin-api-client.md` | body shape を正本仕様参照に統一 | Phase 12 で確定 |

---

## `spec_created` → `completed` 化条件

| 条件 | 達成判定 |
| --- | --- |
| Phase 1〜10 が completed | 本 Phase 終了時点 |
| Phase 11（手動テスト検証）evidence 取得 | Phase 11 終了時 |
| Phase 12（docs 同期）AC-6 / AC-7 達成 | Phase 12 終了時 |
| Phase 13（PR 作成）#297 close 条件記述 | Phase 13 終了時 |
| artifacts.json 全 phase = completed | Phase 13 終了時 |

> 上記すべてを満たした時点で artifacts.json の `task.status` を `spec_created` から `completed` に遷移させる。

---

## Self-review（solo dev policy）

| 項目 | 値 |
| --- | --- |
| Reviewer | @daishiman（自己レビュー） |
| CODEOWNERS 該当 | なし（`apps/api/**` / `apps/web/**` の global fallback のみ。`required_pull_request_reviews=null`）|
| Required reviewers | 0（CLAUDE.md branch protection 記載どおり） |
| 検証手段 | Self-checklist（本 Phase の Review Checklist + Q-1〜Q-9）|
| Approval ログ | 本 Phase の outputs/phase-10/main.md に記録 |

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | NON_VISUAL evidence の取得対象を AC マトリクスから引き継ぐ |
| Phase 12 | R-1 / R-6 の docs 同期を Phase 12 のチェックリストとして引き継ぐ |
| Phase 13 | #297 close 条件 / `completed` 化条件をリリースノート / PR body に転記 |

---

## 多角的チェック観点

- 不変条件 #5 / #10 / #11: Phase 9 までで個別確認済、本 Phase で再 cross-check
- DRY: Phase 8 の D-1〜D-4 が hit 1 件に収束しているか再確認
- 後方互換: 旧契約呼び出しの残存を Phase 7 AC-7 で grep 検出済
- 整合性: Phase 1 4 条件の最終判定がすべて PASS
- 運用性: Blocker B-1〜B-6 が解消 or 持ち越し条件付き

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | GO/NO-GO 判定基準表記入 | 10 | pending | G-1〜G-10 |
| 2 | 4 条件最終判定 | 10 | pending | 価値性 / 実現性 / 整合性 / 運用性 |
| 3 | Blocker 一覧確定 | 10 | pending | B-1〜B-6 |
| 4 | Review Checklist R-1〜R-6 達成記録 | 10 | pending | Phase 2 追従対象表 |
| 5 | `spec_created` → `completed` 条件記述 | 10 | pending | Phase 11〜13 達成条件 |
| 6 | Self-review 実施 | 10 | pending | solo dev policy |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | GO/NO-GO 判定 / 4 条件最終判定 / Blocker / Review Checklist / Self-review |
| メタ | artifacts.json | Phase 10 を completed に更新 |

---

## 完了条件

- [ ] GO/NO-GO 判定基準表 G-1〜G-10 がすべて判定済（pass / conditional / fail）
- [ ] 4 条件の最終判定がすべて PASS
- [ ] Blocker B-1〜B-6 がそれぞれ「解消 / 持ち越し条件付き」で記録済
- [ ] Review Checklist R-1〜R-6 が達成 Phase と紐付いている
- [ ] Self-review approver / CODEOWNERS 該当なし / required reviewers=0 が記録済

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-10/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- 判定が NO-GO の場合は戻り Phase（Phase 1 / 2 / 5 / 8 のいずれか）を明記
- 判定が conditional GO の場合は条件解消を Phase 11 / 12 / 13 のどこで達成するか明記
- artifacts.json の phase 10 を completed に更新

---

## 次 Phase

- 次: 11 (手動テスト検証)
- 引き継ぎ事項: GO/NO-GO 結果 / conditional 条件（AC-6 / AC-7 を Phase 12 で確定）/ NON_VISUAL evidence 取得対象
- ブロック条件: G-1〜G-7 / G-9 / G-10 のいずれかが fail の場合は戻り Phase を実行
