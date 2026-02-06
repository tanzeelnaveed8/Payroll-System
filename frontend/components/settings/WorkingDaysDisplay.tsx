"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface WorkingDaysDisplayProps {
  timezone?: string;
  workingDays?: string[];
  title?: string;
}

/**
 * Display component for working days and timezone (read-only)
 * Used for manager, dept_lead, and employee views
 */
export default function WorkingDaysDisplay({ 
  timezone, 
  workingDays = [], 
  title = "Time & Schedule" 
}: WorkingDaysDisplayProps) {
  const workingDaysMap: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  // Normalize working days to lowercase for consistent display
  const normalizedDays = workingDays.map(day => day.toLowerCase().trim());
  
  // Sort days by their order in the week
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const sortedDays = normalizedDays
    .filter(day => dayOrder.includes(day))
    .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  return (
    <Card className="border-2 border-slate-300 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#0F172A]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {timezone && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">
              Timezone
            </label>
            <p className="text-sm text-[#64748B]">{timezone}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#0F172A]">
            Working Days
          </label>
          {sortedDays.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {sortedDays.map((day) => (
                <Badge
                  key={day}
                  className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20 px-3 py-1"
                  aria-label={`Working day: ${workingDaysMap[day] || day}`}
                >
                  {workingDaysMap[day] || day.charAt(0).toUpperCase() + day.slice(1)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748B] italic">No working days configured</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
