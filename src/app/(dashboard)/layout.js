export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      {/* Dashboard navigation and sidebar can go here */}
      <main>{children}</main>
    </div>
  );
}