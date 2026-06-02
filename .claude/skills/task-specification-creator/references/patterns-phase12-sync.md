# Phase 12 Sync Patterns

## 目的

implementation guide、system spec sync、未タスク化、feedback を漏れなく閉じる。

## パターン1: implementation guide は validator 先行

Part 1 に必要なもの:

- 「なぜ必要か」を先に書く
- 日常の例えを書く
- 専門用語を使うなら即説明する

Part 2 に必要なもの:

- TypeScript 型定義
- API / CLI シグネチャ
- 使用例
- エラーハンドリング
- エッジケース
- 設定項目または定数一覧

## パターン2: Step 1 と Step 2 を混ぜない

| 役割 | 含めるもの |
| --- | --- |
| Step 1 | 完了記録、実装状況、関連タスク、topic-map、LOGS、history |
| Step 2 | interface / API / architecture / security / UI spec の実体更新 |

## パターン3: planned wording zero

completed 扱いの workflow では、`planned`、`仕様策定のみ`、`予定` などの wording を outputs と phase 本文から除く。

## パターン4: 0件報告も成果物化

- `unassigned-task-detection.md` は 0 件でも作る。
- `skill-feedback-report.md` は改善なしでも作る。
- `documentation-changelog.md` には「更新なし」の判断根拠を残す。

## パターン5: current と baseline の二層報告

| 出力 | current | baseline |
| --- | --- | --- |
| `quality-report.md` | 今回差分の pass / fail | 既存 backlog の観測 |
| `documentation-changelog.md` | final status | legacy note |
| `discovered-issues.md` | 今回見つかった blocker | 既知 backlog |

## パターン6: UI task の Phase 11 証跡固定

UI/UX 実装を含む task では:

1. screenshot plan を作る。
2. representative screenshot を取得する。
3. Apple UI/UX 観点で視覚レビューを書く。
4. Phase 12 で screenshot path を changelog と summary に転記する。

## パターン7: docs-only task の Phase 11 証跡固定

docs-only task では screenshot を要求せず、以下を残す:

- `SKILL.md` から family file への navigation
- `LOGS.md` から archive への navigation
- `.claude` と `.agents` の file set 一致

## パターン8: final sync の順序

1. outputs を揃える。
2. `artifacts.json` と `outputs/artifacts.json` を同期する。
3. workflow 本文を completed へ更新する。
4. aiworkflow-requirements 側の台帳、教訓、LOGS、SKILL history を更新する。
5. validator を再実行する。

## パターン9: P59 対策 — 並列エージェント成果物統合チェック

Phase 12 を複数の SubAgent で分担する場合、documentation-changelog の件数と unassigned-task-detection の件数が乖離するリスクがある。

**必須手順（メインエージェントが実施）**:
1. 全 SubAgent 完了を確認する
2. 件数照合を実行する:
   ```bash
   # unassigned-task-detection の検出件数を取得
   grep -c "^| UT-" outputs/phase-12/unassigned-task-detection.md

   # documentation-changelog の Task 4 記載件数を確認
   grep "検出件数" outputs/phase-12/documentation-changelog.md
   ```
3. 件数不一致の場合は changelog を修正してから完了とする

**禁止パターン**: SubAgent が独立して changelog を作成し、他 SubAgent の成果物件数を確認しないまま「完了」と記録する

## パターン10: upstream 資産再利用タスクの Phase 1 anchor 固定

landed 親タスクの table/helper/UI primitive を再利用する implementation task では、新規成果物名を作る前に Phase 1 で upstream anchor 表を固定する。

| Anchor | 必須内容 |
| --- | --- |
| parent workflow | 親 workflow root、Issue、landed commit または evidence path |
| code asset | 再利用する table/helper/component の current path |
| ownership | 本 task が変更する surface と、変更しない upstream surface |
| Phase 12 carry-over | artifact inventory と implementation guide で同じ identifier を使う |

実例: issue-1029 public member photo display は #983 の `member_photos` / `presignMemberPhotoGetUrl` / `Avatar src?` を継承し、Phase 1 `spec-extraction-map.md` の anchor を Phase 12 inventory へ転記した。

## パターン11: optional resolver DI で provider 依存フィールドを足す

route/provider 境界に依存する optional response field を use-case に追加する場合、既存テストを provider 必須へ変えない。resolver は optional DI とし、未注入時は従来レスポンス、注入時だけ新フィールド、失敗時は fail-soft を検証する。

| Gate | 必須条件 |
| --- | --- |
| default behavior | resolver 未注入で既存 field set が維持される |
| resolver-present | provider が値を返すと optional field が出る |
| resolver-failure | provider failure は response 全体を落とさない |
| N+1 prevention | list では batch helper を使い、member ごとの provider/repository 呼び出しを避ける |

実例: issue-1029 は public list/profile の `photoUrl` を optional resolver DI で配線し、`listMemberPhotosByIds` batch helper と focused Vitest で固定した。

## パターン12: local visual evidence と real provider capture を分ける

VISUAL_ON_EXECUTION task で local mock runtime screenshot は取得済みだが、staging deploy / provider secret / real URL capture が user-gated の場合、Phase 11 inventory は local screenshot を `present` にする。real provider capture は Gate-C user-gated として別行に分ける。

| Evidence | Status rule |
| --- | --- |
| local Playwright screenshot | ファイルがあれば `present` |
| local mock runtime log | ファイルがあれば `present` |
| real provider URL / staging screenshot | user approval が必要なら `pending_user_approval` |
| compliance verdict | local implementation は PASS、external ops は Gate-C pending と書く |

## 再利用チェックリスト

- [ ] Part 1 / Part 2 validator 要件を満たした
- [ ] Step 1 と Step 2 の判定を分けて記録した
- [ ] 0件成果物を省略していない
- [ ] UI task か docs-only task かで Phase 11 証跡を切り替えた
- [ ] final sync の順序を守った
- [ ] 並列 SubAgent を使った場合は documentation-changelog と unassigned-task-detection の件数を照合した（P59 対策）
- [ ] upstream 資産再利用 task では Phase 1 anchor 表を Phase 12 inventory に継承した
- [ ] provider 依存 optional field は optional resolver DI / fail-soft / batch helper で検証した
- [ ] local visual evidence と real provider capture の gate を分離して記録した
