# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production observability target diff script (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-01 |
| Wave | 2-plus |
| 実行種別 | serial（親 UT-06-FU-A-PROD-ROUTE-SECRET-001 完了後の observability 自動化フォローアップ） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | implementation / observability-automation（read-only diff script の追加） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 規模 | small |
| GitHub Issue | #329 |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 (`docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`) |
| 起源 spec | `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md` |

## 目的

親タスク UT-06-FU-A-PROD-ROUTE-SECRET-001 で「`bash scripts/cf.sh tail` の手順整備」と「Logpush / Analytics の dashboard 確認手順」までを runbook 化したが、`ubm-hyogo-web-production`（新 Worker）と旧 Worker 名の両方を **機械的に diff 可能な形式で一覧化する read-only script** が不足している。

本タスクは、Workers Logs / Tail / Logpush / Analytics Engine の 4 軸 observability target を `bash scripts/cf.sh` ラッパー経由で取得・redaction・出力する script を `scripts/` 配下に追加することで、**production deploy 後の障害観測漏れを機械検知できる状態** を作る。

## 真の論点 (true issue)

- 「observability の dashboard 確認手順を runbook に書くこと」ではなく、「**4 軸 (Workers Logs / Tail / Logpush / Analytics Engine) すべてについて、新 Worker と旧 Worker のどちらに observability target が紐付いているかを script 1 本で diff 可能にし、token / sink credential / dataset key を一切出力に残さないこと**」が本質である。
- 副次的論点として、Cloudflare API の plan 制限（無料プランで取得できない項目）に対し、取得不可項目を **dashboard fallback として明示** する設計境界を引くこと。
- 本タスクは **read-only diff** に閉じる。Logpush job の作成・削除、Analytics dataset の操作、observability 設定の mutation は一切行わない。旧 Worker の削除導線にも接続しない。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 成果物は CLI script + golden output (text) + runbook 追記。UI スクリーンショット対象なし |
| 成果物の物理形態 | shell script または ts CLI（`scripts/observability-target-diff.sh` または `scripts/cf-observability-diff.ts` ※ Phase 2 で確定）+ markdown |
| 検証方法 | unit test（redaction logic 単体） / contract test（cf.sh wrapper 経由実行） / golden output diff（redaction 後の安定出力比較） |

