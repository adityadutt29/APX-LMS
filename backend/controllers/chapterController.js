const axios = require("axios");
const { google } = require("googleapis");
const YoutubeCourse = require("../models/youtubeCourse");

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || "";
const CEREBRAS_MODEL =
  process.env.CEREBRAS_MODEL || "qwen-3-235b-a22b-instruct-2507";

// Rate limiting configuration
const RATE_LIMIT_DELAY =
  parseInt(process.env.CEREBRAS_RATE_LIMIT_DELAY) || 2000; // Delay between Cerebras API calls
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds initial retry delay
const VIDEOS_PER_CHAPTER = parseInt(process.env.VIDEOS_PER_CHAPTER) || 3; // Videos per chapter (each needs 1 Cerebras call)

// Initialize YouTube client with API key
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// Helper function to add delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to call Cerebras API with retry logic
async function callCerebrasWithRetry(prompt, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Add delay before each API call (except the first one)
      if (attempt > 0) {
        const backoffDelay = RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(
          `Retry attempt ${attempt + 1}, waiting ${backoffDelay}ms...`
        );
        await delay(backoffDelay);
      }

      const resp = await axios.post(
        "https://api.cerebras.ai/v1/chat/completions",
        {
          model: CEREBRAS_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          top_p: 0.95,
          max_completion_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${CEREBRAS_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return resp.data.choices?.[0]?.message?.content || "";
    } catch (error) {
      const isRateLimitError = error.response?.status === 429;
      const isLastAttempt = attempt === retries - 1;

      if (isRateLimitError && !isLastAttempt) {
        console.warn(
          `Rate limit hit, retrying... (attempt ${attempt + 1}/${retries})`
        );
        continue;
      }

      // If not a rate limit error or last attempt, throw the error
      throw error;
    }
  }
  throw new Error("Max retries exceeded for Cerebras API call");
}

const generateChapterContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await YoutubeCourse.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    console.log(
      `Starting content generation for ${course.chapters.length} chapters...`
    );

    // Process each chapter sequentially
    for (
      let chapterIndex = 0;
      chapterIndex < course.chapters.length;
      chapterIndex++
    ) {
      const chapter = course.chapters[chapterIndex];
      console.log(
        `Processing chapter ${chapterIndex + 1}/${course.chapters.length}: ${
          chapter.title
        }`
      );

      // Construct a more specific search query
      const searchQuery = `${course.topic} ${chapter.title} programming tutorial -gaming -gameplay`;

      const searchResult = await youtube.search.list({
        part: ["snippet"],
        q: searchQuery,
        type: ["video"],
        maxResults: VIDEOS_PER_CHAPTER,
        relevanceLanguage: "en",
        videoDuration: "medium",
        order: "relevance",
        safeSearch: "strict",
        topicId: "/m/01k8wb", // Computer Programming topic
      });

      const videoContents = [];

      // Process videos SEQUENTIALLY to avoid rate limits
      for (
        let videoIndex = 0;
        videoIndex < searchResult.data.items.length;
        videoIndex++
      ) {
        const item = searchResult.data.items[videoIndex];

        try {
          console.log(
            `  Processing video ${videoIndex + 1}/${
              searchResult.data.items.length
            }...`
          );

          const videoData = await youtube.videos.list({
            part: ["snippet", "statistics", "contentDetails"],
            id: [item.id.videoId],
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

          // Call Cerebras API with retry logic
          let content = await callCerebrasWithRetry(prompt);
          content = content.replace(/```json|```/g, "").trim();

          try {
            const parsedContent = JSON.parse(content);
            videoContents.push({
              videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              videoTitle: videoDetails.title,
              ...parsedContent,
            });
          } catch (parseError) {
            console.error(
              `JSON parsing error for video in chapter ${chapter.title}:`,
              content
            );
            videoContents.push({
              videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              videoTitle: videoDetails.title,
              summary: "Failed to generate content",
              codeBlocks: [],
              keyPoints: [],
            });
          }

          // Add delay between API calls to respect rate limits
          if (videoIndex < searchResult.data.items.length - 1) {
            console.log(
              `  Waiting ${RATE_LIMIT_DELAY}ms before next API call...`
            );
            await delay(RATE_LIMIT_DELAY);
          }
        } catch (videoError) {
          console.error(
            `Error processing video ${videoIndex + 1}:`,
            videoError.message
          );
          // Continue with next video even if this one fails
          videoContents.push({
            videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            videoTitle: "Error processing video",
            summary: "Failed to generate content",
            codeBlocks: [],
            keyPoints: [],
          });
        }
      }

      chapter.content = videoContents;
      console.log(
        `Completed chapter ${chapterIndex + 1}/${course.chapters.length}`
      );
    }

    await course.save();
    console.log("Course content generation completed successfully");
    res.json(course);
  } catch (error) {
    console.error("Course content generation error:", error);
    res.status(500).json({
      error: "Failed to generate course content",
      details: error.message,
    });
  }
};

module.exports = {
  generateChapterContent,
};
