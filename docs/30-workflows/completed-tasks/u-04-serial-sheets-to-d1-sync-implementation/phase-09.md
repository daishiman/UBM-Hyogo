# Phase 9: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-to-d1-sync-implementation |
| Phase 番号 | 9 / 13 |
| Phase 名称 | リファクタリング |
| 作成日 | 2026-04-30 |
| 前 Phase | 8 (品質保証) |
| 次 Phase | 10 (ドキュメント整備) |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

Phase 3 で MINOR 追跡された **TECH-M-01〜04** の解消ポイントと、Phase 8 で挙がった lint warning / 複雑度超過 / 命名揺れを集約し、`apps/api/src/sync/*` を「契約と差分ゼロ」「DRY」「単一責務」「unused 0」の状態へ収束させる。挙動を変えない（test green を維持する）リファクタのみを許可する。

## 実行タスク

1. TECH-M-01〜04 解消方針の確定と Before / After 表
2. 命名統一（`apps/api/src/sync/types.ts` を正本に）
3. 共通化（audit / sheets-client / mapping / upsert / mutex の責務再配置）
4. 未使用コード / dead branch / unused import の除去
5. リファクタ後の test 再実行と差分ゼロ確認
6. 残課題の Phase 10 / 12 引き継ぎ

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-03/main.md | TECH-M-01〜04 の出典 |
| 必須 | outputs/phase-02/sync-module-design.md | 採用モジュール構成 |
| 必須 | outputs/phase-02/audit-writer-design.md | audit 共通基盤の責務 |
| 必須 | outputs/phase-02/d1-contract-trace.md | mapping 命名の正本 |
| 必須 | outputs/phase-08/main.md | lint warning / 複雑度超過 |
| 必須 | `docs/00-getting-started-manual/specs/01-api-schema.md` | stableKey 用語 |
| 参考 | `CLAUDE.md` | 不変条件 #1〜#7 |

## 実行手順

### ステップ 1: TECH-M-01〜04 解消方針

| MINOR ID | Phase 3 指摘 | 解消方針 | 解消手段 | Phase 8 で残検知済か | 完了確認 |
| --- | --- | --- | --- | --- | --- |
| TECH-M-01 | mutex DB 排他の race 残存リスク（Q1） | `mutex.ts` の SELECT count → INSERT を **単一 D1 batch** にまとめ、INSERT 時の UNIQUE 制約（`status='running'` 部分 unique）に依存する形に変更（D1 が許容する範囲で） | `mutex.tryAcquire(deps)` の実装を 1 文の `INSERT ... WHERE NOT EXISTS (SELECT 1 FROM sync_audit WHERE status='running')` 形に統合 / 取得 row 数で判定 | Phase 8 integration test で race を再現 | integration test green + audit row diff |
| TECH-M-02 | scheduled 同秒取りこぼし（Q4） | `scheduled.ts` の差分検出キーを `submittedAt > last_success.finished_at` から **`submittedAt >= last_success.cursor_submitted_at`** に変更し、responseId upsert で重複を吸収 | sync_audit に `cursor_submitted_at` 列が無い場合は `last_success.started_at - 1s` の安全マージン適用 | unit test に「同秒 2 row」ケース | unit test green |
| TECH-M-03 | audit row が running のまま漏れるリスク（Q5） | 全 handler を `try { ... } catch (e) { await failRun(...) } finally { /* noop */ }` で必ず finalize する形に統一。`audit.ts` に `withAudit(deps, trigger, fn)` 高階関数を新設して 3 handler を統一 | manual.ts / scheduled.ts / backfill.ts は `withAudit` を呼ぶだけに簡素化 | integration test に「未捕捉例外 → failRun」 | unit + integration green |
| TECH-M-04 | F 案（shared 化）の将来再検討 | 現状 sync 内に閉じる責務であり shared 化しない（Phase 3 の判定維持）。本タスクでは **再検討不要** とし、Phase 12 の unassigned-task に「admin endpoint から audit を参照する要件が出た時点で shared 化検討」と記録する | コードは触らず、Phase 12 でドキュメント化 | - | unassigned-task に記録済 |

