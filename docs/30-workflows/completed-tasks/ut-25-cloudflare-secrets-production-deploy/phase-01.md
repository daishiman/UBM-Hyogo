# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）(ut-25-cloudflare-secrets-production-deploy) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | 1（HIGH） |
| 実行種別 | serial |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| タスク種別 | implementation / visualEvidence: NON_VISUAL / scope: cloudflare_secrets_deployment |
| 親 Issue | #40（CLOSED, 仕様書化のため再利用） |

## 目的

UT-03 で実装済みの `apps/api/src/jobs/sheets-fetcher.ts` が要求する Cloudflare Workers 環境変数 `GOOGLE_SERVICE_ACCOUNT_JSON` を staging / production の両環境に安全配置するための要件を確定する。1Password に保管済みの SA JSON key を、シェル履歴汚染と JSON `private_key` 改行破壊を回避した経路で `wrangler secret put`（`bash scripts/cf.sh` ラッパー経由）に投入する手順を仕様化し、配置完了確認・rollback 経路・UT-26 引き渡しまでを 1 本の workflow として固定する。本 Phase は要件確定に閉じ、実投入は Phase 13 ユーザー承認後に別オペレーションで実施する。

## 真の論点 (true issue)

- 「secret を入れるか否か」ではなく、**「(a) シェル履歴 / プロセス引数 / 1Password から実値を漏らさず stdin に流す経路、(b) JSON `private_key` の `\n` 改行を破壊しない投入手段、(c) staging-first 順序で本番事故を防ぐオペレーション順序、(d) 配置後値が読み取り不可な前提で機能確認を UT-26 に委譲する境界、(e) wrangler 直接実行禁止ルールの遵守」**を同時に満たす仕様化。
- 副次的論点として、(1) `apps/api/.dev.vars` のローカル取扱と `.gitignore` 除外の確認、(2) rollback 経路（delete + 旧 key 再投入）の事前文書化、(3) UT-03 runbook への配置完了反映ルートの定義。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流（必須） | UT-03（sheets-auth.ts 実装） | secret 名 `GOOGLE_SERVICE_ACCOUNT_JSON` 確定 / 参照側コード存在 | Phase 2 設計の入力 |
| 上流（必須） | 01c-parallel-google-workspace-bootstrap | SA JSON key を 1Password に保管済み | adapter / 投入経路の入力素材 |
| 上流（必須） | 01b-parallel-cloudflare-base-bootstrap | apps/api Workers staging / production 環境作成済み | `--env staging/production` 切替の前提 |
| 関連 | scripts/cf.sh | `wrangler` ラッパー（op 注入 + esbuild 解決 + mise exec） | 全ての wrangler コマンドはこの経路のみ |
| 下流 | UT-26（Sheets API E2E 疎通） | 配置済み secret の機能確認 | 本タスク完了後に着手 |
| 下流 | UT-09（Sheets→D1 同期） | secret 配置済み Workers | 本タスク完了後に着手 |

## 価値とコスト

- 価値: UT-03 で実装した Sheets API 認証経路を実環境で動作可能状態に遷移させ、UT-26 / UT-09 の下流タスクを unblock する。これがなければ apps/api は Sheets API に署名できず、フォーム回答の取り込みパイプラインが本番で機能しない。
- コスト: 仕様書整備 + Phase 13 で 2 環境 × 1 secret の `wrangler secret put` 実行のみ。実装コストは小だが、シェル履歴 leak / `private_key` 改行破壊 / staging スキップ / wrangler 直接呼び出しのいずれかを誤ると secret 漏洩 or 422 / 認証失敗の事故に直結する。
- 機会コスト: GitHub Actions 経由の自動投入（OIDC + Cloudflare API トークン）も検討可能だが、MVP 段階では手動配置（1 回限り + ローテーション時のみ再実行）で十分。将来 secret rotation 自動化フェーズで再評価。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-26 / UT-09 を unblock し、Sheets API 認証経路の実体化により本番フォーム取り込みパイプラインが機能する |
| 実現性 | PASS | `bash scripts/cf.sh` ラッパー + `op read` + stdin パイプは既存技術範囲。`apps/api/wrangler.toml` の env 宣言も完了済み |
| 整合性 | PASS | 不変条件 #5 を侵害しない（D1 不関与、apps/api 配下のみ）。CLAUDE.md の「wrangler 直接禁止」「平文 .env 禁止」「op 経由注入」と整合 |
| 運用性 | PASS | 配置後 `wrangler secret list` で名前確認 / rollback は delete + 再 put / ローテーション時も同経路で再実行可能 |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| secret 名 | Cloudflare Workers Secret | `GOOGLE_SERVICE_ACCOUNT_JSON`（UT-03 で確定済み・全環境共通） |
| 環境名 | wrangler `--env` | `staging` / `production`（apps/api/wrangler.toml の env 宣言と一致） |
| ラッパー経路 | scripts/cf.sh | `bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env <env>` |
| ローカル変数ファイル | `apps/api/.dev.vars` | `.gitignore` 除外必須・実値書き込み or op 参照 |
| evidence 命名 | `outputs/phase-13/secret-list-evidence-{staging,production}.txt` | `wrangler secret list` 出力（name のみ）を環境別に分離 |
| runbook 命名 | `outputs/phase-13/deploy-runbook.md` / `outputs/phase-13/rollback-runbook.md` | 配置と巻き戻しを別ファイル |
| コミットメッセージ | Phase 13 承認後 | `chore(secrets): deploy GOOGLE_SERVICE_ACCOUNT_JSON to staging/production [UT-25]` |

