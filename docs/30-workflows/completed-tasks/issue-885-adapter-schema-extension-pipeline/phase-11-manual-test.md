# Phase 11: 手動テスト

## 1. 手動検証の必要性

本タスクは UI 変更を伴わない README + spec コメントの追加のため、ブラウザでの目視検証は不要。ただし「README を読んで実際に拡張が再現できるか」のセルフ walkthrough を 1 回行う。

## 2. Walkthrough 手順（ドライラン）

実 schema 拡張は行わず、README に従って「もし `socialLinks` field（kind=`url`、既存）を追加するなら何を触るか」を頭でなぞる:

1. `packages/shared/src/zod/viewmodel.ts` の `PublicMemberProfileZ` 内 `publicSections[].fields[]` zod schema を確認 → 新 field 追加箇所が特定できるか
2. `apps/web/src/fixtures/public-member-profile.ts` を開き、`publicSections[0].fields` の末尾に新 field を push する位置を特定できるか
3. spec 末尾の EXTENSION TEMPLATE をコピペすれば、stableKey / kind / value を埋めるだけで 1 ケース増やせるか
4. `member-detail.ts` の `normalizeField` で visibility filter / safeParse の経路がどう走るかを README ステップ 4 から想起できるか
5. primitive 描画を変える場合に「別 PR」と判断できるか

すべて ✓ なら README の意図が伝わっている。

## 3. 証跡

手動 walkthrough の結果メモを `outputs/phase-11/walkthrough.md` として残す（任意・scope に応じて省略可）。Phase 11 は本タスクでは軽量で良い。

## 4. UI 影響確認

- `apps/web` 上の表示は変更なし
- `MemberDetail` primitive レンダリング結果は変更なし

`pnpm --filter @ubm-hyogo/web dev` で `/members/<id>` を表示し、serial-06 完了時点と差分がないことを目視確認する（任意）。
