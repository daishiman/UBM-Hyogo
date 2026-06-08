# Phase 10: 最終レビュー — issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / NON_VISUAL / ゲート: 最終レビュー（AC 充足判定）

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | issue-1104-member-creation-path-unification |
| Phase | 10（最終レビュー） |
| workflow_state | **implemented_local_evidence_captured**（ローカル実装・focused 証跡取得済み。commit/PR/staging はユーザーゲート） |
| 入力 | Phase 9 品質保証方針（typecheck / lint / 全テスト）/ index.md §3 全 AC |
| 出力 | AC-1〜AC-7 充足判定・blocker 有無・MINOR 未タスク化候補 |
| 分類 | NON_VISUAL（`apps/api` のみ。`apps/web` 無変更 = AC-6） |

## 目的

index.md §3 の AC-1〜AC-7 の充足を判定し、リリース blocker の有無を確定する。
本 workflow は **implemented_local_evidence_captured** 段階であるため、各 AC の判定はローカル実装と focused evidence に基づく充足判定として記録する。commit・push・PR・staging 検証のみユーザー明示承認後に行う（CONST_002 / CONST_006）。

## 実行タスク

### 10.1 AC 充足判定テーブル（implemented_local_evidence_captured 段階）

「判定」列の意味 = ローカル実装・focused D1 evidence・grep/diff gate に基づく現在地の判定。

| # | 受け入れ基準 | 判定基準（検証手段） | 期待結果 | 判定 |
|---|-------------|---------------------|----------|-------------|
| AC-1 | member 作成経路の棚卸し表に現存全経路（**ingest / auto-link**）が列挙されている（issue §5.1 の欠落 = auto-link を補完） | index.md §1.2 / phase-1.md §5 inventory / `grep` 呼び出し箇所確認 | P-1（ingest）/ P-2（auto-link）/ P-3（route 防御）を網羅。issue 見落としの P-2 を補完済み | **GREEN（inventory 確定）** |
| AC-2 | `member_identities` と `member_status` 既定行を必ず同期生成する単一 helper（`createMemberWithStatus`）が新設されている | repository spec（helper 単体テスト・冪等性確認） | helper 内で identity upsert + `ensureMemberStatusRow` を両方実行・`Promise<void>`・冪等 | GREEN（2026-06-05 focused evidence） |
| AC-3 | 既存の全 member 作成経路（ingest / auto-link）が単一 helper 経由 or status 連結に差し替えられ、新規生成経路に散在する独立 `ensureMemberStatusRow` 呼び出しが集約されている | `grep` で新規生成経路（P-1/P-2）に散在呼び出しが残らないこと / 各経路の参照確認 | ingest = `createMemberWithStatus` 1 呼び出し / auto-link = identity INSERT 直後に status 連結。P-3（route 防御）は意図的保持（集約対象外） | GREEN（2026-06-05 focused evidence） |
| AC-4 | どの経路から member を作っても `member_status` 既定行が生成される（経路ごとの回帰テスト） | sync-forms-responses spec（ingest）/ identities spec（auto-link） | 各経路で member 作成後に `member_status` 行が必ず存在 | GREEN（2026-06-05 focused evidence） |
| AC-5 | 既存 endpoint surface・レスポンスが不変で回帰がない（一覧 / 詳細 / status の従来挙動を維持） | 既存 spec 全 PASS / `mise exec -- pnpm typecheck` 成功 | 既存出力と差異なし・型エラーなし | GREEN（2026-06-05 focused evidence） |
| AC-6 | `apps/web` は無変更（diff 0） | `git diff --name-only dev...HEAD \| grep '^apps/web/'` | マッチ 0 件 | grep gate で確認（Phase 9 §品質保証） |
| AC-7 | D1 schema 変更・新規 endpoint・FK 制約導入を行っていない（followup-002 と責務が重複しない） | `apps/api/migrations/` に新規ファイルなし / `git diff` 確認 | migration 追加なし・endpoint 追加なし・FK 追加なし | grep / diff gate で確認 |

> AC-1〜AC-7 はローカル実装・focused D1 evidence・grep/diff gate で GREEN。

### 10.2 blocker 判定

| 観点 | 判定 |
|------|------|
| リリース blocker | **なし**。endpoint surface 不変・既存正常パス非回帰・helper の両 write は `ON CONFLICT DO UPDATE` / `INSERT OR IGNORE` で冪等のため rollback リスク極小。新規 migration / D1 schema 変更なし（AC-7）。commit / push / PR / staging smoke はユーザーゲート（Phase 13） |
| データ破壊リスク | なし。`ensureMemberStatusRow`（`INSERT OR IGNORE`）は既存 `member_status` を上書きしない。auto-link への status 連結は +1 write（冪等）のみ |
| 不変条件抵触 | なし（#5 `apps/web`→D1 直アクセス禁止維持・既存 API surface のみ・GAS prototype 非昇格） |
| 循環 import | なし（Phase 3 §2 で確認済み。`members.ts` / `identities.ts` → `status.ts` の単方向） |

→ **ゲート判定: pass（blocker なし）**。ローカル実装と focused evidence は充足済み。remote/staging 確認のみ user-gated。

### 10.3 Phase 10 MINOR 判定（未タスク化候補 → Phase 12）

| ID | MINOR 候補 | 分離理由 | 推奨優先度 | 新規起票要否 |
|----|-----------|----------|-----------|-------------|
| （MINOR なし） | — | 本 Phase で検出した新規スコープ外改善は **なし**。設計はスコープ内で閉じており、過剰スコープの切り出し対象が発生しなかった | — | — |

> **MINOR なし**。本タスクの設計（単一 helper 集約 + auto-link 連結 + F-4 防御保持）は
> index.md §4 のスコープ内で完結し、新規に未タスク化すべき改善点は検出されなかった。

#### scope-out（既存分離・新規起票ではない）

| 項目 | 扱い | 根拠 |
|------|------|------|
| FK 制約（`member_status.member_id` → `member_identities`）導入 | **followup-002 へ既に分離済み**（本 Phase での新規未タスク起票ではない） | 親 `admin-member-detail-status-404-fix` の Phase 10 MINOR-FUT-2 で既に将来層として記録され、followup-002 として境界が確定している。本タスク（followup-001）の責務は「アプリ層の生成責務集約」であり、DB 層の整合性保証（FK）は別関心。index.md §4「含まない」で明記済み。**したがって本 Phase で Issue を新規起票する対象には該当しない** |

### 10.4 完了条件チェックリスト

- [x] AC-1〜AC-7 の充足判定（基準・期待・spec 判定）をテーブル化した
- [x] AC-1〜AC-7 はローカル実装・focused D1 evidence・grep/diff gate で充足済み
- [x] リリース blocker の有無を判定した（なし）
- [x] Phase 10 MINOR 判定を記録した（**MINOR なし**）
- [x] scope-out（FK = followup-002）は既存分離であり本 Phase の新規未タスク起票ではない旨を明記した

## 参照資料

- Phase 9（品質保証方針）/ index.md §3 AC-1〜AC-7 / §4 スコープ
- Phase 2 §3（F-4 route 防御の保持判定）/ Phase 3 §2（循環 import 確認）
- 親タスク Phase 10 MINOR-FUT-1（= 本 followup-001）/ MINOR-FUT-2（= followup-002 / FK）

## 成果物

- 本ファイル（Phase 10 最終レビュー）
- AC-1〜AC-7 充足判定テーブル・blocker なし判定・MINOR なし記録・scope-out 整理
