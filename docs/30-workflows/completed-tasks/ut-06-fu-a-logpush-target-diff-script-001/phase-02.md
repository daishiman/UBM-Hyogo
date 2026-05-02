# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production observability target diff script (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-01 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビューゲート) |
| 状態 | spec_created |
| タスク分類 | implementation / observability-automation |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で確定した「4 軸 observability target の機械化 diff + 完全 redaction」要件を、(1) Worker target inventory 設計、(2) API/CLI 抽出方法設計、(3) redaction logic 設計、(4) script interface 設計、(5) runbook 導線設計、の 5 軸に分解する。Phase 3 のレビューゲートが GO/NO-GO を一意に判定でき、Phase 4 が unit / contract / golden output / redaction test を機械的に書き起こせる粒度にする。

## 実行タスク

1. **Worker target inventory 設計**: 新 Worker `ubm-hyogo-web-production` と旧 Worker 名（rename 前 entity）の両方を比較対象にする inventory データ構造を設計する（完了条件: `outputs/phase-02/target-inventory-design.md` に Worker 名解決ロジックと比較項目テーブルが記載）。
2. **API / CLI 抽出方法設計**: 4 軸 (R1〜R4) ごとに `bash scripts/cf.sh` 経由で取得する API endpoint / parse 対象ファイルを確定する（完了条件: `outputs/phase-02/script-interface-design.md` に取得経路と plan 制限時の fallback が記載）。
3. **redaction logic 設計**: token / sink credential / dataset key / Authorization / OAuth トークン値を検出・置換する正規表現と allowlist 構造を設計する（完了条件: `outputs/phase-02/redaction-design.md` に redaction rule / allowlist / golden output sample が記載）。
4. **script interface 設計**: CLI フラグ / 出力フォーマット / exit code / stderr 方針を確定する（完了条件: usage / 入出力例 / read-only 保証が記載）。
5. **runbook 導線設計**: 親タスク `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` のどのファイルに本 script の実行手順を追記するか確定する（完了条件: 追記先パス / 章立て / 既存 runbook との関係が記載）。
6. **テスト戦略の枠組み**: unit / contract / golden output / redaction の 4 レイヤーに分解し、Phase 4 の入力にする。
7. **影響範囲・依存・セキュリティ整理**: token / OAuth トークンの扱い、出力に値を残さない方針、API plan 差での fallback 方針を明文化する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/phase-01.md` | 真の論点・AC・スコープ・制約 |
| 必須 | `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md` | 起源 spec |
| 必須 | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-02/route-secret-observability-design.md` | 旧 Worker 名特定 |
| 必須 | `apps/web/wrangler.toml` | `[env.production].name` / `[observability]` / `[[analytics_engine_datasets]]` の正本 |
| 必須 | `scripts/cf.sh` | 拡張対象ラッパー |
| 必須 | `CLAUDE.md` `Cloudflare 系 CLI 実行ルール` | wrapper 一本化の根拠 |
| 参考 | Cloudflare API: `/accounts/{id}/logpush/jobs` / `/accounts/{id}/workers/scripts/{script}` | Logpush / Workers metadata 取得 |

## 1. Worker target inventory 設計

### 1.1 目的

新旧 Worker 名を一意に解決し、4 軸 (R1〜R4) の比較対象として固定する。

### 1.2 Worker 名解決ロジック

| 項目 | 取得元 | 設計 |
| --- | --- | --- |
| 新 Worker 名 | `apps/web/wrangler.toml` の `[env.production].name` | toml parse で動的取得（hardcode 回避）。fallback 値 `ubm-hyogo-web-production` |
| 旧 Worker 名 | 親タスク `route-secret-observability-design.md` の記録 | 環境変数 `LEGACY_WORKER_NAME` で injection。未設定時は `ubm-hyogo-web` を default |

### 1.3 inventory データ構造（成果物 `target-inventory-design.md`）

