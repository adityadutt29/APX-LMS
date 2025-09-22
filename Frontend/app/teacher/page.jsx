"use client";
import { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Courses from './Courses';
import Students from './Students';
import Grades from './Grades';
import QuizResults from './QuizResults';
import GenerateCoursePage from './generate-course/page';
import ChatPage from './chat/page';
import AdvancedTodoList from './todolist';
import Calendar from './calander';


const TeacherDashboard = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [quizResults, setQuizResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  useEffect(() => {
    // Load quiz results from localStorage
    const results = JSON.parse(localStorage.getItem('quizResults')) || [];
    setQuizResults(results);

    // Fetch students associated with the teacher from API
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const token = localStorage.getItem('token');
        const teacherId = localStorage.getItem('userId');
        if (!token || !teacherId) {
          setStudents([]);
          setLoadingStudents(false);
          return;
        }
  const response = await fetch(`http://localhost:5001/api/users/students?teacherId=${teacherId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          setStudents([]);
        } else {
          const data = await response.json();
          setStudents(data.students || []);
        }
      } catch (err) {
        setStudents([]);
      }
      setLoadingStudents(false);
    };
    fetchStudents();

    // Fetch grades associated with the teacher from API
    const fetchGrades = async () => {
      setLoadingGrades(true);
      try {
        const token = localStorage.getItem('token');
        const teacherId = localStorage.getItem('userId');
        if (!token || !teacherId) {
          setGrades([]);
          setLoadingGrades(false);
          return;
        }
  const response = await fetch(`http://localhost:5001/api/users/grades?teacherId=${teacherId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          setGrades([]);
        } else {
          const data = await response.json();
          setGrades(data.grades || []);
        }
      } catch (err) {
        setGrades([]);
      }
      setLoadingGrades(false);
    };
    fetchGrades();

    // Update active tab based on current URL
    const getCurrentTab = () => {
      const tabParam = searchParams.get('tab');
      if ((pathname === '/teacher' || pathname === '/teacher/') && !tabParam) return 'courses';
      if (tabParam === 'chat') return 'chat';
      if (tabParam === 'coursesgenerate') return 'coursesgenerate';
      if (tabParam === 'students') return 'students';
      if (tabParam === 'grades') return 'grades';
      if (tabParam === 'todo') return 'todo';
      if (tabParam === 'calendar') return 'calendar';
      return tabParam || 'courses';
    };
    setActiveTab(getCurrentTab());
  }, [searchParams, pathname]);

  const handleAddStudent = (newStudent) => {
    setStudents(prevStudents => [...prevStudents, newStudent]);
  };

  const renderActiveTab = () => {
    // Enhanced tab detection to handle both query params and direct paths
    const getCurrentTab = () => {
      const tabParam = searchParams.get('tab');

      return tabParam || 'courses';
    };

    const currentTab = getCurrentTab();

    switch (currentTab) {
      case 'courses':
        return <Courses />;
      case 'students':
        return (
          <Students
            students={students}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAddStudent={handleAddStudent}
            loading={loadingStudents}
          />
        );
      case 'grades':
        return <Grades grades={grades} loading={loadingGrades} />;
      case 'chat':
        return <ChatPage />;
      case 'coursesgenerate':
        return <GenerateCoursePage />;
      case 'todo':
        return <AdvancedTodoList/>;
      case 'calendar':
        return <Calendar/>
      case 'quizResults':
        return (
          <QuizResults
            quizResults={quizResults}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      default:
        return <Courses />;
    }
  };

  return (
    <div>
      {renderActiveTab()}
    </div>
  );
};

export default TeacherDashboard;
