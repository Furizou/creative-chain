"use client";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
