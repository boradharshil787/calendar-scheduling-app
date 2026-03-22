import { NextResponse } from 'next/server';
import { Task } from '@/types/task';

let mockTasks: Task[] = [
  {
    id: '1',
    title: 'Review PRs',
    completed: false,
    dueDate: new Date(),
  }
];

export async function GET() {
  return NextResponse.json(mockTasks);
}

export async function POST(request: Request) {
  const task = await request.json() as Task;
  const newTask = { ...task, id: Math.random().toString(36).substr(2, 9) };
  mockTasks.push(newTask);
  return NextResponse.json(newTask, { status: 201 });
}
