const axios = require('axios');
const { google } = require('googleapis');
const YoutubeCourse = require('../models/youtubeCourse');

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || 'qwen-3-235b-a22b-instruct-2507';

// Initialize YouTube client with API key
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

const generateChapterContent = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await YoutubeCourse.findById(courseId);

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Process each chapter sequentially
        for (const chapter of course.chapters) {
            // Construct a more specific search query
            const searchQuery = `${course.topic} ${chapter.title} programming tutorial -gaming -gameplay`;
            
            const searchResult = await youtube.search.list({
                part: ['snippet'],
                q: searchQuery,
                type: ['video'],
                maxResults: 3,
                relevanceLanguage: 'en',
                videoDuration: 'medium',
                order: 'relevance',
                safeSearch: 'strict',
                topicId: '/m/01k8wb'  // Computer Programming topic
            });

            const videoPromises = searchResult.data.items.map(async (item) => {
                const videoData = await youtube.videos.list({
                    part: ['snippet', 'statistics', 'contentDetails'],
                    id: [item.id.videoId]
                });

                const videoDetails = videoData.data.items[0].snippet;
                const prompt = `Create a JSON object for this educational programming video about "${chapter.title}". Return ONLY a valid JSON object:
                {
                    "summary": "Technical summary focusing on ${chapter.title}",
                    "codeBlocks": [{"language": "language name", "code": "code here", "explanation": "explanation here"}],
                    "keyPoints": ["point1", "point2"]
                }

                Video: "${videoDetails.title}"
                Description: ${videoDetails.description}

                Rules:
                1. Focus only on ${chapter.title} related content
                2. Include only relevant code examples
                3. Return valid JSON only`;

                const resp = await axios.post(
                    'https://api.cerebras.ai/v1/chat/completions',
                    { model: CEREBRAS_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.7, top_p: 0.95, max_completion_tokens: 1024 },
                    { headers: { Authorization: `Bearer ${CEREBRAS_API_KEY}`, 'Content-Type': 'application/json' } }
                );
                let content = resp.data.choices?.[0]?.message?.content || '';
                content = content.replace(/```json|```/g, '').trim();
                
                try {
                    const parsedContent = JSON.parse(content);
                    return {
                        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                        videoTitle: videoDetails.title,
                        ...parsedContent
                    };
                } catch (parseError) {
                    console.error(`JSON parsing error for chapter ${chapter.title}:`, content);
                    return {
                        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                        videoTitle: videoDetails.title,
                        summary: "Failed to generate content",
                        codeBlocks: [],
                        keyPoints: []
                    };
                }
            });

            const videoContents = await Promise.all(videoPromises);
            chapter.content = videoContents;
        }

        await course.save();
        res.json(course);
    } catch (error) {
        console.error('Course content generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate course content',
            details: error.message
        });
    }
};

module.exports = {
    generateChapterContent
};