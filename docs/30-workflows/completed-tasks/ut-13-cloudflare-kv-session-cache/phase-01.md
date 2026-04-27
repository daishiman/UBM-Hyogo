# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare KV セッションキャッシュ設定 (UT-13) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-27 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

Cloudflare KV セッションキャッシュ設定タスクの必要性・スコープ・受入条件を確定し、
下流 Phase（特に Phase 2 設計と Phase 5 セットアップ実行）の手戻りを防ぐ。
KV の最終的一貫性制約・無料枠書き込み制限という強い物理制約があるため、
要件段階で「何を KV に置き、何を置かないか」を明確化する。

## 実行タスク

- KV を使う必要性・代替手段との比較を行う真の論点を特定する
- スコープ・依存境界を確定する（特に認証機能実装タスクとの責務切り分け）
- 受入条件 (AC-1〜AC-7) を正式定義する
- 4条件評価を行い、実施可否を判断する
- 既存資産インベントリ（既存 wrangler.toml・既存 KV namespace の有無）を洗い出す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | KV 基本手順・wrangler 操作 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | タスク概要・AC |
| 必須 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/cloudflare-bootstrap-runbook.md | 上流 runbook |
| 必須 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-02/cloudflare-topology.md | Cloudflare リソーストポロジ |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 実行手順

### ステップ 1: input と前提の確認

- index.md・上流タスク（01b-parallel-cloudflare-base-bootstrap）を読む
- 認証機能実装タスクで KV に期待される責務（セッション保管 / ブラックリスト / 設定キャッシュ）を整理する
- Cloudflare KV の最終的一貫性・無料枠制約を deployment-cloudflare.md で確認する

### ステップ 2: Phase 成果物の作成

- 本 Phase の成果物として受入条件・スコープ・4条件評価・既存資産インベントリを確定する
- downstream Phase から参照されるパス（wrangler.toml の対象ファイル、runbook 章）を具体化する

### ステップ 3: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を評価する
- 次 Phase に渡す blocker と open question を記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 本 Phase の AC・スコープを設計の入力として使用 |
| Phase 5 | AC-1 / AC-2（KV 作成・バインディング設定）の実施根拠 |
| Phase 6 | AC-7（最終的一貫性）と AC-5（無料枠）の異常系設計の根拠 |
| Phase 9 | AC-5（無料枠遵守）・secret hygiene 検証の根拠 |

## 多角的チェック観点（AIが判断）

- 価値性: 認証機能実装タスクが「KV はある前提」で設計を進められる効果が実体化するか
- 実現性: 無料枠内（書き込み 1,000/日）で KV をセッション用に活用できる設計が成立するか
- 整合性: production / staging の KV ID 取り違えが起きない命名・バインディング規約が定義できるか
- 運用性: 無料枠枯渇時のフォールバック方針（KV 不使用に退避）が明記できるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点・依存境界の確定 | 1 | completed | 認証実装タスクとの責務切り分けを明確化 |
| 2 | 4条件評価 | 1 | completed | 価値性 / 実現性 / 整合性 / 運用性 |
| 3 | AC 正式定義 | 1 | completed | index.md の AC-1〜AC-7 を Phase に反映 |
| 4 | 既存資産インベントリ | 1 | completed | wrangler.toml・既存 KV namespace の現状確認 |
| 5 | 正本仕様参照表の確認 | 1 | completed | deployment-cloudflare.md・01b runbook 確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 真の論点・依存境界が確定している
- 4条件評価が全て TBD でない
- AC が正式定義されている（AC-1〜AC-7）
- 既存資産インベントリが作成されている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（最終的一貫性・無料枠枯渇・ID 取り違え）も論点として確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: AC・スコープ・4条件評価の結果・既存資産インベントリを設計の入力として渡す
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない

## 真の論点

- セッション保管に KV を使うべきか、JWT のみで完結させ KV はブラックリスト用途に絞るべきか
  （無料枠の書き込み 1,000/日 制限を考えると後者が現実的）
- KV の最終的一貫性（最大 60 秒）を許容できる用途と許容できない用途を本タスクで線引きする必要がある
- production / staging の KV namespace ID 取り違えを防ぐ運用ルールをどこまで本仕様で規定するか
- 認証機能実装タスクが起動するまでに、本タスクをどこまで進めておくか
  （AC-1〜AC-3 までは前倒し可能、AC-4〜AC-7 は認証要件確定後）

