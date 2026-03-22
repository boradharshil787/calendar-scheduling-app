import { NextResponse } from 'next/server';

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const updatedData = await request.json();
  // Return mocked success preserving the requested ID
  return NextResponse.json({ id: params.id, ...updatedData });
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // Return mocked success
  return NextResponse.json({ success: true, deletedId: params.id });
}
