# APX LMS - The AI-powered, all-in-one platform to revolutionize your learning experience.

<img align=center width="2000" height="1333" alt="APX LMS" src="https://github.com/user-attachments/assets/4a17e875-c0b6-4b5d-831f-e03e7942152a" />


APX LMS is a modern, feature-rich Learning Management System designed to provide a seamless and interactive learning experience for students, teachers, and administrators. It features a responsive and user-friendly interface built with Next.js and a powerful backend powered by Node.js, Express, and MongoDB.

## Educational Impact

APX LMS aims to solve several real-world problems in education by:

-   **Improving Accessibility:** Centralizes course materials, assignments, and communication, making them accessible anytime, anywhere.
-   **Enhancing Engagement:** Interactive features like real-time notifications, AI-powered tools, and viva voce practice keep students engaged and motivated.
-   **Streamlining Teaching:** Simplifies course management, assignment distribution, and grading for teachers, allowing them to focus more on teaching.
-   **Facilitating Communication:** Provides a direct line of communication between students and teachers through announcements and feedback channels.

## Innovation & Creativity

The project demonstrates innovation and creativity through:

-   **AI-Powered Course Generation:** Teachers can automatically generate a complete course structure, including chapters and summaries, from a YouTube playlist or a given topic.
-   **Viva Voce Practice:** An AI-powered viva voce feature allows students to practice their oral examination skills and receive instant feedback on their answers.
-   **AI-Generated Quizzes:** The system can generate quizzes (both multiple-choice and open-ended questions) from provided text, allowing for quick and easy creation of practice materials.
-   **Real-time Interaction:** The use of WebSockets for instant notifications creates a dynamic and responsive learning environment, mimicking the immediacy of a physical classroom.
-   **Unified Platform:** Combines the functionalities of course management, communication, and assessment into a single, cohesive platform, reducing the need for multiple disparate tools.

## Functionality

APX LMS is a technically sound and usable platform that goes beyond a minimum viable product. All core features are fully implemented and work as intended, providing a robust and reliable experience for all user roles.

## Features

### User-Specific Dashboards

-   **Student Dashboard:** A personalized space for students to access their enrolled courses, view upcoming assignments, track their grades, and engage with practice materials like flashcards and quizzes.
-   **Teacher Dashboard:** A comprehensive command center for teachers to create and manage courses, enroll students, create and grade assignments, post announcements, and monitor student progress.
-   **Admin Dashboard:** A powerful back-end interface for administrators to manage user accounts, oversee all courses and system activity, and configure application settings.

### AI-Powered Tools

-   **Course Generation from YouTube:** Teachers can input a topic or a YouTube playlist URL, and the AI will generate a complete course outline with structured chapters, detailed summaries, and estimated durations.
-   **Viva Voce Practice:** An interactive, AI-powered tool that allows students to practice for oral exams. The system asks questions on a specified topic and provides instant, detailed feedback on the student's answers, including a performance rating.
-   **Automatic Quiz Generation:** Teachers and students can generate practice quizzes (multiple-choice or open-ended) from any text-based content, making it easy to create study materials.
-   **AI-Powered Chat Assistant:** An integrated chatbot to assist users with educational queries and provide support.

### Core LMS Features

-   **Course Management:** Teachers can create, update, and manage courses with a unique join code for easy student enrollment.
-   **Student Enrollment:** Students can join courses with a simple join code, making the process quick and easy.
-   **Assignments and Submissions:** Teachers can create assignments with due dates, points, and attachments. Students can submit their work directly through the platform.
-   **Grading and Feedback:** A streamlined interface for teachers to grade assignments and provide personalized feedback to students.
-   **Flashcards:** Students can create and use digital flashcards to study key concepts and terms.
-   **Practice Quizzes:** In addition to AI-generated quizzes, the platform supports various practice quizzes to help students prepare for exams.
-   **Real-time Notifications:** A WebSocket-based system provides instant notifications for announcements, new assignments, and grades.
-   **Secure Authentication:** The platform uses JWT for secure authentication and supports Google OAuth for easy and secure login.
-   **File Management:** A robust system for uploading and managing files for courses, assignments, and submissions.

## Technologies Used

### Frontend

-   **Framework:** Next.js
-   **Styling:** Tailwind CSS
-   **UI Components:** Radix UI, Lucide React
-   **State Management:** React Hooks
-   **HTTP Client:** Axios
-   **Real-time:** WebSocket

### Backend

-   **Framework:** Express.js
-   **Database:** MongoDB with Mongoose
-   **Authentication:** JSON Web Tokens (JWT), bcrypt.js, Google Auth Library
-   **AI Integration:** Cerebras AI API
-   **Real-time:** ws (WebSocket)
-   **File Uploads:** Multer
-   **Validation:** express-validator

## Project Structure

The project is divided into two main directories:

-   `Frontend/`: Contains the Next.js frontend application.
-   `backend/`: Contains the Node.js and Express backend application.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js and npm installed
-   MongoDB instance running

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/your_username/apx-lms.git
    ```
2.  **Install backend dependencies**
    ```sh
    cd backend
    npm install
    ```
3.  **Install frontend dependencies**
    ```sh
    cd ../Frontend
    npm install
    ```

### Configuration

1.  **Create a `.env` file in the `backend` directory** and add the following environment variables:
    ```env
    PORT=5001
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    GOOGLE_CLIENT_ID=your_google_client_id
    CEREBRAS_API_KEY=your_cerebras_api_key
    ```
2.  **Create a `.env.local` file in the `Frontend` directory** and add the following environment variables:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:5001
    ```

### Running the Application

1.  **Start the backend server**
    ```sh
    cd backend
    npm start
    ```
    The backend server will start on `http://localhost:5001`.

2.  **Start the frontend development server**
    ```sh
    cd ../Frontend
    npm run dev
    ```
    The frontend application will be available at `http://localhost:3000`.

## API Endpoints

The backend provides a RESTful API for the frontend to consume. Here are some of the main endpoints:

-   `POST /api/auth/register`: Register a new user.
-   `POST /api/auth/login`: Log in a user.
-   `GET /api/auth/me`: Get the current user's profile.
-   `POST /api/courses`: Create a new course.
-   `GET /api/courses/teacher`: Get all courses for a teacher.
-   `GET /api/courses/student`: Get all courses for a student.
-   `POST /api/courses/join`: Join a course.
-   `POST /api/courses/:id/announcements`: Create an announcement.
-   `POST /api/courses/:id/assignments`: Create an assignment.
-   `POST /api/youtubecourses/generate`: Generate a course from a YouTube playlist.
-   `POST /api/viva/generate`: Generate a new viva session.
-   `POST /api/practice/generate-quiz`: Generate a quiz from text.
-   `GET /api/flashcards`: Get all flashcards for a user.

For a full list of API endpoints, please refer to the route files in the `backend/routes` directory.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📞 Contact
For any questions or support, please contact:
- **Aditya Dutt** | [Github](https://github.com/adityadutt29) | [Linkedin](https://www.linkedin.com/in/adityadutt29/).
- **Email**: <adityadutt29@yahoo.com>
