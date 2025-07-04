export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-magis-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              <span className="text-magis-600">MAGIS</span>
              <br />
              <span className="text-4xl font-light">Your Personal AI Assistant</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Revolutionary AI assistant with comprehensive memory, proactive intelligence, 
              and natural voice interaction across all your life contexts.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-magis-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                🧠
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">RAG Memory</h3>
              <p className="text-sm text-gray-600">
                Remembers every conversation and learns from your preferences
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-magis-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                🗣️
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Voice First</h3>
              <p className="text-sm text-gray-600">
                Natural speech-to-text and text-to-speech integration
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-magis-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                💬
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Proactive Care</h3>
              <p className="text-sm text-gray-600">
                Naturally follows up on experiences and builds relationships
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-magis-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                🎯
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Context Aware</h3>
              <p className="text-sm text-gray-600">
                Adapts between work, personal, and family contexts seamlessly
              </p>
            </div>
          </div>

          {/* Development Status */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-yellow-800 mb-2">🚧 Development Mode</h3>
            <p className="text-yellow-700">
              MAGIS is currently in development. Complete the setup by configuring Convex and API keys.
            </p>
          </div>

          {/* Setup Instructions */}
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">🚀 Next Steps</h3>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="bg-magis-100 text-magis-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                <div>
                  <strong>Set up Convex:</strong> Run <code className="bg-gray-100 px-2 py-1 rounded">npx convex login</code> and <code className="bg-gray-100 px-2 py-1 rounded">npx convex dev</code>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-magis-100 text-magis-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                <div>
                  <strong>Configure API keys:</strong> Copy <code className="bg-gray-100 px-2 py-1 rounded">.env.example</code> to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> and add your OpenAI and Anthropic API keys
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-magis-100 text-magis-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                <div>
                  <strong>Deploy schema:</strong> Run <code className="bg-gray-100 px-2 py-1 rounded">npx convex deploy</code> to create the database schema
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-magis-100 text-magis-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                <div>
                  <strong>Start development:</strong> Run <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code> to start the development server
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}