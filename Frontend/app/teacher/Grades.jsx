import { useState, useEffect } from "react";

const Grades = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", "Viva", "Practice", "AssignmentScore"];
  const [grades, setGrades] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [generatingCourse, setGeneratingCourse] = useState(null); // Format: "studentId-topic"
  const [generatedCourses, setGeneratedCourses] = useState(new Set()); // Track completed generations
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    // Fetch all grades for dashboard from backend
    const fetchAllGrades = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setGrades([]);
          setLoading(false);
          return;
        }
        const response = await fetch("http://localhost:5001/api/grades/all", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          setGrades([]);
        } else {
          const data = await response.json();
          // Flatten studentScores object to array for table rendering
          const flatGrades = Object.entries(data).flatMap(
            ([studentId, scores]) => {
              // Use scores.name if available, otherwise fallback to studentId
              const studentName =
                scores.name ||
                scores.studentName ||
                scores.student ||
                studentId;
              return [
                ...scores.assignments.map((a) => ({
                  student: studentName,
                  assignment: a.course,
                  type: "Assignment",
                  score: a.score,
                })),
                ...scores.viva.map((v) => ({
                  student: studentName,
                  assignment: v.subject || "Viva",
                  type: "Viva",
                  score: v.score,
                })),
                ...scores.quizzes.map((q) => ({
                  student: studentName,
                  assignment: q.quizName || q.fileName || "Practice",
                  type: "Practice",
                  percentage: q.percentage,
                  score: q.score,
                })),
              ];
            }
          );
          setGrades(flatGrades);
        }
      } catch (err) {
        setGrades([]);
      }
      setLoading(false);
    };
    fetchAllGrades();
  }, []);

  // Fetch course recommendations for students
  useEffect(() => {
    if (showRecommendations) {
      fetchRecommendations();
    }
  }, [showRecommendations]);

  // Auto-refresh recommendations every 5 minutes if enabled
  useEffect(() => {
    let interval;
    if (autoRefresh && showRecommendations) {
      interval = setInterval(() => {
        fetchRecommendations();
      }, 5 * 60 * 1000); // 5 minutes
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, showRecommendations]);

  const fetchRecommendations = async () => {
    setRecommendationsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setRecommendations([]);
        setRecommendationsLoading(false);
        return;
      }
      const response = await fetch(
        "http://localhost:5001/api/course-recommendations/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        setRecommendations([]);
      } else {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (err) {
      setRecommendations([]);
    }
    setRecommendationsLoading(false);
  };

  const generateAndAssignCourse = async (studentId, recommendation) => {
    const courseKey = `${studentId}-${recommendation.topic}`;
    setGeneratingCourse(courseKey);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5001/api/course-recommendations/generate-and-assign",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId,
            topics: [recommendation.topic],
            difficulty: recommendation.suggestedDifficulty,
            customizations: {
              duration: recommendation.estimatedDuration,
              numChapters: Math.max(
                3,
                Math.min(5, recommendation.weakAreas.length + 2)
              ),
            },
          }),
        }
      );

      if (response.ok) {
        alert("Course generated and assigned successfully!");
        // Mark this specific course as generated
        setGeneratedCourses((prev) => new Set([...prev, courseKey]));
        // Refresh recommendations
        fetchRecommendations();
      } else {
        alert("Failed to generate and assign course. Please try again.");
      }
    } catch (err) {
      alert("Error generating course. Please try again.");
    }
    setGeneratingCourse(null);
  };

  // Filter grades by selected category
  const filteredGrades =
    selectedCategory === "All"
      ? grades
      : grades.filter((g) => {
          if (selectedCategory === "AssignmentScore") {
            return (
              (g.type || "").toLowerCase() === "assignment" ||
              (g.type || "").toLowerCase() === "assignmentscore"
            );
          }
          if (selectedCategory === "Practice") {
            return (g.type || "").toLowerCase() === "practice";
          }
          return (g.type || "Other") === selectedCategory;
        });

  // Filter recommendations by priority
  const filteredRecommendations =
    priorityFilter === "All"
      ? recommendations
      : recommendations
          .filter((rec) =>
            rec.recommendations.some((r) => r.priority === priorityFilter)
          )
          .map((rec) => ({
            ...rec,
            recommendations: rec.recommendations.filter(
              (r) => r.priority === priorityFilter
            ),
          }));

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex justify-between items-center px-6 pt-6 pb-2">
        <h2 className="text-2xl font-bold text-purple-700">Grades List</h2>
        <button
          onClick={() => setShowRecommendations(!showRecommendations)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
            showRecommendations
              ? "bg-purple-600 text-white"
              : "bg-purple-100 text-purple-700 hover:bg-purple-200"
          }`}
        >
          {showRecommendations
            ? "Hide Recommendations"
            : "Show Course Recommendations"}
        </button>
      </div>

      {showRecommendations && (
        <div className="px-6 pb-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                🎯 AI-Powered Course Recommendations
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-600">
                    Priority:
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="All">All</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label
                    htmlFor="autoRefresh"
                    className="text-sm font-medium text-gray-600"
                  >
                    Auto-refresh (5min)
                  </label>
                </div>
                <button
                  onClick={fetchRecommendations}
                  disabled={recommendationsLoading}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  {recommendationsLoading ? "Updating..." : "Refresh"}
                </button>
              </div>
            </div>
            {recommendationsLoading ? (
              <div className="text-center text-gray-500 py-4">
                <span className="animate-spin inline-block w-6 h-6 border-4 border-purple-300 border-t-transparent rounded-full mr-2"></span>
                Analyzing student performance...
              </div>
            ) : filteredRecommendations.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <p>No students match the selected priority filter.</p>
                <p className="text-sm mt-1">
                  Try changing the priority filter or refresh the data.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {rec.student.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {rec.student.email}
                        </p>
                        <div className="flex items-center mt-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              rec.overallPerformance < 40
                                ? "bg-red-100 text-red-700"
                                : rec.overallPerformance < 60
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            Overall: {rec.overallPerformance}%
                          </span>
                          {rec.needsIntervention && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                              Needs Intervention
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {rec.recommendations.map((recommendation, recIndex) => {
                        const courseKey = `${rec.student.id}-${recommendation.topic}`;
                        const isGenerating = generatingCourse === courseKey;
                        const isAlreadyGenerated =
                          generatedCourses.has(courseKey);

                        return (
                          <div
                            key={recIndex}
                            className="bg-gray-50 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-800">
                                  {recommendation.topic}
                                </h5>
                                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">
                                      Average Score:
                                    </span>{" "}
                                    {recommendation.averageScore}%
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Difficulty:
                                    </span>{" "}
                                    {recommendation.suggestedDifficulty}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Priority:
                                    </span>
                                    <span
                                      className={`ml-1 px-2 py-1 rounded text-xs ${
                                        recommendation.priority === "High"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-yellow-100 text-yellow-700"
                                      }`}
                                    >
                                      {recommendation.priority}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Duration:
                                    </span>{" "}
                                    {recommendation.estimatedDuration}
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-gray-700">
                                    Weak Areas:{" "}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {recommendation.weakAreas
                                      .map((area) => area.type)
                                      .join(", ")}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  generateAndAssignCourse(
                                    rec.student.id,
                                    recommendation
                                  )
                                }
                                disabled={
                                  generatingCourse !== null ||
                                  isAlreadyGenerated
                                }
                                className={`ml-4 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                  isAlreadyGenerated
                                    ? "bg-blue-100 text-blue-700 cursor-default"
                                    : generatingCourse !== null
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                              >
                                {isGenerating ? (
                                  <>
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                                    Generating...
                                  </>
                                ) : isAlreadyGenerated ? (
                                  "✓ Already Generated"
                                ) : (
                                  "Generate & Assign Course"
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex gap-2 px-6 pb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-semibold border transition-all duration-200 ${
              selectedCategory === cat
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-purple-50 hover:text-purple-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="p-8 text-center text-gray-500">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-green-300 border-t-transparent rounded-full mr-2"></span>
          Loading grades...
        </div>
      ) : (
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 border-b border-gray-300">
                Student
              </th>
              <th className="text-left p-4 border-b border-gray-300">
                Assignment
              </th>
              <th className="text-left p-4 border-b border-gray-300">Type</th>
              <th className="text-left p-4 border-b border-gray-300">Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrades.map((grade, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 border-b border-gray-200"
              >
                <td className="p-4 border-r border-gray-200">
                  {grade.student}
                </td>
                <td className="p-4 border-r border-gray-200">
                  {grade.assignment}
                </td>
                <td className="p-4 border-r border-gray-200">
                  {grade.type ? (
                    <span
                      className={`px-2 py-1 rounded ${
                        grade.type === "Viva"
                          ? "bg-blue-100 text-blue-600"
                          : grade.type === "AI Quiz"
                          ? "bg-purple-100 text-purple-600"
                          : grade.type.toLowerCase() === "assignment" ||
                            grade.type.toLowerCase() === "assignmentscore"
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {grade.type === "AssignmentScore"
                        ? "Assignment"
                        : grade.type}
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      Other
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-green-100 text-green-600 rounded">
                    {grade.type === "Practice"
                      ? `${grade.percentage || 0}%`
                      : grade.type === "Viva"
                      ? `${grade.score || 0}%`
                      : grade.type === "Assignment"
                      ? `${grade.score || 0}%`
                      : grade.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Grades;
