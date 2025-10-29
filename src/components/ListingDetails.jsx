import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './assets/ImageWithFallback';
import { useAuth } from '../App';
import apiService from '../services/api';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Wifi, 
  Heart,
  Star,
  Users,
  Calendar,
  Phone,
  Mail,
  Shield,
  ArrowLeft,
  Share2,
  Camera
} from 'lucide-react';

export function ListingDetails() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [l, r] = await Promise.all([
          apiService.getListing(id),
          apiService.get(`/listings/${id}/reviews`)
        ]);
        if (l.success) setListing(l.data);
        if (r.success) setReviews(r.data);
      } catch (e) {
        setError(e.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const getAmenityIcon = (iconType) => {
    switch (iconType) {
      case 'wifi': return <Wifi className="h-4 w-4" />;
      case 'parking': return <Car className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          Loading...
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-destructive">{error || 'Listing not found'}</p>
          <Button variant="outline" asChild className="mt-4">
            <Link to="/listings">Back to Listings</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleContact = (type) => {
    if (!listing?.landlord) {
      setContactError('Landlord details are not available right now.');
      return;
    }

    const { email, phone, name } = listing.landlord;
    const subject = encodeURIComponent(`StayShare enquiry about ${listing.title}`);
  const greetingName = name ? name.split(' ')[0] : 'there';
  const body = encodeURIComponent(`Hi ${greetingName},

I found your listing "${listing.title}" on StayShare and would love to discuss details.

Thanks!`);

    setContactError('');

    if (type === 'email') {
      if (email) {
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        return;
      }
      if (phone) {
        setContactError('Email not available. Calling instead.');
        window.location.href = `tel:${phone}`;
        return;
      }
    }

    if (type === 'phone') {
      if (phone) {
        window.location.href = `tel:${phone}`;
        return;
      }
      if (email) {
        setContactError('Phone number missing. Sending email instead.');
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        return;
      }
    }

    setContactError('The host has not shared direct contact details yet.');
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-4" asChild>
          <Link to="/listings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="relative mb-6">
                <ImageWithFallback
                  src={listing.images?.[currentImageIndex]}
                alt={listing.title}
                className="w-full h-96 object-cover rounded-lg"
              />
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button variant="secondary" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setIsSaved(!isSaved)}
                >
                  <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
              <div className="absolute bottom-4 left-4 flex space-x-1">
                {listing.images?.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
              <div className="absolute bottom-4 right-4">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  <Camera className="h-3 w-3 mr-1" />
                  {listing.images?.length || 0} photos
                </Badge>
              </div>
            </div>

            {/* Property Info */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-medium text-foreground mb-2">{listing.title}</h1>
                  <div className="flex items-center text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{listing.location}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      <span>{listing.bedrooms} bedrooms</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      <span>{listing.bathrooms} bathroom</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{listing.roommates?.current || 0}/{listing.roommates?.max || 0} roommates</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">{listing.rating?.average?.toFixed?.(1) || '0.0'}</span>
                    <span className="text-muted-foreground ml-1">({listing.rating?.count || 0} reviews)</span>
                  </div>
                  <Badge variant="outline" className="mt-2">{listing.roomType}</Badge>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="roommates">Roommates</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About this place</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{listing.description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>House Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(listing.houseRules || []).map((rule, index) => (
                        <li key={index} className="flex items-center text-muted-foreground">
                          <Shield className="h-4 w-4 mr-2" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transport Links</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(listing.nearbyTransport || []).map((transport, index) => (
                        <li key={index} className="flex items-center text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          {transport}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="amenities">
                <Card>
                  <CardHeader>
                    <CardTitle>What this place offers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {(listing.amenities || []).map((amenity, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          {getAmenityIcon(amenity)}
                          <span className="text-foreground">{String(amenity).charAt(0).toUpperCase() + String(amenity).slice(1)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="roommates">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Roommates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(listing.currentRoommates || []).map((roommate, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                          <Avatar>
                            <AvatarImage src={roommate.avatar} />
                            <AvatarFallback>{roommate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">{roommate.name}</h4>
                            <p className="text-sm text-muted-foreground">{roommate.age} years old • {roommate.occupation}</p>
                            <p className="text-sm text-muted-foreground mt-1">{roommate.bio}</p>
                          </div>
                        </div>
                      ))}
                      {((listing.roommates?.current || 0) < (listing.roommates?.max || 0)) && (
                        <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center">
                          <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">{(listing.roommates?.max || 0) - (listing.roommates?.current || 0)} space(s) available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Reviews ({listing.rating?.count || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review._id} className="border-b border-border pb-4 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{review.user?.name || 'User'}</h4>
                            <span className="text-sm text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center mb-2">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <p className="text-muted-foreground">{review.comment}</p>
                        </div>
                      ))}
                    </div>

                    {isAuthenticated && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Leave a Review</h4>
                        <div className="flex items-center space-x-2 mb-2">
                          <label className="text-sm">Rating:</label>
                          <select
                            className="border rounded px-2 py-1 text-sm"
                            value={reviewForm.rating}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                          >
                            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                        <textarea
                          className="w-full border rounded p-2 text-sm"
                          rows={3}
                          placeholder="Share your experience..."
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        />
                        <div className="mt-2">
                          <Button
                            onClick={async () => {
                              try {
                                const token = apiService.getToken();
                                if (!token) {
                                  throw new Error('Please log in to submit a review');
                                }
                                const res = await apiService.post(`/listings/${id}/reviews`, reviewForm);
                                if (res.success) {
                                  setReviews(prev => [res.data, ...prev]);
                                }
                              } catch (e) {
                                alert(e.message || 'Failed to add review');
                              }
                            }}
                          >
                            Submit Review
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <span className="text-3xl font-medium text-foreground">₹{listing.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {listing.availableFrom && (
                  <div className="flex items-center justify-center text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Available from {new Date(listing.availableFrom).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="space-y-3">
                  {isAuthenticated ? (
                    <>
                      <Button asChild className="w-full">
                        <Link to={`/booking/${listing._id}`}>Book Viewing</Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleContact('email')}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Landlord
                      </Button>
                    </>
                  ) : (
                    <Button asChild className="w-full">
                      <Link to="/auth">Login to Book</Link>
                    </Button>
                  )}
                </div>
                {contactError && (
                  <p className="text-xs text-destructive text-center mt-2">{contactError}</p>
                )}
              </CardContent>
            </Card>

            {/* Landlord Info */}
            <Card>
              <CardHeader>
                <CardTitle>Hosted by</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-3">
                    <Avatar>
                    <AvatarImage src={listing.landlord?.avatar} />
                    <AvatarFallback>{(listing.landlord?.name || 'U N').split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{listing.landlord?.name}</h4>
                      {listing.landlord.verified && (
                        <Badge variant="default" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-muted-foreground">{listing.landlord?.rating || '-'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Response time: {listing.landlord?.responseTime || '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {listing.landlord?.totalListings || 1} listings
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => handleContact('phone')}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Host
                </Button>
              </CardContent>
            </Card>

            {/* Safety Features */}
            <Card>
              <CardHeader>
                <CardTitle>Safety Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-muted-foreground">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="text-sm">Verified listing</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="text-sm">Secure payments</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="text-sm">24/7 support</span>
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