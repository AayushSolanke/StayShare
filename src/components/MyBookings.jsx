import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './assets/ImageWithFallback';
import apiService from '../services/api';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';

const statusCopy = {
  pending: 'Waiting for landlord approval. We will notify you once they respond.',
  confirmed: 'Viewing confirmed! Contact details are unlocked below so you can coordinate.',
  rejected: 'This request was declined by the landlord. You can still explore other listings.',
  cancelled: 'You cancelled this request.',
  completed: 'Viewing completed. Feel free to leave a review for the host.'
};

const statusVariant = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800'
};

export function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getBookings();
        if (res.success) {
          setBookings(res.data || []);
        } else {
          setError(res.message || 'Unable to fetch bookings');
        }
      } catch (err) {
        setError(err.message || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!bookings.length) {
      setActiveTab('upcoming');
      return;
    }

    const hasPending = bookings.some((booking) => booking.status === 'pending');
    const hasUpcoming = bookings.some(
      (booking) => booking.status === 'confirmed' && new Date(booking.viewingDate) >= new Date()
    );

    if (hasPending) {
      setActiveTab('pending');
    } else if (hasUpcoming) {
      setActiveTab('upcoming');
    } else {
      setActiveTab('past');
    }
  }, [bookings]);

  const categorized = useMemo(() => {
    const upcoming = [];
    const pending = [];
    const past = [];

    bookings.forEach((booking) => {
      if (booking.status === 'pending') {
        pending.push(booking);
        return;
      }

      if (booking.status === 'confirmed') {
        if (new Date(booking.viewingDate) >= new Date()) {
          upcoming.push(booking);
        } else {
          past.push(booking);
        }
        return;
      }

      if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
        past.push(booking);
      }
    });

    return { upcoming, pending, past };
  }, [bookings]);

  const renderStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const BookingCard = ({ booking }) => {
    const landlord = booking.listing?.landlord;
    const unlocked = booking.status === 'confirmed';

    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <ImageWithFallback
              src={booking.listing?.images?.[0]}
              alt={booking.listing?.title}
              className="w-full md:w-32 h-32 object-cover rounded-lg"
            />
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-medium text-foreground">{booking.listing?.title}</h3>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{booking.listing?.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatusIcon(booking.status)}
                  <Badge className={statusVariant[booking.status] || 'bg-gray-100 text-gray-800'}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {statusCopy[booking.status] || 'Status awaiting update.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">{formatDate(booking.viewingDate)}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">{booking.viewingTime || 'To be decided'}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">Move-in: {formatDate(booking.moveInDate)}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {landlord && (
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">Hosted by {landlord.name}</div>
                      <div className="flex items-center text-muted-foreground">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>
                          {unlocked
                            ? landlord.phone || 'Phone not shared'
                            : 'Phone shared after approval'}
                        </span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>
                          {unlocked ? landlord.email : 'Email shared after approval'}
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">₹{booking.listing?.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
              </div>

              {booking.message && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">{booking.message}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/listing/${booking.listing?._id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View Listing
                  </Link>
                </Button>

                {unlocked && landlord?.phone && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`tel:${landlord.phone}`}>
                      <Phone className="h-4 w-4 mr-1" />
                      Call Landlord
                    </a>
                  </Button>
                )}

                {unlocked && landlord?.email && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`mailto:${landlord.email}?subject=Viewing confirmation for ${booking.listing?.title}`}>
                      <Mail className="h-4 w-4 mr-1" />
                      Send Email
                    </a>
                  </Button>
                )}

                {booking.status === 'pending' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await apiService.cancelBooking(booking._id);
                        if (res.success) {
                          setBookings((prev) => prev.map((item) => (item._id === booking._id ? res.data : item)));
                        }
                      } catch (err) {
                        alert(err.message || 'Failed to cancel booking');
                      }
                    }}
                  >
                    Cancel Request
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your bookings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-foreground">My Bookings</h1>
          <p className="text-muted-foreground">Manage your property viewing appointments</p>
          {error && <p className="text-destructive mt-3">{error}</p>}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming ({categorized.upcoming.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({categorized.pending.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({categorized.past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {categorized.upcoming.length ? (
              categorized.upcoming.map((booking) => <BookingCard key={booking._id} booking={booking} />)
            ) : (
              <Card>
                <CardContent className="pt-6 text-center space-y-4">
                  <Calendar className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="font-medium text-foreground">No Upcoming Viewings</h3>
                    <p className="text-muted-foreground">Confirmed viewings will appear here once approved.</p>
                  </div>
                  <Button asChild>
                    <Link to="/listings">Browse Properties</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {categorized.pending.length ? (
              categorized.pending.map((booking) => <BookingCard key={booking._id} booking={booking} />)
            ) : (
              <Card>
                <CardContent className="pt-6 text-center space-y-4">
                  <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="font-medium text-foreground">No Pending Requests</h3>
                    <p className="text-muted-foreground">All your viewing requests have been addressed.</p>
                  </div>
                  <Button asChild>
                    <Link to="/listings">Book Another Viewing</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {categorized.past.length ? (
              categorized.past.map((booking) => <BookingCard key={booking._id} booking={booking} />)
            ) : (
              <Card>
                <CardContent className="pt-6 text-center space-y-4">
                  <CheckCircle className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="font-medium text-foreground">No Past Bookings</h3>
                    <p className="text-muted-foreground">Attend a viewing to see it listed here.</p>
                  </div>
                  <Button asChild>
                    <Link to="/listings">Start Exploring</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto py-4">
                <Link to="/listings">
                  <div className="text-center">
                    <Eye className="h-6 w-6 mx-auto mb-2" />
                    <div>Browse Properties</div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link to="/roommates">
                  <div className="text-center">
                    <MessageSquare className="h-6 w-6 mx-auto mb-2" />
                    <div>Find Roommates</div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link to="/post-roommate">
                  <div className="text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-2" />
                    <div>Post Request</div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}