import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
// import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ImageWithFallback } from './assets/ImageWithFallback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { useAuth } from '../App';
import apiService from '../services/api';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Star,
  MessageSquare,
  Heart,
  Clock,
  Shield,
  CheckCircle,
  Phone,
  Mail,
  User,
  Home,
  Cigarette,
  PawPrint
} from 'lucide-react';

export function RoommateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [roommate, setRoommate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageError, setMessageError] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const currentUserId = user?._id?.toString();
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', livedTogetherDuration: '' });
  const [reviewSubmitError, setReviewSubmitError] = useState('');
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState('');

  const loadRoommate = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await apiService.getRoommateRequest(id);
      if (res.success && res.data) {
        setRoommate(res.data);
      } else {
        setError('Roommate not found');
        setRoommate(null);
      }
    } catch (err) {
      setError('Roommate not found');
      setRoommate(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewError('');
    try {
      const res = await apiService.getRoommateReviews(id);
      if (!res.success) {
        throw new Error(res.message || 'Unable to load reviews');
      }
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setReviewError(err.message || 'Unable to load reviews');
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setMessageError('');
    setMessageLoading(false);
    setReviewSubmitError('');
    setReviewSubmitSuccess('');
    loadRoommate();
    fetchReviews();
  }, [loadRoommate, fetchReviews]);

  const myReview = useMemo(() => {
    if (!currentUserId) {
      return null;
    }
    return reviews.find((review) => review.reviewer?._id === currentUserId) || null;
  }, [reviews, currentUserId]);

  useEffect(() => {
    if (myReview) {
      setReviewForm({
        rating: myReview.rating ?? 5,
        comment: myReview.comment || '',
        livedTogetherDuration: myReview.livedTogetherDuration || '',
      });
    } else {
      setReviewForm({ rating: 5, comment: '', livedTogetherDuration: '' });
    }
  }, [myReview]);

  const ownerId = roommate?.user?._id?.toString();
  const isOwner = Boolean(ownerId && ownerId === currentUserId);
  const canReview = isAuthenticated && !isOwner;

  // Build a view model from API shape (RoommateRequest)
  const vm = useMemo(() => {
    if (!roommate) return null;
    const dealBreakersArray = Array.isArray(roommate.dealBreakers)
      ? roommate.dealBreakers
      : (roommate.dealBreakers ? String(roommate.dealBreakers).split(',').map(s => s.trim()).filter(Boolean) : []);
    return {
      name: roommate.user?.name || 'Roommate',
      location: roommate.location || '',
      avatar: roommate.profileImage || roommate.user?.avatar || '',
      bio: roommate.bio || '',
      budgetMin: roommate.budget?.min ?? null,
      budgetMax: roommate.budget?.max ?? null,
      moveInDate: roommate.moveInDate || null,
      roomType: roommate.roomType || '',
      preferredAreas: roommate.preferredAreas || [],
      interests: roommate.interests || [],
      lifestyle: roommate.lifestyle || { cleanliness: 3, socialLevel: 3, smoking: false, pets: false, workSchedule: 'flexible', sleepSchedule: 'flexible' },
      idealRoommate: roommate.idealRoommate || '',
      dealBreakers: dealBreakersArray,
      memberSince: roommate.createdAt || null,
      rating: typeof roommate.rating === 'number' ? roommate.rating : null,
      reviewCount: roommate.reviewCount ?? 0,
    };
  }, [roommate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error || !vm) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Roommate not found'}</div>;

  const formatMoveInDate = (dateString) => {
    // Using en-GB locale for DD/MM/YYYY format which is common in India
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatMemberSince = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatReviewDate = (value) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (err) {
      return '';
    }
  };

  const handleStartConversation = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!roommate?._id) {
      setMessageError('Roommate details are still loading. Please try again shortly.');
      return;
    }

    if (isOwner) {
      setMessageError('You cannot message your own roommate request.');
      return;
    }

    setMessageError('');
    setMessageLoading(true);
    try {
      const res = await apiService.startConversation({ roommateRequestId: roommate._id });
      if (!res.success) {
        throw new Error(res.message || 'Unable to start conversation');
      }
      const conversationId = res.data?._id;
      navigate(`/inbox${conversationId ? `?conversation=${conversationId}` : ''}`);
    } catch (err) {
      setMessageError(err.message || 'Unable to open messaging');
    } finally {
      setMessageLoading(false);
    }
  };

  const handleReviewFieldChange = (field) => (event) => {
    const value = event.target.value;
    setReviewForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!canReview) {
      if (!isAuthenticated) {
        navigate('/auth');
      }
      return;
    }

    const numericRating = Number(reviewForm.rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      setReviewSubmitError('Please choose a rating between 1 and 5.');
      return;
    }

    setReviewSubmitError('');
    setReviewSubmitSuccess('');
    setReviewSubmitting(true);

    const payload = {
      rating: numericRating,
      comment: reviewForm.comment?.trim() || '',
      livedTogetherDuration: reviewForm.livedTogetherDuration?.trim() || '',
    };

    try {
      let response;
      if (myReview) {
        response = await apiService.updateRoommateReview(id, myReview._id, payload);
      } else {
        response = await apiService.createRoommateReview(id, payload);
      }

      if (!response.success) {
        throw new Error(response.message || 'Unable to save review');
      }

      const savedReview = response.data;
      setReviews((prev) => {
        if (myReview) {
          return prev.map((review) => (review._id === savedReview._id ? savedReview : review));
        }
        return [savedReview, ...prev];
      });
      setReviewSubmitSuccess(myReview ? 'Review updated successfully.' : 'Review added successfully.');
      await loadRoommate(false);
    } catch (err) {
      setReviewSubmitError(err.message || 'Unable to save review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview) {
      return;
    }

    setReviewSubmitError('');
    setReviewSubmitSuccess('');
    setReviewSubmitting(true);

    try {
      const response = await apiService.deleteRoommateReview(id, myReview._id);
      if (!response.success) {
        throw new Error(response.message || 'Unable to delete review');
      }

  setReviews((prev) => prev.filter((review) => review._id !== myReview._id));
  setReviewSubmitSuccess('Review deleted.');
  await loadRoommate(false);
    } catch (err) {
      setReviewSubmitError(err.message || 'Unable to delete review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-4" asChild>
          <Link to="/roommates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roommates
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Profile Header */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="relative h-32 w-32 rounded-full overflow-hidden">
                    <ImageWithFallback
                      src={vm.avatar || '/default-avatar.svg'}
                      alt={vm.name}
                      className="h-full w-full object-cover"
                    />
                    {roommate?.verified && (
                      <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center">
                        <Shield className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-medium text-foreground">{vm.name}</h1>
                        {(roommate?.age || roommate?.occupation) && (
                          <p className="text-lg text-muted-foreground">
                            {roommate?.age ? `${roommate.age} years old` : ''}
                            {roommate?.age && roommate?.occupation ? ' • ' : ''}
                            {roommate?.occupation ?? ''}
                          </p>
                        )}
                        <div className="flex items-center text-muted-foreground mt-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{vm.location}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={isSaved ? 'text-red-500' : 'text-muted-foreground'}
                        onClick={() => setIsSaved(!isSaved)}
                      >
                        <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="font-medium">
                            {typeof roommate?.rating === 'number' ? roommate.rating.toFixed(1) : '—'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{roommate?.responseRate != null ? `${roommate.responseRate}%` : '—'}</p>
                        <p className="text-xs text-muted-foreground">Response Rate</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center">
                          <Clock className="h-4 w-4 mr-1 text-green-500" />
                          <span className="font-medium text-green-600">{roommate?.lastActive ? new Date(roommate.lastActive).toLocaleString() : '—'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Last Active</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{vm.memberSince ? formatMemberSince(vm.memberSince) : '—'}</p>
                        <p className="text-xs text-muted-foreground">Member Since</p>
                      </div>
                    </div>

                    <p className="text-muted-foreground">{vm.bio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Housing Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-2">Budget Range</p>
                        <p className="text-2xl font-medium text-foreground">
                          ₹{vm.budgetMin ?? '—'} - ₹{vm.budgetMax ?? '—'}
                          <span className="text-base text-muted-foreground">/month</span>
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-2">Move-in Date</p>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{vm.moveInDate ? formatMoveInDate(vm.moveInDate) : '—'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium mb-2">Room Type</p>
                      <Badge variant="outline">{vm.roomType}</Badge>
                    </div>

                    <div>
                      <p className="font-medium mb-2">Preferred Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {vm.preferredAreas.map((area) => (
                          <Badge key={area} variant="secondary">{area}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Interests & Languages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium mb-2">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {vm.interests.map((interest) => (
                          <Badge key={interest} variant="secondary">{interest}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium mb-2">Languages</p>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">—</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>What I'm Looking For</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium mb-2">Ideal Roommate</p>
                      <p className="text-muted-foreground">{roommate?.idealRoommate || '—'}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium mb-2">Deal Breakers</p>
                      <ul className="space-y-1">
                        {vm.dealBreakers.map((item, index) => (
                          <li key={index} className="text-muted-foreground flex items-center">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                            {item}
                          </li>
                        ))}
                        {vm.dealBreakers.length === 0 && (
                          <li className="text-muted-foreground">—</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lifestyle" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Lifestyle Compatibility</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Cleanliness Level</p>
                        <span className="text-sm text-muted-foreground">{vm.lifestyle.cleanliness}/5</span>
                      </div>
                      <Progress value={vm.lifestyle.cleanliness * 20} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {vm.lifestyle.cleanliness >= 4 ? 'Very clean and organized' : 
                         vm.lifestyle.cleanliness >= 3 ? 'Generally tidy' : 'Relaxed about cleanliness'}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Social Level</p>
                        <span className="text-sm text-muted-foreground">{vm.lifestyle.socialLevel}/5</span>
                      </div>
                      <Progress value={vm.lifestyle.socialLevel * 20} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {vm.lifestyle.socialLevel >= 4 ? 'Very social and outgoing' : 
                         vm.lifestyle.socialLevel >= 3 ? 'Moderately social' : 'Prefers quiet environment'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center">
                          <Cigarette className="h-4 w-4 mr-2" />
                          <span>Smoking</span>
                        </div>
                        <span className={vm.lifestyle.smoking ? 'text-yellow-600' : 'text-green-600'}>
                          {vm.lifestyle.smoking ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center">
                          <PawPrint className="h-4 w-4 mr-2" />
                          <span>Pets</span>
                        </div>
                        <span className={vm.lifestyle.pets ? 'text-blue-600' : 'text-muted-foreground'}>
                          {vm.lifestyle.pets ? 'Has pets' : 'No pets'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="font-medium mb-1">Work Schedule</p>
                        <p className="text-muted-foreground">{vm.lifestyle.workSchedule}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Sleep Schedule</p>
                        <p className="text-muted-foreground">{vm.lifestyle.sleepSchedule}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span>Roommate Reviews</span>
                      <span className="text-sm text-muted-foreground">
                        {vm.reviewCount
                          ? `${vm.reviewCount} ${vm.reviewCount === 1 ? 'review' : 'reviews'}`
                          : 'No reviews yet'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {reviewError && <p className="text-sm text-destructive">{reviewError}</p>}

                    {reviewsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading reviews…</p>
                    ) : reviews.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No reviews yet. Share your experience if you've stayed together.
                      </p>
                    ) : (
                      <div className="space-y-6">
                        {reviews.map((review) => {
                          const stars = Math.max(0, Math.min(5, Math.round(review.rating || 0)));
                          return (
                            <div key={review._id} className="border-b border-border pb-4 last:border-b-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                  <h4 className="font-medium">{review.reviewer?.name || 'Community member'}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {review.livedTogetherDuration ? `${review.livedTogetherDuration} • ` : ''}
                                    {formatReviewDate(review.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  {Array.from({ length: stars }).map((_, index) => (
                                    <Star key={index} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                              </div>
                              {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                              {review.reviewer?._id === currentUserId && (
                                <Badge variant="secondary" className="mt-2 text-xs">Your review</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {canReview && (
                      <div className="border-t border-border pt-4">
                        <h4 className="font-medium mb-3">{myReview ? 'Update your review' : 'Leave a review'}</h4>
                        <form onSubmit={handleReviewSubmit} className="space-y-3">
                          <div className="flex items-center gap-3">
                            <label htmlFor="roommate-rating" className="text-sm font-medium">
                              Rating
                            </label>
                            <select
                              id="roommate-rating"
                              className="border rounded px-2 py-1 text-sm"
                              value={reviewForm.rating}
                              onChange={handleReviewFieldChange('rating')}
                              disabled={reviewSubmitting}
                            >
                              {[1, 2, 3, 4, 5].map((value) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="roommate-duration" className="text-sm font-medium">
                              How long did you stay together?
                            </label>
                            <input
                              id="roommate-duration"
                              type="text"
                              className="w-full border rounded px-3 py-2 text-sm mt-1"
                              placeholder="e.g. 6 months, 1 semester"
                              value={reviewForm.livedTogetherDuration}
                              onChange={handleReviewFieldChange('livedTogetherDuration')}
                              disabled={reviewSubmitting}
                            />
                          </div>
                          <div>
                            <label htmlFor="roommate-comment" className="text-sm font-medium">
                              Share a few details
                            </label>
                            <textarea
                              id="roommate-comment"
                              className="w-full border rounded px-3 py-2 text-sm mt-1"
                              rows={4}
                              placeholder="What was it like sharing a flat?"
                              value={reviewForm.comment}
                              onChange={handleReviewFieldChange('comment')}
                              disabled={reviewSubmitting}
                            />
                          </div>
                          {reviewSubmitError && <p className="text-xs text-destructive">{reviewSubmitError}</p>}
                          {reviewSubmitSuccess && <p className="text-xs text-emerald-600">{reviewSubmitSuccess}</p>}
                          <div className="flex items-center gap-2">
                            <Button type="submit" disabled={reviewSubmitting} className="inline-flex items-center gap-2">
                              {reviewSubmitting ? 'Saving…' : myReview ? 'Update review' : 'Submit review'}
                            </Button>
                            {myReview && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={handleDeleteReview}
                                disabled={reviewSubmitting}
                              >
                                Delete review
                              </Button>
                            )}
                          </div>
                        </form>
                      </div>
                    )}

                    {!isAuthenticated && !isOwner && (
                      <div className="border-t border-border pt-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          Want to share your flatshare experience? Log in to leave a review.
                        </p>
                        <Button asChild variant="outline" size="sm">
                          <Link to="/auth">Login to review</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <p className="text-lg font-medium">Interested?</p>
                  <p className="text-sm text-muted-foreground">Send a message to connect</p>
                </div>
                <div className="space-y-3">
                  {isAuthenticated ? (
                    <>
                      <Button
                        className="w-full"
                        onClick={handleStartConversation}
                        disabled={messageLoading || isOwner}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {messageLoading ? 'Opening…' : 'Send Message'}
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Phone className="h-4 w-4 mr-2" />
                        Request Contact
                      </Button>
                    </>
                  ) : (
                    <Button asChild className="w-full">
                      <Link to="/auth">Login to Contact</Link>
                    </Button>
                  )}
                  {messageError && <p className="text-xs text-destructive text-center">{messageError}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="text-sm">Email</span>
                    </div>
                    {roommate?.verifications?.email ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="text-sm">Phone</span>
                    </div>
                    {roommate?.verifications?.phone ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-sm">ID Verification</span>
                    </div>
                    {roommate?.verifications?.id ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      <span className="text-sm">Work Email</span>
                    </div>
                    {roommate?.verifications?.workEmail ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Response Rate</span>
                    <span className="font-medium">{roommate?.responseRate != null ? `${roommate.responseRate}%` : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average Rating</span>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-medium">
                        {typeof roommate?.rating === 'number' ? roommate.rating.toFixed(1) : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Review Count</span>
                    <span className="font-medium">{roommate?.reviewCount ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Posted</span>
                    <span className="font-medium">
                      {roommate?.postedDate ? new Date(roommate.postedDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}