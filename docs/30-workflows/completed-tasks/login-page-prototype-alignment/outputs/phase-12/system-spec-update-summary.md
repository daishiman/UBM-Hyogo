# System spec update summary

本タスクが正本仕様 (`docs/00-getting-started-manual/specs/`) に与える影響。

## 影響する spec

| spec file | 影響 | 更新要否 |
|-----------|------|---------|
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | `/login` UI 構造の variant が変わる。Magic Link 優先・OAuth 二次の動線確定 | **更新済み** |
| `docs/00-getting-started-manual/specs/02-auth.md` | 認証フロー自体 (Auth.js 経路) は不変 | 不要 |
| `docs/00-getting-started-manual/specs/00-overview.md` | 機能数・スコープ不変 | 不要 |
| design tokens (`design-tokens.md`) | 新 token 追加なし (既存のみ参照) | 不要 |

## `13-mvp-auth.md` 更新内容

- /login の UI 構造を「Magic Link primary → OR → Google ghost」へ正式化
- brand mark "兵" + jp/en 2 段タイトルの導入を明文化
- 文言一覧表 (Phase 4 §5) を spec 側に転記
- AC-1..AC-12 を spec 側 acceptance に追記

実装サイクル内で diff 適用済み。

## aiworkflow-requirements skill への影響

- index ([`docs/30-workflows/LOGS.md`](../../../LOGS.md) と aiworkflow `indexes/`) に本ワークフロー root を 1 行追加済み
- `.claude/skills/aiworkflow-requirements/references/workflow-login-page-prototype-alignment-artifact-inventory.md` を追加済み

## 不変条件への影響

CLAUDE.md「重要な不変条件」#5 (D1 直接アクセス禁止)、#7 (再回答経路) には抵触しない。MVP scope 維持。
