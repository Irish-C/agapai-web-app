// client/src/components/GlobalErrorBoundary.jsx
import React from 'react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an analytics service here
    console.error("Global Error Caught:", error, errorInfo);
  }

  handleReset = () => {
    // Clear the error state and reload the page or redirect to home
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h1>
            <p className="text-gray-600 mb-6">
              The application encountered an unexpected error. Don't worry, your monitoring data is safe.
            </p>
            <div className="bg-gray-50 p-3 rounded mb-6 text-left overflow-auto max-h-32">
               <code className="text-xs text-red-500">{this.state.error?.toString()}</code>
            </div>
            <button
              onClick={this.handleReset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition duration-200"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;