export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      {/* Auth-specific styling and layout */}
      <main className="auth-main">{children}</main>
    </div>
  );
}