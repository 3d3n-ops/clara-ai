import { LoadingSpinner } from "./loading-spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <LoadingSpinner size={48} text="Loading..." />
    </div>
  )
} 