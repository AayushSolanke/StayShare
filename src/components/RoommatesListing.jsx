import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ImageWithFallback } from './assets/ImageWithFallback';
import apiService from '../services/api';
import { useAuth } from '../App';
import { 
  Search, 
  MapPin, 
  Calendar,
  Heart,
  Star,
  Users,
  MessageSquare,
  Filter,
  Clock
} from 'lucide-react';

export function RoommatesListing() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [roommates, setRoommates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Dynamic budget bounds derived from data
  const [budgetBounds, setBudgetBounds] = useState({ min: 0, max: 100000 });
  const [filters, setFilters] = useState({
    search: '',
    location: 'all',
    budgetRange: [0, 100000],
    roomType: 'all',
    age: 'all'
  });
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [savedRoommates, setSavedRoommates] = useState([]);
  const [messageLoadingId, setMessageLoadingId] = useState(null);
  const [messageErrors, setMessageErrors] = useState({});

  const currentUserId = user?._id?.toString();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getRoommateRequests();
        if (res.success) {
          const data = Array.isArray(res.data) ? res.data : [];
          setRoommates(data);
          // Compute dynamic budget bounds
          if (data.length > 0) {
            const mins = data.map(r => (r?.budget?.min ?? undefined)).filter(n => typeof n === 'number');
            const maxs = data.map(r => (r?.budget?.max ?? undefined)).filter(n => typeof n === 'number');
            if (mins.length && maxs.length) {
              const min = Math.min(...mins);
              const max = Math.max(...maxs);
              setBudgetBounds({ min, max });
              if (!filtersInitialized) {
                setFilters(prev => ({ ...prev, budgetRange: [min, max] }));
                setFiltersInitialized(true);
              }
            }
          }
        }
      } catch (e) {
        setError(e.message || 'Failed to load roommate requests');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const toggleSaved = (roommateId) => {
    setSavedRoommates(prev => 
      prev.includes(roommateId) 
        ? prev.filter(id => id !== roommateId)
        : [...prev, roommateId]
    );
  };

  const filteredRoommates = roommates.filter(req => {
    const userName = (req.user?.name || '').toLowerCase();
    const matchesSearch = userName.includes(filters.search.toLowerCase()) || (req.bio || '').toLowerCase().includes(filters.search.toLowerCase()) || (req.title || '').toLowerCase().includes(filters.search.toLowerCase());
    const matchesLocation = filters.location === 'all' || (req.location || '').toLowerCase().includes(filters.location.toLowerCase());
    const min = req.budget?.min; const max = req.budget?.max;
    // If budget is missing or malformed, don't exclude the item by budget
    const matchesBudget = (typeof min !== 'number' || typeof max !== 'number')
      ? true
      : (max >= filters.budgetRange[0] && min <= filters.budgetRange[1]);
    const matchesRoomType = filters.roomType === 'all' || (req.roomType || '').toLowerCase().includes(filters.roomType);
    return matchesSearch && matchesLocation && matchesBudget && matchesRoomType;
  });

  const formatMoveInDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getLastActiveColor = (lastActive) => {
    if (lastActive.includes('hour')) return 'text-green-600';
    if (lastActive.includes('day') && parseInt(lastActive) <= 3) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  const handleMessage = async (roommate) => {
    if (!roommate?._id) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const ownerId = roommate.user?._id?.toString();
    if (ownerId && ownerId === currentUserId) {
      setMessageErrors((prev) => ({ ...prev, [roommate._id]: 'You cannot message your own roommate request.' }));
      return;
    }

    setMessageErrors((prev) => {
      const next = { ...prev };
      delete next[roommate._id];
      return next;
    });

    setMessageLoadingId(roommate._id);
    try {
      const res = await apiService.startConversation({ roommateRequestId: roommate._id });
      if (!res.success) {
        throw new Error(res.message || 'Unable to start conversation');
      }
      const conversationId = res.data?._id;
      navigate(`/inbox${conversationId ? `?conversation=${conversationId}` : ''}`);
    } catch (err) {
      setMessageErrors((prev) => ({ ...prev, [roommate._id]: err.message || 'Unable to open messaging' }));
    } finally {
      setMessageLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">Loading roommate requests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-foreground">Find Roommates</h1>
          <p className="text-muted-foreground">Connect with potential flatmates in your area</p>
          {error && <p className="text-destructive mt-2">{error}</p>}
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, occupation, or interests..."
                      className="pl-10"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="Bandra">Bandra</SelectItem>
                      <SelectItem value="Andheri">Andheri</SelectItem>
                      <SelectItem value="Koregaon Park">Koregaon Park</SelectItem>
                      <SelectItem value="Dadar">Dadar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Budget Range */}
              <div className="space-y-2">
                <Label>Budget Range (/month)</Label>
                <div className="px-3">
                  <Slider
                    value={filters.budgetRange}
                    onValueChange={(value) => handleFilterChange('budgetRange', value)}
                    max={budgetBounds.max}
                    min={budgetBounds.min}
                    step={Math.max(1, Math.round((budgetBounds.max - budgetBounds.min) / 20))}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{filters.budgetRange[0]}</span>
                  <span>{filters.budgetRange[1]}</span>
                </div>
              </div>

              {/* Room Type and Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Type</Label>
                  <Select value={filters.roomType} onValueChange={(value) => handleFilterChange('roomType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="private">Private Room</SelectItem>
                      <SelectItem value="shared">Shared Room</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Age Range</Label>
                  <Select value={filters.age} onValueChange={(value) => handleFilterChange('age', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Age</SelectItem>
                      <SelectItem value="18-25">18-25</SelectItem>
                      <SelectItem value="26-30">26-30</SelectItem>
                      <SelectItem value="31+">31+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            {filteredRoommates.length} roommate{filteredRoommates.length !== 1 ? 's' : ''} found
          </p>
          <Select defaultValue="activity">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activity">Most Active</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="recent">Recently Posted</SelectItem>
              <SelectItem value="budget">Budget Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Roommates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoommates.map((roommate) => (
            <Card key={roommate._id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={roommate.user?.avatar} />
                        <AvatarFallback>{(roommate.user?.name || 'U N').split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {roommate.user?.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{roommate.user?.name}</h3>
                      <p className="text-sm text-muted-foreground">{roommate.title}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={savedRoommates.includes(roommate._id) ? 'text-red-500' : 'text-muted-foreground'}
                    onClick={() => toggleSaved(roommate._id)}
                  >
                    <Heart className={`h-4 w-4 ${savedRoommates.includes(roommate._id) ? 'fill-current' : ''}`} />
                  </Button>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Looking for: {roommate.roomType}</p>
                    <div className="flex items-center text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="text-xs">{roommate.location}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{roommate.bio}</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">₹{roommate.budget?.min}-₹{roommate.budget?.max}/mo</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Move-in:</span>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span className="font-medium">{formatMoveInDate(roommate.moveInDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Room type:</span>
                      <Badge variant="outline" className="text-xs">{roommate.roomType}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Reviews:</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {typeof roommate.rating === 'number' ? roommate.rating.toFixed(1) : '—'}
                        <span className="text-muted-foreground">({roommate.reviewCount ?? 0})</span>
                      </span>
                    </div>
                  </div>

                  {Array.isArray(roommate.interests) && (
                    <div className="flex flex-wrap gap-1">
                      {roommate.interests.slice(0, 3).map((interest) => (
                        <Badge key={interest} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {roommate.interests.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{roommate.interests.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link to={`/roommate/${roommate._id}`}>View Profile</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMessage(roommate)}
                    disabled={messageLoadingId === roommate._id || roommate.user?._id?.toString() === currentUserId}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {messageLoadingId === roommate._id ? 'Opening…' : 'Message'}
                  </Button>
                </div>
                {messageErrors[roommate._id] && (
                  <p className="text-xs text-destructive mt-2">{messageErrors[roommate._id]}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRoommates.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No roommates found matching your criteria.</p>
            <Button 
              variant="outline" 
              className="mr-4"
              onClick={() => setFilters({
                search: '',
                location: 'all',
                budgetRange: [budgetBounds.min, budgetBounds.max],
                roomType: 'all',
                age: 'all'
              })}
            >
              Clear Filters
            </Button>
            <Button asChild>
              <Link to="/post-roommate">Post Your Request</Link>
            </Button>
          </div>
        )}

        {/* CTA Section */}
        <Card className="mt-12">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-medium text-foreground mb-2">Looking for roommates?</h2>
            <p className="text-muted-foreground mb-4">
              Post your own request to let potential flatmates find you
            </p>
            <Button asChild>
              <Link to="/post-roommate">Post Roommate Request</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}