'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, Clock, Brain, User, Briefcase, Home } from 'lucide-react';

export default function MemoryManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterContext, setFilterContext] = useState('all');

  // Convex queries
  const recentMemories = useQuery(api.memory.getRecentMemories, { limit: 50 });

  // Filter and search memories
  const filteredMemories = recentMemories?.filter(memory => {
    const matchesSearch = !searchQuery || 
      memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.entities?.some((entity: string) => 
        entity.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesContext = filterContext === 'all' || memory.context === filterContext;
    return matchesSearch && matchesContext;
  }) || [];

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'work': return <Briefcase className="h-4 w-4" />;
      case 'family': return <Home className="h-4 w-4" />;
      case 'personal': return <User className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'experience': return 'bg-blue-100 text-blue-800';
      case 'preference': return 'bg-green-100 text-green-800';
      case 'relationship': return 'bg-purple-100 text-purple-800';
      case 'goal': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/chat" 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </Link>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-magis-50 text-magis-600">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Memory Management</h1>
                  <p className="text-sm text-gray-500">
                    View and manage your MAGIS memories
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {filteredMemories.length} memories
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterContext}
                onChange={(e) => setFilterContext(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
              >
                <option value="all">All Contexts</option>
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="family">Family</option>
              </select>
            </div>
          </div>
        </div>

        {/* Memory List */}
        {recentMemories === undefined ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magis-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading memories...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || filterContext !== 'all' ? 'No matching memories' : 'No memories yet'}
            </h3>
            <p className="text-gray-600">
              {searchQuery || filterContext !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Start chatting with MAGIS to create memories!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMemories.map((memory: any) => (
              <div key={memory._id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                      {getContextIcon(memory.context)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(memory.memoryType)}`}>
                          {memory.memoryType}
                        </span>
                        <span className="text-sm text-gray-500">
                          {memory.context}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(memory.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Importance: {memory.importance}/10
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {memory.summary && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Summary</h4>
                      <p className="text-gray-700">{memory.summary}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Content</h4>
                    <p className="text-gray-700 text-sm">
                      {memory.content.length > 300 
                        ? `${memory.content.substring(0, 300)}...` 
                        : memory.content
                      }
                    </p>
                  </div>
                  
                  {memory.entities && memory.entities.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Entities</h4>
                      <div className="flex flex-wrap gap-2">
                        {memory.entities.map((entity: string, index: number) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {entity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}