# Phase 8: リファクタリング（runbook 整理）

> **本タスクは docs-only / infrastructure-verification である。** 本 Phase の "リファクタリング" はコード再構成ではなく、**runbook 文書の重複削減・節順整理・親 UT-06-FU-A runbook との重複統合・コマンドサンプルの DRY 化** を指す。実装コードは変更しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker 名分離に伴う route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング（runbook 整理） |
| 作成日 | 2026-04-30 |
| 前 Phase | 7 (テストカバレッジ確認 / runbook 網羅性検証) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク分類 | infrastructure-verification（refactoring / dry） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1〜7 で確定した runbook 草稿・チェックリスト・コマンドサンプル・用語に対し、**重複排除 / 節順整理 / 親 UT-06-FU-A runbook との重複統合 / コマンドサンプルのラッパー統一 / 用語の正本化** を行う。本タスクは親 runbook（`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`）への **追記** が成果物のため、親 runbook 既存記述との重複が放置されると AC1（チェックリスト追記）の DRY 性を損なう。schema-as-source-of-truth 原則と同様、本タスクでは **「正本仕様 §2.2 の AC を唯一の AC registry とし、runbook 本文は AC への参照リンクのみで重複定義しない」** を runbook-as-source-of-truth として明文化する。

## 実行タスク

1. Phase 1〜7 の仕様書 / outputs / 親 UT-06-FU-A runbook を横断 grep し、重複記述（例: secret list コマンドが複数節で再記述、Worker 名が複数表記）を洗い出す（完了条件: 重複件数が表化）。
2. runbook 章立てを **「前提 → inventory → 突合 → 再注入 → 観測 → 判断記録」の 6 節順** に整理する（完了条件: 章順が固定 + 各節の 1 行要約が記述）。
3. 親 UT-06-FU-A runbook 既存記述との重複を統合する（完了条件: 親 runbook の既存節と本タスク追記節の境界が明示 + 同一手順は親側へ link 集約）。
4. コマンドサンプルを CLAUDE.md「Cloudflare 系 CLI 実行ルール」と完全整合させる（完了条件: `wrangler` 直接実行ゼロ / `bash scripts/cf.sh` 経由のみ）。
5. 用語統一（仕様語 ↔ 実装語対応表）を最終化する（完了条件: 表が確定し、揺れゼロを grep で再確認）。
6. IPC 契約ドリフト検証は本タスク該当なし（runbook 文書のみで API I/F 変更を伴わない）旨を明記する（完了条件: N/A 理由が記述）。
7. セキュリティリファクタとして、サンプル出力テンプレに secret 値が混入しない構造（key 名のみ・値プレースホルダなし）を確認する（完了条件: テンプレ書式が確定）。
8. navigation drift（artifacts.json / 各 phase-XX.md / 親 runbook へのリンク）を確認する（完了条件: リンク切れ 0）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-01.md 〜 phase-07.md | リファクタリング対象 |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/index.md | 用語・命名の正本 |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md | 正本仕様（AC1〜AC5） |
| 必須 | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ | 親 runbook（追記先・重複統合対象） |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | コマンドサンプル整合 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare 運用規約 |

## Before / After 比較テーブル

### 章立て（節順）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| runbook 章順 | 草稿は spec §3 順（認証 → route → secret → observability → 旧 Worker 処遇） | **前提 → inventory → 突合 → 再注入 → 観測 → 判断記録** の 6 節順に固定 | deploy 承認直前の作業時系列に合わせ、作業者が上から順に実行できるようにする |
| 節タイトル | 「3.1 認証」「3.2 route」… の番号付き | 「§1 前提」「§2 inventory」… の意味付き節名 | 番号は親 runbook と衝突するため意味付けを優先 |
| サブ節 | フラットな箇条書き | 各節に「前提コマンド」「期待出力」「失敗時の対応」を 3 サブ節構造で統一 | 各節が独立して実行可能な単位になる |

