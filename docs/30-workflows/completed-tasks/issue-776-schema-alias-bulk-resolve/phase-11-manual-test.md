# Phase 11: Manual Test / Evidence

## メタ情報
- workflow: issue-776-schema-alias-bulk-resolve

## 目的
PR 前は local dev または branch preview で bulk resolve 動線を検証し、screenshot を取得する。Cloudflare Workers + auth + D1 staging の実機検証は PR 後の runtime gate として再取得する。

## 前提

- PR 前: local dev server または branch preview が起動済
- PR 後 runtime gate: staging 環境にデプロイ済（dev branch merge 後）
- admin アカウント `manjumoto.daishi@senpai-lab.com` でログイン
- staging D1 に `unresolved` / `changed` diff が存在（fixture を `bash scripts/cf.sh d1` で投入、または既存 staging diff を流用）

## 手動シナリオ

### S1: 正常系 5 件一括 resolve

1. `/admin/schema` へアクセス
2. `Bulk Resolve` トグルを ON
3. `unresolved` カテゴリの 5 行を checkbox 選択
4. 選択件数バッジに `5 件選択中（unresolved 5 / changed 0）` が表示されることを確認
5. `Bulk Resolve` 確定ボタン押下
6. modal で各行に推奨値を auto-fill（[全行に推奨を適用]）
7. `Confirm` 押下 → 5 行すべて success badge → modal 自動クローズ → panel が refetch
8. 該当 5 行が `unresolved` から消えていることを確認

### S2: partial failure 3 件中 1 件 409

1. 同 diff の片方の `questionId` に対し既に alias が登録されている状態を staging で作る
2. 3 行選択 → 一括 submit
3. modal に 2 success + 1 error (alias_conflict) が表示され、失敗行のみ残ることを確認
4. 失敗行の stableKey を別値に修正 → 再 submit → 全件成功 → modal close

### S2b: retryable continuation 3 件中 1 件 202

1. 3 行選択 → 一括 submit
2. 1 行だけ `202 backfill_cpu_budget_exhausted` を返す状態を mock / branch preview fixture で作る
3. modal に 2 success + 1 retryable が表示され、retryable 行だけが再開可能状態として残ることを確認

### S3: a11y（VoiceOver / NVDA）

1. modal open 時に focus がリストの先頭 stableKey input に移動することを確認
2. Tab で modal 外にフォーカスが抜けないことを確認
3. submit progress / error が読み上げられることを確認

### S4: mobile 375 width

1. iPhone SE viewport（375×667）で同シナリオ S1 を実行
2. checkbox / select-all / modal が overflow なく表示されることを確認

### S5: 性能 (NFR-5)

1. 30 行一括選択 → submit
2. DevTools Network tab で全件完了までの時間を計測
3. 30 秒以内に完了することを確認、所要時間をログ

## 取得 evidence

`outputs/phase-11/` 配下に以下 PNG を配置:

- `bulk-select-desktop-1280.png`
- `bulk-modal-desktop-1280.png`
- `bulk-partial-failure-desktop-1280.png`
- `bulk-success-desktop-1280.png`
- `bulk-select-mobile-375.png`
- `bulk-modal-mobile-375.png`

加えて以下のテキストログ:

- `outputs/phase-11/perf-30rows.md`: 30 行 submit 所要時間 / 各 row HTTP latency / 結果
- `outputs/phase-11/a11y-manual-check.md`: VoiceOver/NVDA 手動チェック結果

## 完了条件
- [ ] S1〜S5 全件 PASS
- [ ] 上記 evidence 6 PNG + 2 md が `outputs/phase-11/` に配置
- [ ] NFR-5（30 秒以内）が満たされている
