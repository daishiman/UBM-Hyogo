# Phase 11: 手動 smoke test — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 状態 | completed |
| 作成日 | 2026-04-26 |

## Smoke Test 種別

- Task type: `code_and_docs`
- Visual evidence: `VISUAL_STUB`（runtime foundation home をスクリーンショット取得）
- Primary evidence source: document path, artifact map, source-of-truth sync checks, local web UI screenshot

## Evidence Set

- `outputs/phase-11/manual-smoke-log.md`（手動確認ログ）
- `outputs/phase-11/manual-test-result.md`（validator 用手動テスト結果）
- `outputs/phase-11/link-checklist.md`（主要リンク確認）
- `outputs/phase-11/screenshots/RF-01-runtime-foundation-home-after.png`（Next.js runtime foundation home）
- `outputs/phase-11/screenshots/TC-01-runtime-foundation-home-after.png`（validator 用 alias）

## Smoke Checklist 確認結果

| チェック項目 | 結果 | 備考 |
| --- | --- | --- |
| index.md から各 task index へ遷移できる | PASS | phase-01.md〜phase-13.md の全リンクが存在 |
| 各 task index から 13 phase へ遷移できる | PASS | index.md の Phase 一覧に全 phase が記載 |
| branch / env / data ownership / secret placement を説明して矛盾がない | PASS | feature→dev→main, D1→apps/api, AUTH_*→Cloudflare Secrets の一貫性確認 |
| version-policy.md に Node 24.x / pnpm 10.x / Next.js 16.x / React 19.2.x / TS 6.x が記録されている | PASS | outputs/phase-02/version-policy.md に記録済み |
| runtime-topology.md に apps/web（@opennextjs/cloudflare）/ apps/api（Hono Workers）の分離構成が明記されている | PASS | outputs/phase-02/runtime-topology.md に記録済み |
| @cloudflare/next-on-pages 廃止の理由が phase-02 または phase-03 に記録されている | PASS | phase-03/main.md の代替案セクションに記録済み |
| Auth.js v5 の環境変数プレフィックス（AUTH_*）が phase-02 環境変数一覧に記録されている | PASS | phase-02/main.md の環境変数設計に記録済み |
| pnpm 9 EOL（2026-04-30）への対処が既存資産インベントリに記録されている | PASS | phase-01/main.md に記録済み |
| 正本仕様との差分が Phase 12 Step 2 domain sync に引き継がれている | PASS | B-01（TS 6.x）・B-02（@opennextjs/cloudflare 明示）が Phase 10/12 に明記 |
| `apps/web` の home 画面が runtime foundation 情報を表示する | PASS | `RF-01-runtime-foundation-home-after.png` で Web runtime / API runtime / version policy を確認 |
| `apps/web/wrangler.toml` が OpenNext Workers 形式である | PASS | `main = ".open-next/worker.js"` と `[assets] directory = ".open-next/assets"` を確認 |

## 失敗時の戻り先（逆引き表）

| 問題 | 戻り先 |
| --- | --- |
| branch / env drift | Phase 2 / 8 |
| source-of-truth drift | Phase 2 / 3 |
| output path drift | Phase 5 / 8 |
| secret placement ミス | Phase 2 / 6 |
| @cloudflare/next-on-pages 残存 | Phase 3 / 8 |

## 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 全成果物の整合性を手動確認し、Phase 12 への引き継ぎを保証 |
| 実現性 | PASS | docs 確認、typecheck、home screenshot で完結 |
| 整合性 | PASS | 全チェック項目が PASS |
| 運用性 | PASS | Phase 12 へ明確な handoff |

## Phase 11 → Phase 12 handoff

| 引き継ぎ事項 | 内容 |
| --- | --- |
| smoke test 結果 | 全チェック項目 PASS |
| Phase 12 必須作業 | B-01（TS 6.x 同期）・B-02（@opennextjs/cloudflare 明示）を Step 2 domain sync で実施。実装済みファイルと未タスクを current facts へ再同期 |
| 必須 6 成果物 | implementation-guide.md, system-spec-update-summary.md, documentation-changelog.md, unassigned-task-detection.md, skill-feedback-report.md, phase12-task-spec-compliance-check.md |

## 完了条件チェック

- [x] 主成果物が作成済み（manual-smoke-log.md, manual-test-result.md, link-checklist.md, screenshots/RF-01-runtime-foundation-home-after.png, screenshots/TC-01-runtime-foundation-home-after.png）
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
