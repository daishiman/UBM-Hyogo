# Phase 8: DRY 化 / 仕様間整合

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / 仕様間整合 |
| 作成日 | 2026-04-30 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| タスク分類 | specification-design（contract DRY） |

## 目的

本タスクは「コードを書かない契約決定タスク」であり、Phase 1〜7 で蓄積した canonical set 決定 / マッピング表 / shared 配置 / 書き換え対象リスト / runbook / AC マトリクスが **複数ファイルに重複転記** されていないかを単一正本観点で検証する。docs-only タスクの DRY は実装の抽出ではなく **「同一値ドメインを定義するセクションが複数 Phase に散在しない」「仕様語と実装語の対応表が唯一」「関連タスク（U-UT01-07/09/10）の責務へ侵食しない」** の 3 軸で構成する。

ここでの drift を放置すると、UT-04 / UT-09 が後段で実装に着手したとき「どの Phase の値ドメインが正本か」を判断する手間が生じ、結果として canonical 統一というタスクの目的そのものが崩れる。

## 実行タスク

1. canonical 値ドメイン（status 5 値 / trigger_type 3 値）の **single-source 化** を確認する（完了条件: `outputs/phase-02/canonical-set-decision.md` を唯一正本とし、Phase 5 / Phase 7 は値リテラルの再列挙ではなく link 参照にとどめている）。
2. 既存値 → canonical 値マッピング表の **single-source 化** を確認する（完了条件: `outputs/phase-02/value-mapping-table.md` のみが定義箇所、Phase 5 contract-runbook と Phase 7 ac-matrix は表を再掲しない）。
3. 仕様語 ↔ 実装語の対応表（例: 仕様 `sync_log` ↔ 物理 `sync_job_logs`）が U-UT01-07 と本タスクで二重定義になっていないかを確認する（完了条件: 本タスクは「値ドメインのみ」を扱い、テーブル名対応は U-UT01-07 を参照する link のみ）。
4. shared 配置決定（`packages/shared/src/types/sync.ts` + `packages/shared/src/zod/sync.ts`）が U-UT01-10 の責務と **直交 or 統合** どちらかを明記する（完了条件: 本タスクの AC-4 と U-UT01-10 起票 .md の「含む / 含まない」セクションが背理しない）。
5. 関連タスク（U-UT01-07 / U-UT01-09 / U-UT01-10）の責務との重複を排除する（完了条件: 直交関係表が単一の正本（本タスク index.md）に存在し、各 phase は再掲しない）。
6. doc 内リンク（`outputs/phase-XX/*.md` / `index.md` / `artifacts.json` / 関連タスク dir）の navigation drift を確認する（完了条件: リンク切れ 0 / 参照名と実ファイル名一致）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/index.md | 用語・直交関係の正本 |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md | 起票仕様 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-07-sync-naming-alignment.md | 命名整合タスク（責務分離確認用） |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-sync-retry-offset-unification.md | retry/offset タスク（責務分離確認用） |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-10-shared-sync-contract-types.md | shared 契約型タスク（統合判断対象） |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-08.md | DRY 化観点の参照事例 |

## Before / After 比較テーブル

### 値ドメイン定義の重複

| 対象 | Before（仮想 drift） | After（本 Phase 確定） | 理由 |
| --- | --- | --- | --- |
| `status` canonical 5 値 | Phase 2 / Phase 5 / Phase 7 で個別列挙される可能性 | `outputs/phase-02/canonical-set-decision.md` のみが正本、Phase 5 / 7 は link 参照 | docs-only タスクの DRY は「値ドメインの単一定義箇所」が肝 |
| 既存値 → canonical マッピング | 各 Phase で表が散在しがち | `outputs/phase-02/value-mapping-table.md` のみが正本 | 後発 grep 漏れの根本対策 |
| 直交関係表 | index.md / 各 phase / 起票.md で再掲しがち | `index.md` の主要参照 + 起票.md の §直交関係 のみ、phase は link | 重複定義 0 |
| 仕様 ↔ 実装語対応表 | U-UT01-07 と本タスクで二重定義 | U-UT01-07 が「テーブル名対応」、本タスクは「値ドメイン対応」のみ | 07a feedback の正本維持 |