## 依存関係・責務境界

| 種別 | 対象 | 内容 |
| --- | --- | --- |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウント・Workers 設定確定が前提 |
| 上流 | 認証機能実装タスク（将来） | セッション要件確定で KV 設計を最終化 |
| 下流 | 認証機能実装タスク | KV バインディング名が確定後に実装可能 |
| 責務外 | セッション管理ロジック実装 | 認証機能実装タスクの責務 |
| 責務外 | キャッシュ戦略実装 | アプリケーション層の責務 |
| 責務外 | Durable Objects によるリアルタイム状態管理 | 別途検討 |

## 価値とコスト

- 初回価値: 認証機能実装タスクが「KV はある前提」で安心して設計を始められる
- 初回価値: 無料枠制約と最終的一貫性制約を先に明文化することで、後段の設計事故を防ぐ
- 初回で払わないコスト: セッション管理ロジック実装・キャッシュ戦略実装・暗号化方式設計
- コスト: Cloudflare ダッシュボードまたは wrangler CLI での KV namespace 作成（無料）

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 認証機能実装タスクの設計手戻りを実際に防げるか | PASS |
| 実現性 | 無料枠内で KV をセッション用途に活用できる設計が成立するか | PASS |
| 整合性 | production / staging の KV ID 取り違えを防ぐ命名・バインディング規約が定義できるか | PASS |
| 運用性 | 無料枠枯渇時のフォールバック（KV 不使用に退避）と最終的一貫性の運用指針が明確か | PASS |

## スコープ

### 含む

- KV Namespace 作成（production / staging 分離）
- `wrangler.toml` への KV バインディング設定追加
- TTL 設定方針の定義（用途別）
- KV 使用用途の明確化（セッション / 設定キャッシュ / レートリミットカウンタ）
- 無料枠内での運用方針
- 最終的一貫性制約の明文化と設計指針

### 含まない

- セッション管理ロジックの実装（→ 認証機能実装タスク）
- キャッシュ戦略の実装（→ アプリケーション層）
- Durable Objects によるリアルタイム状態管理（→ 別途検討）
- KV データの暗号化方式設計（→ 認証機能実装タスク）

## 受入条件 (AC)

- AC-1: KV Namespace の production / staging 作成手順と命名規約が確定済み（`ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging`）
- AC-2: `wrangler.toml` の `[env.production]` / `[env.staging]` に追加する KV バインディング設計が確定済み
- AC-3: Workers から KV への読み書き動作確認手順が確定済み（最小キー/バリュー setup test）
- AC-4: TTL 設定方針がドキュメント化済み（用途別: セッション / 設定キャッシュ / レートリミット）
- AC-5: 無料枠（100k read/day, 1k write/day）内での運用方針が明文化済み
- AC-6: Namespace 名・バインディング名・KV ID 管理方針が下流タスク（認証実装）向けにドキュメント化済み（実 ID は本仕様書に記載しない）
- AC-7: 最終的一貫性制約と「即時反映が必要な操作で KV を使わない」設計指針が明記済み

## 既存資産インベントリ

| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| wrangler.toml (api) | KV バインディングの有無・現在の env 構成 | 確認済み |
| wrangler.toml (web) | KV バインディングの有無（web 用 KV が必要か） | 確認済み |
| 既存 KV namespace | 既に作成済みの KV namespace があるか | 未作成（UT-30 で実 ID 発行） |
| wrangler CLI バージョン | KV namespace 作成・バインディングに必要なバージョン | 4.85.0 前提（package.json の wrangler pin に準拠） |
| Cloudflare アカウント権限 | KV 作成権限が付与されているか | 確認済み |

## 正本仕様参照表

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | KV 基本手順・wrangler 操作・KV binding 設定例 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | タスク概要・AC・依存関係の正本 |
| 必須 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/cloudflare-bootstrap-runbook.md | 上流タスクの runbook（KV 章を追記する基準） |
| 必須 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-02/cloudflare-topology.md | Cloudflare リソーストポロジ |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |
