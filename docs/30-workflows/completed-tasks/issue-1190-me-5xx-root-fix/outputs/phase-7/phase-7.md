# Phase 7: カバレッジ確認

## メタ情報
正本: `outputs/phase-7/phase-7.md` / 上位 SSOT: `../../_shared-context.md`

参照: `../phase-6/phase-6.md`（P6-1〜P6-9）/ `../phase-4/phase-4.md`（TC-1〜TC-4・fail パターン表）

## 目的
カバレッジ目標を**変更ブロック（T01/T02 で追加した catch 4 箇所と分岐）に限定**して定義する。全体一律の閾値は引き上げず、変更した関数ブロックのみの line/branch を実測し、未到達分岐があれば Phase 6 のケースで埋める。本タスクは catch 追加の小さな差分であり、リポジトリ全体の coverage gate はベースライン維持でよい。

不変条件: カバレッジ取得のために production コード / テストへ新規ロジックを足さない。apps/web は非接触（計測対象外）。

---

## 1. 計測対象（変更ブロックのみ）

| 対象ブロック | ファイル | 種別 | line 目標 | branch 目標 | 主担当ケース |
|--------------|----------|------|-----------|-------------|--------------|
| P1 catch（`Promise.all(...).catch` rethrow） | `apps/api/src/middleware/session-guard.ts` | 改修 | 100% | `err instanceof Error && err.stack !== undefined` の**両側**（Error 側 / non-Error 側） | TC-1（Error 側）・P6-9（non-Error 側） |
| P2 catch（`findAdminByEmail(...).catch` rethrow） | `apps/api/src/middleware/session-guard.ts` | 改修 | 100% | 同上（Error 側のみ必須。non-Error 側は P1 で分岐式を共有検証済みとして任意） | P6-2 |
| P3 catch（`buildMemberProfile(...).catch` rethrow） | `apps/api/src/routes/me/index.ts` | 改修 | 100% | 同上（Error 側必須） | TC-2 |
| P4 `.catch`（fail-soft + `logError` + `{}` 返却） | `apps/api/src/routes/me/index.ts` | 改修 | 100% | catch 発火 / 非発火（成功経路）の両側 | TC-3・P6-1（発火）/ TC-4 既存 pendingRequests 系（非発火） |
| 既存無変更行（null→401 :89-93 / 410 :95-100 等） | 両ファイル | 据え置き | ベースライン維持（低下させない） | — | P6-7・P6-8・TC-4 |

> 分岐の数え方: 条件付き spread `...(err instanceof Error && err.stack !== undefined ? { stack: err.stack } : {})` が各 catch 内の唯一の新規分岐。`&&` の短絡 2 条件 × 三項の真偽で、実用上は「Error（stack あり）」と「non-Error」の 2 入力で両側に到達する（vitest が throw する `Error` は常に stack を持つ）。

---

## 2. カバレッジ確認コマンド（変更ブロックに限定した実測）

focused run に `--coverage` を付け、変更 2 ファイルへ `--coverage.include` で絞って実測する。全体閾値は変えず、出力された変更ファイルの行・分岐をレビューする。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts \
   \
  --coverage \
  --coverage.include='apps/api/src/routes/me/index.ts' \
  --coverage.include='apps/api/src/middleware/session-guard.ts'
```

確認手順:
1. 上記コマンドの coverage レポートで `session-guard.ts` / `routes/me/index.ts` の uncovered lines を確認する。
2. §1 の対象ブロック（catch 4 箇所）の行が uncovered に**含まれない**ことを確認する（line 100%）。
3. branch レポートで条件付き spread の両側到達を確認する（P1 の non-Error 側は P6-9 が担保）。
4. 変更していない既存行のカバレッジがベースラインから低下していないことを目視確認する（既存テスト無編集のため通常は同値）。

---

## 3. 未到達分岐が出た場合の対応

| 想定未到達 | 原因 | 対応ケース |
|------------|------|------------|
| P1 catch 本体が未到達 | failing pattern が sessionGuard まで届いていない | TC-1 の pattern `/member_identities\|member_status/` を確認（Phase 4 §3.3） |
| P2 catch が未到達 | `/admin_users/` pattern のケース欠落 | P6-2 を追加（必須） |
| P3 catch が未到達 | TC-2 の pattern が sessionGuard で先に fail している | pattern を `/response_fields/`（builder 専用テーブル）に固定（Phase 4 §3.3・R2 確定） |
| P4 catch が未到達 | `/admin_member_notes/` 注入ケース欠落 | TC-3 / P6-1 を追加（必須） |
| 条件付き spread の non-Error 側が未到達 | non-Error throw の入力が無い | P6-9（Proxy が文字列を throw）を追加 |
| P4 の非発火側（成功経路）が未到達 | 既存 pendingRequests 系テストが focused run に含まれていない | `index.contract.spec.ts` 全件を focused run へ含める（コマンドどおり） |

各未到達は**全体閾値の引き上げではなく、Phase 6 の対応ケース追加**で埋める。

## 統合テスト連携
本 Phase で「変更ブロックの line/branch を 100% 目標で実測する」基準を固定した。Phase 8 のリファクタリング再評価（分類 helper 純関数化の要否）で構造が変わった場合も同じ focused + `--coverage.include` で再実測する。Phase 9 で focused vitest を gate として最終実行し、Phase 11 に実測値を証跡として記録する（実装後・user-gated 範囲外のローカル実行）。

## 参照資料
- `../../_shared-context.md`（SSOT §6 実行コマンド）/ `../phase-6/phase-6.md`（P6-1〜P6-9）/ `../phase-4/phase-4.md`（fail パターン表）
- 実コード: `apps/api/src/middleware/session-guard.ts` / `apps/api/src/routes/me/index.ts`

## 成果物
- `outputs/phase-7/phase-7.md`

## 完了条件
- [x] 計測対象を変更ブロック（catch 4 箇所 + 条件付き spread 分岐）に限定して列挙した。
- [x] 各対象の line/branch 目標と主担当ケース（TC/P6）を対応付けた。
- [x] 変更ブロック限定の `--coverage.include` 実測コマンドと確認手順を定義した（全体閾値非引き上げ）。
- [x] 未到達分岐の埋め戻しケースを表で示した。
