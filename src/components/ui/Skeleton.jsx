export default function Skeleton({ width = '100%', height = 14, radius, style, className = '' }) {
  return <span aria-hidden="true" className={`skeleton ${className}`} style={{ width, height, borderRadius: radius, ...style }} />;
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="list" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="list-item">
          <Skeleton width={32} height={32} radius="50%" />
          <div className="list-item__main stack-sm">
            <Skeleton width={`${60 + ((i * 13) % 30)}%`} />
            <Skeleton width="40%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}
