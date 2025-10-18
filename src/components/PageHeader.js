"use client";
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-8">
      {title && <h1 className="text-3xl font-bold mb-2">{title}</h1>}
      {subtitle && <p className="text-gray-600 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}
