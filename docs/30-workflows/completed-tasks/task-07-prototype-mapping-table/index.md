# task-07 prototype-mapping-table

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | w2-par |
| mode | parallel |
| owner | Tech Writer |
| 状態 | spec_created / docs-only |
| visualEvidence | NON_VISUAL |
| 想定工数 | 0.5 人日 |

## purpose

`docs/00-getting-started-manual/claude-design-prototype/{app,primitives,pages-public,pages-member,pages-admin}.jsx` 計約 2,026 行を凍結正本として、本番実装ターゲット component への 1:1 mapping 表 `docs/00-getting-started-manual/specs/09a-prototype-map.md` を新規作成する。後続 task-10（primitives 実装）と task-11..17（各画面実装）が「自分が担当する component / route の参考行範囲」を 1 ファイルから引ける状態を作る。

## 実装区分

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## scope in / out

### Scope In
- `09a-prototype-map.md` 新規作成（360〜500 行）
- §2 primitives mapping (13+ rows)
- §3 routes mapping (19 routes 全件)
- §4 shell / chrome mapping (Sidebar / Topbar / MinimalBar)
- §5 派生ルール 8 パターン (5.1〜5.8) を phase-3 §3 から正本化転記
- §6 行範囲台帳 (25+ rows)
- 不採用記述（TweaksPanel / AvatarStoreProvider / data-theme warm/cool）
- 検証スクリプト `scripts/verify-09a-prototype-line-ranges.sh` 作成計画

### Scope Out
- token 値の決定（task-08 の責務）
- props / state の正本化（task-06 の責務）
- 実装コード変更（task-10..17 の責務）
- prototype の改変（凍結正本）
- 09c..09h 等の追加 spec ファイル本体作成（後続 task が担当）

## dependencies

### Depends On
- task-01 scope-gate-all-screens

### Blocks
- task-10 ui-primitives
- task-11..17 各画面実装

### Parallel Compatible
- task-06 ui-ux-contract-rewrite
- task-08 design-tokens-doc

## refs

- docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-07-w2-par-prototype-mapping-table.md
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md §3
- docs/00-getting-started-manual/claude-design-prototype/{app,primitives,pages-public,pages-member,pages-admin}.jsx
- docs/00-getting-started-manual/claude-design-prototype/styles.css

## 不変条件

1. プロトタイプ jsx 5 ファイルは凍結正本として扱う。本タスクで改変しない。
2. プロトタイプ未掲載画面に対して新規 primitive を生やさない。
3. プロトタイプ EDITMODE 専用要素（TweaksPanel / AvatarStoreProvider / data-theme warm/cool）は不採用と明記。
4. token 値の決定はしない。
5. props / state の正本化はしない。
6. 行範囲は `L<start>-L<end>` 形式で grep 一意検索可能にする。

## DoD（task-07 §8 を転記）

- [ ] `09a-prototype-map.md` が 360 行以上で新規作成されている
- [ ] §2 で 13+ primitives が mapping されている
- [ ] §3 で 19 routes すべてが行されている（プロトタイプ忠実 9 + 未掲載 10）
- [ ] §4 で shell（Sidebar / Topbar / MinimalBar）の本番先が明示
- [ ] §5 で派生ルール 8 パターン（5.1〜5.8）が phase-3 §3 と完全一致
- [ ] §5 末尾に「新規 primitive を生やさない」段落が存在
- [ ] §6 行範囲台帳が 25 行以上、`primitives.jsx` / `pages-*.jsx` / `app.jsx` の全主要 component を網羅
- [ ] 不採用記述（TweaksPanel / AvatarStoreProvider / data-theme warm/cool）が「不採用」と明記
- [ ] §3 表の route × component が phase-3 §2 の画面/API境界と齟齬なし（固定列に API 列は追加しない）
- [ ] markdown lint error 0
- [ ] 行範囲が実体 jsx と矛盾なし（§6.2 の sed/grep 確認）
- [ ] `09-ui-ux.md`（task-06 出力）からの link target として参照されている

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — タスク分解
- [phase-05.md](phase-05.md) — 実装計画
- [phase-06.md](phase-06.md) — 実装レビュー観点
- [phase-07.md](phase-07.md) — テスト設計
- [phase-08.md](phase-08.md) — テスト実装
- [phase-09.md](phase-09.md) — 統合検証
- [phase-10.md](phase-10.md) — 品質ゲート
- [phase-11.md](phase-11.md) — 受け入れ検証
- [phase-12.md](phase-12.md) — ドキュメント完了処理
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- artifacts.json
- outputs/phase-01/main.md 〜 outputs/phase-13/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## completion definition

全 phase 仕様書、`09a-prototype-map.md` 本体、`scripts/verify-09a-prototype-line-ranges.sh`、Phase 12 の strict 7 outputs、root `artifacts.json`、`09-ui-ux.md` backlink、aiworkflow-requirements 同期ファイル（reference / quick-reference / resource-map / task-workflow-active / topic-map / keywords / changelog / LOGS）が揃い、`git diff --name-only main...HEAD` が task-07 の docs-only 同一 wave scope 内だけで構成されていること。
