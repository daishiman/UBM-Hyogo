# Phase 12 — 実装ガイド（2 部構成）

タスク: skill-ledger-a3-progressive-disclosure
Phase: 12 / 13（ドキュメント更新）
作成日: 2026-04-28
種別: docs-only / NON_VISUAL

> Part 1（中学生向け）と Part 2（技術者向け）の 2 部構成。Part 1 では「たとえば」を含む日常の例え話で skill / entrypoint / references の関係を説明し、Part 2 で skill loader の動作・分割設計・mirror 同期・ロールバックを実装視点で解説する。

---

## Part 1: 中学生向け（skill / entrypoint / references の例え話）

### 1-1. skill って何？

たとえば、あなたが料理クラブで「カレーを上手に作る」「魚をきれいにさばく」のような **作業ごとのレシピ集** を持っているとします。Claude Code でいう **skill** は、まさにこのレシピ集に当たります。

- skill = 「特定の作業を上手にやるためのレシピ集」
- レシピ集の **表紙** が `SKILL.md`（エントリポイント）
- レシピ集の **巻末資料** が `references/<topic>.md`（詳しい手順）

たとえば `task-specification-creator` という skill は、「タスクを Phase 1〜13 に分けて仕様書を作る」というレシピ集です。

### 1-2. entrypoint と references って何？

| 例え | 役割 | 中身 |
| --- | --- | --- |
| 表紙（entrypoint = `SKILL.md`） | 「このレシピ集で何ができるか」「目次」 | 概要 5〜10 行 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow |
| 巻末資料（references = `references/<topic>.md`） | 「だしの取り方」「煮込み時間」のような詳しい手順 | Phase テンプレ / アセット規約 / 品質ゲート / オーケストレーション / 運用ランブック など |

たとえば、表紙には「カレーの作り方は巻末 P.10、味噌汁は P.20」のように **目次だけ** 書きます。実際の手順（材料の切り方・火加減）は巻末資料に書きます。

### 1-3. なぜ「200 行未満」が大事なの？

たとえば、表紙が分厚い辞書のようになっていると、誰かがレシピを開くたびに 500 ページ全部を最初から読み直さないといけません。これだと:

1. **疲れる**: Claude が毎回 500 行全部を読むと、頭の容量（context window）が無駄遣いされて、肝心の作業に使える脳みそが減ります（loader の context 消費）。
2. **ケンカが起きる**: 友達と同時に同じ表紙の同じ行を書き換えると、保存するときに「どっちが正しい？」というケンカ（merge conflict）が起きます。
3. **見つからない**: 大事な「目次」がどこに書いてあるか分からなくなります。

そこで **表紙は 200 行未満（薄い）にして、詳しい話は巻末資料に分ける** というルールにします。これが Progressive Disclosure（段階的に開示する）という考え方です。

### 1-4. 今回（A-3）でやったこと

たとえば `task-specification-creator/SKILL.md` という表紙が **517 行** に膨らんでいました。今回は機械的に「表紙に必要な 10 項目だけ残し、それ以外は巻末資料に切り出す」作業をしました。

- before: 表紙 517 行（厚い辞書）
- after: 表紙 115 行 + 巻末資料 7 ファイル新規（薄い表紙 + 専門資料）

これで「友達が同時に編集してもケンカしにくい」「Claude が表紙を読むだけで全体像をつかめる」状態になりました。

---

## Part 2: 技術者向け（loader / Progressive Disclosure / mirror / rollback）

### 2-1. skill loader の動作モデル

| ステップ | ロード対象 | 備考 |
| --- | --- | --- |
| 1. 起動時 | `SKILL.md` の front matter（`name` / `description` / `trigger` / `allowed-tools`） + Anchors | 全 skill 分が常時メモリに乗る |
| 2. trigger 発火後 | `SKILL.md` 本体（200 行未満） | クイックスタート / モード一覧 / references リンク表まで |
| 3. 必要時 | `references/<topic>.md` を遅延ロード | Progressive Disclosure |

> 結論: entry の薄さは loader の context budget に直結する。500 行 SKILL.md × 8 skill = 4,000 行が常時消費される事故を 200 行 × 8 = 1,600 行に抑える。

### 2-2. entry 残置 10 要素（固定セット）

`SKILL.md` には以下 10 要素のみを残し、それ以外は references へ移送する。

1. front matter（`name` / `description` / `trigger` / `allowed-tools`）
2. 概要 5〜10 行
3. trigger 条件（自然文）
4. allowed-tools 一覧
5. Anchors（外部から参照される固定 ID）
6. クイックスタート（最小実行例）
7. モード一覧（collaborative / orchestrate 等の概念のみ）
8. agent 導線（呼び出し可能な agent / sub-skill）
9. references リンク表（topic → ファイルパス）
10. 最小 workflow（Phase 番号と入出力の一覧のみ）