```
{
  "workers": [
    { "name": "ubm-hyogo-web-production", "role": "current", "wrangler_toml": "apps/web/wrangler.toml" },
    { "name": "ubm-hyogo-web", "role": "legacy", "wrangler_toml": null }
  ],
  "axes": ["workers_logs", "tail", "logpush", "analytics_engine"]
}
```

## 2. API / CLI 抽出方法設計

### 2.1 4 軸 × 取得経路 × plan 制限 matrix

| 軸 | 一次取得経路 | plan 制限時 fallback |
| --- | --- | --- |
| R1 Workers Logs | `apps/web/wrangler.toml` の `[observability]` block を parse + `bash scripts/cf.sh` 経由 `GET /accounts/{id}/workers/scripts/{script}` で metadata 確認 | `N/A (dashboard fallback: Workers & Pages → Worker → Logs)` |
| R2 Tail | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production --dry-run` 相当（target Worker 名解決のみ） | `N/A (dashboard fallback: Triggers)` |
| R3 Logpush | `bash scripts/cf.sh` 経由 `GET /accounts/{id}/logpush/jobs` を呼び、`output.filter` で `script_name == <Worker>` を抽出 | `N/A (dashboard fallback: Analytics & Logs → Logpush)` |
| R4 Analytics Engine | `apps/web/wrangler.toml` の `[[analytics_engine_datasets]]` parse + `bash scripts/cf.sh` 経由 dataset 一覧取得（plan 依存） | `N/A (dashboard fallback: Workers & Pages → Worker → Settings → Bindings)` |

### 2.2 API 呼び出し規約

- HTTP method は **GET のみ**（C-4 の read-only 原則）
- すべて `bash scripts/cf.sh` 経由で実行する。`scripts/cf.sh` に `observability-diff` subcommand を追加し、内部で `wrangler` または `curl` を使用する場合も `op run --env-file=.env` 経由でのみ token 注入する
- HTTP error / plan 制限による 4xx は **fail にしない**。当該軸の出力を `N/A (dashboard fallback: ...)` に置換し、exit code 0 を維持
- ネットワーク不通 / 認証失敗 / 設定不在は **fail にする**（exit code 2）

### 2.3 取得不可項目の fallback 方針

```
取得試行 → 成功: 値を redaction layer に渡す
            → 4xx (plan / permission): N/A (dashboard fallback: <UI 経路>) を記録、exit 0 維持
            → 5xx / network error: stderr に redacted error、exit 2
            → 認証失敗: stderr に redacted error、exit 3
