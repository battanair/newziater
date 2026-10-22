export function LegalPage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <main className="wrap section" style={{ maxWidth: 760 }}>
      <h1 className="h1" style={{ marginBottom: 24 }}>{title}</h1>
      <div className="soft" style={{ lineHeight: 1.7 }}>{children}</div>
    </main>
  );
}
