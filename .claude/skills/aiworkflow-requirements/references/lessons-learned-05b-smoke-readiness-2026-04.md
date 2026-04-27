# Lessons Learned — 05b-parallel-smoke-readiness-and-handoff（2026-04）

> 親ファイル: [lessons-learned-current-2026-04.md](lessons-learned-current-2026-04.md)
> 分離理由: `lessons-learned-current-2026-04.md` が 500 行制限を超過しているため、05b 系教訓を独立ファイル化（責務分離）

---

## v3.16.0 (2026-04-26) — `05b-parallel-smoke-readiness-and-handoff` Phase 12 close-out

対象タスク: 05b-parallel-smoke-readiness-and-handoff（docs-only / `spec_created` 分類）
スコープ: task root path drift 補正（`docs/01-infrastructure-setup/05b-*/` → `docs/05b-*/`）、Phase 2/5/10/11/12 個別成果物作成、artifacts.json と Phase 1-12 status 同期、Phase 11 UI 変更なしの代替証跡（manual-smoke-log / link-checklist）整備、Phase 13 は `approval_required` で commit/PR 未実行。

### L-05B-001: docs-only / spec_created タスクの Phase 12 close-out は同一 wave で 4 軸を閉じる

- **症状**: docs-only / `spec_created` タスクの Phase 12 close-out で「成果物ファイル存在」だけを確認すると、(1) artifact parity（root `artifacts.json` と `outputs/artifacts.json` / `index.md` の Phase 1-12 status 同期）、(2) LOGS 記録、(3) task root path drift（祖先ディレクトリ残存）、(4) 旧パス残存検出の各軸で drift が残り、downstream handoff が壊れる
- **解決**: Phase 12 close-out checklist を「成果物存在」「artifact parity」「LOGS 記録」「path drift / 旧パス残存検出」の 4 軸独立とし、すべて同一 wave で閉じる。検出は `grep -r "<旧パス>" <repo>` を verification-report の証跡として固定する
- **Why**: docs-only タスクは「コードが動かないので動作確認できない」分、ファイル参照整合と path canonical 化が唯一の品質ゲート。1 軸でも drift が残ると後続タスクが旧パスを引き、handoff の正本が分裂する
- **How to apply**: contract-only / docs-only / `spec_created` 分類の Phase 12 では、次の 4 項目を verification-report に必須欄として記録する。(a) 必須成果物全数 PASS（Phase 2/5/10/11/12 個別 artifact 含む）、(b) `artifacts.json` ↔ `outputs/artifacts.json` ↔ `index.md` の Phase 1-12 status 完全一致、(c) LOGS.md 当日エントリ追加、(d) `grep` による旧パス残存ゼロ確認。Phase 11 が UI 変更なしの場合は screenshot N/A とし、`manual-smoke-log.md` / `link-checklist.md` を代替証跡として固定する

### L-05B-002: task root の祖先ディレクトリ → `docs/` 直下移動は legacy-ordinal-family-register への登録を必須化

- **症状**: 05b は元々 `docs/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/` 配下にあったが、canonical path として `docs/05b-parallel-smoke-readiness-and-handoff/` に移動された。03 系（`03-serial-data-source-and-storage-contract`）と同型の path drift 補正だが、register に 05b 行が登録されないと旧 citation / 旧 log / 旧 PR コメントの参照解決ができなくなる
- **解決**: 祖先ディレクトリ（`docs/01-infrastructure-setup/<task>/`）から `docs/<task>/` への task root リネームは、03 系エントリ書式を踏襲して `legacy-ordinal-family-register.md` の "Current Alias Overrides" 表に必ず行追加する。`last-verified` は移動を確認した日付を記録する
- **Why**: register は旧 citation を current path に引き直すための正本である。同型の移動を行ったタスクが 1 件でも未登録だと、register の網羅性が崩れて「register を見れば current path がわかる」という不変条件が壊れる
- **How to apply**: 任意のタスクで task root を祖先ディレクトリから `docs/` 直下に移動した直後、`legacy-ordinal-family-register.md` に `| <task-id> task root | <legacy path> | <current path> | <canonical location> | <YYYY-MM-DD> |` 行を追加し、ヘッダの「最終更新日」を同日に更新する。register 更新は task root rename と同一 wave で実施し、後回しにしない（後回しは drift 蓄積の主因）
