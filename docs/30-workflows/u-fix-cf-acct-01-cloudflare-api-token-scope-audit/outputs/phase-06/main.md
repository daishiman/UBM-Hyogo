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
| 上流 | outputs/phase-04/main.md, outputs/phase-05/main.md |
| 下流 | outputs/phase-07/main.md, outputs/phase-11/main.md |

## 1. 目的

Token 最小化の運用において、**権限の過不足 / Token 値露出 / 適用タイミング競合**を早期検出し、Token 値を成果物に残さない形で復旧できるようにする。本 Phase はランブック実行中に発生する fail path を 4 領域 + scope 外で網羅し、検出経路と復旧手順を Phase 5（実装ランブック）と Phase 4（テスト戦略）にバインドする。

## 2. 異常系シナリオ一覧

### 2.1 権限不足（過小付与）

| ID | 想定異常 | 検出経路 | 期待挙動 / 復旧 |
| --- | --- | --- | --- |
| FC-01 | D1:Edit が欠落 | TC-N01 / TC-R03 で `code: 10000` または `code: 7003` | Step 7 rollback → Token を Dashboard で編集して `D1:Edit` 追加 → 再検証 |
| FC-02 | Workers Scripts:Edit が欠落 | TC-N02 / TC-R04 で `Authentication error` | 同上、`Workers Scripts:Edit` を追加 |
| FC-03 | Cloudflare Pages:Edit が欠落 | TC-N03 / TC-R05 で Pages project list 失敗 | `Cloudflare Pages:Edit` を追加。`Workers Scripts:Edit` は Pages を内包しないため両方必要 |
| FC-04 | Account Settings:Read 欠落 | `cf.sh whoami` が空 / `account not found` | `Account Settings:Read` を追加 |
| FC-05 | Workers KV Storage:Edit が条件付きで必要 | `cf.sh kv namespace list` が fail、または KV binding を持つ Worker の deploy で fail | Phase 11 evidence に実測根拠を記録した上で `Workers KV Storage:Edit` を昇格付与 |
| FC-06 | User Details:Read が条件付きで必要 | wrangler-action 初期化段階で `Could not retrieve user` | Phase 11 evidence に根拠記録の上で `User Details:Read` を昇格付与 |

### 2.2 権限過剰（過大付与）

| ID | 想定異常 | 検出経路 | 期待挙動 / 復旧 |
| --- | --- | --- | --- |
| FC-07 | "Edit Cloudflare Workers" テンプレート流用で Queues / R2 / Stream 等が含まれる | Cloudflare Dashboard → API Tokens → 該当 Token 詳細で permissions 行数が正本 4 種を超える | Phase 11 evidence の権限行数で過剰を検知 → Token 編集で削除。条件付き 2 種は実測根拠がある場合だけ許可 |
| FC-08 | Account Resources が `All accounts` になっている | Token 詳細の Resources 欄目視 | `Specific account - <UBM-Hyogo>` に絞り直す |
| FC-09 | Zone Resources が誤って `All zones` を含む | 同上 | UBM-Hyogo は CI で Zone を扱わないため Zone resources を空に |

### 2.3 Token 値露出

| ID | 想定異常 | 検出経路 | 期待挙動 / 復旧 |
| --- | --- | --- | --- |
| FC-10 | 成果物 / commit に Token 値が混入 | TC-S06 / TC-N04 の `grep -E '[A-Za-z0-9_-]{40,}'` でヒット | **即時 incident 対応**: ① 該当 Token を Cloudflare Dashboard で **Roll**（即時失効＋再発行） → ② GitHub Secret 値を新値に更新（stdin 経由） → ③ git history に残った場合は `git filter-repo` 等で履歴除去 → ④ Phase 11 evidence に incident log を追記（Token 値そのものは記録しない） |
| FC-11 | CI ログに Token 値が含まれる | `gh run view <id> --log` 出力を `grep -E '[A-Za-z0-9_-]{40,}'` | wrangler-action はマスクするが、`set -x` 由来の echo がある場合は workflow から除去 → Token を Roll |
| FC-12 | 1Password 一時 vault に Token 値が残ったまま | 24h 後の vault 監査 | 一時項目を delete |
| FC-13 | `gh secret set --body "<value>"` 経由で値がプロセスリストに露出 | レビュー時点で `--body` 引数が grep ヒット | Phase 5 §6 のとおり stdin 経路へ修正（`pbpaste \| gh secret set ...`）→ Token を Roll |