```

## 3. redaction logic 設計

### 3.1 出力許可項目（allowlist）

- Worker target 名（`ubm-hyogo-web-production` / 旧 Worker 名）
- dataset 名（Logpush / Analytics の dataset name 文字列）
- host 名（Logpush destination の host 部のみ。例: `s3.amazonaws.com`。bucket / path / query / credential は不可）
- enabled flag (true/false)
- head_sampling_rate（数値）
- job 名（Logpush job の name フィールドのみ）
- filter 概要（`script_name == <Worker>` の事実のみ。値の中身は dataset 名以外不可）

### 3.2 redaction 対象（denylist + 正規表現）

| 種別 | 正規表現（参考） | 置換後 |
| --- | --- | --- |
| Cloudflare API token | `[A-Za-z0-9_-]{40,}` | `<redacted:token>` |
| Bearer / Basic / Authorization 値 | `(?i)(authorization|bearer|basic)\s*[:= ]\s*\S+` | `<redacted:auth-header>` |
| URL の userinfo / query / path（host のみ残す） | `(https?://)([^/?#]+)([/?#].*)?` → host のみ抽出 | `<host>` |
| AWS Access Key / Secret | `AKIA[0-9A-Z]{16}` / `[A-Za-z0-9/+=]{40}` | `<redacted:credential>` |
| Logpush destination_conf 全体 | フィールド単位で除去（key 自体を出力しない） | フィールド削除 |
| Analytics dataset write key | API レスポンスの `key` / `secret` 属性 | フィールド削除 |
| OAuth token (`ya29.*` 等) | `ya29\.[A-Za-z0-9_-]+` | `<redacted:oauth>` |

### 3.3 redaction layer 適用範囲

- **stdout**: 出力前に必ず redaction を通す
- **stderr**: error message も同じ redaction 通過
- **log file**: 生成しない（一時ファイル禁止。on-memory のみ）

### 3.4 golden output sample（成果物 `redaction-design.md`）

redaction 後の出力例を Phase 4 golden test の正本にする:

```
# observability-target-diff
worker: ubm-hyogo-web-production (current)
  R1 workers_logs: enabled=true head_sampling_rate=1.0
  R2 tail:         target=ubm-hyogo-web-production
  R3 logpush:      jobs=[{name=app-prod-logs, dataset=workers_trace_events, host=s3.amazonaws.com, enabled=true}]
  R4 analytics:    bindings=[ubm_metrics] datasets=[ubm_events]
worker: ubm-hyogo-web (legacy)
  R1 workers_logs: N/A (dashboard fallback: Workers & Pages → Worker → Logs)
  R2 tail:         target=ubm-hyogo-web
  R3 logpush:      jobs=[]  # legacy worker に紐付き 0 件
  R4 analytics:    bindings=[]  # legacy worker に紐付き 0 件

diff:
  legacy-only routes: []
  current-only routes: [R1, R3, R4]
  shared targets:     [R2]
```

## 4. script interface 設計

### 4.1 配置先（決定）

- **第一候補**: `scripts/cf.sh` の subcommand として `observability-diff` を追加
- **第二候補**: スタンドアロン `scripts/observability-target-diff.sh`（cf.sh から呼び出し）
- 決定: **第一候補（subcommand）**。Phase 3 で承認を得る

### 4.2 usage（成果物 `script-interface-design.md`）

```
bash scripts/cf.sh observability-diff \
  --config apps/web/wrangler.toml \
  --env production \
  [--legacy-worker-name ubm-hyogo-web] \
  [--format text|json] \
  [--no-color]
```

### 4.3 exit code

| code | 意味 |
| --- | --- |
| 0 | 成功（plan 制限による N/A 含む） |
| 2 | ネットワーク / 5xx / 設定不在 |
| 3 | 認証失敗 |
| 64 | usage error（CLI 引数不正） |

### 4.4 read-only 保証

- HTTP method 一覧を script 冒頭にコメントで列挙し GET のみであることを宣言
- lint で POST / PUT / DELETE / PATCH を含む文字列が script に存在しないことを検査（Phase 4 contract test）

## 5. runbook 導線設計

### 5.1 追記先

- **第一候補**: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-XX/observability-diff-runbook.md` を新規作成
- **第二候補**: 親タスク `route-secret-observability-design.md` への章追記
- 決定: **第一候補（新規 markdown）**。Phase 3 で承認を得る

### 5.2 章立て（追記版）

```
## observability target 機械検証

### 実行コマンド
bash scripts/cf.sh observability-diff --config apps/web/wrangler.toml --env production

### 期待出力
（redacted golden output へリンク）

### 失敗時のトラブルシュート
- exit 2: cf.sh whoami で認証確認
- exit 3: 1Password の API Token 期限確認
- N/A 多数: plan 制限のため dashboard 確認に切り替え
```

## 6. テスト戦略の枠組み（Phase 4 への引き渡し）

| レイヤー | 範囲 | 概要 |
| --- | --- | --- |
| unit | redaction 関数 | token / Authorization / URL credential / OAuth が全て denylist で消えることを 10+ pattern で検証 |
| contract | cf.sh wrapper | `scripts/cf.sh observability-diff --help` が exit 0 / `wrangler` 直叩きが script 内に 0 件 |
| golden output | redaction 後の出力 | `redaction-design.md` の sample を正本に diff |
| redaction 検証（負例） | API token / OAuth token / sink URL credential を含む合成 fixture | 出力に redaction 対象文字列が 1 つも残らない |

## 7. 影響範囲・依存・セキュリティ

| 項目 | 方針 |
| --- | --- |
| `.env` 読み取り | 行わない（op 参照のみ。`scripts/cf.sh` が解決） |
| OAuth トークン保持 | 行わない（`wrangler login` 禁止） |
| token 値の log 残留 | redaction layer で消去。tmp file 生成しない |
| Cloudflare API rate limit | 4 軸の取得を直列実行し、429 時は exponential backoff（最大 3 回）。それでも 429 なら fallback |
| `wrangler` 直叩き混入防止 | Phase 4 contract test で `\bwrangler\s+(?!login)` パターンを script 全体から grep（許容: コメント内の参照のみ） |

## 仕様語 ↔ 実装語対応表

| 仕様語 | 実装語 |
| --- | --- |
| 新 Worker | `apps/web/wrangler.toml` `[env.production].name = "ubm-hyogo-web-production"` |
| 旧 Worker | rename 前 entity（環境変数 `LEGACY_WORKER_NAME` で注入） |
| Workers Logs | `wrangler.toml` `[observability]` + Worker metadata API |
| Tail | `wrangler tail` の target Worker 名解決のみ |
| Logpush | Cloudflare API `/accounts/{id}/logpush/jobs` |
| Analytics Engine | `wrangler.toml` `[[analytics_engine_datasets]]` |
| ラッパー | `scripts/cf.sh` |
| read-only | HTTP GET のみ |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 5 軸（inventory / 抽出 / redaction / interface / runbook 導線）を承認対象にする |
| Phase 4 | redaction 正規表現 / golden output / contract test の入力 |
| Phase 11 | NON_VISUAL evidence（redacted text 出力）の取得経路 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-02/main.md` | 設計の総括 |
| ドキュメント | `outputs/phase-02/target-inventory-design.md` | Worker inventory データ構造 |
| ドキュメント | `outputs/phase-02/redaction-design.md` | redaction rule / allowlist / golden sample |
| ドキュメント | `outputs/phase-02/script-interface-design.md` | usage / exit code / read-only 保証 |

## 完了条件

- [ ] 5 軸（inventory / 抽出 / redaction / interface / runbook 導線）すべての設計が確定
- [ ] 4 軸 (R1〜R4) × 取得経路 × plan 制限 fallback が matrix 化されている
- [ ] redaction 正規表現が token / Authorization / URL credential / OAuth / AWS key を全カバー
- [ ] script interface の exit code 4 種が定義されている
- [ ] HTTP method が GET のみであることが宣言されている
- [ ] runbook 追記先の第一候補 / 第二候補が明示されている
- [ ] 全 Cloudflare 呼び出しが `bash scripts/cf.sh` 経由で実装される設計になっている
- [ ] golden output sample が Phase 4 入力として配置されている

## 多角的チェック観点

- AC カバレッジ: AC-1〜AC-5 が §1〜§5 に対応しているか。
- CLAUDE.md ルール: `wrangler` 直叩きが設計に混入していないか。
- read-only 原則: HTTP method が GET 以外を含む設計になっていないか。
- redaction 完全性: token / OAuth / URL credential / AWS key の denylist が網羅されているか。
- 取得不可耐性: plan 制限で fail せず fallback で exit 0 を維持できる設計か。
- runbook 導線: 親タスク runbook に script 実行手順が追記される章立てが明確か。
- テスト可能性: redaction の golden output が Phase 4 で diff 可能な形で固定されているか。

## 次 Phase への引き渡し

- 次 Phase: 3（設計レビューゲート / user_approval_required: true）
- 引き継ぎ事項:
  - 5 軸設計（inventory / 抽出 / redaction / interface / runbook 導線）
  - script 配置先決定（cf.sh subcommand `observability-diff`）
  - runbook 追記先決定（新規 markdown 作成）
  - HTTP method GET のみの read-only 保証
  - redaction allowlist / denylist の確定
  - Phase 4 への入力: redaction 正規表現一覧 / golden output sample / contract test 観点
- ブロック条件:
  - `wrangler` 直叩きが設計に混入
  - mutation 系 HTTP method を含む設計
  - redaction allowlist に token / credential が混入
  - runbook 追記先が UT-06-FU-A 配下以外
