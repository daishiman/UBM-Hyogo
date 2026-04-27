# Phase 1: 要件定義成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | Cloudflare KV セッションキャッシュ設定 (UT-13) |
| 種別 | spec_created / docs-only / NON_VISUAL |
| 作成日 | 2026-04-27 |
| Phase | 1 / 13 |
| 状態 | completed |

## 真の論点

- 認証で利用するセッション情報を「KV に置く」か「JWT のみで完結し KV はブラックリストに限定する」か。Cloudflare KV の無料枠 write 1,000/日 制約を踏まえると、セッションごと書き込みは数百ユーザー規模で枯渇する。本タスクでは後者（JWT 主・KV はブラックリスト + 設定キャッシュ + レートリミット）を前提に設計する。
- KV の最終的一貫性（書き込み伝搬最大 60 秒）を許容できる用途（読み取り中心の設定キャッシュ・期限付きセッションブラックリスト）と、許容できない用途（ログアウト即時反映・権限変更即時反映）の境界を要件段階で確定する。
- production / staging の KV namespace ID 取り違えを防ぐ運用ルール（命名規約・1Password 管理・wrangler.toml の env 分離）を本仕様に含める。
- 認証実装タスクが起動するまでに、本タスクは AC-1〜AC-3（KV 作成手順・wrangler.toml バインディング設計・read/write 動作確認手順）と AC-4〜AC-7（TTL 方針・無料枠運用・対応表・最終的一貫性指針）を全て前倒しで仕様化する。

## 4条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 認証機能実装タスクの設計手戻りを実際に防げるか | PASS | KV 命名規約・バインディング名（`SESSION_KV`）・TTL 方針・最終的一貫性指針を本仕様で先行確定し、下流タスクは「KV はある前提」で設計可能 |
| 実現性 | 無料枠内で KV をセッション用途に活用できる設計が成立するか | PASS | JWT 主・KV をブラックリスト/設定キャッシュ/レートリミットに限定する設計で write 1,000/日に収まる |
| 整合性 | production / staging の KV ID 取り違えを防ぐ命名・バインディング規約が定義できるか | PASS | `ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging` 命名規約 + `wrangler.toml` の `[env.production]` / `[env.staging]` 分離 + 1Password 管理 |
| 運用性 | 無料枠枯渇時のフォールバック（KV 不使用に退避）と最終的一貫性の運用指針が明確か | PASS | 異常系 Phase 6 で failure cases と mitigation 手順を文書化、Phase 9 で運用方針を明文化する計画 |

## 受入条件 (AC)

- AC-1: KV Namespace の production / staging 作成手順と命名規約が確定済み（`ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging`）
- AC-2: `wrangler.toml` の `[env.production]` / `[env.staging]` に追加する KV バインディング設計が確定済み（バインディング名 `SESSION_KV`）
- AC-3: Workers から KV への読み書き動作確認手順が確定済み（最小キー/バリュー setup test）
- AC-4: TTL 設定方針がドキュメント化済み（用途別: セッション / 設定キャッシュ / レートリミット）
- AC-5: 無料枠（100k read/day, 1k write/day, 1 GB storage）内での運用方針が明文化済み
- AC-6: Namespace 名・バインディング名・KV ID 管理方針が下流タスク（認証実装）向けにドキュメント化済み（実 ID は本仕様書に記載しない）
- AC-7: 最終的一貫性制約と「即時反映が必要な操作で KV を使わない」設計指針が明記済み

## スコープ

### 含む

- KV Namespace 作成手順（production / staging 分離）
- `wrangler.toml` への KV バインディング設定追加（`[env.production]` / `[env.staging]`）
- TTL 設定方針の定義（用途別: セッション / 設定キャッシュ / レートリミット）
- KV 使用用途の明確化（セッション補助 / 設定キャッシュ / レートリミットカウンタ）
- 無料枠内での運用方針（書き込み 1,000/日 上限を超えない設計指針）
- 最終的一貫性（最大 60 秒）制約の明文化と「即時反映が必要な操作で KV を使わない」設計指針

### 含まない

- セッション管理ロジックの実装（→ 認証機能実装タスク）
- KV を使ったキャッシュ戦略の実装（→ アプリケーション層）
- Durable Objects を使ったリアルタイム状態管理（→ 別途検討）
- KV データの暗号化方式設計（→ 認証機能実装タスク）

## 既存資産インベントリ

| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| `apps/api/wrangler.toml` | 既存バインディング (D1: `DB`, R2: `STORAGE`) | 既存。KV バインディング `SESSION_KV` の追記が必要 |
| `apps/web/wrangler.toml` | KV バインディングの有無 | web からは KV を直接利用しない（不変条件「D1 アクセスは apps/api に閉じる」と同方針） |
| 既存 KV namespace | 既に作成済みの KV namespace の有無 | 未作成（01b runbook で言及なし）。本タスク Phase 5 の手順で初回作成 |
| wrangler CLI バージョン | KV namespace 作成・バインディングに必要 | 4.85.0 以上を要件とする |
| Cloudflare アカウント権限 | KV 作成権限の有無 | 01b 完了済み前提（要 Phase 4 verify suite で `wrangler whoami` 確認） |

## 正本仕様参照表

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | KV 基本手順・wrangler 操作・KV binding 設定例 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | タスク概要・AC・依存関係の正本 |
| 必須 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/cloudflare-bootstrap-runbook.md | 上流タスクの runbook（KV 章を追記する基準） |
| 必須 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-02/cloudflare-topology.md | Cloudflare リソーストポロジ |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 依存関係・責務境界

| 種別 | 対象 | 内容 |
| --- | --- | --- |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウント・Workers 設定確定が前提 |
| 上流 | 認証機能実装タスク（将来） | セッション要件確定で KV 設計を最終化（双方向） |
| 下流 | 認証機能実装タスク | KV バインディング名 `SESSION_KV` が確定後に実装可能 |
| 責務外 | セッション管理ロジック実装 | 認証機能実装タスクの責務 |
| 責務外 | キャッシュ戦略実装 | アプリケーション層の責務 |
| 責務外 | Durable Objects によるリアルタイム状態管理 | 別途検討 |

## 価値とコスト

- 初回価値: 認証機能実装タスクが「KV はある前提」で安心して設計に着手できる
- 初回価値: 無料枠制約と最終的一貫性制約を先に明文化することで、後段の設計事故を防ぐ
- 初回で払わないコスト: セッション管理ロジック実装・キャッシュ戦略実装・暗号化方式設計
- インフラコスト: Cloudflare KV 無料枠内（100k read/day, 1k write/day, 1 GB storage）

## 次 Phase への引き継ぎ事項

- AC-1〜AC-7 を Phase 2 設計の入力として渡す
- 既存資産インベントリ（`apps/api/wrangler.toml` 既存バインディング `DB`, `STORAGE`）を Phase 2 の DRY 化方針検討材料に渡す
- 4条件評価結果（全 PASS）を Phase 3 設計レビューの根拠として渡す
- 真の論点（JWT 主 + KV はブラックリスト/設定キャッシュ/レートリミット限定）を採用方針として Phase 2 に申し送る

## ブロック条件

- 本 Phase の主成果物（本ファイル）が未作成なら次 Phase に進まない → 本ファイル作成済み、Phase 2 に進行可
