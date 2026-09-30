export default function Loading() {
  return (
    <div role="status" className="space-y-6 motion-safe:animate-pulse">
      <span className="sr-only">관리 정보를 불러오는 중</span>
      <div className="h-16 w-60 rounded-xl bg-sunken" />
      <div className="grid gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-sunken" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-sunken" />
    </div>
  );
}
