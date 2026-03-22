"use client"

import { Button } from "@/components/ui/Button"
import { useCalendarStore } from "@/store/calendarStore"
import { useTaskStore } from "@/store/taskStore"
import { format, addMonths, subMonths, addDays, subDays, addYears, subYears } from "@/lib/date-utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import dayjs from "dayjs"

export function Header() {
  const { currentDate, setCurrentDate } = useCalendarStore();
  const { filterTag, setFilterTag } = useTaskStore();
  const router = useRouter();
  const pathname = usePathname();

  // Navigate by the correct unit depending on active view
  const handlePrevious = () => {
    if (pathname === '/day')   return setCurrentDate(subDays(currentDate, 1));
    if (pathname === '/year')  return setCurrentDate(subYears(currentDate, 1));
    return setCurrentDate(subMonths(currentDate, 1));
  };
  const handleNext = () => {
    if (pathname === '/day')   return setCurrentDate(addDays(currentDate, 1));
    if (pathname === '/year')  return setCurrentDate(addYears(currentDate, 1));
    return setCurrentDate(addMonths(currentDate, 1));
  };
  const handleToday = () => setCurrentDate(new Date());

  // Show the right label in the header depending on the view
  const headerLabel = () => {
    if (pathname === '/day')  return format(currentDate, "EEEE, MMMM d, yyyy");
    if (pathname === '/year') return format(currentDate, "yyyy");
    return format(currentDate, "MMMM yyyy");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="flex h-16 items-center border-b px-6 bg-white shrink-0 justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900 whitespace-nowrap">
            {headerLabel()}
          </h1>
          {/* Jump-to-date: fixed using dayjs to avoid timezone midnight shift */}
          <input
            type="date"
            title="Jump to date"
            className="text-sm border border-gray-200 bg-gray-50 rounded-md px-2 py-1.5 text-gray-600 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer transition-all"
            value={dayjs(currentDate).format("YYYY-MM-DD")}
            onChange={(e) => {
              if (e.target.value) {
                // dayjs parsing avoids the UTC midnight → local prev-day shift
                setCurrentDate(dayjs(e.target.value).toDate());
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex items-center rounded-md border p-1 bg-gray-50">
        <select 
          value={filterTag} 
          onChange={(e) => setFilterTag(e.target.value as any)}
          className="mr-3 ml-1 rounded-sm border-transparent bg-transparent py-1 text-sm font-medium text-gray-600 focus:outline-none cursor-pointer"
        >
          <option value="all">All Tags</option>
          <option value="urgent">Urgent</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
        </select>
        <div className="w-[1px] h-6 bg-gray-200 mx-1" />
        <button 
          onClick={() => router.push('/day')}
          className={`px-3 py-1 text-sm rounded-sm transition-colors ${isActive('/day') ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Day
        </button>
        <button 
          onClick={() => router.push('/month')}
          className={`px-3 py-1 text-sm rounded-sm transition-colors ${isActive('/month') ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Month
        </button>
        <button 
          onClick={() => router.push('/year')}
          className={`px-3 py-1 text-sm rounded-sm transition-colors ${isActive('/year') ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Year
        </button>
      </div>
    </header>
  )
}
