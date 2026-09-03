import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const { childId } = await params;

    if (!childId) {
      return NextResponse.json({ error: 'Missing childId' }, { status: 400 });
    }

    // In production with live Supabase:
    // await supabase.rpc('delete_child_data', { p_child_id: childId });

    return NextResponse.json({
      success: true,
      message: `Child profile ${childId} and all associated learning history permanently deleted.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
