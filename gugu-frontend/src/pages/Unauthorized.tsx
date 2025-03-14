import { Link } from "react-router-dom";

export default function Unauthorized() {
    const state = history.state?.state || {};
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            ⚠️ Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            {state.error || "You don't have permission to view this page"}
          </p>
          <Link
            to="/"
            className="inline-block bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark transition-colors"
          >
            Return to Safety
          </Link>
        </div>
      </div>
    );
  }