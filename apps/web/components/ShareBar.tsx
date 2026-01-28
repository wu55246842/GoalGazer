interface ShareBarProps {
  label: string;
  links: { href: string; label: string }[];
}

export default function ShareBar({ label, links }: ShareBarProps) {
  return (
    <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#6b7280" }}>
      <span>{label}: </span>
      {links.map((link, index) => (
        <span key={link.href}>
          <a href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
          {index < links.length - 1 ? " · " : null}
        </span>
      ))}
    </div>
  );
}
