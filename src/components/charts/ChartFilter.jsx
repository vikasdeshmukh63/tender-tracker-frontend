import React from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export const getDateRangeFromFilter = (filterOption) => {
  const now = new Date();
  let startDate = null;

  switch (filterOption) {
    case "Last 2 Weeks":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 14);
      break;
    case "Last 3 Months":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "Last 6 Months":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
      break;
    case "Last Year":
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case "This Year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "All Time":
    default:
      return null;
  }

  return startDate;
};

export default function ChartFilter({ onFilterChange, options = ["All Time", "Last 3 Months", "Last 6 Months", "Last Year", "This Year", "Last 2 Weeks"] }) {
  const [selected, setSelected] = React.useState(options[0]);

  const handleSelect = (option) => {
    setSelected(option);
    onFilterChange?.(option);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
          {selected}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {options.map((option) => (
          <DropdownMenuItem key={option} onClick={() => handleSelect(option)} className="text-xs cursor-pointer">
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}