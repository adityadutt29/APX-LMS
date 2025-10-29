const mongoose = require("mongoose");

const YoutubeCourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topic: { type: String },
  summary: { type: String },
  difficulty: { type: String },
  totalDuration: { type: String },
  chapters: [
    {
      title: String,
      summary: String,
      duration: String,
      content: [
        {
          videoTitle: String,
          videoUrl: String,
          summary: String,
          keyPoints: [String],
          codeBlocks: [
            {
              language: String,
              code: String,
              explanation: String,
            },
          ],
        },
      ],
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sharedWith: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isPersonalized: {
    type: Boolean,
    default: false,
  },
  targetStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  generatedFor: {
    type: String,
    enum: ["general", "remedial", "advanced"],
    default: "general",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("youtubeCourse", YoutubeCourseSchema);
