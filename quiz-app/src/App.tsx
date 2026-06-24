import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { AdminLogin } from './pages/AdminLogin'
import { AdminDashboard } from './pages/AdminDashboard'
import { CreateQuiz } from './pages/CreateQuiz'
import { ReviewQuestions } from './pages/ReviewQuestions'
import { QuizEntry } from './pages/QuizEntry'
import { QuizScreen } from './pages/QuizScreen'
import { Results } from './pages/Results'
import { Leaderboard } from './pages/Leaderboard'
import { AdminStats } from './pages/AdminStats'
import { AdminRoute } from './components/AdminRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/create" element={<AdminRoute><CreateQuiz /></AdminRoute>} />
        <Route path="/admin/review/:setId" element={<AdminRoute><ReviewQuestions /></AdminRoute>} />
        <Route path="/admin/stats/:setId" element={<AdminRoute><AdminStats /></AdminRoute>} />
        <Route path="/quiz" element={<QuizEntry />} />
        <Route path="/quiz/:setId" element={<QuizScreen />} />
        <Route path="/result/:setId" element={<Results />} />
        <Route path="/leaderboard/:setId" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