### コマンドサンプル統一（CLAUDE.md 整合）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 認証確認 | `wrangler whoami` | `bash scripts/cf.sh whoami` | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 |
| secret 一覧 | `wrangler secret list --env production` | `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production` | ラッパー一本化 + config 明示 |
| secret 投入 | `wrangler secret put KEY --env production` | `bash scripts/cf.sh secret put <KEY> --config apps/web/wrangler.toml --env production` | 同上、`<KEY>` プレースホルダ化 |
| tail | `wrangler tail --env production` | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` | 同上 |
| deploy | `wrangler deploy --env production` | （本タスクスコープ外。`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` を **コメントアウトで参考表記** のみ） | 正本 §10「production deploy を実行しない」 |

### 用語統一（仕様語 ↔ 実装語対応表）

| 仕様語（正本） | 実装語（runbook / コマンド） | 備考 |
| --- | --- | --- |
| 新 Worker | `ubm-hyogo-web-production` | `apps/web/wrangler.toml [env.production].name` |
| 旧 Worker | rename 前 entity（inventory で動的特定） | Phase 1 inventory に列挙 |
| route / custom domain | route（Cloudflare ダッシュボード Workers & Pages → Routes） | API 経由は `bash scripts/cf.sh` ラッパー化を検討 |
| secret スナップショット | secret list 出力（key 名のみ） | 値は含めない（CLAUDE.md 禁止事項） |
| observability | Tail / Logpush / Workers Analytics Engine | 本タスクは Tail を主軸、他 2 つは設定確認のみ |
| 判断記録 | 残置 / 無効化 / 削除 / route 移譲 の 4 択 | 正本仕様 §3.5 |

### パス（runbook 配置）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 追記先 | 本タスク仕様書内に runbook 本文を保持 | 親 `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` 配下 runbook へ追記、本タスク outputs は **diff のみ** 保持 | runbook-as-source-of-truth |
| 本タスク outputs | 重複した完全版 runbook | `outputs/phase-05/runbook-additions.md`（追記差分のみ） + `outputs/phase-08/refactoring-summary.md` | 重複削減 |
| AC マトリクス | Phase 7 に保持 | Phase 7 単一正本、他 Phase は link のみ | DRY |

## 重複統合方針（親 runbook ↔ 本タスク追記）

| # | 重複候補 | 統合方針 | 担当 Phase |
| --- | --- | --- | --- |
| 1 | `bash scripts/cf.sh whoami` の前提節 | 親 runbook 既存節があれば link、なければ本タスクで追加し以後 link 参照 | Phase 5 |
| 2 | `apps/web/wrangler.toml [env.production].name` の説明 | 親 UT-06-FU-A 主仕様で既述。本タスクは「Worker 名特定」の **検証チェックリスト** にのみフォーカス | Phase 5 |
| 3 | secret list / put コマンドの基本形 | 本タスク §3 / §4 が単一正本。他箇所は link | Phase 5 |
| 4 | tail コマンドの基本形 | 本タスク §5 / §6 が単一正本 | Phase 5 |
| 5 | 旧 Worker 処遇の 4 択判断 | 本タスク §6 / §7 が単一正本（AC5 の責務） | Phase 5 |
| 6 | rollback 余地確保ポリシー | 親 runbook（UT-06 全体）が正本、本タスクは link のみ | Phase 5 |

## IPC 契約ドリフト検証（N/A）

- 本タスクは runbook / checklist の文書追加のみで、Workers⇔D1 / Workers⇔外部 API の I/F を変更しない。
- 既存の Workers binding（D1 / KV / Secrets / Analytics）の **値の差し替え** は対象だが、**契約形** は不変。
- ゆえに IPC 契約ドリフト検証は **本タスク N/A**。設定値の整合は AC2（secret 差分 0）/ AC3（route 紐付き）で別途担保される。

## セキュリティリファクタ（値漏洩防止）

| 観点 | 確認事項 | 想定結果 |
| --- | --- | --- |
| secret 値混入 | runbook 本文・サンプル出力テンプレ・Phase 7 evidence に値が含まれないこと | `grep -E '^[A-Z_]+=.+$'` で 0 件 |
| 1Password 参照 | secret 投入時の値出典が `op://Vault/Item/Field` 形式または `.dev.vars` 経由のみと明記されていること | 直書きゼロ |
| token / API key | API Token 値・OAuth トークン値が runbook に転記されていないこと | CLAUDE.md「禁止事項」遵守 |
| ログ出力テンプレ | サンプル出力は key 名・行数・先頭/末尾の伏字のみ | 値そのものを含むサンプルゼロ |