### 2-3. Progressive Disclosure 分割設計の原則

- **片方向参照**: SKILL.md → references のみ。references 同士の循環参照は禁止（Phase 8 依存グラフで検出）。
- **単一責務命名**: `references/<topic>.md` は 1 トピック 1 ファイル。複合トピックは `topic-aspect.md` 形式に分解する。
- **機械的 cut & paste 不変条件**: 切り出しは「セクション単位の cut & paste」のみ。意味的書き換え・新規 trigger 追加は禁止。意味変更は別タスクへ分離する。
- **アンカー保全**: 旧 SKILL.md 内アンカーは `references/<topic>.md#<anchor>` へ移動し、SKILL.md 末尾の references リンク表で誘導を担保する。

### 2-4. canonical / mirror 同期規約

- canonical: `.claude/skills/<skill>/`
- mirror: `.agents/skills/<skill>/`
- 同期手順: `rsync -av --delete .claude/skills/<skill>/ .agents/skills/<skill>/`
- 検証: `diff -r .claude/skills/<skill> .agents/skills/<skill>` の差分が **0** であること（Phase 4 V4 / Phase 11 smoke）。
- 不変条件: canonical 修正後に必ず mirror へ反映する。mirror 単独編集は禁止。

### 2-5. PR 計画（1 PR = 1 skill 分割）

| PR | 対象 skill | 行数 before | 行数 after（目標） | 状態 |
| --- | --- | ---: | ---: | --- |
| PR-1（本 PR） | task-specification-creator | 517 | 115 | 実装完了 / Phase 13 で提出 |
| PR-2（次 PR） | automation-30 | 432 | < 200 | 計画済み（次 wave） |
| PR-3（次 PR） | skill-creator | 402 | < 200 | 計画済み（次 wave） |
| PR-4（次 PR） | github-issue-manager | 363 | < 200 | 計画済み（次 wave） |
| PR-5（次 PR） | claude-agent-sdk | 324 | < 200 | 計画済み（次 wave） |
| PR-N（別 PR） | skill 改修ガイドへの Anchor 追記（「fragment で書け」「200 行を超えたら分割」） | — | — | 別 PR で実施（再発防止 docs update） |

> **実施結果（PR-1 / 本 PR の確定値）**:
> - `task-specification-creator/SKILL.md`: 517 → **115 行**（200 行未満達成）
> - 新規 references: **7 件**（Phase 12 ガイド / Phase テンプレ / アセット規約 等を切り出し）
> - canonical / mirror diff: **0**（`diff -r` で確認済み、Phase 11 evidence 参照）
>
> **残対象 4 skill（automation-30 / skill-creator / github-issue-manager / claude-agent-sdk）は次 PR で個別分割予定**（本 PR には含めない）。

### 2-6. ロールバック戦略

1. **PR 単位 revert**: 1 PR = 1 skill 原則により、`git revert <merge-commit>` で 1 skill 単位に戻る。
2. **mirror 戻し**: revert 後に `rsync -av --delete .claude/skills/<skill>/ .agents/skills/<skill>/` を再実行し、`diff -r` = 0 を再確認。
3. **Anchor 追記の独立 revert**: AC-10 の skill 改修ガイド Anchor 追記は分割本体とは別 PR にしているため、単独で revert 可能（本体 revert と独立）。
4. **検証**: revert 後に `bash outputs/phase-04/scripts/line-count.sh` で行数を再計測し、意図通りの巻き戻しを確認。
5. **影響範囲**: 他 skill / 他 PR には波及しない（1 PR = 1 skill 原則の帰結）。

### 2-7. 実装後の不変条件チェック

| チェック | コマンド | 期待 |
| --- | --- | --- |
| 行数 | `bash outputs/phase-04/scripts/line-count.sh` | 対象 SKILL.md が 200 行未満 |
| リンク健全性 | `bash outputs/phase-04/scripts/link-integrity.sh` | リンク切れ 0 |
| 未参照 references | `bash outputs/phase-04/scripts/orphan-references.sh` | 0 件 |
| mirror diff | `bash outputs/phase-04/scripts/mirror-diff.sh` | 差分 0 |

---

## まとめ

- **Part 1（中学生向け）**: skill = レシピ集、SKILL.md = 表紙、references = 巻末資料、200 行未満 = 表紙を薄く保つルール、というメンタルモデル。
- **Part 2（技術者向け）**: entry 10 要素 / 片方向参照 / 機械的 cut & paste / canonical-mirror 同期 / 1 PR = 1 skill / 別 PR Anchor 追記。
- **本 PR の範囲**: `task-specification-creator` 単独（517 → 115 行 / references 7 件 / mirror diff 0）。
- **残 4 skill** は次 PR 計画として `unassigned-task-detection.md` に登録済み。
