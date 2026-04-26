# UT-05 Follow-up 002: CI matrix 拡張（多 OS / 多 Node）

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-05-FU-002 |
| タスク名 | CI matrix 拡張（多 OS / 多 Node） |
| 優先度 | LOW |
| 推奨Wave | Wave 3 以降（必要性が顕在化したら） |
| 作成日 | 2026-04-27 |
| 種別 | improvement |
| 状態 | unassigned |
| 由来 | UT-05 Phase 10 MINOR-I |
| 親タスク | docs/30-workflows/ut-05-cicd-pipeline |

## 目的

現行の `ubuntu-latest` / Node 24 単一実行から、unit-test / build-smoke の matrix を `ubuntu-latest` + `macOS-latest`、Node 20 + Node 24 へ拡張する必要性とコストを判定する。Phase 4 で shard 数 4 は確定済みのため、本 follow-up は「OS 軸」「Node version 軸」の追加に限定する。

## スコープ

### 含む

- macOS / Windows 追加の価値（開発者環境差異検出）とコスト（GHA 分消費・実行時間）の比較
- Node 20 / 24 両対応の必要性判断（`.mise.toml` で Node 24 固定済みである現状との整合）
- 現行 CI の実行時間ベースラインと拡張後の見積もり差分の記録
- private リポ無料枠（月 2,000 分）への影響評価（UT-05-FU-003 と連携）

### 含まない

- shard 数の再設計（Phase 4 で確定済み）
- E2E テストの matrix 拡張（別タスク）
- self-hosted runner 導入（範囲外）
- Node version の本番ランタイム変更（`.mise.toml` 改訂は別タスク）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-05 CI/CD pipeline 実装完了 | 単一 OS / 単一 Node の実行時間ベースラインが必要 |
| 上流 | UT-05-FU-003（GHA 分監視） | コスト影響評価のため使用分の可視化が前提 |
| 関連 | UT-05-FU-001（reusable workflow 化） | matrix と reusable 化は同時設計が望ましい |

## 苦戦箇所・知見

**1. macOS runner はコスト 10 倍**
GitHub Actions の macOS runner は Linux の 10 倍の分単位で消費される（private リポ）。Phase 7 / Phase 10 で month 2,000 分制約（UT-05-FU-003）が記録されているが、macOS を 1 ジョブ追加するだけで実質的な残量が大幅減になる。判定時は「分換算 × 倍率」で計算する必要があり、生分数で比較すると見誤る。

**2. Cloudflare Workers ランタイムは実質単一環境**
本番ランタイムは Cloudflare Workers V8 isolate であり、開発者ローカル OS の差異が本番に直接波及することは少ない。matrix 拡張の主目的は「ローカル開発体験の保証」であって「本番互換性検証」ではない点を判定根拠に含めること。混同するとオーバースペックな matrix を組んでしまう。

**3. Node 20 を追加する判断には依存ライブラリの最低要件確認が必須**
`@opennextjs/cloudflare` や Hono など主要依存の Node サポート範囲を Phase 1 R-7 / R-8 で再確認した上で判定する。`.mise.toml` で Node 24 固定にした経緯（CLAUDE.md 記載済み）を覆すことになるため、固定理由の根拠を上書きする強い動機が必要。

**4. matrix 失敗時の `fail-fast` 挙動の取り扱い**
matrix 拡張時に `fail-fast: true`（デフォルト）のままだと 1 環境失敗で全体が止まる。`ci-gate`（polling 方式・MINOR-G）の判定と組み合わせた際の挙動が変わるため、`fail-fast: false` 採用時のジョブ依存設計を事前定義する必要がある。

**5. 起動条件＝「実害が出てから」**
本 follow-up は「ローカル開発で OS 起因のバグが顕在化した」「Node version 不整合 issue が起票された」など、具体的な実害が出てから着手する。予防的に matrix 拡張すると Phase 10 で否定された YAGNI に該当し、無料枠を圧迫するだけになる。本仕様書を起動する閾値を明記しておく。

## 受入条件

- [ ] macOS / Windows を追加する価値（開発体験向上）とコスト（分単位 × 倍率）を比較した表が作成されている
- [ ] Node 20 / 24 両対応が必要かを依存ライブラリ要件と `.mise.toml` 固定根拠から判断している
- [ ] 現行 CI の実行時間ベースラインと拡張後の見積もり差分が記録されている
- [ ] private リポ無料枠（月 2,000 分）への影響が UT-05-FU-003 の実測値と突合されている
- [ ] `fail-fast` の方針と `ci-gate` への影響が記録されている
- [ ] 起動条件（実害顕在化）を満たすことを示す根拠が記録されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/phase-10.md | MINOR-I 指摘内容 |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/outputs/phase-12/unassigned-task-detection.md | 検出記録 §2.2 |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/phase-04.md | 既存 CI matrix 設計（shard 数確定済み） |
| 関連 | docs/30-workflows/unassigned-task/ut-05-followup-003-actions-minutes-monitor.md | 無料枠監視と統合判定 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | GitHub Actions 設計指針 |
