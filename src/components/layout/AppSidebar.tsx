"use client"

import { Calendar, Plus } from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import Link from "next/link"

export function AppSidebar() {
  const { openEditor } = useTaskStore();

  return (
    <aside className="w-64 border-r bg-white flex flex-col h-full">
      <div className="p-4 border-b h-16 flex items-center shrink-0">
        <div className="flex items-center gap-2 font-semibold text-xl text-gray-800 tracking-tight">
          <Calendar className="h-6 w-6 text-blue-600" />
          <span>CalSync</span>
        </div>
      </div>

      <div className="p-4 pt-6 shrink-0">
        <button 
          onClick={() => openEditor({})}
          className="flex items-center gap-3 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 rounded-full px-5 py-3.5 text-sm font-semibold text-gray-700 transition-all duration-200 ease-in-out hover:scale-[1.02]"
        >
          <Plus className="h-6 w-6 text-blue-600" />
          <span className="text-[15px]">Create</span>
        </button>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        <Link href="/month" className="flex items-center gap-4 rounded-md bg-blue-50 px-3 py-2.5 text-blue-700 text-sm font-medium">
          <Calendar className="h-4 w-4" />
          Calendar
        </Link>
      </nav>
    </aside>
  )
}

