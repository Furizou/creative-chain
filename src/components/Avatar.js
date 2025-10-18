"use client";
export default function Avatar({ src, alt, size = 40 }){
  return <img src={src} alt={alt} className="rounded-full" style={{ width: size, height: size }} />;
}
