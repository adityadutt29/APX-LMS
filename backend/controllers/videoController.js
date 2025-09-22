const axios = require('axios');
const { google } = require('googleapis');

// Initialize YouTube client with API key
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || 'qwen-3-235b-a22b-instruct-2507';

// Extract video ID from URL
const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const summarizeVideo = async (req, res) => {
    try {
        const { videoUrl } = req.body;
        const videoId = extractVideoId(videoUrl);

        if (!videoId) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Get video details from YouTube API
        const videoData = await youtube.videos.list({
            part: ['snippet', 'statistics'],
            id: [videoId]
        });

        const videoDetails = videoData.data.items[0].snippet;
        
    // Generate summary using Cerebras with enhanced context
    const prompt = `Please provide a comprehensive summary of this YouTube video:
        Title: ${videoDetails.title}
        Description: ${videoDetails.description}
        URL: ${videoUrl}
        
        Please include:
        1. Main topics and key points
        2. Important details and examples
        3. Key takeaways
        4. Any technical concepts explained
        
        Structure the summary in a clear and organized way.`;

        const resp = await axios.post(
            'https://api.cerebras.ai/v1/chat/completions',
            { model: CEREBRAS_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.6, top_p: 0.95 },
            { headers: { Authorization: `Bearer ${CEREBRAS_API_KEY}`, 'Content-Type': 'application/json' } }
        );
        const summary = resp.data.choices?.[0]?.message?.content || '';

        res.json({ 
            summary,
            videoDetails: {
                title: videoDetails.title,
                description: videoDetails.description,
                publishedAt: videoDetails.publishedAt,
                channelTitle: videoDetails.channelTitle,
                thumbnails: videoDetails.thumbnails
            }
        });
    } catch (error) {
        console.error('Summarization error:', error);
        res.status(500).json({ error: 'Failed to summarize video' });
    }
};

module.exports = {
    summarizeVideo
};