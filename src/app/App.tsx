import { RouterProvider } from 'react-router'
import { router } from '@/app/routes/router'
import { FeedbackProvider } from '@/components/ui/FeedbackProvider'
import { AuthProvider } from '@/features/auth'

function App() {
  return (
    <AuthProvider>
      <FeedbackProvider>
        <RouterProvider router={router} />
      </FeedbackProvider>
    </AuthProvider>
  )
}

export default App
