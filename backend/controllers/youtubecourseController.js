const YoutubeCourse = require('../models/youtubeCourse');

const axios = require('axios');
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || 'qwen-3-235b-a22b-instruct-2507';

const generateCourse = async (req, res) => {
    try {
        const { topic, details, difficulty, duration, numChapters } = req.body;

    const prompt = `Generate a detailed course layout in strict JSON format for:
        Topic: ${topic}
        ${details ? `Additional Details: ${details}` : ''}
        Difficulty Level: ${difficulty}
        Total Duration: ${duration}
        Number of Chapters: ${numChapters}

        Return ONLY a JSON object with this exact structure:
        {
            "name": "Course Name",
            "summary": "Course Summary",
            "chapters": [
                {
                    "title": "Chapter Title",
                    "summary": "Chapter Summary",
                    "duration": "Duration"
                }
            ]
        }

        Do not include any markdown formatting, code blocks, or additional text. Return only the JSON object.`;

        const resp = await axios.post(
            'https://api.cerebras.ai/v1/chat/completions',
            { model: CEREBRAS_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.7, top_p: 0.95, max_completion_tokens: 2048 },
            { headers: { Authorization: `Bearer ${CEREBRAS_API_KEY}`, 'Content-Type': 'application/json' } }
        );

        let generatedContent = resp.data.choices?.[0]?.message?.content || '';
        generatedContent = generatedContent.replace(/```json|```/g, '').trim();
        const courseLayout = JSON.parse(generatedContent);

        // Return the generated course layout without saving
        res.status(200).json({
            name: courseLayout.name,
            topic,
            summary: courseLayout.summary,
            difficulty,
            totalDuration: duration,
            chapters: courseLayout.chapters
        });
    } catch (error) {
        console.error('Course generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate course',
            details: error.message 
        });
    }
};

// Add this function to your existing courseController.js
const getCourses = async (req, res) => {
    try {
        const courses = await YoutubeCourse.find().populate('createdBy', 'username');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};

const getCourseById = async (req, res) => {
    try {
        const course = await YoutubeCourse.findById(req.params.courseId)
            .populate('createdBy', 'username');
        
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch course' });
    }
};

const saveCourse = async (req, res) => {
    try {
        // Defensive: ensure required fields are present
        const { name, summary, difficulty, totalDuration, chapters } = req.body;
        if (!name || !summary || !difficulty || !totalDuration || !Array.isArray(chapters)) {
            return res.status(400).json({ error: 'Missing required course fields.' });
        }
        // Defensive: ensure req.user exists and has _id
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'Unauthorized: User info missing.' });
        }
        // Ensure createdBy is set to the current user (teacher/admin)
        const courseData = { ...req.body, createdBy: req.user._id };
        const course = new YoutubeCourse(courseData);
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        console.error('Failed to save course:', error);
        res.status(500).json({ 
            error: 'Failed to save course',
            details: error.message 
        });
    }
};

const deleteCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user._id;

        const course = await YoutubeCourse.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Optional: Only allow creator to delete
        if (course.createdBy && course.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'You are not authorized to delete this course' });
        }

        await YoutubeCourse.deleteOne({ _id: courseId });
        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete course', details: error.message });
    }
};

const shareCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const { students } = req.body; // array of student IDs

        // Defensive: check students is array and not empty
        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ error: 'No students selected for sharing.' });
        }

        const course = await YoutubeCourse.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Fix: allow sharing if user is admin OR course.createdBy matches teacherId
        const teacherId = req.user._id;
        // Make sure createdBy is set and is a string
        if (!course.createdBy) {
            return res.status(403).json({ error: 'Course does not have a creator. Only the creator can share.' });
        }
        if (
            !(
                (course.createdBy.toString() === teacherId.toString()) ||
                (req.user.role === 'admin')
            )
        ) {
            return res.status(403).json({ error: 'You are not authorized to share this course.' });
        }

        // Defensive: ensure sharedWith exists and is array
        if (!Array.isArray(course.sharedWith)) course.sharedWith = [];

        students.forEach(studentId => {
            if (studentId && !course.sharedWith.includes(studentId)) {
                course.sharedWith.push(studentId);
            }
        });

        await course.save();
        res.json({ success: true, message: 'Course shared successfully', sharedWith: course.sharedWith });
    } catch (error) {
        console.error('Failed to share course:', error);
        res.status(500).json({ error: 'Failed to share course', details: error.message });
    }
};

module.exports = {
    generateCourse,
    getCourses,
    getCourseById,
    saveCourse,
    deleteCourse,
    shareCourse
};