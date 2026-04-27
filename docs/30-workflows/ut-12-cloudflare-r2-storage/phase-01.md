# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-27 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |
| タスク種別 | spec_created（docs-only / 実装は別タスク） |

## 目的

R2 ストレージ設定タスクの真の論点を特定し、スコープ・依存境界・受入条件を確定する。
タスク種別が `spec_created`（docs-only）であることを明文化し、実装は将来のファイルアップロードタスクで実施する前提を Phase 2 以降に正しく伝達する。

## 実行タスク

- 真の論点（R2 を今設定する意義・将来要件）を特定する
- スコープ・依存境界を確定する（含む / 含まない）
- 受入条件 (AC-1〜AC-8) を Phase 単位に紐付ける
- 4条件評価（価値性 / 実現性 / 整合性 / 運用性）を行い実施可否を確定する
- タスクタイプ判定（spec_created / docs-only）を明文化する
- 既存資産インベントリ（命名トポロジー・上流タスク carry-over）を洗い出す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-12-cloudflare-r2-storage/index.md | タスク概要・AC・依存関係の正本 |
| 必須 | docs/30-workflows/ut-12-cloudflare-r2-storage/artifacts.json | Phase / outputs 機械可読定義 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Workers バインディング設定方針 |
| 必須 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/token-scope-matrix.md | API Token スコープ定義 |
| 必須 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/cloudflare-bootstrap-runbook.md | Cloudflare リソース命名トポロジー |
| 必須 | docs/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | CI/CD secret 登録経路 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |
| 参考 | https://developers.cloudflare.com/r2/ | Cloudflare R2 公式ドキュメント |

## 実行手順

### ステップ 1: input と前提の確認

- index.md・artifacts.json を読み、AC / Phase 構成 / 主要成果物を把握する
- 上流タスク (01b / 04) の成果物を棚卸しし carry-over 内容を確定する
- deployment-cloudflare.md の R2 関連記述（バインディング・wrangler 設定）を確認する
- GitHub Issue #15 (CLOSED) の議論内容と本タスク仕様書の差分を整理する

### ステップ 2: タスクタイプ判定の明文化

- タスク種別が `spec_created`（docs-only）である根拠を整理する
- Issue が CLOSED 状態で再オープンせず仕様書整備のみで完結する旨を記録する
- 実装は将来のファイルアップロードタスクが担当する境界線を示す

### ステップ 3: スコープ・受入条件の確定

- スコープ「含む / 含まない」を index.md から転記し、本 Phase で確定する
- AC-1〜AC-8 を担当 Phase（特に Phase 5 / Phase 11）に紐付ける
- 既存資産インベントリ（wrangler.toml・既存 Token・01b 成果物）を表形式で記録する

### ステップ 4: 4条件評価と handoff 整理

- 価値性 / 実現性 / 整合性 / 運用性を評価し TBD を残さない
- Phase 2 に渡す blocker / open question を抽出する
- carry-over した上流成果物のうち本 Phase で参照すべきパスを Phase 2 へ申し送る

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 本 Phase の AC・スコープ・タスクタイプ判定を設計入力として使用 |
| Phase 5 | AC-1〜AC-3 / AC-7（命名・バインディング・Token・下流配布）の実施根拠 |
| Phase 6 | AC-5（CORS）の異常系設計の根拠 |
| Phase 11 | AC-4（smoke test）の手動検証根拠 |

## 多角的チェック観点（AIが判断）

