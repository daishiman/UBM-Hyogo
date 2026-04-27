# ut-12-cloudflare-r2-storage - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-12 |
| タスク名 | Cloudflare R2 ストレージ設定 |
| ディレクトリ | docs/30-workflows/ut-12-cloudflare-r2-storage |
| Wave | 2+ |
| 実行種別 | 独立タスク（spec_created）|
| 作成日 | 2026-04-27 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | docs-only（R2 バケット設定の記録・参照用 / 実装コードは別タスク）|
| 優先度 | MEDIUM |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 検出元タスク | 01b-parallel-cloudflare-base-bootstrap (UN-01) |
| GitHub Issue | #15 (CLOSED) |

> **注意: GitHub Issue #15 は CLOSED 状態だが、タスク仕様書として正式化する。**
> 当該 R2 設定は将来のファイルアップロード機能実装時に必要となる前提作業であり、
> 仕様書は実装着手判断のための参照資料として整備する。Wave 2+ で実施予定。

## 目的

ファイルアップロード・画像配信機能のための Cloudflare R2 バケットを設定し、
Cloudflare Workers API (`apps/api`) からの R2 バインディングを確立する。`apps/web` は R2 に直接アクセスせず、必要なファイル操作は API 経由に限定する。
無料枠（10GB ストレージ・1,000万 Class A / 1億 Class B 操作 / 月）内で
運用できる構成を定義し、後続のファイルアップロード機能実装が
迷いなく着手できる状態を作る。

## スコープ

### 含む

- R2 バケット作成（production / staging 分離）
- `wrangler.toml` への R2 バインディング設定追加
- Workers からの R2 アクセス権限設定（API Token スコープ追加 / 専用 Token 作成）
- CORS 設定（ブラウザからの直接アップロード対応）
- パブリックアクセス設定方針（パブリック / プライベート の選択基準）
- 無料枠使用量モニタリング設定方針

### 含まない

- ファイルアップロード機能の実装コード（→ 別途実装タスクで実施）
- CDN/キャッシュ設定（→ 別途タスク）
- 画像リサイズ・変換処理（→ アプリケーション層で対応）
- Presigned URL 発行ロジックの実装（→ ファイルアップロード実装タスク）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | docs/30-workflows/completed-tasks/01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウント・API Token スコープ・命名トポロジーの確定が前提 |
| 上流 | docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync | R2 バインディング名を CI/CD に登録するため |
| 下流 | ファイルアップロード実装タスク（将来） | R2 バケット名・バインディング名が確定後に実装可能 |
| 下流 | UT-16 (カスタムドメイン設定) | CORS の AllowedOrigins 再設定の起点 |
| 関連 | UT-17 (Cloudflare Analytics アラート設定) | 無料枠接近時の通知連携 |

## 着手タイミング

> **着手前提**: `01b-parallel-cloudflare-base-bootstrap` と
> `04-serial-cicd-secrets-and-environment-sync` が完了し、
> ファイルアップロード機能の実装が計画に入った段階で着手すること。

| 条件 | 理由 |
| --- | --- |
| アプリにファイルアップロード機能が計画済み | 不要な R2 リソースの作成を避けるため |
| 01b タスク完了 | API Token スコープ（R2:Edit 追加）が確定している必要がある |
| 04 タスク完了 | Secrets/Variables の登録経路が確立している |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/token-scope-matrix.md | API Token スコープ定義 |
| 必須 | docs/30-workflows/completed-tasks/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/cloudflare-bootstrap-runbook.md | Cloudflare リソース作成手順の参考 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Workers バインディング設定方針 |
| 必須 | docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | CI/CD secret 登録経路 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |
| 参考 | https://developers.cloudflare.com/r2/ | Cloudflare R2 公式ドキュメント |

## 受入条件 (AC)