### 命名規則の整合（仕様語 ↔ 実装語）

| 対象 | 仕様（UT-01 論理） | 実装（apps/api 既存） | 担当タスク |
| --- | --- | --- | --- |
| 物理テーブル名 | `sync_log` | `sync_job_logs` / `sync_locks` | **U-UT01-07** |
| 値ドメイン: status | `pending\|in_progress\|completed\|failed` | `running\|success\|failed\|skipped` | **本タスク (U-UT01-08)** |
| 値ドメイン: trigger | `manual\|cron\|backfill` | `admin\|cron\|backfill` | **本タスク (U-UT01-08)** |
| retry 上限値 | （未定） | `DEFAULT_MAX_RETRIES=5` | **U-UT01-09** |
| processed_offset | （未定） | （未実装） | **U-UT01-09** |
| shared 型 / Zod 実装 | （配置判断のみ） | （未実装） | **U-UT01-10**（本タスクは判断まで） |

> 各行の「担当タスク」が一意であることが直交性の証拠。本タスクは status / trigger_type 行以外を扱わない。

### 配置判断の重複（shared）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| shared 配置決定 | 本タスク Phase 2 + U-UT01-10 起票.md で乖離可能 | `outputs/phase-02/shared-placement-decision.md` を唯一正本、U-UT01-10 は本決定を引用する形に統一 | 配置判断は本タスクの責務、実装コミットは U-UT01-10 の責務 |
| 統合 / 分離判断 | 不明瞭 | AC-4 で「U-UT01-10 と統合 / 分離」のいずれかを **明示記述** | 後続着手の混乱回避 |

## 重複削除の対象一覧

| # | 重複候補 | 削除方針 | 適用範囲 |
| --- | --- | --- | --- |
| 1 | 値ドメイン 5 値 / 3 値の列挙 | Phase 2 のみ正本、Phase 5 / 7 は link | 全 phase-XX.md |
| 2 | 既存値 → canonical 変換マッピング | Phase 2 のみ正本、Phase 5 contract-runbook は SQL 疑似コードのみ保持 | Phase 5 / 7 |
| 3 | 直交関係表 | index.md + 起票.md のみ正本 | 全 phase-XX.md |
| 4 | 仕様語 ↔ 実装語対応 | 「テーブル名対応」は U-UT01-07、「値ドメイン対応」は本タスク Phase 2 | 本タスク全 phase |
| 5 | shared 配置の根拠 | Phase 2 shared-placement-decision のみ | 本タスク全 phase + U-UT01-10 |
| 6 | 苦戦箇所 5 件の説明 | 起票.md のみ正本、各 phase は ID 参照 | 全 phase-XX.md |

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の成果物 path 一致 | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル名 | ls で照合 | 完全一致 |
| index.md `主要参照` 表のパス | artifacts.json と突き合わせ | 完全一致 |
| phase-XX.md 内の他 phase 参照リンク | `../phase-YY.md` を全件確認 | リンク切れ 0 |
| 起票 unassigned-task への参照 | `docs/30-workflows/unassigned-task/U-UT01-08-...md` 実在確認 | 実在 |
| 関連タスク参照 | U-UT01-07 / 09 / 10 起票 .md の path | 実在 |
| UT-04 / UT-09 への引き渡し path | 各タスク dir の index.md | 実在 |
| GitHub Issue link | Issue #262 (CLOSED) | 実在（close 状態のまま参照のみ） |

## 共通化パターン

- docs-only タスクでは **schema 抽出ではなく「値ドメインの単一定義箇所」が DRY の本体**。
- 同じ canonical 値リテラルを 2 箇所以上で記述したら必ず一方を link 参照に置き換える。
- 直交関係表は index.md を正本、phase は文中で link のみ。
- 関連タスクの責務に踏み込まない（テーブル名 / retry / 実装コミットは他タスク）。
- 4条件は「価値性 / 実現性 / 整合性 / 運用性」の順序固定。

## 実行手順

### ステップ 1: 値ドメイン重複の洗い出し
- `grep -rn "pending\|in_progress\|completed\|skipped\|running\|success" docs/30-workflows/u-ut01-08-sync-enum-canonicalization/` を実行。
- Phase 2 以外で値リテラルが列挙されている箇所を表化。

