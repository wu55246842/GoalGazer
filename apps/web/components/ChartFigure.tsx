'use client';

interface ChartFigureProps {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
}

export default function ChartFigure({
  src,
  alt,
  caption,
  width,
  height,
}: ChartFigureProps) {
  return (
    <figure style={{
      margin: "2.5rem 0",
      padding: 0,
      background: "white",
      borderRadius: "var(--radius-xl)",
      border: "1px solid var(--color-border)",
      boxShadow: "var(--shadow-lg)",
      overflow: "hidden",
      transition: "all var(--transition-base)",
    }}>
      <div style={{
        position: "relative",
        overflow: "hidden",
        background: "var(--color-bg-alt)",
      }}>
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            transition: "transform var(--transition-slow)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        />
      </div>
      {caption && (
        <figcaption style={{
          padding: "1.25rem 1.5rem",
          fontSize: "0.9375rem",
          color: "var(--color-text-muted)",
          textAlign: "center",
          fontStyle: "normal",
          background: "white",
          borderTop: "1px solid var(--color-border-light)",
        }}>
          <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
            {caption}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