## 実行タスク

1. 親タスク仕様（`docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md`）の上流 / 下流 / 配置先 / 完了条件 / 苦戦箇所を本ワークフロー Phase 1〜13 に分解する（完了条件: AC-1〜AC-11 が `index.md` と一致）。
2. タスク種別を `implementation` / `visualEvidence: NON_VISUAL` / `scope: cloudflare_secrets_deployment` で固定する（完了条件: `artifacts.json.metadata` と一致）。
3. 苦戦箇所 1〜5（インタラクティブ入力 / `--env` 切替 / `private_key` 改行 / 値読み取り不可 / `.dev.vars` gitignore）を Phase 2 / 3 / 11 の受け皿に割り当てる。
4. 4 条件評価を全 PASS で確定する。
5. スコープ「本ワークフローはタスク仕様書整備に閉じ、実 `wrangler secret put` は Phase 13 ユーザー承認後の別オペレーション」を §スコープに固定する。
6. CLAUDE.md ルール（wrangler 直接禁止 / scripts/cf.sh ラッパー / 平文 .env 禁止 / op 経由注入）が要件として AC に反映されていることを確認する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | 親タスク仕様 |
| 必須 | apps/api/src/jobs/sheets-fetcher.ts | secret 参照側コード（UT-03） |
| 必須 | apps/api/wrangler.toml | `--env` 宣言 |
| 必須 | scripts/cf.sh | wrangler ラッパー |
| 必須 | CLAUDE.md（Cloudflare 系 CLI 実行ルール / シークレット管理） | wrangler 直接禁止・op 経由注入 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1 テンプレ |
| 参考 | https://developers.cloudflare.com/workers/wrangler/commands/#secret | wrangler secret コマンドリファレンス |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書整備
- Phase outputs 骨格作成
- staging-first 順序の固定
- `bash scripts/cf.sh` ラッパー経路の固定（wrangler 直接禁止）
- JSON `private_key` 改行を保全する stdin 投入経路の仕様化
- シェル履歴汚染防止策（`HISTFILE=/dev/null` / `op read` 直接 stdin）
- ローカル `apps/api/.dev.vars` 設定 + `.gitignore` 除外確認
- rollback 経路（delete + 再 put）の文書化
- UT-03 runbook への配置完了反映ルート定義

### 含まない

- 実 `wrangler secret put` 投入（Phase 13 後の別オペレーション）
- Sheets API 機能疎通（UT-26）
- Sheets→D1 同期実装（UT-09）
- SA JSON key 発行・ローテーション（01c で完了済み）
- Workers 環境作成（01b で完了済み）
- GitHub Actions 経由の自動投入（将来評価）
- 平文 `.env` への実値書き込み（CLAUDE.md ルール禁止）

## 実行手順

### ステップ 1: 親タスク仕様の写経

- `UT-25-cloudflare-secrets-sa-json-deploy.md` の上流 / 下流 / 配置先 / 完了条件 / 苦戦箇所を本仕様書構造へ分解。

### ステップ 2: 真の論点と境界の固定

- 5 リスク（履歴汚染 / 改行破壊 / 順序事故 / 値読取不能前提 / wrangler 直接呼び出し）を同時封じる仕様化。

### ステップ 3: 4 条件評価のロック

- 4 条件すべて PASS 確定。MAJOR があれば Phase 2 へ進めない。

### ステップ 4: タスク種別 / scope / visualEvidence の固定

- `implementation` / `NON_VISUAL` / `cloudflare_secrets_deployment` を固定。

### ステップ 5: 苦戦箇所 1〜5 の対応 Phase 割り当て

