export interface LinkPill {
  label: string;
  href: string;
  ariaLabel?: string;
}

export interface LinkPillsProps {
  links: LinkPill[];
}

export function LinkPills({ links }: LinkPillsProps) {
  return (
    <ul>
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.ariaLabel ?? link.label}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
