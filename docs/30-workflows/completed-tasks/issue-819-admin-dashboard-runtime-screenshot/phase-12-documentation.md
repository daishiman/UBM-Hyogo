# Phase 12: ドキュメント（中学生レベル概念説明含む）

## 12.1 中学生レベル概念説明（What / Why）

### 12.1.1 このタスクって何をしているの？

UBM 兵庫支部会の「管理画面（admin dashboard）」には、会員さんの公開ステータス（誰でも見える人 / 会員だけに見える人 / 非公開の人）の数を **棒グラフ** で見せる機能があります。

実は、この棒グラフは前のタスクで作ったあと「動いている本物の画面のスクリーンショット」をまだ撮っていませんでした。代わりに「16×16 ピクセルの真っ黒な ダミー画像（445 バイト）」がファイルだけ置いてある状態でした。

このタスクでは、本物の admin としてログインして、本物の管理画面を開いて、本物のスクリーンショットを撮って、ダミー画像と差し替えます。

### 12.1.2 なんでダミー画像のままだったの？

前のタスクは「画像ファイルが置いてあるか？」という機械チェック（CI gate）を通すために、ファイルだけ置けば OK というルールで終わらせました。**「ファイルが存在するか」と「中身が本物か」はチェックを分けている**のです。

これは意図的な分離で、コードを書く作業と、本物の admin アカウントでログインしてスクショを撮る作業を別々の人 / 別タイミングで実行できるようにするためです。

### 12.1.3 棒グラフはどうやって描かれているの？

`StatusDistribution.tsx` というファイルが、`slices` という配列を受け取って SVG（ベクター画像）で棒グラフを描きます。

- `slices` が `undefined`（未定義）のとき → 「分布データは現在集計対象外です」というメッセージを表示
- `slices` に `[{status:"public", count:12}, ...]` の形の値が入っているとき → 棒グラフを描画

色は `var(--ubm-color-ok)` のような「色の名前（OKLch トークン）」を使っていて、`#00ff00` のような直接の色コードは書きません。これは「デザインのルール」を 1 箇所で管理するためです（このルールを守らないと `grep-gate` という自動チェックで叱られます）。

### 12.1.4 populated 状態のスクショを撮るために何をするの？

本物の DB にはまだ十分なデータが無い可能性があるので、`StatusDistribution` を呼んでいる場所のコードを **一時的に** 書き換えて、棒 3 本がはっきり見えるダミーの値を渡します:

```
public: 12
member_only: 7
hidden: 3
```

撮影が終わったら、この一時書き換えは `git checkout --` で **必ず元に戻します**。戻し忘れると「コードが変わってしまった」状態でコミットしてしまい、関係ないバグや混乱の原因になります。

### 12.1.5 なんでこの作業が必要なの？

将来「管理画面のデザインが意図せず壊れていないか？」を画像差分で自動チェックする仕組み（visual regression）を作るときに、**比較対象になる「正しい状態の画像」（ベースライン）** が必要です。ダミー画像のままだと「正しい状態」が無いので、差分を見ても意味がありません。

今回ここを本物画像にしておくと、後のタスク (task-18 / task-22) がそのまま使えます。

## 12.2 技術的サマリ（成人向け）

### 12.2.1 変更カテゴリ

| 種別 | 件数 | 詳細 |
|---|---|---|
| 新規ドキュメント | 14 | 本 workflow root (index.md + 13 phase + artifacts.json) + outputs/ |
| 親 workflow 編集 | 3 | parent phase-11/main.md, phase-12/main.md, phase-12/unassigned-task-detection.md |
| 親 evidence 置換 | 2 | admin-dashboard-{placeholder,chart}.png |
| unassigned-task 更新 | 1 | step-05-followup-001 consumed 化 |
| コード永続変更 | **0** | 一時 fixture 注入はすべて revert |

### 12.2.2 不変条件遵守

- 既存 API endpoint surface 維持 (`GET /admin/dashboard` のみ)
- OKLch token 正本維持 (`var(--ubm-color-ok|info|warn)`)
- chart dependency 追加なし (SVG 直書き維持)
- D1 直接アクセスなし
- `StatusDistribution.tsx` ロジック不変

### 12.2.3 evidence の二重配置の意図

| 配置先 | 用途 |
|---|---|
| `issue-819/outputs/phase-11/` | 本タスクのトレーサビリティ（誰が・いつ撮ったかが本タスク root に閉じる） |
| `completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/` | 親 workflow の evidence inventory 整合（後続タスクが parent root を参照しても本物 PNG が取れる） |

両方に同一 PNG を配置することで、将来 issue-819 root が archive されても親側 evidence は残る。

### 12.2.4 Phase 11 evidence two-tier status の昇格

| status | 意味 | 本タスク前 | 本タスク後 |
|---|---|---|---|
| present | ファイル存在 | ◯ (dummy) | ◯ (本物) |
| runtime_completed | 本物の runtime artifact である | × | ◯ |

## 12.3 関連 artifacts

- artifacts.json: workflow_state を `spec_created` → runtime screenshot 取得後に `runtime_pending` から `completed` 相当へ昇格候補化。ただし commit / push / PR は user-gated のため Phase 13 完了まで `pending_user_approval` を併記する。
- 親 changelog (`.claude/skills/aiworkflow-requirements/changelog/20260518-step-05-dashboard-chart-implementation.md`) は本タスクの commit message から参照される

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 12 strict 7 と aiworkflow-requirements same-wave sync を完了する。

## 実行タスク

- implementation guide、system spec update、documentation changelog、unassigned detection、skill feedback、compliance check を作成する。
- aiworkflow-requirements の quick-reference、resource-map、task-workflow-active、artifact inventory、changelog、LOGS、SKILL changelog を同期する。

## 参照資料

- `outputs/phase-12/`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/`

## 成果物

- Phase 12 strict 7 files
- aiworkflow-requirements same-wave sync

## 完了条件

strict 7 と same-wave sync が揃い、runtime evidence pending の境界が明記されている。

- [ ] strict 7 と same-wave sync が揃い、runtime evidence pending の境界が明記されている
