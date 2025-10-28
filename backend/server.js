require('dotenv').config();
const express = require('express');
const http = require('http');
const connectDB = require('./configs/db');
const UserRoutes = require('./routes/UserRoutes');
const AuthRoutes = require('./routes/AuthRoutes');
const CourseRoutes = require('./routes/CourseRoutes');
const PracticeRoutes = require('./routes/PracticeRoutes');
const mindmapRoutes = require('./routes/mindmaps');
const GradesRoutes = require('./routes/grades');
const NotificationRoutes = require('./routes/NotificationRoutes');
const FileRoutes = require('./routes/FileRoutes');
const FlashcardRoutes = require('./routes/FlashcardRoutes');
const CodeAnalysisRoutes = require('./routes/CodeAnalysisRoutes');
const TodoRoutes = require('./routes/TodoRoutes');
const ChatRoutes = require('./routes/ChatRoutes');
const youtubecourseRoutes = require('./routes/youtubecourseRoutes');
const chapterRoutes = require('./routes/chapterRoutes');
const videoRoutes = require('./routes/videoRoutes');
const NotificationWebSocketServer = require('./services/NotificationWebSocketServer');
const calendarEventRoutes = require('./routes/CalendarEventRoutes');
const aiAssistantRoutes = require('./routes/aiAssistantRoutes');
const VivaRoutes = require('./routes/VivaRoutes');
const AdminOverviewRoutes = require('./routes/AdminOverviewRoutes');
const StudentYoutubeCoursesRoutes = require('./routes/StudentYoutubeCoursesRoutes');
const YoutubeCourseShareRoutes = require('./routes/YoutubeCourseShareRoutes');
const CompilerRoutes = require('./routes/CompilerRoutes');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize WebSocket server for real-time notifications
const wsServer = new NotificationWebSocketServer(server);

// Make WebSocket server available globally for sending notifications
global.notificationWS = wsServer;

// Updated CORS configuration for Google OAuth
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://localhost:3000',
    'http://127.0.0.1:3000',
    'https://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api/users', UserRoutes);
app.use('/api/auth', AuthRoutes);
app.use('/api/courses', CourseRoutes);
app.use('/api/practice', PracticeRoutes);
app.use('/api/mindmaps', mindmapRoutes);
app.use('/api/grades', GradesRoutes);
app.use('/api/notifications', NotificationRoutes);
app.use('/api/files', FileRoutes);
app.use('/api/flashcards', FlashcardRoutes);
app.use('/api/code-analysis', CodeAnalysisRoutes);
app.use('/api/todos', TodoRoutes);
app.use('/api/chat', ChatRoutes);
app.use('/api/calendar', calendarEventRoutes);
app.use('/api/youtubecourses', youtubecourseRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/videos', videoRoutes);
app.use('/ai-assistant', aiAssistantRoutes);
app.use('/api/viva', VivaRoutes);
app.use('/api/admin', AdminOverviewRoutes);
app.use('/api/student-youtubecourses', StudentYoutubeCoursesRoutes);
app.use('/api/youtubecourse-share', YoutubeCourseShareRoutes);
app.use('/api/compiler', CompilerRoutes);

app.get('/', (req, res) => res.send('API Running with WebSocket support'));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`WebSocket server running at ws://localhost:${PORT}/ws`);
});