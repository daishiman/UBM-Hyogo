# Phase 3: 設計レビュー（Phase 4 進行判定ゲート）

## 1. モジュール俯瞰（実装可能粒度の確認）

後続のタスク仕様書がコード実装可能な粒度になるよう、対象モジュールと想定変更点を俯瞰する。

```
packages/shared/
  src/types/common.ts        … [編集] normalizeTagSource 純関数（新規 export）
  src/zod/primitives.ts      … [編集] TagSourceZ に .catch("manual")
  src/index.ts               … barrel（既存 export * → 追加配線不要・確認のみ）
  packages/shared/src/zod/viewmodel.spec.ts   … [既存 spec へ追記] zod 防壁テスト

apps/api/
  src/repository/_shared/builder.ts                 … [編集] 357/429 の as → normalizeTagSource()
  apps/api/src/repository/__tests__/builder.repository.spec.ts … [既存 spec へ追記] seed source 回帰
  src/routes/admin/members.ts                       … [不変] 506-508 の safeParse は触らない（正規化で成功する）

apps/web/
  src/features/admin/components/_members/MemberDrawer.tsx … [編集] reloadKey + retry ボタン
  apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx … [既存 spec へ追記]
```

各ファイルの**変更箇所・関数シグネチャ・差分方針**は `_shared-context.md §2-4` と Phase 5 task 仕様で逐語固定済み。後続実装者は迷わず着手できる。

## 2. 代替案比較

| 案 | 内容 | 採否 | 理由 |
|----|------|------|------|
| A1 | shared 純関数 normalizeTagSource + zod .catch（採用） | ✅ | 値ドメイン所有権が正しく、一覧/詳細の非対称を根治、将来の未知 source 全般に強い。ブラスト半径最小 |
| A2 | `TagSourceZ` enum に `'seed'` 追加のみ | ❌ | seed 以外の未知値で再発する脆弱性が残る。union 拡張のブラスト半径も発生 |
| A3 | seed データの source を `'manual'` に書換 | ❌ | migration/seed 変更は不変条件で禁止。根本のスキーマ非対称（zod strict）が残り別経路で再発 |
| A4 | 詳細 view の tags から source を落とす | ❌ | レスポンス shape 変更＝endpoint surface 破壊（不変条件 #1 違反） |
| B1 | reloadKey インクリメントで再 fetch（採用） | ✅ | React 標準・副作用局所・回復可能 |
| B2 | error boundary 再 throw | ❌ | 無限ループ誘発リスク・症状を悪化させうる |

ユーザー承認方針（fail-soft 正規化＋enum 防御 / 500 解消＋UI 堅牢化）は A1 + B1 に一致。

## 3. 整合性チェック

- `normalizeTagSource` 戻り値 `TagSource` は `MemberProfile.tags[].source` 型と一致（typecheck 担保）。
- `TagSourceZ.catch("manual")` の出力 union は不変（`viewmodel.ts:71` / `identity.ts:68` 互換）。
- Lane B の `reloadKey` 依存追加は初回挙動不変（既存 drawer テスト非破壊）。
- 識別子は実コードに一致: `normalizeTagSource` / `TagSourceZ` / `buildAdminMemberDetailView` / `buildMemberProfile` / `MemberDrawer` / `reloadKey` / `member-detail-retry`。

## 4. 依存関係

- Lane A → Lane B 依存なし（完全独立並列）。
- Lane A 内: shared（normalizeTagSource / TagSourceZ）→ apps/api（builder が import）。同 Lane 内で順序あり（shared 先・api 後）だが 1 実装者で逐次完結。
- Phase 依存（1→2→3→...→13）は artifacts.json と一致。

## 5. 4 条件評価

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | 管理者の会員詳細運用停止（500）を最小差分で解消・将来の未知 source 全般に強い |
| 実現性 | PASS | 純関数 1 + zod 1 行 + キャスト 2 置換 + UI retry。1 サイクルで実装可能 |
| 整合性 | PASS | union 非拡張で既存表示分岐に無影響・責務境界が shared/api/web で分離 |
| 運用性 | PASS | 回帰テスト 3 本で再発検知・seed や本番未知値の双方をカバー |

## 6. Phase 4 進行判定

**PASS**。設計は確定し、変更ファイル・シグネチャ・テスト方針・代替案・リスクが揃った。Phase 4（I/O 契約・テスト計画）へ進む。

## 7. スコープ厳守（CONST_007）

全成果物（Lane A / Lane B）は後続の本実装サイクル 1 サイクル内で完了できる。先送り・別 PR・バックログ送りは無し。スコープ外項目（DB CHECK 制約追加・MemberTagsEditor 個別回復強化）は技術的理由（migration 禁止・本経路外）で明示分離し、Phase 12 で MINOR 判定する。
