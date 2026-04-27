import type { ReactNode } from "react";

export interface KVItem {
  key: string;
  value: ReactNode;
}

export interface KVListProps {
  items: KVItem[];
}

export function KVList({ items }: KVListProps) {
  return (
    <dl>
      {items.map((item) => (
        <div key={item.key}>
          <dt>{item.key}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
