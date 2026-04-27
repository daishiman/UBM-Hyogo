# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-27 |
| 前 Phase | 11 (手動 smoke test / NON_VISUAL) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |
| タスク種別 | spec_created（docs-only） |
| 実装状況記録 | **`spec_created`**（`completed` ではない / docs-only タスクのため） |

## 目的

本タスク（UT-12）の成果物を正本仕様（system spec）に同期し、close-out として「実装ガイド（中学生レベル + 技術詳細の 2 部構成）」「documentation-changelog」「未タスク検出」「スキルフィードバック」「Phase 12 仕様遵守チェック」を完了させる。同時に、Step 1-A〜1-C を `spec_created` として記録し、same-wave sync ルール（spec-update-workflow.md）を遵守する。

## 参照資料（前提成果物）

- Phase 1〜11 の全成果物
- Phase 10: review-decision.md（PASS 判定 / MINOR 未タスク化リスト）
- Phase 11: main.md / manual-smoke-log.md / link-checklist.md（NON_VISUAL 証跡）
- 正本: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` / `LOGS.md`

## 成果物（必須 5 + 1 = 6 成果物）

| 種別 | パス | 説明 | 必須 |
| --- | --- | --- | --- |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1（中学生レベル概念）+ Part 2（技術詳細） | YES |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Step 1-A〜1-C / Step 2 結果 | YES |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 変更ファイル一覧 / 検証コマンド結果 | YES |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出（**0 件でも出力必須**） | YES |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | スキルフィードバック（**改善点なしでも出力必須**） | YES |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Task 12-1〜12-6 準拠チェック | YES |
| メタ | artifacts.json | Phase 状態の更新 | YES |

> 上記成果物の実体ファイルは Phase 12 実行時に作成する。本 phase 仕様書では作成しない。

## 実行タスク（Phase 12 共通ルール）

1. **implementation-guide.md（Part 1 / Part 2）**
2. **system-spec-update-summary.md（Step 1-A〜1-C / Step 2）**
3. **documentation-changelog.md**
4. **unassigned-task-detection.md（0 件でも出力必須）**
5. **skill-feedback-report.md（改善点なしでも出力必須）**

加えて Task 6: phase12-task-spec-compliance-check.md（Task 1〜5 の完了確認）を実施する。

## Task 1: implementation-guide.md【必須 / 2 部構成】

### Part 1: 中学生レベル概念説明（日常の例え話 / 専門用語禁止）

- 「Cloudflare R2 は、インターネット上の大きな倉庫のようなもの」
- 「バケットは倉庫の中の部屋。本番用と練習用で部屋を分けて、間違って本番に荷物を置かないようにする」
- 「鍵（API Token）は最低限の部屋しか開けられないものを別に用意する。万一鍵をなくしても被害が部屋ひとつで済む」
- 「CORS は『どのお店から荷物を運び込んでいいか』のルール。許可していないお店からの荷物は門前払いする」
- 「無料枠は『1 か月に何回開け閉めしていいか』の上限。超えそうになったらアラートで知らせる仕組み（UT-16）と組み合わせる」
- 専門用語は登場させず、登場した場合は同段落内で日常語に言い換える

### Part 2: 技術詳細

#### wrangler.toml schema

```toml
[env.production]
[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-prod"

[env.staging]
[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-staging"
```

#### CORS JSON テンプレ（環境別 AllowedOrigins）

```json
[
  {
    "AllowedOrigins": ["<env-specific-origin>"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "Authorization"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

#### R2 API シグネチャ（Workers binding）

```ts
// apps/api 内（不変条件 5: D1/R2 直接アクセスは apps/api 限定）
// 型定義の例（実装は別タスク）
interface Env {
  R2_BUCKET: R2Bucket;
}

// PUT
await env.R2_BUCKET.put(key, body, { httpMetadata: { contentType } });
// GET
const obj = await env.R2_BUCKET.get(key);
// DELETE
await env.R2_BUCKET.delete(key);
```

#### MINOR 申し送り（Phase 10 から橋渡し）

- AllowedOrigins 暫定値の正式更新（UT-16 完了後）
- 無料枠通知経路の確定（UT-17 着手後）

## Task 2: system-spec-update-summary.md【必須】

### Step 1-A: 完了タスク記録

> **重要: same-wave sync ルール遵守 / N/A 化禁止**

- `LOGS.md`（タスクワークフロー側）に UT-12 の `spec_created` 状態を記録
- `LOGS.md`（aiworkflow-requirements skill 側）に R2 設定の参照ガイド追加を記録（×2 系）
- `topic-map.md` に R2 / Cloudflare ストレージ関連 anchor を追記
- 関連ドキュメントリンク（phase-01〜phase-13.md / outputs/phase-NN/*）を一覧化
- 変更履歴を `documentation-changelog.md` と相互参照

### Step 1-B: 実装状況テーブル

| 対象 | 実装状況 | 備考 |
| --- | --- | --- |
| docs/30-workflows/ut-12-cloudflare-r2-storage/ | **`spec_created`** | docs-only / 実装は別タスク |
| `apps/api/wrangler.toml` への R2 バインディング適用 | 未適用 | 将来のファイルアップロード実装タスクで適用 |
| R2 バケット実作成 | 未作成 | 同上（着手時 / Phase 5 runbook 参照） |
| CORS JSON 適用 | 未適用 | 同上 |

### Step 1-C: 関連タスクテーブル更新

| 関連タスク | 関係 | 申し送り内容 |
| --- | --- | --- |
| 01b-parallel-cloudflare-base-bootstrap | 上流 | Token スコープ正本との整合確認済 |
| 04-serial-cicd-secrets-and-environment-sync | 上流 | R2 Token を GitHub Secrets に登録する経路の前提 |
| future-file-upload-implementation | 下流 | 本タスクの設計 / runbook を実装前提とする |
| UT-16 (custom-domain) | 関連 | CORS AllowedOrigins 再設定の起点 |
| UT-17 (Cloudflare Analytics alerts) | 関連 | 無料枠閾値の通知経路 |

### Step 2: 新規インターフェース追加なし → N/A

> 本タスクは docs-only / spec_created であり、新規 IPC 契約・型定義 export・公開 API の追加は無い。  
> Step 2（インターフェース追加に伴う `.claude/skills/` の更新）は **N/A**。  
> 理由: 既存の `deployment-cloudflare.md` への参照ガイド追記のみで完結し、新規 export はない。

## Task 3: documentation-changelog.md【必須】

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-27 | 新規 | docs/30-workflows/ut-12-cloudflare-r2-storage/index.md | タスク仕様書インデックス |
| 2026-04-27 | 新規 | docs/30-workflows/ut-12-cloudflare-r2-storage/artifacts.json | 機械可読サマリー |
| 2026-04-27 | 新規 | phase-01.md 〜 phase-13.md | Phase 1〜13 仕様書 |
| 2026-04-27 | 新規 | outputs/phase-01〜phase-12 | 各 Phase 成果物 |
| 2026-04-27 | 追記 | aiworkflow-requirements `topic-map.md` | R2 anchor 追加 |
| 2026-04-27 | 追記 | LOGS.md（×2 系） | UT-12 `spec_created` 記録 |

検証コマンド結果（実行例）:

```bash
# 計画系文言 残存確認
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "計画系文言 なし"

# 未タスク検出リンク整合
node .claude/skills/task-specification-creator/scripts/verify-unassigned-links.js \
  --source docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-12/unassigned-task-detection.md
```

## Task 4: unassigned-task-detection.md【必須 / 0 件でも出力必須】

> **0 件でも空ファイルではなく「設計タスクパターン確認済、N 件」と明記する。**

| 検出項目 | 種別 | 推奨対応 | 割り当て先 |
| --- | --- | --- | --- |
| R2 バケット実作成 + wrangler.toml 適用 | 実作業 | 将来のファイルアップロード実装着手時に Phase 5 runbook を実行 | future-file-upload-implementation |
| AllowedOrigins 正式値への更新 | 実作業 | UT-16 完了後に CORS JSON を再適用 | UT-16 完了後の運用タスク |
| 無料枠通知経路の確定 | 設計 / 実作業 | UT-17 で R2 の Storage / Class A / Class B メトリクスをアラート対象に追加 | UT-17 |
| Presigned URL 発行ロジック | 実装 | アプリケーション層で実装 | future-file-upload-implementation |

配置先: `docs/30-workflows/unassigned-task/`（[P38 再発防止] / Phase 12 ガイドに準拠）

## Task 5: skill-feedback-report.md【必須 / 改善点なしでも出力必須】

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | NON_VISUAL タスクのスクリーンショット不要ルールが適切に適用できた | NON_VISUAL の判定フローチャートを SKILL.md にもっと前段で出してもよい |
| aiworkflow-requirements | deployment-cloudflare.md に R2 バインディング・CORS の推奨形が記載されると Phase 2 設計が早まる | R2 セクションを deployment-cloudflare.md に追記する未タスクを起こす |
| github-issue-manager | CLOSED Issue を仕様書として正式化する経路（spec_created）が機能した | CLOSED Issue → spec_created の変換手順をガイドに明記 |

> 改善点が無い場合も「改善点なし / 確認のみ」と明記する。

## Task 6: phase12-task-spec-compliance-check.md【必須】

| チェック項目 | 基準 | 状態 |
| --- | --- | --- |
| Task 1: implementation-guide.md（Part 1 + Part 2） | 中学生レベル + 技術詳細の 2 部構成 | pending |
| Task 2: system-spec-update-summary.md | Step 1-A / 1-B（spec_created） / 1-C / Step 2（N/A 理由付き） | pending |
| Task 3: documentation-changelog.md | 全変更ファイル + 検証コマンド結果 | pending |
| Task 4: unassigned-task-detection.md | 0 件でも出力済 / 配置先正しい | pending |
| Task 5: skill-feedback-report.md | 改善点なしでも出力済 | pending |
| same-wave sync ルール遵守 | LOGS.md ×2 / topic-map.md 更新済 | pending |
| Phase 11 NON_VISUAL 整合 | screenshots ディレクトリ非作成を確認 | pending |
| ファイル名照合 | unassigned-task-detection.md（誤名 unassigned-task-report.md なし） | pending |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook 統合内容を implementation-guide Part 2 に反映 |
| Phase 11 | NON_VISUAL 証跡を main.md の所見に転記 |
| Phase 13 | documentation-changelog から PR 変更ファイル一覧を生成 |

## 多角的チェック観点

- 価値性: implementation-guide が将来の実装タスク着手時に「迷わず進められる」具体性か
- 実現性: docs-only として system spec 更新が完結し、計画系文言 が残っていないか
- 整合性: documentation-changelog が全変更ファイルを網羅しているか
- 運用性: unassigned-task-detection が後続タスク（UT-16 / UT-17 / 実装タスク）への引き継ぎを漏らしていないか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | implementation-guide.md（Part 1 / Part 2） | 12 | pending |
| 2 | system-spec-update-summary.md（Step 1-A〜1-C / Step 2） | 12 | pending |
| 3 | documentation-changelog.md | 12 | pending |
| 4 | unassigned-task-detection.md | 12 | pending |
| 5 | skill-feedback-report.md | 12 | pending |
| 6 | phase12-task-spec-compliance-check.md | 12 | pending |
| 7 | LOGS.md ×2 / topic-map.md の実更新 | 12 | pending |

## 完了条件（受入条件 + AC 紐付け）

- [ ] 必須 6 成果物が全て作成されている
- [ ] implementation-guide が Part 1 / Part 2 構成（AC-1 / AC-2 / AC-5 / AC-7）
- [ ] Step 1-B が `spec_created` として記録されている（`completed` ではない）
- [ ] Step 2 が N/A 判定 + 理由を明記
- [ ] unassigned-task-detection が 0 件でも出力済
- [ ] skill-feedback-report が改善点なしでも出力済
- [ ] LOGS.md ×2 / topic-map.md が実更新済（計画系文言 残存なし）
- [ ] phase12-task-spec-compliance-check の全項目 PASS
- [ ] AC-6（モニタリング方針）/ AC-8（パブリック・プライベート選択基準）が implementation-guide に反映

## レビューポイント / リスク / 落とし穴

- Step 1-A〜1-C を N/A にしない（same-wave sync で必ず閉じる）
- 「仕様策定のみ」「実行予定」「保留として記録」という 計画系文言 を残さない
- ファイル名 typo（`unassigned-task-report.md` 等）を作らない（正式名は `unassigned-task-detection.md`）
- screenshots ディレクトリ（NON_VISUAL タスクのため不要）を Phase 12 で誤って作らない
- LOGS.md は両系（タスクワークフロー / aiworkflow-requirements skill）に記録（×2 系）

## 次フェーズへの引き渡し

- 次: 13 (PR 作成)
- 引き継ぎ事項: 全成果物パス / documentation-changelog の変更ファイル一覧 / compliance check 結果
- ブロック条件: phase12-task-spec-compliance-check に未 PASS 項目が残っている場合は Phase 13 に進まない
