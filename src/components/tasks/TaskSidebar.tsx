"use client"

import { useEffect, useState } from "react"
import { useTaskStore } from "@/store/taskStore"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { CheckSquare, AlertCircle } from "lucide-react"

export function TaskSidebar() {
  const { tasks, fetchTasks, toggleTaskCompletion, addTask, isLoading } = useTaskStore()
  const [newTaskTitle, setNewTaskTitle] = useState("")

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    // Immediately pushes to store and initiates async background POST
    await addTask({
      title: newTaskTitle,
      completed: false,
      dueDate: new Date().toISOString(),
    });
    
    setNewTaskTitle("")
  }

  return (
    <aside className="w-80 border-l bg-white flex flex-col h-full relative z-10 shrink-0">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-blue-600" />
          My Tasks {isLoading && <span className="text-xs text-gray-400 font-normal ml-2">Syncing...</span>}
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50/50 hover:bg-white transition-colors shadow-sm">
            <input 
              type="checkbox" 
              checked={task.completed} 
              onChange={() => toggleTaskCompletion(task.id)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
            />
            <div className={`flex-1 ${task.completed ? 'opacity-50 line-through' : ''}`}>
              <div className="text-sm font-medium text-gray-900">{task.title}</div>
              {task.dueDate && (
                <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Due soon
                </div>
              )}
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-8">
            No tasks yet. Create one!
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-gray-50/50">
        <form onSubmit={handleAddTask} className="flex gap-2">
          <Input 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..." 
            className="flex-1 bg-white"
          />
          <Button type="submit" size="sm" variant="default">Add</Button>
        </form>
      </div>
    </aside>
  )
}
