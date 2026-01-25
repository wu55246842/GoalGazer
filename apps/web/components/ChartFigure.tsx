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
    <figure className="figure">
      <img src={src} alt={alt} width={width} height={height} loading="lazy" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