### ステップ 2: マッピング表の重複除去
- `outputs/phase-02/value-mapping-table.md` のみが詳細定義、他 Phase は link になっているかを確認。

### ステップ 3: 直交関係の単一正本化
- index.md / 起票.md / 各 phase-XX.md で直交関係表が複数定義されていないかを grep。

### ステップ 4: shared 配置の単一正本化
- `outputs/phase-02/shared-placement-decision.md` を正本、U-UT01-10 起票.md がこれを引用しているかを確認。

### ステップ 5: navigation drift 確認
- artifacts.json の outputs path と各 phase-XX.md の参照 path を照合。

### ステップ 6: outputs/phase-08/main.md に集約
- 上記 5 観点の結果と Before / After 表を 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済みの単一正本 path を品質保証 link 検証の前提に使用 |
| Phase 10 | navigation drift 0 を GO/NO-GO の根拠に使用 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md に DRY 化結果を反映 |
| UT-04 | canonical 値ドメイン引き渡し（CHECK 句に使用予定） |
| UT-09 | 既存実装書き換え対象（書き換え対象リスト Phase 5）を引き渡し |
| U-UT01-10 | shared 配置決定（統合 / 分離判断）を引き渡し |

## 多角的チェック観点

- 価値性: DRY 化により後続 UT-04 / UT-09 着手時の「どの値ドメインが正本か」を即特定可能。
- 実現性: docs-only タスクのため抽出コストは grep + 表化のみで完結する。
- 整合性: 不変条件 #4（admin-managed data 分離 = `triggered_by` 別カラム）/ #5（D1 access apps/api 内）に違反しない。
- 運用性: 命名一貫性で grep 検索性が向上、レビュー時の値ドメイン突合が容易。
- 認可境界: trigger_type の actor 軸と mechanism 軸の分離（`triggered_by` 別カラム化）により admin 権限境界を schema レベルで識別可能。
- 無料枠: docs-only のため D1 storage 影響なし。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 値ドメイン重複洗い出し | 8 | spec_created | grep 結果を表化 |
| 2 | マッピング表 single-source 化 | 8 | spec_created | Phase 2 を正本 |
| 3 | 直交関係表 single-source 化 | 8 | spec_created | index.md を正本 |
| 4 | 仕様 ↔ 実装語対応表の責務分離 | 8 | spec_created | U-UT01-07 と背理しない |
| 5 | shared 配置の単一正本化 | 8 | spec_created | U-UT01-10 統合 / 分離明示 |
| 6 | navigation drift 確認 | 8 | spec_created | リンク切れ 0 |
| 7 | outputs/phase-08/main.md 作成 | 8 | spec_created | 全項目集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（Before/After・重複削除・navigation drift・直交関係） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] 値ドメイン定義の重複が 0（Phase 2 のみ正本）
- [ ] マッピング表の重複が 0（Phase 2 のみ正本）
- [ ] 直交関係表の重複が 0（index.md + 起票.md のみ正本）
- [ ] 仕様語 ↔ 実装語対応が U-UT01-07 と背理していない
- [ ] shared 配置決定が U-UT01-10 と統合 / 分離いずれかで明記
- [ ] navigation drift（artifacts.json / index.md / phase-XX.md / outputs path）が 0
- [ ] outputs/phase-08/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定
- Before / After が 3 区分（値ドメイン / 命名整合 / 配置判断）で網羅
- 重複削除候補 6 件以上
- navigation drift 0
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - DRY 化済みの単一正本 path 表（Phase 9 link 検証の前提として参照）
  - 直交関係の単一正本（index.md）
  - shared 配置の統合 / 分離判断（U-UT01-10 への申し送り）
  - navigation drift 0 状態の維持（Phase 9 link 検証で再確認）
- ブロック条件:
  - 値ドメイン or マッピング表が複数 Phase に重複定義されたまま
  - 関連タスク（07/09/10）と責務が重なる記述が残る
  - shared 配置判断が「未決」のまま Phase 9 に進む
  - navigation drift が 0 にならない
