# Phase 3: 設計レビューゲート

## 判定: **PASS**（Phase 4 へ進行可）

---

## 1. 一次結論（4条件評価）

| 条件 | 評価 | 根拠 |
| ---- | ---- | ---- |
| **価値性** | ◎ | 誰の何のコストを下げるか明確: 公開ページ閲覧者が、会員のビジネス概要・スキル・パーソナル・メッセージを構造的に読み取れるようになる。会員にとっては「アンケートで答えた情報がちゃんと載る」価値。導入コストは adapter + 小 component 3 つ + seed のみで、API/DB 不変ゆえ低リスク。 |
| **実現性** | ◎ | 1 サイクルで完了可能な厚み。proto 用 CSS クラスは既存、新規 component は dumb で小さい。RED/GREEN で実装可。 |
| **整合性** | ◎ | 責務境界が閉じている（API=データ / adapter=振り分け / component=描画 / seed=確認データ）。状態所有権の混在なし（Server Component 純表示）。不変条件（endpoint 不変・D1 web 禁止・OKLch・visibility 二重防御・stableKey 定数）すべて維持。 |
| **運用性** | ◎ | 回帰は adapter/component spec で担保。visual baseline は既存の authenticated staging visual ワークフローで別途回収可能。seed 拡充で staging 検証が再現可能になる。spec sync は Phase 12 で実施。 |

---

## 2. 真の論点の確認

- **現象ではなく主問題**: 「薄い」という現象の主問題は『web の adapter/components が proto の構造化レイアウトを実装していない』。API は供給済み（誤って API 改修に向かわないことを明示）。
- **複数案件の混在チェック**: (A) UI 構造化 と (B) seed 拡充 は別関心だが、どちらも「全項目が proto 通り表示される」という単一ゴールに従属し、1 サイクルで完了する。Sentry 拡張ノイズは別ワークフローへ分離済み（混在排除）。
- **why now / why this way**: now=staging で実害（薄い表示）が出ている。this way=API/DB を触らず web 層の表現責務に閉じるのが最小リスクかつ proto 正本に忠実。

---

## 3. 因果・境界の確認

### 強化ループ（良い方向）

```
seed 全項目化 → staging で全セクションが埋まる → proto 準拠 UI の差分が可視化される
  → 視覚回帰・手動確認が機能する → レイアウト品質が上がる
```

### バランスループ（暴走抑止）

```
public field を全部出したい → が member/admin visibility は除外（AC-8 二重防御）
  → 出し過ぎ（プライバシー漏れ）を adapter filter が抑える
```

- 実行状態の所有権: なし（SSR 純表示）。phase 遷移・verify fail 後の意思決定は本タスクに局所。
- 状態所有権の混在: なし。adapter のみが「振り分け」を持ち、components は dumb。

---

## 4. 価値とコストの不均衡チェック

| 項目 | 初回価値 | コスト | 判定 |
| ---- | -------- | ------ | ---- |
| adapter 再構成 | 高（全項目を正しいセクションへ） | 中（pure 関数 + spec） | 妥当 |
| component 3 新規 | 高（proto レイアウト） | 低（dumb・既存クラス） | 妥当 |
| seed 拡充 | 中（staging 検証可能化） | 低（データ追加のみ） | 妥当 |
| other-fallback | 中（将来項目の取りこぼし防止） | 低（else 分岐 1 つ） | 妥当・将来コスト削減 |

高コスト項目（API 改修・D1 migration・visual baseline 自動更新）は **本タスクに含めない**ことで初期層を軽く保つ。visual baseline 回収は将来層（別ワークフロー）として分離。

---

## 5. 改善優先順位

1. adapter 再構成（全 AC の土台）
2. ProfileHero + 3 新規 component（AC-1〜5）
3. MemberDetail 組み立て（AC-6）
4. other-fallback（AC-7）
5. seed 拡充（AC-9）

---

## 6. リスクと対策

| リスク | 対策 |
| ------ | ---- |
| `globals.css` が他タスクと競合する頻出ファイル | 原則 CSS 追加なし。必要時のみ末尾追加・既存ブロック非破壊。 |
| `MemberLinks` props 形状変更で既存 spec が壊れる | Phase 5 で最小差分（MemberDetail 側変換 or props 薄調整）を選び、既存 spec を同 wave 更新。 |
| seed `STABLE_KEYS` 動的化で `field_count` 不整合 | build-seed-sql spec で field_count の実測値を固定。 |
| member/admin field の漏れ | adapter `visibility !== "public"` 除外 + API 側 filter の二重防御を spec で検証（AC-8）。 |
| `urlOthers`（paragraph kind）の扱い | kind=url でないため other セクションへ。spec で明示。 |

---

## 7. ゲート判定

| 判定軸 | 結果 |
| ------ | ---- |
| MAJOR 指摘 | なし |
| MINOR 指摘 | M-1: visual baseline 自動更新は別ワークフロー委譲（Phase 12 未タスク候補として記録）。M-2: 他公開テストメンバーの profile 充実度は TEST-MEM-01 を正本とし最小限（Phase 12 で記録）。 |
| 進行可否 | **PASS** → Phase 4 着手可 |

> MINOR は Phase 12 の未タスク検出で baseline 項目として記録する（今回サイクルの完了を阻害しない）。
