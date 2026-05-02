# Implementation guide

## Part 1: 中学生レベル

このタスクは、学校の教科書で「08a」というページを探したら見つからない問題を直す作業です。

やることは、新しい内容を書くことではありません。まず本当にページがないのか、別の場所に移されたのかを確かめます。移されているなら目次を書き直し、なくなっているなら「今はこのページは使えない」と正しく印を付けます。

大事なのは、目次、本文、ほかのページからのリンクが同じ場所を指すことです。どれか1つだけ直すと、また迷子になります。

## Part 2: 技術者レベル

本タスクは docs-only / NON_VISUAL の canonical workflow state normalization である。08a workflow root の物理状態を確認し、`legacy-ordinal-family-register.md`、`resource-map.md`、`task-workflow-active.md`、および 09a / 09b / 09c の上流 gate 参照を同一 wave で同期する。

実装順は、物理状態調査、A/B/C state decision、aiworkflow-requirements 更新、downstream reference 更新、index rebuild、NON_VISUAL evidence capture、Phase 12 close-out の順とする。

Phase 13 は commit / push / PR 作成の承認ゲートであり、本タスク仕様書作成時点では実行しない。
