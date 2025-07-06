'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Brain, 
  Trash2, 
  Edit2, 
  Eye,
  ArrowUpDown,
  Calendar,
  User,
  Briefcase,
  Home,
  Heart
} from 'lucide-react';

export default function MemoryManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterContext, setFilterContext] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false); // This would come from user context

  // Convex queries
  const recentMemories = useQuery(api.memory.getRecentMemories, { limit: 50 });
  const updateMemory = useMutation(api.memory.updateMemory);

  // Filter and search memories
  const filteredMemories = recentMemories?.filter(memory => {
    const matchesSearch = !searchQuery || 
      memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.entities?.some((entity: string) => 
        entity.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesContext = filterContext === 'all' || memory.context === filterContext;
    const matchesType = filterType === 'all' || memory.memoryType === filterType;

    return matchesSearch && matchesContext && matchesType;
  }) || [];

  // Sort memories
  const sortedMemories = [...filteredMemories].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return b.createdAt - a.createdAt;
      case 'importance':
        return b.importance - a.importance;
      case 'accessed':
        return b.accessCount - a.accessCount;
      default:
        return b.createdAt - a.createdAt;
    }
  });

  const handleUpdateImportance = async (memoryId: Id<"memories">, importance: number) => {
    try {
      await updateMemory({ memoryId, importance });
    } catch (error) {
      console.error('Error updating memory importance:', error);
    }
  };

  const handleDeactivateMemory = async (memoryId: Id<"memories">) => {
    try {
      await updateMemory({ memoryId, isActive: false });
    } catch (error) {
      console.error('Error deactivating memory:', error);
    }
  };

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
      case 'fact': return 'bg-gray-100 text-gray-800';
      case 'relationship': return 'bg-pink-100 text-pink-800';
      case 'skill': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Memory Management</h1>
        <p className="text-gray-600">
          View and manage MAGIS's memories about you and your interactions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters and Search Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div>
                <Label htmlFor="search">Search Memories</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search content, entities, keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Context Filter */}
              <div>
                <Label htmlFor="context">Context</Label>
                <Select value={filterContext} onValueChange={setFilterContext}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contexts</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <Label htmlFor="type">Memory Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fact">Facts</SelectItem>
                    <SelectItem value="preference">Preferences</SelectItem>
                    <SelectItem value="experience">Experiences</SelectItem>
                    <SelectItem value="relationship">Relationships</SelectItem>
                    <SelectItem value="skill">Skills</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <Label htmlFor="sort">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="importance">Importance</SelectItem>
                    <SelectItem value="accessed">Most Accessed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Toggle (for testing) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="pt-4 border-t">
                  <Label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isAdmin}
                      onChange={(e) => setIsAdmin(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Admin View</span>
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Memory Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Memory Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Memories:</span>
                  <span className="font-medium">{recentMemories?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>High Importance:</span>
                  <span className="font-medium">
                    {recentMemories?.filter(m => m.importance >= 8).length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Recent (24h):</span>
                  <span className="font-medium">
                    {recentMemories?.filter(m => 
                      Date.now() - m.createdAt < 24 * 60 * 60 * 1000
                    ).length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Memories List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Memories ({sortedMemories.length})
              </CardTitle>
              <CardDescription>
                Click on a memory to view details and manage its importance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {sortedMemories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="h-8 w-8 mx-auto mb-4 opacity-50" />
                    <p>No memories found matching your filters</p>
                  </div>
                ) : (
                  sortedMemories.map((memory) => (
                    <MemoryItem
                      key={memory._id}
                      memory={memory}
                      isAdmin={isAdmin}
                      onSelect={() => setSelectedMemory(memory)}
                      onUpdateImportance={handleUpdateImportance}
                      onDeactivate={handleDeactivateMemory}
                      getContextIcon={getContextIcon}
                      getTypeColor={getTypeColor}
                      formatDate={formatDate}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Memory Detail Modal/Panel */}
      {selectedMemory && (
        <MemoryDetailModal
          memory={selectedMemory}
          isAdmin={isAdmin}
          onClose={() => setSelectedMemory(null)}
          onUpdateImportance={handleUpdateImportance}
          onDeactivate={handleDeactivateMemory}
          formatDate={formatDate}
          getContextIcon={getContextIcon}
          getTypeColor={getTypeColor}
        />
      )}
    </div>
  );
}

// Memory Item Component
function MemoryItem({ 
  memory, 
  isAdmin, 
  onSelect, 
  onUpdateImportance, 
  onDeactivate,
  getContextIcon,
  getTypeColor,
  formatDate
}: any) {
  const [localImportance, setLocalImportance] = useState(memory.importance);

  const handleImportanceChange = (newImportance: number) => {
    setLocalImportance(newImportance);
    onUpdateImportance(memory._id, newImportance);
  };

  return (
    <div 
      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getContextIcon(memory.context)}
          <Badge className={getTypeColor(memory.memoryType)}>
            {memory.memoryType}
          </Badge>
          <div className="flex items-center">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(localImportance / 2) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">
              {localImportance}/10
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{formatDate(memory.createdAt)}</span>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
        {memory.summary || memory.content.substring(0, 150) + '...'}
      </p>

      {memory.entities && memory.entities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {memory.entities.slice(0, 3).map((entity: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {entity}
            </Badge>
          ))}
          {memory.entities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{memory.entities.length - 3} more
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Access count: {memory.accessCount}</span>
          {isAdmin && (
            <span>Source: {memory.sourceType}</span>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeactivate(memory._id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Memory Detail Modal Component
function MemoryDetailModal({ 
  memory, 
  isAdmin, 
  onClose, 
  onUpdateImportance, 
  onDeactivate,
  formatDate,
  getContextIcon,
  getTypeColor
}: any) {
  const [importance, setImportance] = useState(memory.importance);

  const handleSave = () => {
    onUpdateImportance(memory._id, importance);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Memory Details</h2>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="space-y-4">
            {/* Memory metadata */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getContextIcon(memory.context)}
                <span className="text-sm font-medium">{memory.context}</span>
              </div>
              <Badge className={getTypeColor(memory.memoryType)}>
                {memory.memoryType}
              </Badge>
              <span className="text-sm text-gray-500">
                {formatDate(memory.createdAt)}
              </span>
            </div>

            {/* Content */}
            <div>
              <Label className="text-sm font-medium">Content</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                {memory.content}
              </div>
            </div>

            {/* Summary */}
            {memory.summary && (
              <div>
                <Label className="text-sm font-medium">Summary</Label>
                <div className="mt-1 p-3 bg-blue-50 rounded-md text-sm">
                  {memory.summary}
                </div>
              </div>
            )}

            {/* Entities */}
            {memory.entities && memory.entities.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Entities</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {memory.entities.map((entity: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {entity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {memory.keywords && memory.keywords.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Keywords</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {memory.keywords.map((keyword: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Importance */}
            <div>
              <Label className="text-sm font-medium">
                Importance ({importance}/10)
              </Label>
              <div className="mt-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={importance}
                  onChange={(e) => setImportance(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            {/* Admin info */}
            {isAdmin && (
              <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
                <div>Source Type: {memory.sourceType}</div>
                <div>Source ID: {memory.sourceId}</div>
                <div>Access Count: {memory.accessCount}</div>
                <div>Last Accessed: {memory.lastAccessedAt ? formatDate(memory.lastAccessedAt) : 'Never'}</div>
                {memory.sentiment !== undefined && (
                  <div>Sentiment: {memory.sentiment}</div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              {isAdmin && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    onDeactivate(memory._id);
                    onClose();
                  }}
                >
                  Deactivate Memory
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}