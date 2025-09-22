import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        
        // Get courses from localStorage (simulated)
        const courses = JSON.parse(localStorage.getItem('courses') || '[]')
            .filter(course => course.createdBy === email);
            
        return NextResponse.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch courses' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const course = {
            id: Date.now(), // Simple ID generation
            name: data.name,
            details: data.details,
            maxStudents: parseInt(data.maxStudents),
            createdBy: data.createdBy,
            level: data.level,
            createdAt: new Date().toISOString()
        };
        
        // Store in localStorage (simulated)
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        courses.push(course);
        localStorage.setItem('courses', JSON.stringify(courses));
        
        return NextResponse.json(course);
    } catch (error) {
        console.error('Error creating course:', error);
        return NextResponse.json(
            { error: 'Failed to create course' },
            { status: 500 }
        );
    }
}