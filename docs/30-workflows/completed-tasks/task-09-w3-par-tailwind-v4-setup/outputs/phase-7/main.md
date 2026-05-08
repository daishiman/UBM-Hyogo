# Phase 7: カバレッジ確認（token coverage）

09b §9 JSON 正本との 1:1 突合。

| カテゴリ | required | actual | カバレッジ |
| --- | --- | --- | --- |
| color.surface | 4 | 4 | ✅ |
| color.text | 3 | 3 | ✅ |
| color.border | 2 | 2 | ✅ |
| color.accent | 3 | 3 | ✅ |
| color.status | 8 | 8 | ✅ |
| color.zone | 5 | 5 | ✅ |
| theme.warm | 12 | 12 | ✅ |
| theme.cool | 12 | 12 | ✅ |
| radius | 5 | 5 | ✅ |
| shadow | 4 | 4 | ✅ |
| font | 5 | 5 | ✅ |
| text | 8 | 8 | ✅ |
| spacing | 10 | 10 | ✅ |
| duration | 3 | 3 | ✅ |
| easing | 4 | 4 | ✅ |
| **合計** | **64+24 override** | **64+24 override** | **100%** |

tokens.test.ts は base 64 tokens 全件を assertion し、欠落 0。
