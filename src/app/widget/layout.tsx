export const metadata = { title: "COIN widget" };

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: 0, background: "transparent" }}>
      {children}
    </div>
  );
}
