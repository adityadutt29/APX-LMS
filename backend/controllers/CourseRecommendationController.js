const PracticeResult = require("../models/PracticeResult");
const User = require("../models/Users");
const Course = require("../models/Course");
const UserAnswer = require("../models/UserAnswer");
const Viva = require("../models/Viva");
const YoutubeCourse = require("../models/youtubeCourse");
const { createNotification } = require("./NotificationController");
const mongoose = require("mongoose");
const axios = require("axios");

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || "";
const CEREBRAS_MODEL =
  process.env.CEREBRAS_MODEL || "qwen-3-235b-a22b-instruct-2507";

// @desc    Analyze student performance and generate course recommendations
// @route   GET /api/course-recommendations/analyze/:studentId
// @access  Private (Teacher only)
const analyzeStudentPerformance = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Fetch student data
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get all student grades and performance data
    const performanceData = await getStudentPerformanceData(
      studentId,
      student.email
    );

    // Analyze weak areas
    const weakAreas = analyzeWeakAreas(performanceData);

    // Generate recommendations based on weak areas
    const recommendations = await generateRecommendations(
      weakAreas,
      performanceData
    );

    res.json({
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
      },
      overallPerformance: calculateOverallPerformance(performanceData),
      weakAreas,
      recommendations,
    });
  } catch (error) {
    console.error("Performance analysis error:", error);
    res.status(500).json({
      message: "Failed to analyze student performance",
      error: error.message,
    });
  }
};

// @desc    Get recommendations for all students
// @route   GET /api/course-recommendations/all
// @access  Private (Teacher only)
const getAllStudentRecommendations = async (req, res) => {
  try {
    // Get all students who have performance data
    const allStudents = await User.find({ role: "student" });
    const recommendations = [];

    for (const student of allStudents) {
      const performanceData = await getStudentPerformanceData(
        student._id,
        student.email
      );

      // Only include students who have some performance data
      if (hasPerformanceData(performanceData)) {
        const weakAreas = analyzeWeakAreas(performanceData);
        const overallPerformance = calculateOverallPerformance(performanceData);

        // Only recommend if performance is below threshold (60%)
        if (overallPerformance < 60 || weakAreas.length > 0) {
          const studentRecommendations = await generateRecommendations(
            weakAreas,
            performanceData
          );

          recommendations.push({
            student: {
              id: student._id,
              name: student.name,
              email: student.email,
            },
            overallPerformance,
            weakAreas,
            recommendations: studentRecommendations,
            needsIntervention: overallPerformance < 60,
          });
        }
      }
    }

    res.json(recommendations);
  } catch (error) {
    console.error("Get all recommendations error:", error);
    res.status(500).json({
      message: "Failed to get recommendations",
      error: error.message,
    });
  }
};

// @desc    Generate and assign a personalized course to a student
// @route   POST /api/course-recommendations/generate-and-assign
// @access  Private (Teacher only)
const generateAndAssignCourse = async (req, res) => {
  try {
    const { studentId, topics, difficulty, customizations } = req.body;
    const teacherId = req.user._id;

    // Validate student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Generate course content using AI
    const courseData = await generatePersonalizedCourse(
      topics,
      difficulty,
      customizations
    );

    // Save the course
    const newCourse = new YoutubeCourse({
      ...courseData,
      createdBy: teacherId,
      sharedWith: [studentId],
      topic: topics.join(", "),
      isPersonalized: true,
      targetStudent: studentId,
      generatedFor: "remedial",
    });

    await newCourse.save();

    // Send notification to student
    await createNotification({
      recipient: studentId,
      sender: teacherId,
      courseId: newCourse._id,
      type: "assignment",
      title: "New Personalized Course Assigned",
      message: `Your teacher has assigned you a personalized course: "${
        courseData.name
      }" to help improve your understanding of ${topics.join(", ")}.`,
      priority: "high",
      metadata: {
        courseId: newCourse._id,
        assignmentType: "personalized_course",
        topics: topics,
        courseName: courseData.name,
      },
    });

    res.json({
      success: true,
      course: newCourse,
      message: "Course generated and assigned successfully",
    });
  } catch (error) {
    console.error("Generate and assign course error:", error);
    res.status(500).json({
      message: "Failed to generate and assign course",
      error: error.message,
    });
  }
};

