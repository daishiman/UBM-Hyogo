# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 6 |
| 状態 | spec_created |
| taskType | implementation |
| subtype | security-audit |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. Token 権限不足 / 過剰 / 値露出 / 適用競合 の 4 領域で fail path を列挙する。
2. 各シナリオに検出経路、切り分け手順、復旧経路を紐付ける。
3. scope 外の事象は派生タスク化候補として明記する。

## 目的

Token 最小化の運用において、権限の過不足・値漏洩・適用タイミング競合を早期検出し、Token 値を成果物に残さない形で復旧できるようにする。

## 参照資料

- `index.md`
- `artifacts.json`
- `phase-04.md`（TC-N01〜N04）
- `phase-05.md`（rollback Step 7）
- `scripts/cf.sh`
- Cloudflare Dashboard: API Tokens audit log

## 入力

- Phase 4（テスト戦略）
- Phase 5（実装ランブック）

## 異常系シナリオ

### 1. 権限不足（過小）

| シナリオ ID | 想定異常 | 検出経路 | 期待挙動 / 復旧 |
| --- | --- | --- | --- |
| FC-01 | D1:Edit が欠落（template 適用ミス） | TC-N01 / TC-R03 で `code: 10000` または `code: 7003` | Step 7 rollback → Token を Dashboard で編集して D1:Edit 追加 → 再検証 |
| FC-02 | Workers Scripts:Edit が欠落 | TC-N02 / TC-R04 で `Authentication error` | 同上、Workers Scripts:Edit を追加 |
| FC-03 | Cloudflare Pages:Edit が欠落 | TC-N03 / TC-R05 で Pages project list 失敗 | Pages:Edit を追加。Workers Scripts:Edit は内包しないため両方必要 |
| FC-04 | Account Settings:Read 欠落 | `cf.sh whoami` が空 / `account not found` | Account Settings:Read を追加 |
| FC-05 | Workers KV Storage:Edit が条件付きで必要 | `cf.sh kv namespace list` 失敗、または KV binding 利用 worker の deploy で fail | 実測根拠を Phase 11 に記録してから KV:Edit を追加 |
| FC-06 | User Details:Read が条件付きで必要 | wrangler-action が初期化段階で fail（"Could not retrieve user"） | 実測根拠を Phase 11 に記録してから User Details:Read を追加 |

### 2. 権限過剰（過大）

| シナリオ ID | 想定異常 | 検出経路 | 期待挙動 / 復旧 |
| --- | --- | --- | --- |
| FC-07 | "Edit Cloudflare Workers" テンプレートをそのまま使い、Queues / R2 / Stream など未使用権限が含まれる | Cloudflare Dashboard → API Tokens → 該当 Token 詳細で permissions 行数が正本 4 種を超える | Phase 11 evidence の権限行数で過剰を検知 → Token 編集で削除。条件付き 2 種は実測根拠がある場合だけ許可 |
| FC-08 | Account Resources が `All accounts` になっている | Token 詳細の Resources 欄目視 | `Specific account` に絞り直す |
| FC-09 | Zone Resources が誤って `All zones` を含む | 同上 | UBM-Hyogo は Zone を CI で使わないため Zone resources を空に |

### 3. Token 値露出

| シナリオ ID | 想定異常 | 検出経路 | 期待挙動 / 復旧 |
| --- | --- | --- | --- |
| FC-10 | 成果物 / commit に Token 値が混入 | TC-S06 / TC-N04 の `grep -E '[A-Za-z0-9_-]{40,}'` でヒット | **即時 incident 対応**: ① 該当 Token を Cloudflare Dashboard で Roll → ② GitHub Secret 値を新値に更新 → ③ git history に残った場合は `git filter-repo` 等で履歴除去（ただし solo 運用のため force push 範囲を main 含め全 ref に拡張）→ ④ Phase 11 evidence に incident log を追記（Token 値そのものは記録しない） |
| FC-11 | CI ログに Token 値が含まれる | `gh run view <id> --log` 出力を grep | wrangler-action はマスクするが、`set -x` 由来の echo がある場合は workflow から除去 → Token Roll |
| FC-12 | 1Password 一時 vault に Token 値が残ったまま | 24h 後の vault 監査 | 一時項目を delete |

### 4. 適用タイミング競合

| シナリオ ID | 想定異常 | 検出経路 | 期待挙動 / 復旧 |
| --- | --- | --- | --- |
| FC-13 | staging 検証中に main へ deploy が走る | `gh run list --branch main` で同時刻に run | production 側はまだ旧 Token のため影響なし。staging 検証完了後に Step 6 へ進む |
| FC-14 | production Secret 差し替え直後に走った run が旧 Token をキャッシュして fail | TC-P03 で `code: 10000` | rollback Step 7（旧値復元）→ 原因調査 → 再差し替え |
| FC-15 | 旧 Token 失効を 24h 待たずに実施し、観測中の run が fail | run conclusion failure | Cloudflare 側の旧 Token は再表示不可のため新 Token で `gh run rerun` 再実行のみが復旧経路 |

### 5. scope 外（派生タスク候補）

| シナリオ ID | 想定異常 | 対応 |
| --- | --- | --- |
| FC-16 | wrangler-action v4 で OIDC ネイティブ対応が拡張される | 別タスク Option D（OIDC 移行）として `unassigned-task-detection.md` で起票 |
| FC-17 | scope 別 Token（D1 専用 / Workers 専用）への分割要請 | Option C を将来 ADR 化、別タスクで扱う |
| FC-18 | wrangler.toml runtime warning（vars 継承 / pages_build_output_dir） | U-FIX-CF-ACCT-02 の scope |

## エラーハンドリング方針

- 本タスクはアプリ実装ロジックを含まないため try/catch は対象外。
- 検出は **CI run conclusion / `cf.sh` exit code / `grep` patten match** の三段に委ねる。
- 復旧操作中は `set -x` 等の echo を絶対に有効化しない。

## 監視・通知

| 観点 | 経路 | 期間 |
| --- | --- | --- |
| main deploy 結果 | GitHub Actions 通知 + `gh run list --branch main` | Step 6 後 24h |
| Token 値露出 | TC-S06 / TC-N04 を Phase 11 完了直前に必須実行 | 永続 |
| 旧 Token 利用ログ | Cloudflare Dashboard → Audit Logs（Token 単位の使用状況） | Step 6 後 24h |

## 統合テスト連携

- アプリ統合テストは追加しない。
- 異常検出は CI run + Cloudflare Dashboard audit log のみ。

## 完了条件

- [ ] 異常系シナリオが ID 付きで 4 領域すべてに列挙されている
- [ ] 各シナリオに検出経路と復旧手順が紐付いている
- [ ] Token 値露出時の incident 手順（FC-10）が定義されている
- [ ] scope 外シナリオが派生タスク化候補として明示されている

## 成果物

- `outputs/phase-06/main.md`
