import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        // Get announcements from localStorage (simulated)
        const announcements = JSON.parse(localStorage.getItem('courseAnnouncements') || '[]')
            .filter(announcement => announcement.courseId === parseInt(params.courseId));
        return NextResponse.json(announcements);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const data = await request.json();
        const announcement = {
            id: Date.now(), // Simple ID generation
            courseId: parseInt(params.courseId),
            title: data.title,
            content: data.content,
            createdBy: data.createdBy,
            createdAt: new Date().toISOString()
        };
        
        // Store in localStorage (simulated)
        const announcements = JSON.parse(localStorage.getItem('courseAnnouncements') || '[]');
        announcements.push(announcement);
        localStorage.setItem('courseAnnouncements', JSON.stringify(announcements));
        
        return NextResponse.json(announcement);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }
}