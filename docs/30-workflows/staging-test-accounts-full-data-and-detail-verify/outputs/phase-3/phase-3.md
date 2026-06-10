# Phase 3: 設計レビュー（ゲート）

[実装区分: 実装仕様書] / Task: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001

## 3.1 4条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | ✅ | 公開掲載 5 件の詳細ページで全 public 項目の表示形態を実データ（フル/全項目入力/エッジ）で一望でき、ユーザーの「どう表示されるか見たい」を直接満たす。 |
| 実現性 | ✅ | 既存 catalog・build-seed-sql・公開詳細 5 セクション描画を再利用。TEST-MEM-01 で全 public 項目描画は成立済 → 残り 9 件へ profile データを与えるだけ。新規 API/D1/Form 変更ゼロ。1 サイクル完了可能。 |
| 整合性 | ✅ | SSOT（catalog）→生成物（drift guard）→D1→view の一方向。visibility 3 層二重防御維持。D1 境界 apps/api 固定。consent 不変条件 #4 遵守。 |
| 運用性 | ✅ | `TEST-` prefix + `.invalid` ドメインで cleanup 安全・冪等再投入。staging apply は CLI・user-gated。production は CLI 構造で禁止。 |

## 3.2 因果ループ

- **強化ループ**: profile 充実 → 詳細ページが豊かに描画 → 表示形態の検証精度向上 → UI 改善の判断材料増。
- **バランスループ**: データ量増 ↔ 全項目入力（09）/エッジ（10）で描画堅牢性を意図的に検査 → 過剰最適化を抑止。

## 3.3 責務境界・依存の確認

- ✅ データ投入（apps/api）と表示（apps/web）が分離。apps/web は D1 非接触。
- ✅ Lane A（データ）と Lane B（表示検証）は疎結合。Lane B は fixture で独立検証でき、staging データに依存しない。
- ✅ Lane C は user-gated 実行で、spec / 実装の完了条件から切り離されている。

## 3.4 リスクレビューと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| build-seed-sql に member 固有ハードコードがあり 9 件へ汎用展開できない | 中 | Phase 5 冒頭で build-seed-sql.ts を読み、`profile` の全キーを回す形を確認。固有箇所があれば最小一般化（全 stable_key ループ）。 |
| Lane B でギャップが見つからず作業が薄くなる | 低（想定内） | その場合 Lane B は「テスト追補 + fixture 更新 + ギャップなし記録」に縮退（spec に明記済）。これは正常な verify_existing 帰結。 |
| 09 の「全項目入力」で必須項目まで欠落させると API/描画が壊れる | 中 | 必須（fullName/location/occupation/ubmZone/ubmMembershipType/businessOverview）は必ず充填。空にするのは optional のみ。 |
| seed 生成物の drift（再生成忘れ） | 中 | contract spec が byte 一致を強制。Phase 5 で必ず gen を実行。 |

## 3.5 スコープ妥当性（CONST_007）

- 全「含む」項目（Lane A/B/C）は 1 サイクル完了可能。先送り項目なし。
- 「含まない」は user 判断（公開ページへの member/admin 項目追加）・既存方式踏襲（form sync 取り込み）・規約（commit/PR/apply の user-gate）に基づく明示的除外で、分量理由の先送りなし。

## 3.6 判定

**PASS** — Phase 4（テスト作成）へ進む。設計に矛盾・未解決の責務境界問題はない。

## 完了条件

- 4条件 PASS。因果・境界・リスク・スコープを確認。Phase 4 へ進行可能。
