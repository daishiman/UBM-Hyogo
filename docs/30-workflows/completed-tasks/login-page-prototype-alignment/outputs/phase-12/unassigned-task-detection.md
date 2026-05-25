# Unassigned task detection

本サイクル内で完了させず、follow-up unassigned-task として後段に切り出すべき項目の確認結果。

結論: 今回の実装完了条件に対する未タスク化はなし。local screenshot evidence まで同サイクル内で完了済み。下表は MVP 後に検討可能な独立候補であり、本タスクの漏れを先送りしたものではない。

| ID | 内容 | 種別 | 切り出し理由 |
|----|------|------|---------------|
| FU-LOGIN-001 | Google brand 4-tone 正規アイコンの導入 + design tokens への brand-color exempt path 追加 | consumed by `docs/30-workflows/completed-tasks/issue-872-google-brand-4tone-icon-and-tokens-exempt/` | Issue #872 workflow がローカル実装完了として消費（`apps/web/src/components/ui/brand-icons/google.svg` + `GoogleBrandIcon.tsx` + `verify-design-tokens` brand-asset exempt 追加）。visual baseline 更新・commit/push/PR は user-gated |
| FU-LOGIN-002 | brand-mark を画像アセット (UBM 公式ロゴ) に差し替え | post-MVP candidate | アセット入稿待ち。"兵" 文字暫定 |
| FU-LOGIN-003 | staging 環境での visual smoke | infrastructure | staging deploy 後の user-gated runtime evidence。local visual evidence は本サイクルで完了 |
| FU-LOGIN-004 | i18n (英語ロケール対応) | future-scope | MVP 範囲外 |

CONST_007 例外条件適合性:

- FU-LOGIN-001 / 002: brand 規約 + 外部入稿 = 技術的に同サイクル完了不可
- FU-LOGIN-003: staging deploy gate 後の user-approval が必要
- FU-LOGIN-004: スコープ宣言上 MVP 外

「分量が多い」「念のため」での先送りはなし。すべて独立スコープでの分離。

ユーザーへのエスカレーション (CONST_007 後段要件):

- FU-LOGIN-001 / 002 はリリース前に user 判断で実施可否を確定する必要あり
- 他は後続バックログとして任意タイミング