- §1 履歴汚染 → Phase 2 投入経路設計（`set +o history` / `op read` 直接 stdin）
- §2 `--env` 切替 → Phase 2 staging-first 順序設計
- §3 `private_key` 改行 → Phase 2 stdin パイプ設計
- §4 値読取不能 → Phase 2 / 11 で `wrangler secret list` を name 確認専用とし、機能確認は UT-26 に委譲
- §5 `.dev.vars` gitignore → Phase 2 ファイル戦略 + Phase 11 smoke test

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点 / 投入経路 / 順序 / rollback 経路 / .dev.vars 取扱を設計入力に渡す |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-11 をテスト戦略のトレース対象に渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-11 を使用 |
| Phase 11 | staging 投入確認 / `wrangler secret list` name 確認の smoke 基準として AC-2 / AC-5 を渡す |
| Phase 13 | 実 `wrangler secret put` を user_approval_required: true で実行する根拠として AC-2〜AC-7 を渡す |

## 多角的チェック観点（AIが判断）

- 不変条件 #5: D1 を触らない。apps/api 配下のみ。違反なし。
- CLAUDE.md ルール: wrangler 直接呼び出し禁止が AC に反映されているか。
- secret leak: シェル履歴 / プロセス引数 / log / payload に値が転記されない経路になっているか。
- 改行保全: `private_key` の `\n` を破壊しない stdin 経路になっているか。
- 順序事故: staging 先行 / production 後行が固定されているか。
- 値読取不能前提: 機能確認を `wrangler secret list`（name 確認）と UT-26 疎通テストに分離しているか。
- rollback: delete + 再 put 経路が事前文書化されているか。
- ローカル: `.dev.vars` gitignore が確認手順として組み込まれているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 親タスク仕様の写経と AC-1〜AC-11 確定 | 1 | completed | index.md と一致 |
| 2 | タスク種別 / scope / visualEvidence の固定 | 1 | completed | artifacts.json と一致 |
| 3 | 4 条件評価 PASS 確定 | 1 | completed | 全件 PASS |
| 4 | 苦戦箇所 1〜5 の対応 Phase 割り当て | 1 | completed | 5 件すべて受け皿あり |
| 5 | スコープ「Phase 13 ユーザー承認後投入」固定 | 1 | completed | 含む / 含まない明記 |

## 苦戦箇所サマリ（親仕様 §苦戦箇所写経）

| # | 苦戦箇所 | 受け皿 |
| --- | --- | --- |
| 1 | `wrangler secret put` インタラクティブ入力 / シェル履歴汚染 | Phase 2 投入経路設計（`HISTFILE=/dev/null` / `op read` 直接 stdin） |
| 2 | staging / production の `--env` 切替 | Phase 2 staging-first 順序設計 |
| 3 | JSON `private_key` の `\n` 改行保全 | Phase 2 stdin パイプ設計（`cat` or `op read` パイプ） |
| 4 | 配置後値読み取り不可 | Phase 2 / 11 で `wrangler secret list` name 確認 + UT-26 疎通テストへ機能確認委譲 |
| 5 | `apps/api/.dev.vars` gitignore 確認 | Phase 2 ファイル戦略 + Phase 11 smoke test |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（背景 / 課題 / AC / 4 条件評価 / スコープ / 苦戦箇所） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件

- [x] 真の論点が「(a)〜(e) 5 リスクを同時に塞ぐ仕様化」に再定義されている
- [x] 4 条件評価が全 PASS で確定している
- [x] タスク種別 `implementation` / `visualEvidence: NON_VISUAL` / `scope: cloudflare_secrets_deployment` が固定されている
- [x] スコープ「本ワークフローはタスク仕様書整備に閉じ、実投入は Phase 13 ユーザー承認後の別オペレーション」が明記されている
- [x] AC-1〜AC-11 が `index.md` と完全一致している
- [x] 苦戦箇所 1〜5 が全件受け皿 Phase に割り当てられている
- [x] 不変条件 #5 を侵害しない範囲で要件が定義されている
- [x] CLAUDE.md の wrangler 直接禁止 / op 注入ルールが AC に反映されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `completed`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 1〜5 が全件 AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 5 リスク同時封じ
  - 投入経路は `bash scripts/cf.sh secret put ... --env <env>` + `op read` stdin パイプ
  - staging-first → production 順序固定
  - rollback = delete + 再 put（旧 key を 1Password から再取得）
  - `apps/api/.dev.vars` gitignore 確認
  - 値読取不能前提 = 機能確認は UT-26 に委譲
  - 4 条件評価 全 PASS の根拠
- ブロック条件:
  - 親タスク仕様の存在が確認できない
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-11 が index.md と乖離
  - 苦戦箇所 1〜5 のいずれかに受け皿 Phase が無い
