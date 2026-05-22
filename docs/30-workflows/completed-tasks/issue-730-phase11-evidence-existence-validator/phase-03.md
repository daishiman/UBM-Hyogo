# Phase 3 — 設計レビュー

## 1. 責務分離レビュー

| 既存 validator | 対象 | 本タスク後の関係 |
| --- | --- | --- |
| `validate-phase11-canonical-evidence-paths.js` | `phase11-evidence-canonical-paths.schema.json` 準拠 JSON manifest | **対象不変**。JSON manifest 検証のみ担当 |
| `validate-phase11-screenshot-coverage.js` | VISUAL タスクの screenshot 網羅 | **対象不変**。NON_VISUAL 対象外 |
| `verify-compliance-file.ts`（拡張後） | `phase12-task-spec-compliance-check.md` の canonical heading + Phase 11 evidence existence | **新責務追加**。markdown 内の `present` 宣言突合を担当 |

結論: 責務重複なし。Issue #730 の要請（「`status === present` 宣言と実体ファイル不在を機械突合」）に対し、markdown-driven な経路が唯一不在だったため、本タスクの追加で gap が埋まる。

## 2. canonical heading SSOT との整合

`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の `## Required Sections` は `4. Phase 11 evidence file inventory` を canonical heading として固定している。本タスク parser はこの heading を直接ターゲットにする。template 側 heading 変更時は本タスクの `parse-phase11-evidence.ts` の regex も同 PR 内で更新する（PR チェックリスト Phase 13）。

## 3. trigger 戦略

CI workflow `verify-phase12-compliance.yml` は MVP-PAUSE で `pull_request` トリガーがコメントアウト中。本タスクでは復活させない（CLAUDE.md `# MVP-PAUSE 2026-05-15` の運用方針に従う）。`workflow_dispatch` 経路で新ロジックが流れることを Phase 11 で手動確認する。

## 4. リスクと対処

| リスク | 対処 |
| --- | --- |
| 既存 `pass` fixture を改修すると別 spec が壊れる | fixture 改修と spec 編集を同一 PR で行う。`pnpm test:phase12-compliance` の全 case green を Phase 11 で確認 |
| markdown table parser の正規表現が脆い | 区切り行 `^\s*\|[\s\-:|]+\|\s*$` を厳格判定し、unit test で 4 列以上 / backtick 装飾 / 空セルを網羅 |
| docs-only 3 点以外の代替証跡パターンが将来増える | `references/phase-11-non-visual-alternative-evidence.md` 側で証跡リストを管理。parser は path 列を信用するのみで、許可リスト hard-code はしない |
| `status` 列の表記揺れ（`Present` / `〇` / `OK` 等） | `present` lower-case 完全一致のみ採用。それ以外は `unknown` で fail とし、運用者に表記統一を強制 |

## 5. 後方互換性

- 既存 spec が `## 4. Phase 11 evidence file inventory` heading + table を保持しているが、`present` 宣言した実体ファイルが揃っていない workflow root があると、本タスク merge 後に `pnpm verify:phase12-compliance` が fail し始める可能性がある
- ただし `verify-phase12-compliance.yml` は変更差分のある workflow root だけを対象にする（`collectChangedWorkflowRoots`）ため、既存 root が**変更されない限り再評価対象にならない**。後方互換破壊リスクは低い
- 念のため Phase 11 で `git ls-files docs/30-workflows | xargs grep -l '## 4. Phase 11 evidence file inventory'` で広域確認手順を残す（local 限定。CI では走らせない）

## 6. レビュー合意事項

- 本タスクで `pull_request` トリガーは復活させない
- `required_status_checks` への追加は別タスク（ユーザー承認後）
- docs-only 3 点パターンは validator hard-code せず、fixture の test ケースで網羅を保証