// Helper function to get student performance data
const getStudentPerformanceData = async (studentId, studentEmail) => {
  try {
    // Fetch practice results
    const practiceResults = await PracticeResult.find({ user: studentId });

    // Fetch assignment scores from courses
    const courses = await Course.find().lean();
    const assignmentScores = [];

    courses.forEach((course) => {
      if (Array.isArray(course.assignments)) {
        course.assignments.forEach((assignment) => {
          if (Array.isArray(assignment.submissions)) {
            assignment.submissions.forEach((sub) => {
              if (
                sub.student &&
                sub.student.toString() === studentId.toString() &&
                typeof sub.grade === "number"
              ) {
                assignmentScores.push({
                  course: course.title,
                  assignment: assignment.title || "Assignment",
                  score: sub.grade,
                  createdAt: sub.submittedAt || course.createdAt,
                });
              }
            });
          }
        });
      }
    });

    // Fetch viva scores
    const vivas = await Viva.find({ createdBy: studentEmail });
    const vivaAnswers = await UserAnswer.find({ userEmail: studentEmail });
    const vivaScores = [];

    vivas.forEach((viva) => {
      const answers = vivaAnswers.filter(
        (ans) => ans.mockIdRef === viva.mockId
      );
      if (answers.length > 0) {
        const totalRating = answers.reduce(
          (sum, ans) => sum + (parseFloat(ans.rating) || 0),
          0
        );
        const averageRating = totalRating / answers.length;
        const percentageScore = averageRating * 10;

        vivaScores.push({
          subject: viva.topics || viva.subject || "General",
          score: Math.round(percentageScore * 100) / 100,
          createdAt: viva.createdAt,
        });
      }
    });

    return {
      practice: practiceResults,
      assignments: assignmentScores,
      viva: vivaScores,
    };
  } catch (error) {
    console.error("Error fetching student performance data:", error);
    return { practice: [], assignments: [], viva: [] };
  }
};

// Helper function to check if student has performance data
const hasPerformanceData = (performanceData) => {
  return (
    performanceData.practice.length > 0 ||
    performanceData.assignments.length > 0 ||
    performanceData.viva.length > 0
  );
};

// Helper function to analyze weak areas
const analyzeWeakAreas = (performanceData) => {
  const weakAreas = [];
  const threshold = 60; // Consider below 60% as weak

  // Analyze practice results
  performanceData.practice.forEach((practice) => {
    if (practice.percentage < threshold) {
      weakAreas.push({
        type: "Practice",
        topic: practice.fileName || "General Practice",
        score: practice.percentage,
        area: "problem-solving",
      });
    }
  });

  // Analyze assignment scores
  performanceData.assignments.forEach((assignment) => {
    if (assignment.score < threshold) {
      weakAreas.push({
        type: "Assignment",
        topic: assignment.course,
        score: assignment.score,
        area: "theoretical-knowledge",
      });
    }
  });

  // Analyze viva scores
  performanceData.viva.forEach((viva) => {
    if (viva.score < threshold) {
      weakAreas.push({
        type: "Viva",
        topic: viva.subject,
        score: viva.score,
        area: "conceptual-understanding",
      });
    }
  });

  return weakAreas;
};

// Helper function to calculate overall performance
const calculateOverallPerformance = (performanceData) => {
  let totalScore = 0;
  let totalCount = 0;

  performanceData.practice.forEach((practice) => {
    totalScore += practice.percentage || 0;
    totalCount++;
  });

  performanceData.assignments.forEach((assignment) => {
    totalScore += assignment.score || 0;
    totalCount++;
  });

  performanceData.viva.forEach((viva) => {
    totalScore += viva.score || 0;
    totalCount++;
  });

  return totalCount > 0 ? Math.round((totalScore / totalCount) * 100) / 100 : 0;
};

// Helper function to generate recommendations
const generateRecommendations = async (weakAreas, performanceData) => {
  if (weakAreas.length === 0) {
    return [];
  }

  // Group weak areas by topic
  const topicGroups = {};
  weakAreas.forEach((area) => {
    if (!topicGroups[area.topic]) {
      topicGroups[area.topic] = [];
    }
    topicGroups[area.topic].push(area);
  });

  const recommendations = [];

  for (const [topic, areas] of Object.entries(topicGroups)) {
    const avgScore =
      areas.reduce((sum, area) => sum + area.score, 0) / areas.length;
    const difficulty =
      avgScore < 40 ? "Beginner" : avgScore < 60 ? "Intermediate" : "Advanced";

    // Calculate duration based on number of weak areas (3-5 hours max)
    let estimatedHours = Math.min(3 + areas.length, 5);

    recommendations.push({
      topic,
      averageScore: Math.round(avgScore * 100) / 100,
      suggestedDifficulty: difficulty,
      weakAreas: areas,
      priority: avgScore < 40 ? "High" : "Medium",
      estimatedDuration: `${estimatedHours} hours`,
      focusAreas: areas
        .map((area) => area.area)
        .filter((area, index, self) => self.indexOf(area) === index),
    });
  }

  return recommendations.sort((a, b) => a.averageScore - b.averageScore);
};

