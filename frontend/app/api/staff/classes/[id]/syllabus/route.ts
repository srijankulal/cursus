import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongoose';
import { SESSION_COOKIE_NAME, SESSION_USER_ID_COOKIE_NAME, isSessionRole } from '@/lib/auth/session';
import { Faculty } from '@/models/faculty';
import { Class } from '@/models/class';
import { SyllabusProgress } from '@/models/syllabusProgress';

async function verifyClassGuide(userId: string, classId: string) {
  const faculty = await Faculty.findOne({ user: userId, isActive: true }).exec();
  if (!faculty) {
    return { error: NextResponse.json({ ok: false, message: 'Faculty not found.' }, { status: 404 }) };
  }

  const classDoc = await Class.findById(classId).exec();
  if (!classDoc) {
    return { error: NextResponse.json({ ok: false, message: 'Class not found.' }, { status: 404 }) };
  }

  if (String(classDoc.classGuide) !== String(faculty._id)) {
    return { error: NextResponse.json({ ok: false, message: 'Not authorized to manage this class.' }, { status: 403 }) };
  }

  return { faculty, classDoc };
}

// GET progress for this class
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const roleValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!isSessionRole(roleValue) || roleValue !== 'staff') {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = cookieStore.get(SESSION_USER_ID_COOKIE_NAME)?.value;
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Missing user id.' }, { status: 401 });
    }

    const { id } = await Promise.resolve(params);
    await connectToDatabase();

    const verification = await verifyClassGuide(userId, id);
    if (verification.error) return verification.error;

    console.log('📖 GET Progress - Class:', id);

    const progress = await SyllabusProgress.findOne({ class: id }).exec();
    console.log('📖 GET Progress - Found:', progress ? 'Yes' : 'No');

    return NextResponse.json({
      ok: true,
      completedTopics: progress?.completedTopics || [],
    });
  } catch (error) {
    console.error('❌ Error fetching progress:', error);
    return NextResponse.json({ ok: false, message: 'Failed to fetch progress.' }, { status: 500 });
  }
}

// POST progress update for this class
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🟢 POST Progress Route Called');

    const cookieStore = await cookies();
    const roleValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!isSessionRole(roleValue) || roleValue !== 'staff') {
      console.log('❌ Unauthorized: role is', roleValue);
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = cookieStore.get(SESSION_USER_ID_COOKIE_NAME)?.value;
    if (!userId) {
      console.log('❌ Missing user id');
      return NextResponse.json({ ok: false, message: 'Missing user id.' }, { status: 401 });
    }

    const { id } = await Promise.resolve(params);
    const body = await request.json();

    console.log('📝 Class ID:', id);
    console.log('📝 Incoming progress data:', body.completedTopics?.length, 'topics marked');

    await connectToDatabase();
    console.log('✅ Connected to database');

    const verification = await verifyClassGuide(userId, id);
    if (verification.error) {
      console.log('❌ Verification failed');
      return verification.error;
    }

    // Find or create progress document
    let progress = await SyllabusProgress.findOne({ class: id }).exec();
    
    if (!progress) {
      console.log('📝 Creating new Progress document');
      progress = new SyllabusProgress({
        class: id,
        completedTopics: body.completedTopics || [],
      });
    } else {
      console.log('📝 Updating existing Progress document');
      progress.completedTopics = body.completedTopics || [];
    }

    const savedDoc = await progress.save();
    
    console.log('✅✅✅ SAVED TO DATABASE!');
    console.log('🗄️ Progress saved for class:', savedDoc.class);
    console.log('  Completed topics:', savedDoc.completedTopics.length);

    return NextResponse.json({
      ok: true,
      message: 'Progress updated!',
      completedTopics: savedDoc.completedTopics,
    });
  } catch (error) {
    console.error('❌ ERROR in POST progress:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ ok: false, message: 'Failed to update progress.' }, { status: 500 });
  }
}