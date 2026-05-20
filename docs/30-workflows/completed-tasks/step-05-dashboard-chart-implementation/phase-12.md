# Phase 12: ドキュメント / Phase 12 コンプライアンス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 区分 | ドキュメント / 監査 |
| 想定所要 | 0.5 人日 |

## 目的

Phase 11 evidence を踏まえて Phase 12 必須 6 タスク（実体 7 ファイル）を生成し、`verify-phase12-compliance` CI gate を pass させる。

## Phase 12 必須出力（canonical 9 headings SSOT）

`docs/30-workflows/step-05-dashboard-chart-implementation/outputs/phase-12/` 配下に下記 7 ファイルを物理生成する。

| # | ファイル | 内容 | 必須セクション |
| --- | --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 メイン（実装ガイドへの index） | 上記 9 headings |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベル の実装ガイド | 概念 / 実装 / 検証 |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | タスク仕様書コンプライアンスチェック | 9 headings 監査結果 |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | システム仕様書更新サマリ（変更なしでも明示出力） | 影響範囲 / 更新箇所 / なしの場合は理由 |
| 5 | `outputs/phase-12/skill-feedback-report.md` | スキルフィードバック（テンプレ改善 / ワークフロー改善 / ドキュメント改善 3 観点固定） | 3 章固定 |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件でも出力必須） | 検出結果 / 件数 / 0 件理由 |
| 7 | `outputs/phase-12/documentation-changelog.md` | ドキュメント更新履歴 | path + 更新内容 |

## canonical 9 headings（main.md 必須）

```
1. 目的
2. スコープ
3. 実装サマリ
4. Phase 11 evidence file inventory
5. 検証結果
6. 残課題
7. 未タスク
8. ロールバック方針
9. 参照
```

## 状態語彙

- `workflow_state`: `implementation_completed`（Phase 5 で実コード差分が生成されるため）。
- `phases[].status`: 各 Phase 完了で `completed`。
- 禁止表記: `PASS` 単独 / `spec_created` のまま実コード差分を残す / `runtime_pending` のまま CI green を主張。

## システム仕様書更新（aiworkflow-requirements）

| 仕様書 | 更新有無 | 理由 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/00-overview.md` | なし | 全体構成変わらず |
| `docs/00-getting-started-manual/specs/design-tokens.md` | なし | 新規 token 追加なし |
| admin dashboard 仕様 | あり | StatusDistribution の表示仕様に「`slices` populated 時は SVG bar chart 描画」を追記 |

> admin dashboard 仕様の正本パスは Phase 12 実行時に再確認し、`system-spec-update-summary.md` に明示する。

## 未タスク検出

本サイクルで新規 formalize する未タスクは 0 件。

| 検出項目 | 件数 | 判定 |
| --- | --- | --- |
| API `byStatus` producer | 0 | 今回レビューサイクル内で `GET /admin/dashboard` の既存 endpoint に実装したため未タスク化しない |
| その他 | 0 | 追加検出なし |

API 側 `byStatus` producer は同一サイクル内で完了したため、本 Phase 12 で新規 unassigned task は作成しない。

## skill-feedback-report 章構成

```
## 1. テンプレ改善
（StatusDistribution 単一 component 改修における Phase 12 ファイル数の最小化提案、または「現状で十分」の判定）

## 2. ワークフロー改善
（small UI task で 13 Phase 全 file 生成のオーバーヘッド観察、または「現状で十分」の判定）

## 3. ドキュメント改善
（design-tokens.md と SVG chart 描画パターンの相互参照追加提案、または「現状で十分」の判定）
```

## documentation-changelog 必須エントリ

| path | 更新内容 |
| --- | --- |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` | SVG bar chart 描画ロジック追加 |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx` | 新規追加（7 tests で TC-CHART-01〜14 を網羅） |
| `docs/30-workflows/step-05-dashboard-chart-implementation/` | 新規ワークフロー（本タスク仕様書） |
| visual snapshot（更新時のみ） | admin dashboard の SVG chart 追加分 |

## 実行タスク

- Phase 12: strict 7 outputs、aiworkflow 正本同期、4条件再検証を完了する。

## 参照資料

- - `phase-11.md`
- - `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- - `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- - `outputs/phase-12/` strict 7 と aiworkflow index 差分を成果物にする。

## 統合テスト連携

- - `verify-phase12-compliance` / `validate-phase-output` / `verify-all-specs` に接続する。

## 完了条件

- [ ] outputs/phase-12/ 配下 7 ファイル全て物理存在
- [ ] `bash scripts/verify-pr-ready.sh` が exit 0
- [ ] `verify-phase12-compliance` の canonical 9 headings drift なし
- [ ] `gate-metadata:validate` の zod schema 違反なし
- [ ] `indexes:rebuild` drift なし
- [ ] 未タスク検出 0 件が `outputs/phase-12/unassigned-task-detection.md` に記録済

## 依存Phase trace

- Phase 1 / phase-01.md
- Phase 2 / phase-02.md
- Phase 5 / phase-05.md
- Phase 6 / phase-06.md
- Phase 7 / phase-07.md
- Phase 8 / phase-08.md
- Phase 9 / phase-09.md
- Phase 10 / phase-10.md
- Phase 11 / phase-11.md
