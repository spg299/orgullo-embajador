export default function SectionEyebrow({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-royal-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-royal-500">
      <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
      {children}
    </span>
  );
}
