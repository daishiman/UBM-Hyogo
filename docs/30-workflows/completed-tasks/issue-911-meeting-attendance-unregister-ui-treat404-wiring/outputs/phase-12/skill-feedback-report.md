**[実装区分: スキルフィードバック]**

# Skill Feedback Report

## テンプレ改善

| 対象 | verdict | 根拠 |
| --- | --- | --- |
| task-specification-creator | applied | L-I911-001..005 を patterns-lessons 末尾に追記。「DELETE-race UI 二重 mutation / `treat404AsSuccess` 配線 / register-unregister 分離 / API 改変回避 / NON_VISUAL evidence」を汎化 |
| aiworkflow-requirements | applied | lessons-learned + indexes (quick-reference / resource-map) + task-workflow-active + artifact inventory へ same-wave sync |

## L-I911-001..005 ドラフト

### L-I911-001: DELETE-race の race=success 化

既存 API が POST `attended:false` で 404 を返す DELETE-race パターンでは、UI 側で `treat404AsSuccess: { toast: <info message> }` を mutation options に渡すことで「既に解除済み」を error toast ではなく info toast に降格できる。新 DELETE route を起こさず既存 endpoint surface だけで race=success を成立させる。

### L-I911-002: 第 2 mutation 分離（誤適用ガード）

register と unregister は **別 mutation インスタンス**で構成する。同一 mutation で `attended` payload を分岐させると `treat404AsSuccess` が両者に効いてしまい、register 側の本物 404（meeting / member 未存在）を success に誤読する。spec 側では register 側 404 が `"開催日または会員が見つかりません"` の失敗扱いを維持することを A6b で契約化する。

### L-I911-003: `refreshOnSuccess: false` の選択

404 fallthrough を success 扱いする場合、再 fetch を発火しないほうが UI 楽観反映と整合する。サーバ側にデータが無いので再 fetch しても同じ状態が返るだけで、ネットワーク・体験コストが無駄になる。

### L-I911-004: API 改変回避（UI prototype alignment 不変条件 1）

UI 改善 task で API 改変誘惑が出たら、まず「既存 endpoint surface で payload 変更だけで対応可能か」を検証する。本 task では POST `attended:true/false` で完結することを実装読み取り (`admin/meetings.ts:200-249`) で確認してから spec 化した。

### L-I911-005: NON_VISUAL evidence の判定 4 軸

`(1) design token / primitive 改変なし` `(2) AC が screenshot を要求しない` `(3) 親 workflow の visual baseline 範囲外` `(4) 振る舞いが component spec assertion で完全網羅される` の 4 軸全成立で NON_VISUAL 判定可能。screenshot 取得を省略し vitest ログ evidence に集約する。

## ワークフロー改善

`treat404AsSuccess` を hook の global 設定にせず component options で渡す既存 policy は本 task で再確認された。新 caller を追加する際は **mutation インスタンスを分離**し、誤適用ガード assertion を spec に含めるテンプレを task-specification-creator に組み込む。

## ドキュメント改善

strict 7 構成（main.md ハブ + phase-12.md サマリ + 6 専用文書）を本 task でも踏襲。`NON_VISUAL` の根拠を Phase 11 で 4 軸明示することで「screenshot 取得を省いた理由」が後追い可能になる。

## 30種思考法 compact evidence

| カテゴリ | 適用した思考法 | 結論 |
| --- | --- | --- |
| 論理分析系 | 批判的 / 演繹 / アブダクション | 「DELETE route 追加」は scope inflate。既存 POST + 404 fallthrough で十分 |
| 構造分解系 | 要素分解 / MECE / プロセス | UI / hook / API / spec / docs / skill sync に分解。改変面は UI + spec + docs に閉じる |
| メタ・抽象系 | メタ / 抽象化 | race=success は「もう済んでる」を error にしない一般原則。本 task はその具体例 |
| 発想・拡張系 | 水平 / 逆説 / if | 「もし register と unregister を同一 mutation にしたら？」→ 誤適用ガード必要性が浮上 |
| システム系 | システム / 因果関係 | API endpoint surface 固定 → UI 側で payload 切替 + race 吸収という因果フロー |
| 戦略・価値系 | トレードオン / 価値提案 | UI 体験改善と API 安定（surface 固定）を同時達成 |
| 問題解決系 | why / 仮説 / 論点 | 真の論点は「DELETE-race の UI 表示」で、API 追加ではない |
