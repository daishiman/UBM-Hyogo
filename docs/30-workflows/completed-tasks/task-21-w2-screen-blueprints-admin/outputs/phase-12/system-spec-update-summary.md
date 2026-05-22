# system-spec-update-summary.md

## 対象 spec

`docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`（906 行 / AC-1〜9 PASS）

## 関連 spec との参照関係

| 関連 spec | 関係 | 09g からの参照 | 09g への被参照 |
| --- | --- | --- | --- |
| 09-ui-ux.md | 親 | §X.8 で back link | admin 詳細へのリンク追加候補 |
| 09c-primitives.md | 部品出典 | 全画面 §X.2 / §X.6 で primitive 名参照 | admin 用例リンク追加候補 |
| 09d-icons.md | icon 出典 | §1.2 / §X.8 で参照 | なし |
| 09e-screen-blueprints-public.md | 兄弟 | §X.8 で参照 | なし |
| 09f-screen-blueprints-member.md | 兄弟 | §X.8 で参照 | なし |
| 09h-shell-and-fixtures.md | shell / fixtures | §1.3 / §X.8 で参照 | なし |
| pages-admin.jsx（凍結） | 一次転記元 | §2 §3 §4 §6 で 構造 contract 転記 | なし（凍結） |
| phase-3 §2 §3 §5.3〜5.7 | API + 派生元 | §X.4 / §5/§7/§8/§9 派生注記 | なし |

## 親 workflow への影響

`ui-prototype-alignment-mvp-recovery` の下記 task が本 spec を起点に着手可能になる:

- task-15: admin shell（§1 + §2）
- task-16: admin members / tags（§3 / §4）
- task-17: admin meetings / schema / requests / identity-conflicts / audit（§5〜§9）

## aiworkflow-requirements skill 同期判定

| 同期対象 | 判定 | 理由 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 必要（実施） | 09g が admin blueprint の直接導線になったため |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 必要（実施） | task-21 / 09g / Phase 12 evidence を逆引き可能にするため |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 必要（実施） | W2 task-21 の Phase 1〜12 完了と Phase 13 gate を親 workflow 進捗として明記するため |

> 上記 N/A 判定は `phase12-task-spec-compliance-check.md` の self-check 表でも検証している。

## 横断ドキュメントへの追加候補（changelog で実施）

- 09 末尾に「admin 詳細は 09g を参照」リンク
- 09a 末尾に「admin での token 利用例は 09g §1.4 / 各 §X.2 を参照」リンク
- 09c 末尾に「admin での primitive 組合せ用例は 09g 各 §X.2 / §X.6 を参照」リンク

## 不変条件への影響

CLAUDE.md 不変条件 1〜7 は本タスクで変更しない。pages-admin.jsx を改変せず、D1 直接アクセス禁止を維持。

## 結論

- 09g は repair により AC-1〜9 全 PASS
- skill 同期は quick-reference / resource-map / task-workflow-active に実施済み
- 関連 spec への back-link 追加候補は changelog で記録