- 価値性: 将来のファイルアップロード機能着手時に「R2 設計が無いことで止まる」リスクを除去できるか
- 実現性: 無料枠（10GB / Class A 1,000万 / Class B 1億 / 月）内で運用可能な設計に収まるか
- 整合性: 01b の命名トポロジー（`ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`）と矛盾しないか
- 運用性: API Token スコープ追加 / 専用 Token 作成のいずれを採るかが最小権限原則に整合するか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点・依存境界の確定 | 1 | pending | index.md と上流タスク確認 |
| 2 | タスクタイプ判定（spec_created / docs-only） | 1 | pending | Issue CLOSED の扱いを明記 |
| 3 | 4条件評価 | 1 | pending | 価値性 / 実現性 / 整合性 / 運用性 |
| 4 | AC 正式定義と Phase 紐付け | 1 | pending | AC-1〜AC-8 を Phase に対応付け |
| 5 | 既存資産インベントリ | 1 | pending | wrangler.toml・01b/04 成果物の棚卸し |
| 6 | 命名トポロジー確認 | 1 | pending | 01b token-scope-matrix.md 参照 |
| 7 | carry-over 成果物の整理 | 1 | pending | 上流成果物のパスを次 Phase に渡す |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 真の論点・スコープ・AC・4条件評価をまとめた主成果物 |
| ドキュメント | outputs/phase-01/scope-definition.md | 含む / 含まないの境界と将来タスクへの handoff |
| ドキュメント | outputs/phase-01/task-type-decision.md | spec_created / docs-only である判定根拠 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

> 上記成果物の実体ファイルは Phase 1 実行時に作成する。本 phase 仕様書では作成しない。

## 完了条件

- 真の論点・依存境界が確定している
- タスクタイプ判定（spec_created / docs-only）が文書化されている
- 4条件評価が全て TBD でない
- AC-1〜AC-8 が担当 Phase に紐付けられている
- 既存資産インベントリ（命名トポロジー・上流成果物）が作成されている
- Phase 2 への carry-over 内容が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 上流タスク（01b / 04）成果物の参照経路を全て記録
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: AC・スコープ・タスクタイプ判定・4条件評価・既存資産インベントリ・命名トポロジーを Phase 2 へ
- ブロック条件: 主成果物未作成 / タスクタイプ未確定 / AC 紐付け未完了の場合は次 Phase に進まない

## 真の論点

- R2 バケットを「いつ」設定するか（ファイルアップロード機能の計画が立った段階で着手する前提を維持できるか）
- API Token スコープ追加 vs 専用 Token 新規作成のいずれを最小権限原則として推奨するか
- CORS 設定が UT-16（カスタムドメイン）完了後に再設定必須となる前提を Phase 2 設計に組み込めるか
- 無料枠（特に Class B 1億 ops/月）の超過リスクを UT-17 と連携してどう監視するか
- GAS prototype 由来のファイル管理ロジックを R2 に持ち込まない（CLAUDE.md 不変条件 6）境界線

## 依存関係・責務境界

| 種別 | 対象 | 内容 |
| --- | --- | --- |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | API Token スコープ・命名トポロジー・Account ID 確定 |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | Secrets/Variables 登録経路の確立 |
| 下流 | future-file-upload-implementation | バケット名・バインディング名を前提に実装 |
| 下流 | UT-16 (custom-domain) | CORS の AllowedOrigins を UT-16 完了後に再設定 |
| 関連 | UT-17 (Cloudflare Analytics alerts) | 無料枠接近時の通知連携 |

## 価値とコスト

- 初回価値: 将来のファイルアップロード実装着手時に「R2 設計待ち」で止まらない状態を作る
- 初回で払わないコスト: アップロード API 実装・Presigned URL 発行ロジック・画像変換・CDN キャッシュ
- 設定コスト: バケット作成・wrangler.toml バインディング追記・CORS JSON 適用のみ（無料枠内）

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 将来のファイルアップロード機能で R2 設計が完成済みであることが価値を生むか | TBD |
| 実現性 | 無料枠と既存 wrangler / API Token の枠内で R2 設定が完結するか | TBD |
| 整合性 | 01b の命名トポロジー・Token スコープと矛盾なく設計できるか | TBD |
| 運用性 | 無料枠超過監視・CORS 再設定・Token rollback 手順が運用に乗るか | TBD |

## スコープ

### 含む

- R2 バケット作成（production / staging 分離）
- `wrangler.toml` の `[env.production]` / `[env.staging]` への `[[r2_buckets]]` バインディング設定
- Workers からの R2 アクセス権限設計（API Token スコープ追加 / 専用 Token 新規作成の選択）
- CORS 設定 JSON 設計（ブラウザ直接アップロード対応）
- パブリック / プライベートアクセス選択基準の文書化
- 無料枠使用量モニタリング方針（UT-17 連携ポイントの明示）

### 含まない