artifacts.json の `metadata.visualEvidence` を `NON_VISUAL` で確定する。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-06-FU-A-PROD-ROUTE-SECRET-001 (`completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`) | Worker 名分離（`ubm-hyogo-web-production` 確定）/ 4 軸 observability の手動確認 runbook が存在 | 機械化 diff script からの導線 |
| 上流 | `completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-02/route-secret-observability-design.md` | 旧 Worker 名（rename 前 entity）の特定情報 | script 内の比較対象 Worker 名一覧 |
| 上流 | CLAUDE.md `Cloudflare 系 CLI 実行ルール` | `bash scripts/cf.sh` ラッパー一本化方針 | 全 Cloudflare API 呼び出しを ラッパー経由で実装 |
| 上流 | `scripts/cf.sh` | 既存ラッパー（op + esbuild + mise 解決） | 本 script から呼び出す唯一のエントリポイント |
| 並列 | UT-06-FU-A-OPEN-NEXT-CONFIG-REGRESSION-TESTS | `wrangler.toml` drift 検出方針 | observability target との整合確認の前提 |
| 下流 | UT-06 production deploy 後の運用 | 本 script の出力（redacted diff） | 障害観測漏れの早期検出 |
| 下流 | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` runbook | 親タスク runbook | script への導線追記 |

## 要件

### 4 軸 × 取得方法 × redaction 方針 マトリクス

| # | 観測経路 | 取得方法（Phase 2 で確定） | 取得項目（出力許可） | redaction 対象（出力禁止） |
| --- | --- | --- | --- | --- |
| R1 | Workers Logs（observability binding / `[observability]` block） | `wrangler.toml` parse + `bash scripts/cf.sh` 経由 API 呼び出し | enabled flag / head_sampling_rate / target Worker 名 | dataset credential / API token |
| R2 | Tail（リアルタイムログ） | `bash scripts/cf.sh tail --dry-run` 相当 or Worker 名から tail target を逆引き | tail 可能性（true/false）/ target Worker 名 | 実 tail 出力 / Authorization / Cookie |
| R3 | Logpush | `bash scripts/cf.sh` 経由 Cloudflare API (`/accounts/{id}/logpush/jobs`) | job 名 / dataset name / target Worker 名 / enabled flag / filter 概要 | destination_conf URL / sink credential / API token / 認証ヘッダ |
| R4 | Analytics Engine | `bash scripts/cf.sh` 経由 Cloudflare API or `wrangler.toml` の `[[analytics_engine_datasets]]` parse | dataset binding 名 / dataset name / target Worker 名 | dataset write key / query key |

### 受入基準（AC）

- **AC-1**: 追加した script が新 Worker `ubm-hyogo-web-production` と旧 Worker 名（rename 前 entity・親タスク `phase-02/route-secret-observability-design.md` で特定済み）の両方について observability target を一覧化する。両方の inventory が出力に含まれ、どちらか一方しか取得しない実装は不可。
- **AC-2**: token / secret / sink credential / dataset write key / Authorization ヘッダ / OAuth トークン値が **一切出力されない**。redaction 検証用の golden output に「token-like 文字列を含む API レスポンス」を投入しても、出力は host / dataset name / worker target name のみとなることが unit test で確認できる。
- **AC-3**: Workers Logs / Tail / Logpush / Analytics Engine の **4 軸を網羅**する。いずれか 1 軸でも未対応の実装は AC-3 NG。取得不可項目（plan 制約等）は出力上「N/A (dashboard fallback)」と明示する。
- **AC-4**: 親タスクの runbook (`docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` 配下) からの **導線が追加** される。runbook に「observability target diff の機械検証は `bash scripts/cf.sh observability-diff` を実行する」相当の節が追記される。
- **AC-5**: 全実行が `bash scripts/cf.sh` ラッパー経由でのみ可能となる。直接 `wrangler` 呼び出し / 直接 `curl` での Cloudflare API 呼び出し / `wrangler login` のローカル OAuth 利用は実装に含まれない。CI / lint で wrangler 直叩きを検出した場合は fail する。

## 実行タスク

1. 4 軸 (R1〜R4) × 取得方法 × redaction 方針マトリクスを固定する。
2. read-only / mutation 禁止の境界を確定する。
3. 親タスク runbook への導線を AC-4 として要件化する。
4. taskType = implementation, visualEvidence = NON_VISUAL を確定する。
5. AC-1〜AC-5 を Phase 2 設計入力として固定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 起源 | `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md` | scope / AC / risk |
| 親 | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-01.md` | 4 領域 R1〜R4 マトリクス |
| 親 | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-02/route-secret-observability-design.md` | 旧 Worker 名特定 |
| 親 | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-11/tail-sample.md` | tail sample template |
| 運用 | `CLAUDE.md` `Cloudflare 系 CLI 実行ルール` | wrapper 一本化 |
| 既存 | `scripts/cf.sh` | 拡張対象ラッパー |
| 正本 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | デプロイ規約 |

