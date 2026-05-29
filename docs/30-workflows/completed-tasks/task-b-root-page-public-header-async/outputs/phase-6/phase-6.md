# Phase 6: テスト拡充

| 項目      | 値                          |
| --------- | --------------------------- |
| Phase     | 6 / 13                      |
| 名称      | テスト拡充                  |
| 状態      | completed                   |
| 作成日    | 2026-05-28                  |

## 1. 追加テスト（fail path / 回帰 guard）

| ID     | ケース                                                                                    | 期待挙動                                                |
| ------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| TC-03  | `resolveAuthView` が guest / member / admin を決定論的に返す                               | helper 側で fail-closed 境界を集約し root page は authView を配線するだけ |
| TC-04  | `revalidate` 値が 60 のまま（regression）                                                  | `export const revalidate === 60`                        |
| TC-05  | `connection()` 呼び出しが残存                                                              | `app/page.tsx` 内で `connection(` が grep に hit する   |

> TC-04 / TC-05 は static source guard としても並走可能（grep gate）。

## 2. grep gate（補助 command）

```bash
# 旧 <PublicHeader /> （props なし）が残っていないことを保証
! grep -nE '<PublicHeader\s*/>' apps/web/app/page.tsx

# await getAuthView() が 1 件存在
grep -nE 'await\s+getAuthView\(\)' apps/web/app/page.tsx

# revalidate / connection / generateMetadata の不変性
grep -nE 'export const revalidate\s*=\s*60' apps/web/app/page.tsx
grep -nE 'connection\(' apps/web/app/page.tsx
grep -nE 'generateMetadata' apps/web/app/page.tsx
```

## 3. 完了条件

- TC-03 〜 TC-05 を spec / source guard に追加し、すべて GREEN
- 上記 grep gate がすべて期待通り（旧パターン 0 件 / 新パターン 1 件以上）
