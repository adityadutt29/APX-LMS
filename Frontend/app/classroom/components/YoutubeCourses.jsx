import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Clock,
  ChevronRight,
  ChevronDown,
  Eye,
  Video,
  ExternalLink,
  FileText,
  Lightbulb,
  Code,
  ChevronLeft
} from "lucide-react";

function YoutubeCourses() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [loading, setLoading] = useState(false);
  const [chapterProgress, setChapterProgress] = useState([]); // array of completed chapter indices
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/youtubecourse-share/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      // Filter out null/undefined courses
      const validCourses = (data || []).filter(course => course && course._id && course.name);
      setCourses(validCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleViewCourse = async (course) => {
    setSelectedCourse(course);
    setExpandedChapters({});
    setProgressLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/youtubecourse-share/progress/${course._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setChapterProgress(data.completedChapters || []);
      } else {
        setChapterProgress([]);
      }
    } catch {
      setChapterProgress([]);
    } finally {
      setProgressLoading(false);
    }
  };
  // Mark chapter as completed and update backend
  const handleCompleteChapter = async (chapterIdx) => {
    if (chapterProgress.includes(chapterIdx)) return;
    setProgressLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/youtubecourse-share/progress/${selectedCourse._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chapterIdx }),
      });
      if (response.ok) {
        setChapterProgress((prev) => [...prev, chapterIdx]);
      }
    } catch {}
    setProgressLoading(false);
  };

  const handleBack = () => {
    setSelectedCourse(null);
    setExpandedChapters({});
  };

  const toggleChapterExpansion = (chapterIdx) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterIdx]: !prev[chapterIdx],
    }));
  };

  // Card grid view (course summary only)
  if (!selectedCourse) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <h2 className="text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-blue-500" />
          Courses Shared by Teachers
        </h2>
        {loading ? (
          <div className="text-center py-12 text-blue-500 font-semibold">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">
            No YouTube courses have been shared yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              // Safety check
              if (!course || !course._id) return null;
              
              return (
                <div key={course._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 flex flex-col relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 line-clamp-2 pr-2">
                      {course.name || 'Untitled Course'}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {course.summary || 'No description available'}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-500 mb-2">
                    <span className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {course.chapters?.length || 0} Chapters
                    </span>
                    <span className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.totalDuration || 'N/A'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewCourse(course)}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow hover:shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105"
                  >
                    <Eye className="w-5 h-5" />
                    View Course
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Detailed course view (show chapters, expand/collapse chapter content)
  const totalChapters = selectedCourse?.chapters?.length || 0;
  const completedCount = chapterProgress.length;
  const progressPercent = totalChapters ? Math.round((completedCount / totalChapters) * 100) : 0;
  return (
    <div className="max-w-4xl mx-auto py-8">
      <button
        onClick={handleBack}
        className="mb-6 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold flex items-center gap-2"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Courses
      </button>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-blue-700 mb-2">{selectedCourse.name}</h2>
        <p className="text-gray-600 mb-4">{selectedCourse.summary}</p>
        <div className="flex gap-4 text-sm text-gray-500 mb-6">
          <span className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
            <BookOpen className="w-4 h-4 mr-1" />
            {totalChapters} Chapters
          </span>
          <span className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4 mr-1" />
            {selectedCourse.totalDuration}
          </span>
        </div>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-gray-700">Progress</span>
            <span className="text-xs text-gray-500">{progressPercent}% completed</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full">
            <div
              className="h-3 bg-blue-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
        <h4 className="font-semibold text-gray-800 mb-4">Course Chapters</h4>
        <div className="space-y-4">
          {selectedCourse.chapters?.map((chapter, idx) => {
            const isExpanded = expandedChapters[idx];
            const hasContent = chapter.content && chapter.content.length > 0;
            const isCompleted = chapterProgress.includes(idx);
            const canAccess = idx === 0 || chapterProgress.includes(idx - 1);
            return (
              <div key={idx} className={`bg-gray-50 rounded-xl shadow-sm mb-2 ${!canAccess ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold text-gray-800">
                      Chapter {idx + 1}: {chapter.title}
                    </h5>
                    <span className="text-gray-500 text-xs">{chapter.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Complete tick/checkbox */}
                    <button
                      disabled={isCompleted || progressLoading || !canAccess}
                      onClick={() => handleCompleteChapter(idx)}
                      className={`ml-2 px-2 py-1 rounded ${isCompleted ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-600'} font-semibold text-xs`}
                    >
                      {isCompleted ? '✓ Completed' : 'Mark Complete'}
                    </button>
                    {/* Expand/collapse */}
                    {hasContent && (
                      <span
                        className="ml-2 p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        onClick={() => canAccess && toggleChapterExpansion(idx)}
                      >
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <p className="text-gray-600 text-sm">{chapter.summary}</p>
                </div>
                {hasContent && isExpanded && (
                  <div className="px-4 pb-4 border-t pt-4">
                    <h6 className="font-semibold mb-2 flex items-center">
                      <Video className="w-4 h-4 mr-2 text-red-500" />
                      YouTube Content
                    </h6>
                    <div className="space-y-6">
                      {chapter.content.map((content, contentIndex) => {
                        const videoId = getYoutubeVideoId(content.videoUrl);
                        return (
                          <div key={contentIndex} className="bg-white rounded-lg p-4 mb-4">
                            <div className="flex flex-col lg:flex-row gap-6">
                              <div className="lg:w-1/2">
                                {videoId ? (
                                  <div className="aspect-video">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${videoId}`}
                                      className="w-full h-full rounded-lg"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    ></iframe>
                                  </div>
                                ) : (
                                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                                    <Video className="w-12 h-12 text-gray-400" />
                                  </div>
                                )}
                                <div className="mt-4">
                                  <h5 className="font-semibold text-gray-800 mb-2">{content.videoTitle}</h5>
                                  <a
                                    href={content.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-600 text-sm flex items-center"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Watch on YouTube
                                  </a>
                                </div>
                              </div>
                              <div className="lg:w-1/2">
                                <div className="mb-4">
                                  <h6 className="font-semibold text-gray-800 mb-2 flex items-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Summary
                                  </h6>
                                  <p className="text-gray-600 text-sm leading-relaxed">{content.summary}</p>
                                </div>
                                {content.keyPoints && content.keyPoints.length > 0 && (
                                  <div className="mb-4">
                                    <h6 className="font-semibold text-gray-800 mb-2 flex items-center">
                                      <Lightbulb className="w-4 h-4 mr-2" />
                                      Key Points
                                    </h6>
                                    <ul className="text-gray-600 text-sm space-y-1">
                                      {content.keyPoints.map((point, pointIndex) => (
                                        <li key={pointIndex} className="flex items-start">
                                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                          {point}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {content.codeBlocks && content.codeBlocks.length > 0 && (
                                  <div>
                                    <h6 className="font-semibold text-gray-800 mb-2 flex items-center">
                                      <Code className="w-4 h-4 mr-2" />
                                      Code Examples
                                    </h6>
                                    <div className="space-y-3">
                                      {content.codeBlocks.map((codeBlock, codeIndex) => (
                                        <div key={codeIndex} className="bg-gray-900 rounded-lg p-4">
                                          <div className="text-xs text-gray-400 mb-2">{codeBlock.language}</div>
                                          <pre className="text-green-400 text-sm overflow-x-auto">
                                            <code>{codeBlock.code}</code>
                                          </pre>
                                          {codeBlock.explanation && (
                                            <p className="text-gray-300 text-xs mt-2">{codeBlock.explanation}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default YoutubeCourses;