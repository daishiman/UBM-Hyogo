# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-runtime-foundation |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-23 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |

## 目的

モノレポとランタイム基盤 における Phase 11 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/web / apps/api |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | dependency rule |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-core.md | Node / pnpm / Next.js |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-frontend.md | Next.js / Tailwind |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-backend.md | Workers / D1 / backend stack |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-11/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 11 | completed | upstream を読む |
| 2 | 成果物更新 | 11 | completed | outputs/phase-11/main.md |
| 3 | 4条件確認 | 11 | completed | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | Phase 11 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] 主成果物が作成済み
- [ ] 正本仕様参照が残っている
- [ ] downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: モノレポとランタイム基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## code_and_docs smoke checklist

この task は `code_and_docs` のため、docs 整合性に加えて `apps/web` の home 画面スクリーンショットを取得する。Phase 11 の証跡は `outputs/phase-11/manual-smoke-log.md`、`outputs/phase-11/manual-test-result.md`、`outputs/phase-11/link-checklist.md`、`outputs/phase-11/screenshots/RF-01-runtime-foundation-home-after.png` とする。

- README から各 task index へ遷移できることを確認する。
- 各 task index から 13 phase へ遷移できることを確認する。
- branch / env / data ownership / secret placement を説明して矛盾が出ないことを確認する。
- `version-policy.md` に Node 24.x / pnpm 10.x / Next.js 16.x / React 19.2.x / TS 6.x が記録されていることを確認する。
- `runtime-topology.md` に apps/web（@opennextjs/cloudflare）/ apps/api（Hono Workers）の分離構成が明記されていることを確認する。
- @cloudflare/next-on-pages 廃止の理由が phase-02 設定値表または phase-03 代替案に記録されていることを確認する。
- Auth.js v5 の環境変数プレフィックス（AUTH_*）が phase-02 環境変数一覧に記録されていることを確認する。
- pnpm 9 EOL（2026-04-30）への対処が既存資産インベントリに記録されていることを確認する。
- 正本仕様との差分が Phase 12 Step 2 domain sync に引き継がれていることを確認する。
- `apps/web` home が runtime foundation 情報を表示することをスクリーンショットで確認する。
- `apps/web/wrangler.toml` が OpenNext Workers 形式であることを確認する。
- TC-01: `apps/web` runtime foundation home の初期表示を確認する。

## スクリーンショット/ログ一覧
| 種別 | パス | 説明 |
| --- | --- | --- |
| review log | outputs/phase-11/manual-smoke-log.md | 手動確認ログ |
| test result | outputs/phase-11/manual-test-result.md | validator 用手動テスト結果 |
| evidence | outputs/phase-11/link-checklist.md | 主要リンク確認 |
| screenshot | outputs/phase-11/screenshots/RF-01-runtime-foundation-home-after.png | runtime foundation home |
| screenshot | outputs/phase-11/screenshots/TC-01-runtime-foundation-home-after.png | validator 用 alias |

## 画面カバレッジマトリクス

| TC-ID | 対象画面 | 証跡 | 判定 |
| --- | --- | --- | --- |
| TC-01 | `apps/web` runtime foundation home | `outputs/phase-11/screenshots/TC-01-runtime-foundation-home-after.png` | PASS |

## 失敗時の戻り先 (逆引き表)
| 問題 | 戻り先 |
| --- | --- |
| branch / env drift | Phase 2 / 8 |
| source-of-truth drift | Phase 2 / 3 |
| output path drift | Phase 5 / 8 |

## 依存Phase成果物参照

- 参照対象: Phase 1 / Phase 2 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10