### ステップ 2: 命名統一（Before / After）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| trigger 種別 enum | `'manual' / 'scheduled' / 'backfill'` 各所文字列直書き | `SyncTrigger` 型を `apps/api/src/sync/types.ts` に集約 | DRY / 型安全 |
| audit row 型 | `any` / 個別 interface | `AuditRow` を `types.ts` に集約 | 単一責務 |
| diff サマリ | `summary` / `diff` / `counts` 揺れ | `DiffSummary` 型に統一 | spec 用語一致（sync-flow.md） |
| handler 命名 | `runSync` / `executeSync` / `syncMembers` 揺れ | `runManualSync` / `runScheduledSync` / `runBackfill` の 3 種に統一 | trigger 種別と 1:1 |
| audit 状態 | `'in_progress'` / `'pending'` 混在 | `'running' / 'success' / 'failed'` のみ（data-contract.md と一致） | 不変条件 整合 |

### ステップ 3: 共通化（Before / After）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| try/finally 分散 | 各 handler が startRun / finishRun / failRun を直接呼ぶ | `audit.withAudit(deps, trigger, async (auditId) => { ... })` に集約 | TECH-M-03 解消 / DRY |
| Sheets fetch + map のループ | handler 内に for-of で混在 | `processRows(rows, mappers)` を `mapping.ts` に切り出し | 単一責務 |
| upsert 3 テーブル | handler 内に直書き | `upsert.persistResponse(deps, mapped)` に集約（member_responses / member_identities / member_status を 1 batch） | 不変条件 #4（admin 列 untouched）の唯一の窓口 |
| backoff loop | handler 内に各個実装 | `sheets-client.fetchWithBackoff(req)` に集約 | AC-12 の単一実装ポイント |
| JWT 署名 | sheets-client.ts と他 util に分散 | `sheets-client.ts` 内 private function に集約 | secret hygiene |

### ステップ 4: 未使用コード / dead branch 除去

| 種別 | 確認手段 | アクション |
| --- | --- | --- |
| unused import | `mise exec -- pnpm lint -- --rule "no-unused-vars"` | 全削除 |
| unused export | `ts-prune apps/api/src/sync` | 内部限定の export は削除、公開 API のみ `index.ts` から export |
| dead branch | Phase 8 coverage report で 0% 行を抽出 | テスト追加 or 削除 |
| TODO / FIXME | `git grep -nE "TODO\|FIXME" apps/api/src/sync` | TECH-M-04 由来分は Phase 12 に転記、それ以外は解消 |
| commented-out code | `git diff --diff-filter=A apps/api/src/sync` レビュー | 全削除 |

### ステップ 5: リファクタ後 verify

| 種別 | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | error 0 |
| lint | `mise exec -- pnpm lint` | error 0 / warning 0 |
| unit | `mise exec -- pnpm test --filter=apps/api -- sync` | 全 green |
| contract | `mise exec -- pnpm test --filter=apps/api -- sync.contract` | 差分 0 |
| integration | `mise exec -- pnpm test --filter=apps/api -- sync.integration` | 全 green |
| coverage 維持 | `mise exec -- pnpm test --filter=apps/api -- --coverage` | Phase 8 と同等 or 向上 |
| diff レビュー | `git diff apps/api/src/sync` | 挙動変更なし（test 結果が証拠） |

### ステップ 6: 残課題引き継ぎ

