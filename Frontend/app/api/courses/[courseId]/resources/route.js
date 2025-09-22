import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        // Get resources from localStorage (simulated)
        const resources = JSON.parse(localStorage.getItem('courseResources') || '[]')
            .filter(resource => resource.courseId === parseInt(params.courseId));
        return NextResponse.json(resources);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const data = await request.json();
        const resource = {
            id: Date.now(), // Simple ID generation
            courseId: parseInt(params.courseId),
            title: data.title,
            description: data.description,
            link: data.link,
            createdBy: data.createdBy,
            createdAt: new Date().toISOString()
        };
        
        // Store in localStorage (simulated)
        const resources = JSON.parse(localStorage.getItem('courseResources') || '[]');
        resources.push(resource);
        localStorage.setItem('courseResources', JSON.stringify(resources));
        
        return NextResponse.json(resource);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
    }
}