## 成果物 / 実行手順

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-01/main.md` | 要件 baseline / 4 軸 R1〜R4 マトリクス / AC-1〜AC-5 / 4 条件 check |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 4 軸 R1〜R4 × 取得方法 × redaction を設計入力にする |
| Phase 4 | unit / contract / golden output / redaction 検証ケースの根拠 |
| Phase 11 | NON_VISUAL evidence の範囲（redacted text 出力）を引き渡す |

## スコープ

### 含むもの

- Workers Logs / Tail / Logpush / Analytics Engine の 4 軸 observability target を取得・列挙する read-only script
- 新 Worker (`ubm-hyogo-web-production`) と旧 Worker 名の両方を比較対象にした diff 出力
- token / sink credential / dataset key / Authorization / OAuth トークン値の redaction logic
- `bash scripts/cf.sh` ラッパーへの subcommand 追加またはスタンドアロン script の `scripts/` 配下追加
- 親タスク runbook (`docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`) からの導線追記
- redaction の golden output を伴う unit / contract test

### 含まないもの

- Logpush job の作成 / 削除 / 変更（mutation）
- Analytics Engine dataset の作成 / 削除 / 変更
- external log sink の credential 発行 / ローテーション
- production deploy の実行
- 旧 Worker の物理削除 / route 移譲の実行
- staging 環境の同等 diff（本タスクは production diff に閉じる）
- dashboard UI の自動操作（API 取得不可項目は dashboard fallback として明示するに留める）

## 制約

| # | 制約 | 出典 | 順守方法 |
| --- | --- | --- | --- |
| C-1 | `wrangler` 直接実行禁止 | CLAUDE.md `Cloudflare 系 CLI 実行ルール` | script 内のすべての Cloudflare 呼び出しは `bash scripts/cf.sh` 経由で実装 |
| C-2 | `.env` 実値・OAuth トークンを出力に残さない | CLAUDE.md「禁止事項」 | redaction logic で token-like 文字列を検出し置換。golden output で検証 |
| C-3 | `wrangler login` のローカル OAuth 保持禁止 | CLAUDE.md `Cloudflare 系 CLI 実行ルール` | `op run --env-file=.env` 経由の API Token 注入のみ。script 内に `wrangler login` を呼ばない |
| C-4 | observability 設定の mutation 禁止 | 起源 spec §スコープ | script は read-only。HTTP method は GET のみ |
| C-5 | 旧 Worker の削除導線に接続しない | 親タスク phase-01 C-5 | 出力に「削除推奨」等の文言を含めない。diff の事実列挙のみ |
| C-6 | sink URL / dataset credential を出力しない | 起源 spec リスク表 | host / dataset name / worker target name のみ許可。`destination_conf` 全文は出力禁止 |
| C-7 | API plan 差で取得不可項目がある場合は dashboard fallback として明示 | 起源 spec リスク表 | エラー時は exit code 0 で「N/A (dashboard fallback: <経路>)」を出力 |

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Logpush / Analytics API の plan 差により取得できない項目がある | Phase 2 で取得可能性を matrix 化し、取得不可項目は `N/A (dashboard fallback)` として出力。エラーで abort しない |
| log sink URL や credential を出力してしまう | host / dataset / worker target 以外は redact し、token-like 正規表現で検出。golden output で固定化 |
| tail 実行を「実 PASS」と誤記する | script は target diff に閉じる。tail 実 sample 取得は親タスク Phase 11 の deploy 後 evidence に分離 |
| 旧 Worker を誤って削除する流れに接続される | 本 script は read-only diff のみ。出力に削除示唆文言を含めない |
| `wrangler` 直叩きが script に混入する | lint で `\bwrangler\b` パターンを検出。CI で fail させる |
| API token を script log / stderr に出してしまう | redaction logic を stdout / stderr の両方に適用。test で stderr 検証も実施 |
| golden output が API レスポンス変動で頻繁に壊れる | golden は redaction 結果（host / dataset / worker name）のみで構成。API raw response は保持しない |

## 完了条件チェックリスト

- [ ] artifacts.json の `metadata.visualEvidence` が `NON_VISUAL` で確定している
- [ ] artifacts.json の `metadata.taskType` が `implementation` で確定している
- [ ] 真の論点が「4 軸 observability target の機械化 diff + 完全 redaction」に再定義されている
- [ ] 依存境界表に上流 4 / 並列 1 / 下流 2 がすべて前提と出力付きで記述されている
- [ ] 4 軸 (R1〜R4) × 取得方法 × redaction 方針のマトリクスが完成している
- [ ] AC-1〜AC-5 が起源 spec / 親タスク AC と整合している
- [ ] スコープ（含む / 含まない）が起源 spec と一致している
- [ ] 制約（C-1〜C-7）に CLAUDE.md `Cloudflare 系 CLI 実行ルール` が反映されている
- [ ] リスク表に起源 spec の 4 リスク + 追加 3 リスクが含まれている
- [ ] 不変条件 #5（D1 直接アクセスは apps/api に閉じる）に違反していない
- [ ] read-only / mutation 禁止が C-4 で明示されている

## 多角的チェック観点

- 不変条件 #5: 本 script は observability API のみ呼び出し、D1 への直接アクセスを `apps/web` から開く要求はしない。
- CLAUDE.md ルール: 全 Cloudflare 呼び出しが `bash scripts/cf.sh` 経由か。`wrangler` 直叩きが設計に混入していないか。
- AI 学習混入防止: token / sink credential / dataset key を出力 / log / docs に残さない原則が反映されているか。
- read-only 原則: mutation 系 HTTP method (POST / PUT / DELETE / PATCH) を使う設計を要求していないか。
- スコープ境界: production deploy 実行 / 旧 Worker 削除 / staging diff を **含まない** 旨が明示されているか。
- 取得不可耐性: API plan 制限で取得できない項目を fail にせず dashboard fallback として明示する設計か。

## 次 Phase への引き継ぎ事項

- 真の論点 = 4 軸 observability target の機械化 diff + 完全 redaction
- 4 軸 R1〜R4 × 取得方法 × redaction マトリクスを Phase 2 設計入力とする
- script 配置候補 = `scripts/observability-target-diff.sh` または `scripts/cf-observability-diff.ts`（Phase 2 で確定）
- 全 Cloudflare 呼び出しは `bash scripts/cf.sh` 経由で実装する
- read-only に閉じ、mutation / 削除導線 / staging diff は **設計対象外**（境界として明記）
- ブロック条件:
  - taskType が `implementation` 以外で誤記載
  - visualEvidence が NON_VISUAL 以外で誤確定
  - AC-1〜AC-5 が起源 spec と乖離
  - `wrangler` 直叩きが script 設計に混入
  - sink credential / token を出力する設計