- AC-1: R2 バケットの production / staging 命名と作成 runbook が、01b のトポロジー（`ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`）に整合している
- AC-2: `wrangler.toml` の `[env.production]` / `[env.staging]` それぞれに追加する `[[r2_buckets]]` バインディング差分が定義されている
- AC-3: API Token に R2:Edit スコープを追加するか専用 Token を作成するかの判断が、最小権限原則に基づき記録されている
- AC-4: Workers API から R2 へのファイルアップロード・ダウンロード smoke test 手順と証跡パスが定義されている
- AC-5: CORS 設定 JSON と適用確認手順が定義され、ブラウザからの直接アップロード経路の検証観点が明示されている
- AC-6: 無料枠使用量モニタリング方針が文書化され、UT-17 との連携ポイントが明示されている
- AC-7: バケット名・バインディング名が下流タスク向けに `outputs/phase-05/` でドキュメント化されている
- AC-8: パブリック / プライベート選択基準と将来のカスタムドメイン (UT-16) との関係が文書化されている

## 状態定義（spec_created の境界）

本タスクは `spec_created` / docs-only であり、R2 実リソースはまだ作成しない。AC は「将来実行できる仕様・runbook・証跡パスが定義されていること」を本タスクの完了基準とし、実環境での作成・適用・smoke test は下流のファイルアップロード実装タスクで実施する。

| AC | 本タスクでの状態 | 実環境状態 | 下流ハンドオフ |
| --- | --- | --- | --- |
| AC-1 | バケット命名と作成手順を定義 | 未作成 | future-file-upload-implementation |
| AC-2 | `apps/api/wrangler.toml` 追記差分を定義 | 未適用 | future-file-upload-implementation |
| AC-3 | 専用 R2 Token 方針と Secret 名を定義 | 未作成 | 04 secret sync / future-file-upload-implementation |
| AC-4 | staging smoke test 手順と証跡パスを定義 | 未実行 | future-file-upload-implementation |
| AC-5 | CORS JSON と確認手順を定義 | 未適用 | future-file-upload-implementation / UT-16 |
| AC-6 | R2 無料枠監視項目を定義 | 未設定 | UT-17 |
| AC-7 | binding-name-registry.md の内容を定義 | 未適用 | future-file-upload-implementation |
| AC-8 | private-first 方針と UT-16 再設定条件を定義 | 未適用 | UT-16 |

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_completed | outputs/phase-01 |
| 2 | 設計 | phase-02.md | spec_completed | outputs/phase-02 |
| 3 | 設計レビュー | phase-03.md | spec_completed | outputs/phase-03 |
| 4 | 事前検証手順 | phase-04.md | spec_completed | outputs/phase-04 |
| 5 | セットアップ実行 | phase-05.md | spec_completed | outputs/phase-05 |
| 6 | 異常系検証 | phase-06.md | spec_completed | outputs/phase-06 |
| 7 | 検証項目網羅性 | phase-07.md | spec_completed | outputs/phase-07 |
| 8 | 設定 DRY 化 | phase-08.md | spec_completed | outputs/phase-08 |
| 9 | 品質保証 | phase-09.md | spec_completed | outputs/phase-09 |
| 10 | 最終レビュー | phase-10.md | spec_completed | outputs/phase-10 |
| 11 | 手動 smoke test | phase-11.md | spec_completed | outputs/phase-11 |
| 12 | ドキュメント更新 | phase-12.md | spec_completed | outputs/phase-12 |
| 13 | PR作成 | phase-13.md | pending | outputs/phase-13 |

## 苦戦予測ポイント（Issue より転記）

1. **R2 バインディングの wrangler.toml 追記方法**: `[env.production]` / `[env.staging]` で別バケット名を設定。命名は 01b トポロジー（`ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`）に揃える。
2. **API Token への R2:Edit スコープ追加**: 既存 Token への追加 vs 専用 Token 新規作成のトレードオフ。最小権限原則から専用 Token を推奨。
3. **CORS 設定の落とし穴**: Presigned URL 経由のブラウザ直接アップロードでは CORS 設定が必須。UT-16 完了後に AllowedOrigins 再設定が必要となる可能性あり。
4. **無料枠の制限**: 10GB ストレージ / Class A 1,000万 / Class B 1億 操作 /月。画像配信用途では Class B 急増リスクがあり UT-17 連携が必要。
