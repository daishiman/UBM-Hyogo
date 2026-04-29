# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging (UT-21) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 8 (DRY 化 / リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | blocked |
| タスク分類 | specification-design（QA） |

## 目的

Phase 8 で確定した命名・パス・型・エンドポイントを前提に、無料枠余裕度（Cloudflare Workers / D1 / Google Sheets API）・secret hygiene（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SYNC_ADMIN_TOKEN` / `SYNC_ADMIN_TOKEN`）・coverage 閾値・CI ゲート・5 点同期チェックリスト（LOGS / SKILL / topic-map / artifacts / index）の 5 観点で品質保証チェックを行い、Phase 10 GO/NO-GO 判定の客観的根拠を揃える。a11y は対象外（バックエンド sync API のみ・UI 持たず）と明記する。

## 実行タスク

1. 無料枠見積もり（Workers / D1 / Sheets × dev/prod）を別ファイル `outputs/phase-09/free-tier-estimation.md` に詳細化（完了条件: 3 サービス × 2 環境すべての試算）。
2. coverage 閾値（line 80%+ / branch 70%+）を Phase 7 allowlist に対して確定（完了条件: vitest config draft 確定）。
3. secret hygiene チェックリスト（4 Secret + 1Password Employee vault + Cloudflare Secrets + rotation 手順）を作成（完了条件: 全項目 PASS 想定）。
4. CI ゲート（typecheck / lint / vitest / verify-indexes-up-to-date）を確認（完了条件: 各 gate のパス条件が記述）。
5. **5 点同期チェックリスト**（LOGS.md / SKILL.md / topic-map / artifacts.json / index.md）を作成（完了条件: 5 件すべてに同期方法が記述）。
6. line budget / link 検証 / a11y N/A 判定を行う（完了条件: 各判定が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-08.md | DRY 化済み命名・path |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-07.md | coverage allowlist |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md | Secrets 一覧 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secret hygiene 規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cron / wrangler / 無料枠 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | sync_audit_logs / sync_locks の writes 試算ベース |
| 参考 | https://developers.cloudflare.com/workers/platform/limits/ | Workers 無料枠 |
| 参考 | https://developers.cloudflare.com/d1/platform/limits/ | D1 無料枠 |
| 参考 | https://developers.google.com/sheets/api/limits | Sheets API quota |
| 参考 | .github/workflows/verify-indexes.yml | indexes drift gate |

## 無料枠見積もり（サマリー）

詳細は `outputs/phase-09/free-tier-estimation.md`。本仕様書には主要数値のみ。

### Cloudflare Workers（production 環境）

| 項目 | 値 | 備考 |
| --- | --- | --- |
| Cron 間隔 | 1h（dev: 6h に分離が要件、production は 1h を想定。Phase 11 で再計測） | `0 * * * *` |
| 1 日 scheduled 起動 | 24 req/day | |
| 1 日 manual 起動（運用想定） | 5 req/day 程度 | admin オペ |
| 月間 | 約 870 req/month | |
| 無料枠 | 100,000 req/day | |
| 余裕度 | 0.029% | 極めて余裕 |

### Cloudflare D1（production 環境）

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 1 sync あたり upsert | 100 records 想定 | batch=100 で 1 batch |
| 1 sync あたり audit/lock 書き込み | 1 (sync_audit_logs) + 2 (sync_locks acquire/release) = 3 writes | audit best-effort 失敗時は outbox に+1 |
| 1 日 writes | 24 sync × (100 + 3) = 2,472 writes/day | |
| 月間 writes | 約 74,160 writes/month | |
| 無料枠 | 50,000 writes/**day** (公式: 100K/day, 月間 5M ※プラン要再確認) | |
| 余裕度 | 4.9% / day（0.05%/月）| 余裕 |
| **dev 環境リスク** | dev で 1h × 100 records × 30 日 = 同等の writes。テスト fixture を 10 records に絞る or Cron 6h で分離 | Phase 5 で「dev は records を絞る + Cron 分離」両採用 |

### Google Sheets API（production 環境）

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 1 sync あたり request | 1 (values.get、5,000 行までは A1 range 1 発で取得可能) | RS256 JWT 取得は 1h 以内キャッシュ可能 |
| 1 日 request | 24 req | |
| 月間 | 約 720 req | |
| 無料枠 | 300 req/min/project | per-minute 制約 |
| 余裕度 | 1 req/min ピーク → 0.3% | 十分 |

## coverage 閾値

| 指標 | 閾値 | 対象 |
| --- | --- | --- |
| line | 80%+ | Phase 7 allowlist 8 ファイル |
| branch | 70%+ | 同上 |
| function | 80%+（推奨） | 同上 |
| statement | 80%+（推奨） | 同上 |

> 閾値未達は Phase 9 で test 追記して green 化。allowlist 外への計測拡張は禁止。

## secret hygiene チェックリスト

| # | 項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | `GOOGLE_SHEETS_SA_JSON` が Secret 経由のみ | `apps/api/src/sync/sheets-client.ts` で `env.GOOGLE_SHEETS_SA_JSON` のみ参照、grep でハードコード 0 | コード / .env / git に平文 0 |
| 2 | `SHEETS_SPREADSHEET_ID` が Variable または Secret | `wrangler.toml` の vars または `bash scripts/cf.sh wrangler secret list` | 環境ごとに登録 |
| 3 | `SYNC_ADMIN_TOKEN` が Secret | `bash scripts/cf.sh wrangler secret list --env production` | 登録済み |
| 4 | `SYNC_ADMIN_TOKEN` が Secret | 同上 | 登録済み |
| 5 | 1Password Employee vault に 4 Secret 登録 | `op item get ubm-hyogo-env --vault Employee` で目視（実値は表示しない） | 4 件すべて存在 |
| 6 | SA 名 `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com` でシート権限付与 | Google Sheets 共有設定 | 閲覧権限あり |
| 7 | rotation 手順が runbook 化 | Phase 5 / Phase 12 implementation-guide.md | rotation 手順 4 ステップ記述 |
| 8 | `.env` に op:// 参照のみ、実値なし | 目視（`cat` 禁止のため git diff レビュー） | op:// のみ |
| 9 | `~/Library/Preferences/.wrangler/config/default.toml` 不在 | CLAUDE.md 禁止事項 | 不在 |

### rotation 手順（runbook 抜粋）

```
1. 1Password Employee vault で新 SA 鍵 / SYNC_ADMIN_TOKEN を生成・更新
2. Cloudflare に登録: bash scripts/cf.sh wrangler secret put <NAME> --config apps/api/wrangler.toml --env production
3. 旧 secret の失効確認: 旧 token で /admin/sync を叩き 401/403 が返ること
4. sync_audit_logs に rotation イベント記録（手動 INSERT）
```

## CI ゲート

| Gate | 確認方法 | パス条件 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | exit 0、`exactOptionalPropertyTypes=true` 違反なし |
| lint | `mise exec -- pnpm lint` | exit 0 |
| vitest | `mise exec -- pnpm --filter ./apps/api vitest run --coverage apps/api/test/sync` | exit 0、coverage line 80%+ / branch 70%+ |
| verify-indexes | `.github/workflows/verify-indexes.yml` で `.claude/skills/aiworkflow-requirements/indexes` drift 検出 | drift 0、必要時 `mise exec -- pnpm indexes:rebuild` |
| build | `mise exec -- pnpm build`（apps/api） | Workers bundle size < 1MB |

## 5 点同期チェックリスト

| # | 同期対象 | 同期方法 | 確認 |
| --- | --- | --- | --- |
| 1 | **LOGS.md**（タスク進捗ログ） | `docs/30-workflows/ut-21-.../LOGS.md` を Phase 完了ごとに追記 | 全 Phase の状態が同一日付で更新 |
| 2 | **SKILL.md**（aiworkflow-requirements skill 参照） | `.claude/skills/aiworkflow-requirements/SKILL.md` の更新が必要なら Phase 12 で実施 | 本タスクは N/A（既存 skill 参照のみで更新不要） |
| 3 | **topic-map**（`.claude/skills/aiworkflow-requirements/topic-map.md`） | sync 関連 topic（auth / sheets-client / audit）を追加するなら Phase 12 で更新 | 本タスクは N/A（既存 topic 利用のみ） |
| 4 | **artifacts.json** | 各 Phase 完了時に `phases[N].status` / `outputs` 更新 | Phase 番号と outputs path が完全一致 |
| 5 | **index.md** | Phase 一覧の状態列を artifacts.json と同期 | 表中の状態と artifacts.json `phases[*].status` が一致 |

> SKILL.md / topic-map は本タスクで更新不要（参照のみ）。Phase 12 で documentation-changelog.md に N/A 判定を明記する。

## a11y 対象外の明記

- 本タスクは Cloudflare Workers の sync API（`/admin/sync` `/admin/sync/responses` `/admin/sync/audit`）と scheduled handler のみで構成され、UI を持たない。
- ゆえに WCAG 2.1 / a11y 観点は本タスクで **対象外**。
- admin UI 側の a11y は別 UT（admin dashboard 系）で扱う。

## line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | ≤ 250 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-13.md | 各 100-300 行 | 100-300 行 | 全 PASS（Phase 6/8/12 は上限近くを許容） |
| outputs/phase-XX/*.md | main.md は 200-400 行 | 個別 | 個別チェック |

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | `Phase 一覧` × 実ファイル | 完全一致 |
| phase-XX.md 内の `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/*.md` | 実在 |
| 03-serial 参照 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/{sync-flow,data-contract}.md` | 実在 |
| 原典 unassigned-task | `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` | 実在 |
| GitHub Issue | `https://github.com/daishiman/UBM-Hyogo/issues/30` | 200 OK |

## 実行手順

1. free-tier-estimation.md 作成（3 サービス × 2 環境）。
2. coverage 閾値を vitest config draft に確定。
3. secret hygiene 9 項目を outputs/phase-09/main.md に記述。
4. CI ゲート 5 件のパス条件を記述。
5. 5 点同期チェックリストを記述（SKILL.md / topic-map は N/A 判定）。
6. line budget / link 検証 / a11y N/A を記述。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 無料枠余裕度・secret hygiene・5 点同期結果を GO/NO-GO の根拠 |
| Phase 11 | 手動 smoke 時の secret 確認手順として再利用 |
| Phase 12 | implementation-guide.md / documentation-changelog.md に rotation・5 点同期結果を転記 |
| UT-08 | monitoring 設計に sync_audit_logs / outbox ボリューム見積もりを引き渡し |

## 多角的チェック観点

- 価値性: 無料枠を超えない範囲で admin オペレーションの監査性を担保。
- 実現性: dev 環境 D1 writes 試算で対策（fixture 10 records or Cron 6h）が立っているか。
- 整合性: 不変条件 #1/#4/#5 と Phase 8 DRY 化結果の維持。03-serial 用語完全一致。
- 運用性: rotation 手順が `scripts/cf.sh` ラッパ経由で記述、誰でも実行可能。
- 認可境界: 4 Secret すべて Cloudflare Secrets / 1Password Employee vault で管理。
- 無料枠: Workers / D1 / Sheets で年間試算余裕。
- 監査性: audit best-effort + outbox の writes が試算に含まれる。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | free-tier-estimation.md 作成 | blocked |
| 2 | coverage 閾値確定 | blocked |
| 3 | secret hygiene 9 項目 | blocked |
| 4 | CI ゲート 5 件 | blocked |
| 5 | 5 点同期チェックリスト | blocked |
| 6 | line budget / link / a11y | blocked |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（5 観点 + 5 点同期） |
| ドキュメント | outputs/phase-09/free-tier-estimation.md | 3 サービス × 2 環境の詳細試算 |
| メタ | artifacts.json | Phase 9 状態更新 |

## 完了条件

- [ ] free-tier-estimation.md に 3 サービス × 2 環境の試算
- [ ] coverage 閾値（line 80%+ / branch 70%+）が allowlist に対して確定
- [ ] secret hygiene 9 項目すべて PASS
- [ ] CI ゲート 5 件のパス条件記述
- [ ] 5 点同期チェックリストが LOGS / SKILL / topic-map / artifacts / index で記述
- [ ] line budget が全 phase で 100-300 行範囲内
- [ ] link 検証でリンク切れ 0
- [ ] a11y 対象外と明記
- [ ] dev 環境の D1 writes 対策が確定

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `blocked`
- 成果物 2 ファイルが `outputs/phase-09/` 配下に配置予定
- 無料枠余裕度が定量化
- secret hygiene 9 項目チェック済み
- 5 点同期チェックリスト 5 件記述
- a11y 対象外明記
- artifacts.json の `phases[8].status` が `blocked`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - 無料枠余裕度（Workers 0.029% / D1 4.9%/day / Sheets 0.3%）
  - dev 環境 writes 対策の確定方針
  - secret hygiene PASS 結果
  - 5 点同期チェックリスト結果（SKILL/topic-map は N/A）
  - line budget / link 整合 / a11y 対象外
  - CI ゲート（特に verify-indexes / vitest coverage）の状態
- ブロック条件:
  - dev 環境 D1 writes 試算が無料枠を超え対策なし
  - secret hygiene 9 項目に NG
  - 5 点同期に drift
  - link 切れ残存