- ファイルアップロード機能の実装コード（→ 別途実装タスク）
- Presigned URL 発行ロジックの実装（→ 別途実装タスク）
- CDN / キャッシュ設定（→ 別途タスク）
- 画像リサイズ・変換処理（→ アプリケーション層）
- カスタムドメイン適用（→ UT-16）

## 受入条件 (AC) と Phase 紐付け

| AC | 内容 | 主担当 Phase | 補完 Phase |
| --- | --- | --- | --- |
| AC-1 | バケット命名 (`ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`) | Phase 5 | Phase 2 (設計) |
| AC-2 | wrangler.toml の `[[r2_buckets]]` 設定 | Phase 5 | Phase 2 (設計) / Phase 8 (DRY 化) |
| AC-3 | API Token に R2:Edit スコープ追加 / 専用 Token 作成方針 | Phase 5 | Phase 2 (設計) / Phase 3 (レビュー) |
| AC-4 | Workers からの R2 アップロード / ダウンロード smoke test | Phase 11 | Phase 4 (事前検証) / Phase 6 (異常系) |
| AC-5 | CORS 設定 JSON の適用 | Phase 5 | Phase 2 (設計) / Phase 6 (異常系) |
| AC-6 | 無料枠モニタリング方針と UT-17 連携 | Phase 5 | Phase 2 (設計) / Phase 12 (ドキュメント) |
| AC-7 | バケット名・バインディング名の下流向け公開 | Phase 5 | Phase 12 (ドキュメント更新) |
| AC-8 | パブリック / プライベート選択基準と UT-17 連携 | Phase 5 | Phase 2 (設計) |

## 既存資産インベントリ

| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| `apps/api/wrangler.toml` | 既存 R2 バインディングの有無 | 要確認（無いことが期待値） |
| `apps/web/wrangler.toml` | 既存 R2 バインディングの有無 | 要確認（不要が期待値） |
| Cloudflare API Token | R2:Edit スコープの現状 | 要確認（01b token-scope-matrix.md と突合） |
| Cloudflare Account ID | 01b で確定済みの値（参照経路のみ） | 1Password / Cloudflare Secrets |
| 命名トポロジー | `ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging` | 01b 命名規約に整合 |
| GitHub Secrets | R2 関連 secret 登録の有無 | 要確認（04 タスク経由） |

## carry-over（上流タスクからの引き継ぎ確認）

| 引き継ぎ元 | 成果物 | 本タスクでの利用 |
| --- | --- | --- |
| 01b-parallel-cloudflare-base-bootstrap | outputs/phase-05/token-scope-matrix.md | API Token スコープ判断（AC-3）の根拠 |
| 01b-parallel-cloudflare-base-bootstrap | outputs/phase-05/cloudflare-bootstrap-runbook.md | バケット作成手順の参照（命名・Account） |
| 04-serial-cicd-secrets-and-environment-sync | index.md | Secrets / Variables 登録経路（AC-3 / AC-7） |

## 正本仕様参照表

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Workers / R2 バインディング・wrangler 操作 |
| 必須 | docs/30-workflows/ut-12-cloudflare-r2-storage/index.md | 本タスクの正本 |
| 必須 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/index.md | 上流タスク（命名・Token） |
| 必須 | docs/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | CI/CD secret 経路 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## レビューポイント / リスク

- Issue が CLOSED であるため Phase 12 で system-spec 同期時に重複記述・矛盾が生まれないか
- 01b 完了前に着手すると Token スコープ判断が空中戦になるためゲートを Phase 1 で必ず確認
- 将来のファイルアップロード実装タスクとの境界が曖昧だと Phase 5 で実装コードを混入させるリスク（spec_created の枠を逸脱）

## 次フェーズへの引き渡し

- Phase 2 へ渡す入力: AC 紐付け表 / スコープ確定 / 4条件評価 / 既存資産インベントリ / carry-over 成果物パス
- Phase 2 で確定すべき設計事項: R2 アーキテクチャ / wrangler.toml 差分 / Token スコープ判断 / CORS ポリシー
- 未解決の場合は Phase 2 進行を保留する open question を `outputs/phase-01/requirements.md` に明記する
