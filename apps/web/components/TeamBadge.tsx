import React from "react";

interface TeamBadgeProps {
  label: string;
  size?: number;
  className?: string;
}

const DEFAULT_SIZE = 24;

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const TeamBadge: React.FC<TeamBadgeProps> = ({ label, size = DEFAULT_SIZE, className = "" }) => {
  const initials = getInitials(label);
  return (
    <div
      aria-label={label}
      title={label}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "999px",
        background: "var(--color-bg-alt)",
        border: "1px solid var(--color-border)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(10, Math.floor(size * 0.45)),
        fontWeight: 700,
        color: "var(--color-text)",
        letterSpacing: "0.04em",
      }}
    >
      {initials}
    </div>
  );
};

export default TeamBadge;