// Helper function to generate personalized course using AI
const generatePersonalizedCourse = async (
  topics,
  difficulty,
  customizations = {}
) => {
  try {
    const topicsStr = Array.isArray(topics) ? topics.join(", ") : topics;

    // Parse duration to get integer hours (e.g., "4 hours" -> 4)
    let durationHours = 4; // default
    if (customizations.duration) {
      const match = customizations.duration.match(/(\d+)/);
      if (match) {
        durationHours = Math.min(parseInt(match[1]), 5); // Max 5 hours
      }
    }

    // Calculate numChapters: ensure it's between 3-5
    let numChapters = customizations.numChapters || 4;
    numChapters = Math.max(3, Math.min(5, parseInt(numChapters)));

    const prompt = `Generate a personalized remedial course layout in strict JSON format for a student who needs improvement in:
        Topics: ${topicsStr}
        Difficulty Level: ${difficulty}
        Focus: Remedial learning and concept reinforcement
        Total Duration: ${durationHours} hours
        Number of Chapters: ${numChapters}

        The course should focus on:
        - Clear explanations of fundamental concepts
        - Step-by-step problem-solving approaches
        - Practice exercises and examples
        - Real-world applications to improve understanding

        IMPORTANT:
        - You must generate EXACTLY ${numChapters} chapters, no more, no less
        - Each chapter duration should be a specific number (e.g., "45 minutes", "1 hour", "30 minutes")
        - Total of all chapter durations should not exceed ${durationHours} hours

        Return ONLY a JSON object with this exact structure:
        {
            "name": "Personalized Course Name (focusing on the weak topics)",
            "summary": "Course summary emphasizing remedial learning and concept reinforcement",
            "chapters": [
                {
                    "title": "Chapter Title",
                    "summary": "Chapter Summary focusing on specific weak areas",
                    "duration": "Duration (e.g., 45 minutes, 1 hour)"
                }
            ]
        }

        Do not include any markdown formatting, code blocks, or additional text. Return only the JSON object.`;

    const resp = await axios.post(
      "https://api.cerebras.ai/v1/chat/completions",
      {
        model: CEREBRAS_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        top_p: 0.95,
        max_completion_tokens: 2048,
      },
      {
        headers: {
          Authorization: `Bearer ${CEREBRAS_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let generatedContent = resp.data.choices?.[0]?.message?.content || "";
    generatedContent = generatedContent.replace(/```json|```/g, "").trim();
    const courseLayout = JSON.parse(generatedContent);

    return {
      name: courseLayout.name,
      summary: courseLayout.summary,
      difficulty,
      totalDuration: `${durationHours} hours`,
      chapters: courseLayout.chapters,
    };
  } catch (error) {
    console.error("Course generation error:", error);
    throw new Error("Failed to generate personalized course");
  }
};

// @desc    Update recommendations based on student progress
// @route   POST /api/course-recommendations/update-progress
// @access  Private (Auto-triggered)
const updateRecommendationsBasedOnProgress = async (req, res) => {
  try {
    const { studentId, activityType, score, topic } = req.body;

    // Fetch student's current performance
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const performanceData = await getStudentPerformanceData(
      studentId,
      student.email
    );
    const overallPerformance = calculateOverallPerformance(performanceData);
    const weakAreas = analyzeWeakAreas(performanceData);

    // Check if student still needs intervention
    const stillNeedsHelp = overallPerformance < 60 || weakAreas.length > 0;

    // If student has improved significantly, send congratulations notification
    if (!stillNeedsHelp && req.user) {
      await createNotification({
        recipient: studentId,
        sender: req.user._id,
        type: "general",
        title: "Great Progress!",
        message: `Congratulations! Your performance has improved significantly. Your overall score is now ${overallPerformance}%.`,
        priority: "normal",
        metadata: {
          progressUpdate: true,
          newScore: overallPerformance,
          improvement: true,
        },
      });
    }

    // Generate updated recommendations if still needed
    const updatedRecommendations = stillNeedsHelp
      ? await generateRecommendations(weakAreas, performanceData)
      : [];

    res.json({
      student: {
        id: student._id,
        name: student.name,
      },
      overallPerformance,
      weakAreas,
      recommendations: updatedRecommendations,
      needsIntervention: stillNeedsHelp,
      improved: !stillNeedsHelp,
    });
  } catch (error) {
    console.error("Update recommendations error:", error);
    res.status(500).json({
      message: "Failed to update recommendations",
      error: error.message,
    });
  }
};

module.exports = {
  analyzeStudentPerformance,
  getAllStudentRecommendations,
  generateAndAssignCourse,
  updateRecommendationsBasedOnProgress,
};