| 種別 | ID | 内容 | 引き継ぎ先 |
| --- | --- | --- | --- |
| 未消化 MINOR | Q-M-03（CPU time 30ms 超） | Phase 12 unassigned-task として paid plan 移行検討 | Phase 12 |
| 未消化 MINOR | TECH-M-04（shared 化） | 将来の admin endpoint 拡張時に再検討 | Phase 12 unassigned-task |
| docs 反映項目 | `withAudit` の使い方、`processRows` の責務 | Phase 10 implementation guide | Phase 10 |
| docs 反映項目 | mutex の単文 INSERT パターン | Phase 10 sync runbook | Phase 10 |

## 統合テスト連携【必須】

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | リファクタ後の最終モジュール構成 / API を docs に反映 |
| 下流 09b | Cron 監視設計の入力に CPU time 実測（Phase 8 / 9 両者）を渡す |
| Phase 12 | TECH-M-04 / Q-M-03 を unassigned-task に転記 |

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| typecheck | error 0 | TBD |
| lint | error 0 / warning 0 | TBD |
| unit / contract / integration | 全 green | TBD |
| coverage | Phase 8 と同等以上 | TBD |
| 挙動差分 | なし | TBD |

## 多角的チェック観点

- 不変条件 #1: 命名統一で `SyncTrigger` / `AuditRow` / `DiffSummary` 型に集約、stableKey 文字列は mapping.ts 内のみ
- 不変条件 #4: `upsert.persistResponse` を admin 列書き込みの唯一の検査ポイント化（admin 列は引数に含めない型設計）
- 不変条件 #5: リファクタ過程で apps/web へ漏れる import が出ていないことを再 grep
- 不変条件 #6: 共通化で `googleapis` 等の Node SDK が紛れ込んでいないことを `package.json` diff で確認
- 単一責務: 1 handler = 1 trigger、1 module = 1 responsibility（audit / sheets-client / mapping / upsert / mutex）
- DI 境界: `withAudit` 高階関数化で test 容易性を維持
- YAGNI: TECH-M-04 の shared 化は今回見送り、Phase 12 にエスカレーション

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | TECH-M-01〜04 解消方針 | 9 | pending | 4 件 |
| 2 | 命名統一 Before / After | 9 | pending | 5 件 |
| 3 | 共通化 Before / After | 9 | pending | 5 件 |
| 4 | unused / dead branch 除去 | 9 | pending | 5 種 |
| 5 | リファクタ後 verify | 9 | pending | 7 種 |
| 6 | 残課題引き継ぎ | 9 | pending | 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | TECH-M-01〜04 解消 + Before / After + verify 結果 |
| メタ | artifacts.json | phase 9 status |

## 完了条件

- [ ] TECH-M-01 / TECH-M-02 / TECH-M-03 が解消（コード + test）
- [ ] TECH-M-04 が Phase 12 へ unassigned として正しく引き継がれている
- [ ] 命名統一 5 件 / 共通化 5 件 / unused 除去 5 種が完了
- [ ] typecheck / lint / unit / contract / integration が全て green
- [ ] coverage が Phase 8 と同等以上
- [ ] 挙動差分なし（test 結果で証明）
- [ ] **本Phase内の全タスクを100%実行完了**

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- outputs/phase-09/main.md 配置
- TECH-M-01〜04 の解消状況が一覧化
- `withAudit` / `persistResponse` / `fetchWithBackoff` などリファクタ後の API が docs に反映可能な形で記載
- 次 Phase へ最終モジュール構成・API・運用注意事項を引き継ぎ
- artifacts.json の phase 9 を completed に更新

## 次 Phase

- 次: 10 (ドキュメント整備)
- 引き継ぎ事項:
  - 最終モジュール構成（リファクタ後の `apps/api/src/sync/*`）
  - `withAudit` 利用パターン
  - mutex 単文 INSERT パターン
  - cursor_submitted_at による差分検出方針（TECH-M-02）
  - 未消化 MINOR（Q-M-03 / TECH-M-04）の Phase 12 引き継ぎ
- ブロック条件: TECH-M-01〜03 のいずれかが解消未済、test red、coverage 後退、挙動差分検知のいずれかが残るなら進まない
