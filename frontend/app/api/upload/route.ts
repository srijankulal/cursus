import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose'; 
import { QPNote } from '@/models/qp_notes';

export async function POST(request: Request) {
  try {
    // 1. Get the form data safely
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No valid file provided' }, { status: 400 });
    }
    
    // Safely extract with fallbacks to guarantee no nulls go to Mongoose
    const uiType = formData.get('documentType') as string;
    const documentType = uiType === 'notes' ? 'note' : 'question_paper'; // Ensuring enum matches

    const subject = (formData.get('subject') as string) || 'General';
    const semesterStr = formData.get('semester');
    const semester = semesterStr ? parseInt(semesterStr as string, 10) : 1;
    const department = (formData.get('department') as string) || 'CSE';
    
    // Using your real faculty ID
    const facultyId = '69c130d23ce40c87ebffe47d'; 

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ error: 'Missing Cloudinary credentials' }, { status: 500 });
    }

    // 2. Upload to Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', uploadPreset);

    const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    const cloudinaryData = await cloudinaryResponse.json();

    if (!cloudinaryResponse.ok) {
      return NextResponse.json(
        { error: cloudinaryData.error?.message || 'Failed to upload image to Cloudinary' },
        { status: cloudinaryResponse.status }
      );
    }

    // 3. Save to MongoDB 
    try {
      await connectToDatabase();
      
      const newNote = await QPNote.create({
        url: cloudinaryData.secure_url,
        type: documentType, 
        subject: subject,
        semester: semester,
        department: department,
        faculty: facultyId, 
        facultyUploaded: true,
        isApproved: false,
        isVisible: true
      });

      // 4. Return success 
      return NextResponse.json({ 
        success: true, 
        url: cloudinaryData.secure_url,
        note: newNote 
      }, { status: 201 });

    } catch (dbError: any) {
      // Catch specific DB errors so they don't break the Next.js process
      console.error('Database insertion error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database error', 
          message: dbError?.message || String(dbError),
          details: dbError?.errors || {} // Will output exact mongoose validation failures
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Fatal API error:', error);
    return NextResponse.json(
      { 
        error: 'Critical server error', 
        message: error?.message || String(error) 
      },
      { status: 500 }
    );
  }
}