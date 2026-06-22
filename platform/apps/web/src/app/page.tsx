"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, MapPin, Route, Truck, TrendingUp, Package, Zap, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { api } from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import { NetworkMap } from "@/components/map/network-map";

const FADE_UP = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const mockDeliveryData = [
  { day: "Mon", deliveries: 142, onTime: 128 },
  { day: "Tue", deliveries: 189, onTime: 171 },
  { day: "Wed", deliveries: 167, onTime: 155 },
  { day: "Thu", deliveries: 203, onTime: 190 },
  { day: "Fri", deliveries: 241, onTime: 228 },
  { day: "Sat", deliveries: 198, onTime: 180 },
  { day: "Sun", deliveries: 87, onTime: 82 },
];

const mockDistrictData = [
  { district: "Siddipet", volume: 423 },
  { district: "Medak", volume: 387 },
  { district: "Nizamabad", volume: 312 },
  { district: "Karimnagar", volume: 289 },
  { district: "Warangal", volume: 254 },
];

export default function Dashboard() {
  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<{ status: string }>("/health"),
    refetchInterval: 30000,
  });

  const isHealthy = health?.status === "ok";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Operations Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Hub-and-Spoke Logistics Network — Telangana</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${isHealthy ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-[var(--text-muted)]">{isHealthy ? "All systems operational" : "System degraded"}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate="show"
      >
        <StatCard variants={FADE_UP} icon={Package} label="Deliveries Today" value="241" delta="+12%" positive />
        <StatCard variants={FADE_UP} icon={MapPin} label="Active Hubs" value="8" delta="2 pending" />
        <StatCard variants={FADE_UP} icon={Truck} label="Vehicles Active" value="34" delta="of 40" />
        <StatCard variants={FADE_UP} icon={TrendingUp} label="On-Time Rate" value="94.6%" delta="+2.1%" positive />
      </motion.div>

      {/* Map + Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[var(--surface)] rounded-xl border overflow-hidden" style={{ height: 400 }}>
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--green)]" />
            <span className="text-sm font-medium">Network Map — Telangana</span>
          </div>
          <NetworkMap />
        </div>

        <div className="bg-[var(--surface)] rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-4 h-4 text-[var(--amber)]" />
            <span className="text-sm font-medium">Volume by District</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockDistrictData} layout="vertical">
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis dataKey="district" type="category" tick={{ fill: "#94a3b8", fontSize: 11 }} width={75} />
              <Tooltip contentStyle={{ background: "#0d1f14", border: "1px solid #1a3322", borderRadius: 8 }} />
              <Bar dataKey="volume" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Delivery trend */}
      <div className="bg-[var(--surface)] rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[var(--green)]" />
          <span className="text-sm font-medium">Delivery Volume — Last 7 Days</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={mockDeliveryData}>
            <defs>
              <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gOnTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#0d1f14", border: "1px solid #1a3322", borderRadius: 8 }} />
            <Area type="monotone" dataKey="deliveries" stroke="#22c55e" fill="url(#gTotal)" strokeWidth={2} name="Total" />
            <Area type="monotone" dataKey="onTime" stroke="#f59e0b" fill="url(#gOnTime)" strokeWidth={2} name="On-Time" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