### 2.4 適用タイミング競合

| ID | 想定異常 | 検出経路 | 期待挙動 / 復旧 |
| --- | --- | --- | --- |
| FC-14 | staging 検証中（T2）に main へ deploy が走る | `gh run list --branch main` で同時刻に run | production 側はまだ旧 Token のため影響なし。staging 検証完了後に Step 6（T4）へ進む |
| FC-15 | production Secret 差し替え直後（T4）に走った run が旧 Token をキャッシュして fail | TC-P03 で `code: 10000` | rollback Step 7（1Password 正本から復元 or 再発行）→ 原因調査 → 再差し替え |
| FC-16 | 旧 Token 失効（T5）を 24h 待たずに実施し、観測中の run が fail | run conclusion failure | Cloudflare 側の旧 Token は再表示不可。新 Token で `gh run rerun <id>` 再実行のみが復旧経路 |

### 2.5 scope 外（派生タスク候補）

| ID | 想定異常 | 対応 |
| --- | --- | --- |
| FC-17 | wrangler-action v4 で OIDC ネイティブ対応が拡張される | Phase 12 `unassigned-task-detection.md` で Option D（OIDC 移行）として起票候補 |
| FC-18 | scope 別 Token（D1 専用 / Workers 専用）への分割要請 | Option C を将来 ADR 化、別タスクで扱う |
| FC-19 | wrangler.toml runtime warning（vars 継承 / pages_build_output_dir） | U-FIX-CF-ACCT-02 の scope（本タスク対象外） |

## 3. エラーハンドリング方針（stderr 露出回避）

- 本タスクはアプリ実装ロジックを含まないため try/catch は対象外。
- 検出は **CI run conclusion / `cf.sh` exit code / `grep` パターンマッチ** の三段に委ねる。
- 復旧操作中は **`set -x` を絶対に有効化しない**（コマンドラインに含まれる Token 値が stderr に echo される事故を防止）。
- 値を扱う一時シェルでは `set +x; set +v` を冒頭で明示。
- `gh secret set` は常に stdin 経由（`--body` 禁止）。
- ログ出力を `tee` する場合は `grep -vE '[A-Za-z0-9_-]{40,}'` を間に挟むか、そもそも `tee` しない。

## 4. 監視・通知

| 観点 | 経路 | 期間 |
| --- | --- | --- |
| main deploy 結果 | GitHub Actions 通知 + `gh run list --branch main` | Step 6（T4）後 24h |
| Token 値露出 | TC-S06 / TC-N04 を Phase 11 完了直前に必須実行 | 永続 |
| 旧 Token 利用ログ | Cloudflare Dashboard → Audit Logs（Token 単位の使用状況） | Step 6（T4）後 24h |

## 5. 統合テスト連携

- アプリ統合テストは追加しない。
- 異常検出は CI run + Cloudflare Dashboard audit log + grep gate のみ。

## 6. AC マッピング（Phase 6 内 完結分）

| AC | 本 Phase での貢献 |
| --- | --- |
| AC-1 | FC-07〜FC-09（過剰権限の検出と削除手順） |
| AC-2 | FC-01〜FC-06（不足判定と昇格条件） |
| AC-7 | FC-15 / FC-16（rollback タイミング） |
| AC-8 | FC-10〜FC-13（Token 値露出 incident） |
| AC-9 | scope 外 FC-19 で U-FIX-CF-ACCT-02 と境界明示 |

## 7. 完了条件

- [ ] 異常系シナリオが ID 付きで 4 領域すべてに列挙されている
- [ ] 各シナリオに検出経路と復旧手順が紐付いている
- [ ] Token 値露出時の incident 手順（FC-10）が定義されている
- [ ] stderr 露出回避方針（`set -x` 禁止・stdin 経路強制）が明記されている
- [ ] scope 外シナリオが派生タスク化候補として明示されている

## 8. 成果物

- 本ファイル: `outputs/phase-06/main.md`
