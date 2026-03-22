"use client"

import dayjs from "dayjs"
import { useCalendarStore } from "@/store/calendarStore"
import { useTaskStore } from "@/store/taskStore"
import { getTasksForDate } from "@/lib/recurrence/taskRecurrence"
import { useRouter } from "next/navigation"

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** Returns all the days in the "calendar grid" for a given month (includes leading/trailing days) */
function getMonthGridDays(year: number, month: number): dayjs.Dayjs[] {
  const start = dayjs(new Date(year, month, 1)).startOf('week')
  const end   = dayjs(new Date(year, month + 1, 0)).endOf('week')
  const days: dayjs.Dayjs[] = []
  let cur = start
  while (cur.isBefore(end) || cur.isSame(end, 'day')) {
    days.push(cur)
    cur = cur.add(1, 'day')
  }
  return days
}

export default function YearView() {
  const { currentDate, setCurrentDate } = useCalendarStore()
  const { tasks, filterTag } = useTaskStore()
  const router = useRouter()

  const year  = dayjs(currentDate).year()
  const today = dayjs()

  const filteredTasks = filterTag === 'all'
    ? tasks
    : tasks.filter(t => t.priority?.includes(filterTag))

  const navigateToMonth = (month: number) => {
    setCurrentDate(dayjs(new Date(year, month, 1)).toDate())
    router.push('/month')
  }

  const navigateToDay = (d: dayjs.Dayjs) => {
    setCurrentDate(d.toDate())
    router.push('/day')
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 12 }, (_, month) => {
          const isCurrentMonth = today.year() === year && today.month() === month
          const monthLabel = dayjs(new Date(year, month, 1)).format('MMMM')
          const gridDays = getMonthGridDays(year, month)

          return (
            <div
              key={month}
              className={[
                'rounded-xl border bg-white shadow-sm transition-all',
                isCurrentMonth
                  ? 'border-blue-200 shadow-blue-100 shadow-md ring-1 ring-blue-200'
                  : 'border-gray-200 hover:shadow-md hover:border-gray-300',
              ].join(' ')}
            >
              {/* Month header — click navigates to month view */}
              <button
                onClick={() => navigateToMonth(month)}
                className="w-full text-left px-4 pt-4 pb-2 group"
              >
                <span className={[
                  'text-sm font-bold tracking-wide transition-colors',
                  isCurrentMonth
                    ? 'text-blue-600'
                    : 'text-gray-800 group-hover:text-blue-600',
                ].join(' ')}>
                  {monthLabel}
                </span>
              </button>

              {/* Weekday header row */}
              <div className="grid grid-cols-7 px-3 mb-1">
                {WEEKDAYS.map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-0.5">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
                {gridDays.map((d, i) => {
                  const inMonth  = d.month() === month
                  const isToday  = d.isSame(today, 'day')
                  const hasTasks = inMonth && getTasksForDate(filteredTasks, d.toISOString()).length > 0

                  if (!inMonth) {
                    return <div key={i} className="aspect-square" />
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => navigateToDay(d)}
                      className={[
                        'aspect-square flex flex-col items-center justify-center rounded-full text-[11px]',
                        'transition-colors relative',
                        isToday
                          ? 'bg-blue-600 text-white font-bold hover:bg-blue-700'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700',
                      ].join(' ')}
                    >
                      {d.date()}

                      {/* Task indicator dot */}
                      {hasTasks && (
                        <span
                          className={[
                            'absolute bottom-[1px] w-1 h-1 rounded-full',
                            isToday ? 'bg-white/70' : 'bg-blue-400',
                          ].join(' ')}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
