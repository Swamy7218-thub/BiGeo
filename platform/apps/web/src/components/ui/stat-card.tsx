"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  variants?: object;
}

export function StatCard({ icon: Icon, label, value, delta, positive, variants }: StatCardProps) {
  return (
    <motion.div
      variants={variants}
      className="bg-[var(--surface)] border rounded-xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-[var(--green-dim)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[var(--green)]" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold text-white">{value}</p>
        {delta && (
          <p className={clsx("text-xs mt-0.5", positive ? "text-green-400" : "text-[var(--text-muted)]")}>
            {delta}
          </p>
        )}
      </div>
    </motion.div>
  );
}
