"use client";

import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import {
  statusLabel,
  TAG_LIFECYCLE_DESCRIPTORS,
  visibleLifecycleOperations,
  type TagDefinitionItem,
  type TagLifecycleOperation,
} from "./tagCatalogLifecycle";

interface TagCatalogRowProps {
  readonly tag: TagDefinitionItem;
  readonly busyOperation: TagLifecycleOperation | null;
  readonly errorMessage?: string | null;
  readonly onOperation: (tag: TagDefinitionItem, operation: TagLifecycleOperation) => void;
}

export function TagCatalogRow({
  tag,
  busyOperation,
  errorMessage,
  onOperation,
}: TagCatalogRowProps) {
  const operations = visibleLifecycleOperations(tag);
  return (
    <article
      className="tag-catalog-row"
      data-active={tag.active ? "true" : "false"}
      data-testid={`tag-catalog-row-${tag.tagId}`}
    >
      <div className="tag-catalog-row__main">
        <div>
          <h2>{tag.label}</h2>
          <p>
            <code>{tag.code}</code>
            <span aria-hidden="true"> / </span>
            <span>{tag.category}</span>
          </p>
        </div>
        <Chip tone={tag.active ? "green" : "stone"} dot>
          {statusLabel(tag.active)}
        </Chip>
      </div>
      <div className="tag-catalog-actions" aria-label={`${tag.label} の操作`}>
        {operations.map((operation) => {
          const descriptor = TAG_LIFECYCLE_DESCRIPTORS[operation];
          return (
            <Button
              key={operation}
              size="sm"
              variant={descriptor.destructive ? "danger" : operation === "reactivate" ? "primary" : "soft"}
              loading={busyOperation === operation}
              onClick={() => onOperation(tag, operation)}
              aria-label={`${tag.label}を${descriptor.label}`}
            >
              {descriptor.label}
            </Button>
          );
        })}
      </div>
      <p className="tag-catalog-row__description">
        {tag.active
          ? "通常のタグ選択に表示されます。論理削除と完全削除を選べます。"
          : "通常のタグ選択から外れています。再有効化または完全削除を選べます。"}
      </p>
      {errorMessage ? (
        <p role="alert" className="tag-catalog-row__error">
          {errorMessage}
        </p>
      ) : null}
    </article>
  );
}
