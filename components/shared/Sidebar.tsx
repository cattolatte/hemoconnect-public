export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-background p-4 md:block">
      {/* Sidebar Content Placeholder */}
      <h2 className="mb-4 text-lg font-semibold tracking-tight">Navigation</h2>
      <nav className="flex flex-col space-y-2">
        {/* You can add navigation links here as well, mirroring or supplementing the Navbar */}
        <p className="text-sm text-muted-foreground">(Sidebar links)</p>
      </nav>
    </aside>
  );
}