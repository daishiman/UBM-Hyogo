# Phase Template Phase1

> 親ファイル: [phase-templates.md](phase-templates.md)

## 対象

Phase 1: 要件定義。

## テンプレート

```markdown
# Phase 1: 要件定義

## メタ情報

| 項目             | 値                                         |
| ---------------- | ------------------------------------------ |
| Phase            | 1                                          |
| 機能名           | {{FEATURE_NAME}}                           |
| 作成日           | {{CREATED_DATE}}                           |
| タスク種別       | {{TASK_TYPE}}（feature/refactor/fix/docs-only） |
| visualEvidence   | {{VISUAL_EVIDENCE}}（true/false）          |
| scope            | {{SCOPE}}（実装範囲 or 「テンプレート作成のみ」） |

> **必須項目**: 上記 6 行は省略不可。`docs-only` の場合は `scope` に handoff 先 task spec のパスを併記する（出典: T-6 / Issue #161）。

## 目的

タスクの目的、スコープ、受け入れ基準を明文化する。

## 実行タスク

- 要件抽出: ユーザー要求から機能要件・非機能要件を抽出
- 受け入れ基準作成: 各要件に対して検証可能な受け入れ基準を定義
- FR/NFR分類: 機能要件と非機能要件を分類し優先度を設定

## 参照資料

| 資料名       | パス                        | 説明             |
| ------------ | --------------------------- | ---------------- |
| システム要件 | `docs/00-requirements/*.md` | 既存システム要件 |
| ユーザー要求 | （会話履歴参照）            | 元のユーザー要求 |

## 実行手順

### 0. P50チェック: 既実装状態の調査（必須）

Phase 1 開始時に、対象ファイルの現在の実装状態を確認する。

複数の実装方針がコスト・runtime topology・外部 mutation を分岐させる場合（例: Paid plan 移行 vs 専用 Worker 分離、外部 SaaS 契約変更、production runtime 操作）は、Phase 2 に進む前にユーザー決定を取得し、採用方針を Phase 1 の acceptance criteria に固定する。未決定の複数アーキ分岐を Phase 2 以降へ持ち込まない。

```bash
# 対象ファイルの最近のコミット履歴
git log --oneline -20 -- <対象ファイルパス>

# 対象関数/機能が既に実装されているか確認
grep -n "<対象関数名>" <対象ファイルパス>
```

#### landed 実装検出時の existing-hardening 分岐（2026-06-01 追加）

P50 で対象機能が既に dev / current branch に landed 済みと確認できた場合、greenfield 新規実装として仕様書を進めない。Phase 1 で `git log` / `rg --files` / `rg -n` の実測結果を表にし、`metadata.implementation_mode` を `existing-hardening`（またはより具体的な `existing-*-hardening`）へ再分類する。

必須記録:

| 項目 | 内容 |
| --- | --- |
| landed reference | PR 番号 / commit hash / current branch 上の確認コマンド |
| current code anchor | 実在する route / component / schema / test / endpoint |
| source-task drift | 元タスク・旧仕様の path / API / UI wording と現行コードの差分 |
| canonical decision | 実コードを正本にするか、旧仕様を復元するか |
| action | no-op documentation / regression test 追加 / adapter 補正 / follow-up escalation |

旧仕様に壊れた endpoint path や古いファイル名が残っている場合は、Phase 1 の「乖離補正」表で現行コードへ補正する。補正を記録せず Phase 2 以降へ旧文字列を持ち込むことは禁止する。

#### Props/型前提条件の確認（P65対策）

- 対象コンポーネントの Props 型定義を確認し、設計で前提とする Props が実在するか検証する
- 対象の型定義（SkillExecutionStatus 等）の現在の値セットを確認し、設計で前提とする値が実在するか検証する
- 存在しない場合は「新規追加」として Phase 2 で変更先ファイルパスを明記する（P32 準拠）

#### Helper / 型シグネチャ verbatim 確認（Issue #224 / #1088 対策）

既存 helper / shared schema / viewmodel type を再利用するタスクでは、Phase 1 で実コードのシグネチャを verbatim に確認し、Map / 配列 / optional / strict などの return shape を誤読しない。

**未実装フィールドを既存 producer に足すタスク**（例: 戻り値型へ 1 フィールド追加）では、issue 本文の抽象的な producer 名（「sync use-case」等）を鵜呑みにせず、実体の戻り値型・関数を**行番号レベルで pin** する。似た名前のラッパー（route 層 / 別 use-case の同名処理）へ誤着地すると、本来の producer を素通りして無効な diff になる。

Phase 1 outputs には以下の表を必ず含める:

| 対象 | 実コード anchor | verbatim signature / shape | 設計上の扱い |
| --- | --- | --- | --- |
| helper | `apps/api/src/repository/...` | 例: `Promise<MemberTagWithDefinition[]>`（フラット配列） | use-case 層で groupBy |
| shared zod | `packages/shared/src/zod/...` | optional / strict / nullable の実値 | response contract |
| shared type | `packages/shared/src/types/...` | public export の有無 | consumer 影響 |
| producer | `apps/api/src/jobs/...`（行番号付き） | 例: `ResponseSyncResult` + `runResponseSync()` の全 return path | 新規 field 追加先を verbatim に pin（似た名前のラッパーへ誤着地しない） |

誤読が見つかった場合は Phase 2 以降の設計例を実コードに合わせて補正し、Phase 12 の skill feedback に再発防止を記録する。

#### Issue / unassigned-task 前提の実コード検証（Issue #1065 対策）

Issue / unassigned-task が記述する「現状の挙動・契約・コード構造」は陳腐化している場合がある。Phase 1-2 では、設計前提として引用する関数契約・呼び出し関係・データフローを、必ず現行コードを Read して検証する。

- issue が「関数 A と関数 B は別契約」等と記述していても、現行コードで A が B の直接 alias（同一関数）だったケースがある（issue-1065: `parseShellCollapsedCookie` は cookie **値**のみを受ける value parser で、`readCollapsedFromCookieString` はその直接 alias。issue が主張した「cookie ヘッダ全体 vs 値」の契約差は現行コードに存在しなかった。ヘッダ文字列を split して値を抜く処理は別関数 `readCollapsedFromDocument` が担っていた）。
- 前提誤りを鵜呑みにすると、存在しない契約差を前提に過剰スコープな設計を生む。
- 検証で前提誤りを見つけたら、`implementation-guide.md` / `phase-1-requirements.md` に **訂正注記**として残し、次の人が再び drift と誤認しないようにする。Phase 2 以降の設計例も実コードに合わせて補正する。
- GitHub Issue ラベルが `docs-only` でも、root cause（SSOT 違反 = dead alias / dead code 残存）の解消にコード変更が必要なら、CONST_004（ラベルより実態優先）で **実装仕様書**として分類する。昇格判断は `artifacts.json` の `spec_classification_note` に残し、後続レビューで分類根拠を追えるようにする（[phase12-skill-feedback-promotion.md](phase12-skill-feedback-promotion.md) Applied Examples 参照）。

#### D1 migration 前提の現行再スコープ（Issue #1105 対策）

D1 migration / table rebuild / FK 制約追加を含むタスクでは、Issue 本文や古い未タスクに書かれた migration 番号・既存 schema をそのまま採用しない。Phase 1 で現行 `apps/api/migrations/` を実測し、番号占有・後続 ALTER・消失する dependent object を表に固定する。

必須確認:

```bash
ls apps/api/migrations/*.sql | sort | tail -10
rg -n "CREATE TABLE|ALTER TABLE|CREATE INDEX|CREATE TRIGGER|CREATE VIEW|FOREIGN KEY|REFERENCES|PRAGMA foreign_keys" apps/api/migrations
```

Phase 1 outputs には以下を記録する:

| 項目 | 内容 |
| --- | --- |
| issue 記載 migration 番号 | Issue / source task が主張する番号・ファイル名 |
| current occupied prefix | 現行 migration directory で実際に占有済みの番号 |
| canonical new prefix | 本タスクで採用する新規番号。重複時は現行 directory を優先 |
| current table columns | baseline `CREATE TABLE` と後続 `ALTER TABLE` を合成した現行列 |
| rebuild dependent objects | DROP/RENAME で消失する INDEX / VIEW / TRIGGER と再作成方針 |
| repository precedent | FK / PRAGMA / rebuild 前例の有無。前例ゼロなら local D1 test と user-gated remote D1 検証境界を分ける |

テーブル再構築 migration では、抽象 NOTE（例: "INDEX/VIEW 棚卸し"）を現行 schema の具体識別子へ落とし込み、消失する INDEX / VIEW / TRIGGER の再作成を AC に昇格する。後続 `ALTER TABLE` で追加された列（例: `notification_opt_out`）をコピー対象から漏らした仕様は Phase 2 へ進めない。

## 統合テスト連携【必須】

統合テストの再実行とゲート判定:

| 判定項目                 | 基準 | 結果       |
| ------------------------ | ---- | ---------- |
| ユニットテストLine       | 80%+ | {{RESULT}} |
| ユニットテストBranch     | 60%+ | {{RESULT}} |
| ユニットテストFunction   | 80%+ | {{RESULT}} |
| 結合テストAPI            | 100% | {{RESULT}} |
| 結合テストシナリオ正常系 | 100% | {{RESULT}} |
| 結合テストシナリオ異常系 | 80%+ | {{RESULT}} |

## 成果物

| 成果物             | パス                                  | 説明               |
| ------------------ | ------------------------------------- | ------------------ |
| 要件定義書         | `outputs/phase-1/requirements.md`     | 機能要件・非機能要件 |

## 完了条件

- [ ] 機能要件が全て抽出されている
- [ ] 受け入れ基準が検証可能な形で定義されている
- [ ] FR/NFR分類と優先度が設定されている
- [ ] **本Phase内の全タスクを100%実行完了**

## 次のPhase

Phase 2: 設計
```

## 1.X Schema / 共有コード Ownership 宣言（並列 wave 必須）

並列 wave（同一フェーズで複数タスクが同時進行する構成）では、共有 schema（D1 テーブル列追加 / Zod schema / packages/shared exports など）や `_shared/` 配下の共通コードに対する **ownership を Phase 1 で必ず宣言** する。宣言しないまま進めると、04b で発生した「`admin_member_notes.note_type` 列追加が 02c 範囲のはずだったが 04b で実施せざるを得なかった」のような wave 越境が発生し、artifacts.json の整合と PR 単位の責務分離が崩れる。

Phase 1 outputs（`requirements.md` または `artifacts.json`）に以下のチェックリストを必ず含める:

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | 例: `admin_member_notes.note_type` 列追加 / `packages/shared/zod/viewmodel` exports |
| 本タスクが ownership を持つか | yes / no（no の場合は ownership wave を明示） |
| 他 wave への影響 | consumer wave の列挙（例: 04b は consumer / 07a は producer） |
| 競合リスク | 同 schema を編集する並列 wave が他にあるか / 解決策（順序付け or 部分分割） |
| migration 番号 / exports 改名の予約 | 重複防止のための番号予約・命名予約 |
| test file ownership（並列 wave） | `__tests__/` 配下の cross-cutting test（authz / invariants / brand-type 等）はどの wave が ownership を持つか。wave 跨ぎでの重複作成を防ぐ（08a で `apps/api/src/__tests__/{authz-matrix,brand-type,invariants}.test.ts` を 08 wave 集約と確定した実例に倣う） |

宣言が `no`（owner ではない）にも関わらず編集を実施した場合は、`unassigned-task-detection.md` でフォローアップタスクとして起票し、正式 owner wave へ補強差分の取り込みを依頼する。

参考実例: 04b では `admin_member_notes.note_type` を additive migration として 04b 内で実施し、Phase 12 で「02c 範囲の補強」として明示記録した（`04b-parallel-member-self-service-api-endpoints/outputs/phase-12/unassigned-task-detection.md`）。

### Closed Issue / 既実装 task の canonical owner 確認

GitHub Issue や旧タスク仕様が closed / completed の場合は、候補ファイル名をそのまま新設しない。Phase 1 で以下を表にする。

| 項目 | 確認内容 |
| --- | --- |
| issue original candidate | 旧仕様が要求したファイル名・関数名 |
| current code anchor | 現行実装の実在ファイル・export |
| canonical owner | 新設せず再利用する owner |
| duplicate risk | 旧候補名で新設した場合の重複リスク |
| action | 新設 / adapter 追加 / regression test 追加 / no-op |

旧候補名と現行 owner が異なる場合は、Phase 2 以降の実装計画を current code anchor に合わせて更新する。

### Existing UI Route / Component Inventory Gate

UI 実装タスクでは、元仕様書が `new` と書いていてもそのまま採用しない。Phase 1 で current worktree の route / component / helper を `rg --files` で確認し、実在する場合は `implementation_mode` を `existing-*-hardening` / `existing-*-alignment` に再分類する。存在しない `apps/web/src/app`、旧 `src/features/admin`、旧 `src/lib/api/admin-*` などの stale path を Phase 2 以降に持ち込んではならない。

必須確認:

```bash
rg --files apps/web/app apps/web/src/components apps/web/src/lib | rg '<route-or-feature-keyword>'
rg -n "app\\.(get|post)|\\.get\\(|\\.post\\(" apps/api/src/routes/admin
```

Phase 1 outputs には以下を記録する:

| 項目 | 内容 |
| --- | --- |
| current route path | 実在する `apps/web/app/.../page.tsx` |
| current component owner | 実在する component / client shell |
| current helper owner | `server-fetch.ts` / `api.ts` 等の既存 helper |
| stale candidate path | 元仕様にあったが作らない path |
| action | new / patch existing / no-op / split follow-up |

参考実例: task-17 admin schema/conflicts/audit では `apps/web/app/(admin)/admin/{schema,identity-conflicts,audit}/page.tsx` と `apps/web/src/components/admin/*` が既に存在したため、`new` ではなく `existing-admin-contract-hardening` に再分類した。

## 1.X 外部 SaaS 無料枠仕様調査（リスク前置き）

監視・分析・認証等の SaaS 連携がある場合、Phase 1 ヒアリングで以下 3 点を必ず確保する:

1. **保存期間 / API quota / monthly cap**: 公式ドキュメントの最新値を Phase 1 outputs に記録（例: WAE 保存期間 31 日、UptimeRobot 5 分間隔）
2. **upgrade path と段階化**: 無料 → 有料移行の閾値・コスト・移行手順
3. **無料枠消費推定**: 月次推定値と SLA との照合

不確定な値は `outputs/phase-01/requirements.md` に「Wave N 実装直前に再確認」と注記し、IMPL タスクの `実装前ゲート` に転記する。SaaS 仕様の改定により設計時前提が陳腐化するリスクを抑える。

参考実例: UT-08 monitoring-alert-design では Phase 10 MINOR-02 として「Wave 2 着手直前に WAE 無料枠を公式情報で再確認」を明示化。

## 関連ガイド

- [phase-template-core.md](phase-template-core.md) — Phase 1-3 共通骨格

## Phase 1 必須入力: artifacts.json.metadata.visualEvidence

Phase 1 の DoD として以下を必須化する。未設定の場合、Phase 11 縮約テンプレ / VISUAL UI task テンプレの
発火判定が不可能になり、Phase 1 を差し戻す。

| メタフィールド | 必須値 | 確定タイミング |
| --- | --- | --- |
| `metadata.taskType` | `docs-only` / `implementation` / `skill-improvement` 等 | Phase 1 完了時 |
| `metadata.visualEvidence` | `VISUAL` / `NON_VISUAL` | Phase 1 完了時（Phase 5 で再判定） |
| `metadata.scope` | タスクの責務領域 | Phase 1 完了時 |
| `metadata.workflow_state` | `spec_created` / `in_progress` / `completed` | Phase 1 完了時（Phase 12 close-out で更新可否判定） |

判定コマンド:

```bash
jq -e '.metadata | (.taskType and .visualEvidence and .scope and .workflow_state)' \
  docs/30-workflows/<task>/artifacts.json \
  || echo "Phase 1 メタ未確定: 差戻し"
```

詳細な発火マトリクスは SKILL.md §「タスクタイプ判定フロー（docs-only / NON_VISUAL）」を参照。
