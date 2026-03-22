import { ReactNode } from "react"
import { AppSidebar } from "./AppSidebar"
import { Header } from "./Header"
import { ReminderToaster } from "../tasks/ReminderToaster"
import { TaskEditorModal } from "../tasks/TaskEditorModal"

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-slate-900">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50/30 relative">
          {children}
        </main>
      </div>
      <ReminderToaster />
      <TaskEditorModal />
    </div>
  )
}
