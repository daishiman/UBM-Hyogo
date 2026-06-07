# Skill Feedback Report — staging-mint-bearer-env-contract-guard

> 改善点なしでも出力必須。各 item に promotion target / no-op reason / evidence path を付す。

## task-specification-creator skill への feedback

| # | 観点 | 内容 | promotion target | evidence path |
| - | ---- | ---- | ---------------- | ------------- |
| FB-1 | 「役割単位の env 契約 drift を PR で機械検出する gate」型タスクの定型化 | 本タスクは「呼び出し側（workflow step）が要求する材料と、呼ばれる側（script）が必須化する材料の食い違い」を PR 時点で静的検出する gate を新設する型。同型（hook integrity / indexes drift / design tokens drift）の gate が既に存在し、`verify-*` 命名 + pure 関数（contract 算出）+ fixture test + workflow の 4 点セットが共通パターン。この「契約 SSOT を 1 定数に集約し caller / gate 双方が import する（二重定義排除）」設計を runtime-smoke 系 follow-up の定型として参照可能にすると再発防止に有効 | `references/` に「contract-drift-gate（caller vs callee env 契約の静的 fail-fast）」パターンとして追記候補 | 本サイクルでは skill 本体を改変せず、提案として記録（実反映は別 wave で skill owner が判断）。evidence: 本ファイル / phase-2 §2.3 / phase-9 §9.1 |
| FB-2 | degrade（セキュリティ緩和許容）の責務境界記述パターン | degrade の「判定」は mint script（入力フラグ `RUNTIME_SMOKE_MINT_DEGRADE` 読取）、「job skip の最終判定」は workflow（marker 結果 env `RUNTIME_SMOKE_MINT_DEGRADED` を読む `if`）と所有権を分離し、入力フラグと結果 marker を別名にする運用は「入力と結果の取り違え」事故を防ぐ。staging 限定 / production 非適用の境界を AC（AC-10/AC-11）に明示する記述が有効 | `references/` の NON_VISUAL / ci-gate タスク節に「degrade の状態所有権分離（入力フラグ ≠ 結果 marker）」を定型として追記候補 | 提案記録のみ（即時 skill 改変なし）。evidence: phase-2 §2.5 / §2.7 / phase-9 §9.1.3 / 不変条件 #4 |

## aiworkflow-requirements skill への feedback

| # | 観点 | 内容 | promotion target | no-op reason / evidence path |
| - | ---- | ---- | ---------------- | ---------------------------- |
| FB-3 | CI/script 層の派生物に対する Step 2 判定 | 本タスクは新 env（`MINT_ROLES` / `RUNTIME_SMOKE_MINT_DEGRADE`）と新 CLI 契約（`--roles`）を導入するが、これらは API/IPC/UI/auth/schema/Secret 正本の契約変更ではない CI/script 派生物。Step 2 = N/A だが「派生物の新 env / CLI 契約は documentation-changelog に記録する」運用が再現性に有効 | no-op（aiworkflow-requirements 正本の新規 I/F 追加なし） | no-op reason: ドメイン契約の新規インターフェース追加が無い（CI/script 改修のみ）。新 env / CLI 契約は documentation-changelog.md に記録済み。evidence: system-spec-update-summary.md Step 2 / documentation-changelog.md「新 env / 新 CLI 契約の記録」 |

## skill-creator skill への feedback

| # | 観点 | 内容 | 判定 |
| - | ---- | ---- | ---- |
| FB-4 | skill 本体の authoring / update プロセス gap | 本タスクは `.claude/skills/**` のファイルを増減せず、skill 構造・authoring プロセスに対する gap を検出しなかった | no-op（skill-authoring プロセスへの改善要素なし。evidence: 本タスクは scripts/smoke + .github/workflows + 仕様書のみ対象） |

## 所有スキルファイルへの反映方針

- 本タスクは `implemented_local_evidence_captured`。skill 本体への即時反映は、同種の CI/script role-scoped env contract pattern がもう一度発生した時点で昇格判断する。今回は aiworkflow-requirements ledger / artifact inventory に同期する。
- FB-1 / FB-2 は task-specification-creator の reference 追記**候補**として記録（実反映は skill owner 判断・別 wave）。FB-3 / FB-4 は no-op（理由は各行に明記）。
- 本サイクルで skill 改善を行っていないため、対象 skill の `SKILL.md` / `LOGS.md` への履歴追記は不要（no-op）。
