"use client";
export function LineChart({ points = [] }){
  const width = 400, height = 120;
  if (!points.length) return <div className="text-sm text-gray-500">No data</div>;
  const max = Math.max(...points);
  const pts = points.map((p,i)=>`${(i/(points.length-1))*width},${height - (p/max)*height}`).join(' ');
  return <svg width={width} height={height} className="w-full"><polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={pts} /></svg>;
}

export function PieChart({ parts = [] }){
  const total = parts.reduce((s,p)=>s+p.value,0) || 1;
  let acc = 0;
  const r = 40, cx = 50, cy = 50;
  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      {parts.map((p,idx)=>{
        const start = (acc/total) * Math.PI*2;
        acc += p.value;
        const end = (acc/total) * Math.PI*2;
        const x1 = cx + r*Math.cos(start);
        const y1 = cy + r*Math.sin(start);
        const x2 = cx + r*Math.cos(end);
        const y2 = cy + r*Math.sin(end);
        const large = end-start > Math.PI ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        return <path key={idx} d={d} fill={p.color||'#ccc'} />
      })}
    </svg>
  );
}
