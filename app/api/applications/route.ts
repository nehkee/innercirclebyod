import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const applicationSchema = z.object({
  type:      z.enum(['hangout', 'studio', 'dinner', 'backstage', 'football']),
  userId:    z.string().min(1),
  userName:  z.string().min(1).max(100),
  userEmail: z.string().email(),
  message:   z.string().min(20).max(1500),
});

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = applicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Anti-spam: check if user already applied this month
    // const { data: existing } = await supabase
    //   .from('applications')
    //   .select('id')
    //   .eq('user_id', parsed.data.userId)
    //   .eq('type', parsed.data.type)
    //   .gte('created_at', startOfMonth.toISOString())
    //   .single();
    //
    // if (existing) return NextResponse.json({ error: 'Already applied this month' }, { status: 429 });

    // Insert application
    // const { data, error } = await supabase.from('applications').insert({
    //   type:       parsed.data.type,
    //   user_id:   parsed.data.userId,
    //   user_name:  parsed.data.userName,
    //   user_email: parsed.data.userEmail,
    //   message:    parsed.data.message,
    //   status:     'pending',
    // }).select().single();

    // Send confirmation email via Resend
    // await resend.emails.send({
    //   from: process.env.RESEND_FROM_EMAIL!,
    //   to:   parsed.data.userEmail,
    //   subject: `Application Received — ${parsed.data.type.replace('_', ' ').toUpperCase()}`,
    //   html: applicationConfirmationEmail(parsed.data),
    // });

    return NextResponse.json({ success: true, applicationId: 'app-' + Date.now() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Admin only
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    // TODO: Supabase query with admin auth
    return NextResponse.json({ applications: [], total: 0 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // TODO: Admin auth + Supabase update
    // const { data } = await supabase
    //   .from('applications')
    //   .update({ status })
    //   .eq('id', id)
    //   .select()
    //   .single();

    // If approved, send notification email
    // if (status === 'approved') {
    //   await resend.emails.send({ ... });
    // }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
