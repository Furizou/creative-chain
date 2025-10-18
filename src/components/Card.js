"use client";
export default function Card({ children, className = '' }){
  return <div className={"p-4 border rounded bg-white " + className}>{children}</div>;
}
