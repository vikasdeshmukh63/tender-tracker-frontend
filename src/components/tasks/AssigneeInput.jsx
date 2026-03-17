import React, { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AssigneeInput({ assignees = [], onChange }) {
  const [inputVal, setInputVal] = useState("");

  const addEmail = (raw) => {
    const email = raw.trim().toLowerCase();
    if (!email || assignees.includes(email)) return;
    onChange([...assignees, email]);
    setInputVal("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(inputVal);
    } else if (e.key === "Backspace" && !inputVal && assignees.length) {
      onChange(assignees.slice(0, -1));
    }
  };

  const remove = (email) => onChange(assignees.filter((a) => a !== email));

  return (
    <div className="min-h-[42px] flex flex-wrap gap-1.5 items-center border rounded-md px-2 py-1.5 bg-gray-50/50 focus-within:ring-1 focus-within:ring-ring">
      {assignees.map((email) => (
        <span key={email} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs rounded-full px-2.5 py-0.5 font-medium">
          {email}
          <button type="button" onClick={() => remove(email)} className="hover:text-red-600 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => addEmail(inputVal)}
        placeholder={assignees.length === 0 ? "Type email and press Enter..." : "Add more..."}
        className="flex-1 min-w-[140px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
      />
    </div>
  );
}