### サンプル出力テンプレ（key 名のみ）

```text
# bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production
[
  { "name": "AUTH_SECRET" },
  { "name": "GOOGLE_CLIENT_ID" },
  { "name": "GOOGLE_CLIENT_SECRET" },
  { "name": "RESEND_API_KEY" }
]
# ↑ value は含まれない。実出力時も同形式であることを Phase 9 で確認。
```

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の成果物 path 一致 | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル名 | ls で照合 | 完全一致 |
| phase-XX.md 内の他 phase 参照リンク | `../phase-YY.md` を全件確認 | リンク切れ 0 |
| 正本 unassigned-task への参照 | `docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md` 実在確認 | 実在 |
| 親 runbook への追記先 path | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` 実在確認 | 実在（未作成の場合は Phase 5 で作成） |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 実在 |
| CLAUDE.md セクション参照 | 「Cloudflare 系 CLI 実行ルール」アンカー | 存在 |

## 共通化パターン

- runbook 章順: **「前提 → inventory → 突合 → 再注入 → 観測 → 判断記録」の 6 節順** で固定。
- コマンドラッパー: `bash scripts/cf.sh` のみ。`wrangler` 直接実行はリファクタで根絶。
- secret 出力: key 名のみ・値プレースホルダなし。
- runbook-as-source-of-truth: 親 UT-06-FU-A runbook が deploy 全体の正本、本タスクは Worker 名差分検証チェックリストの単一正本。
- AC ID は `AC1`〜`AC5` のハイフンなし表記で正本仕様 §2.2 に整合。
- 4 条件は「価値性 / 実現性 / 整合性 / 運用性」順で固定。

## 削除対象一覧

- Phase 1〜6 草稿に残った `wrangler` 直接実行サンプル（全件 `bash scripts/cf.sh` 経由へ書き換え）。
- 旧 Worker 名のハードコード仮置き（inventory で動的に取得する手順に書き換え）。
- 親 runbook と重複した認証・前提節（link 参照に置換）。
- 値プレースホルダ付きの secret サンプル（`AUTH_SECRET=xxxx` 形式は禁止）。
- 暫定タイトルの番号付き節（`3.1` 等）→ 意味付き節名へ。

## 実行手順

### ステップ 1: 重複洗い出し

- `grep -rn 'wrangler ' docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` を実行し、`wrangler` 直接実行が残っていないかチェック。
- 親 runbook ディレクトリ配下と本タスク仕様書を相互 grep し、同一コマンド・同一表記を表化。

### ステップ 2: Before / After テーブル作成

- 章立て / コマンド / 用語 / パス の 4 区分で記述。

### ステップ 3: 親 runbook との重複統合

- 6 件以上の重複候補を列挙し、link / 単一正本のいずれかへ寄せる。

### ステップ 4: セキュリティリファクタ

- secret 値混入経路をゼロにするテンプレを確定。

### ステップ 5: navigation drift 確認

- artifacts.json と各 phase-XX.md の path を照合。リンク切れ 0。

### ステップ 6: outputs/phase-08/refactoring-summary.md に集約

- 上記すべてを 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済みの章順・コマンド・用語を品質保証チェックリストの前提に使用 |
| Phase 10 | navigation drift 0 / `wrangler` 直接実行ゼロを GO/NO-GO の根拠に使用 |
| Phase 11 | staging で runbook の章順通りに実行できるか予行演習 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md に runbook 追記を反映 |
| 親 UT-06-FU-A | 本タスクの追記が親 runbook に統合されたことを確認 |

## 多角的チェック観点

- 価値性: DRY 化により deploy 承認直前の作業時間短縮 + ヒューマンエラー削減。
- 実現性: 章順 6 節が `bash scripts/cf.sh` 経由のみで完結し、現行ツールチェーンと矛盾しないか。
- 整合性: 親 runbook と本タスク追記が DRY、AC1〜AC5 と章順 6 節が 1:1 対応。
- 運用性: 章順が deploy 承認直前の時系列に沿い、運用者が上から順に実行可能。
- 認可境界: production deploy 実行が **本タスクスコープ外** という記述が runbook 冒頭に明示されているか。
- セキュリティ: secret 値混入経路がゼロ、value を含むサンプル出力ゼロ。
- 無料枠: 本タスクは Cloudflare 無料枠に影響なし（runbook 文書のみ）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 重複洗い出し（grep ベース） | 8 | spec_created | `wrangler` 直接実行ゼロを確認 |
| 2 | 章立て 6 節順固定 | 8 | spec_created | 前提→inventory→突合→再注入→観測→判断記録 |
| 3 | 親 runbook との重複統合 | 8 | spec_created | 6 件以上の link 集約 |
| 4 | コマンドサンプル `bash scripts/cf.sh` 統一 | 8 | spec_created | CLAUDE.md 整合 |
| 5 | 用語統一表確定 | 8 | spec_created | 仕様語↔実装語 |
| 6 | IPC 契約ドリフト N/A 明記 | 8 | spec_created | I/F 変更なし |
| 7 | セキュリティリファクタ（値漏洩防止） | 8 | spec_created | key 名のみテンプレ |
| 8 | navigation drift 確認 | 8 | spec_created | リンク切れ 0 |
| 9 | outputs/phase-08/refactoring-summary.md 作成 | 8 | spec_created | 全項目集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/refactoring-summary.md | リファクタリング結果（Before/After・重複統合・セキュリティ・navigation drift） |
| ドキュメント | outputs/phase-05/runbook-additions.md（差分のみ・Phase 5 owned） | 親 runbook への追記差分（重複削減後） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] Before / After 比較テーブルが 4 区分（章立て / コマンド / 用語 / パス）すべてで埋まっている
- [ ] 親 runbook との重複統合候補が 6 件以上列挙されている
- [ ] navigation drift（artifacts.json / index.md / phase-XX.md / 親 runbook path）が 0
- [ ] runbook-as-source-of-truth 原則が明文化されている
- [ ] `wrangler` 直接実行が本タスク全 phase 文書で 0 件
- [ ] secret 値混入経路がゼロ（key 名のみテンプレが確定）
- [ ] IPC 契約ドリフト検証 N/A の理由が明記
- [ ] outputs/phase-08/refactoring-summary.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物が `outputs/phase-08/refactoring-summary.md` に配置予定
- Before / After が 4 区分で網羅
- 重複統合候補 6 件以上
- navigation drift 0
- artifacts.json の `phases[7].status` が `spec_created`
- `grep -rn 'wrangler ' docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` が `bash scripts/cf.sh` 内のみ

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - DRY 化済みの章順・コマンド・用語表（Phase 9 静的検証の前提として参照）
  - `wrangler` 直接実行ゼロ状態の維持（Phase 9 で機械検証）
  - secret 値混入経路ゼロのテンプレ（Phase 9 で実出力スナップショットを確認）
  - navigation drift 0 状態の維持（Phase 9 link 検証で再確認）
  - 親 runbook 追記境界の明示（Phase 9 / Phase 11 で staging 予行演習）
- ブロック条件:
  - Before / After に空セルが残る
  - navigation drift が 0 にならない
  - `wrangler` 直接実行が残存
  - 親 runbook と本タスク runbook の重複が解消されない
