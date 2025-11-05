import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import apiService from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ListChecks,
  PauseCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users
} from 'lucide-react';

const statusLabelMap = {
  pending: { label: 'Pending', variant: 'secondary' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
  completed: { label: 'Completed', variant: 'outline' }
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export function HostDashboard() {
  const { user } = useAuth();
  const [listingItems, setListingItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [listingBusy, setListingBusy] = useState({});
  const [bookingBusy, setBookingBusy] = useState({});

  const loadData = async () => {
    setLoading(true);
    setError('');
    setFeedback(null);
    try {
      const [listingRes, bookingRes] = await Promise.all([
        apiService.getMyListings(),
        apiService.getLandlordBookings()
      ]);

      if (listingRes?.success) {
        setListingItems(listingRes.data || []);
      } else {
        throw new Error(listingRes?.message || 'Failed to load listings');
      }

      if (bookingRes?.success) {
        setBookings(bookingRes.data || []);
      } else {
        throw new Error(bookingRes?.message || 'Failed to load bookings');
      }
    } catch (err) {
      console.error('Host dashboard load error:', err);
      setError(err.message || 'Unable to load host data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(() => {
    const totalListings = listingItems.length;
    const activeListings = listingItems.filter((item) => item.listing?.isActive).length;
    const pendingRequests = bookings.filter((booking) => booking.status === 'pending').length;
    const upcomingViewings = bookings.filter((booking) => {
      if (booking.status !== 'confirmed') return false;
      const viewingDate = booking.viewingDate ? new Date(booking.viewingDate) : null;
      return viewingDate ? viewingDate >= new Date() : false;
    }).length;

    return {
      totalListings,
      activeListings,
      pendingRequests,
      upcomingViewings
    };
  }, [listingItems, bookings]);

  const handleListingStatus = async (listingId, nextState) => {
    setListingBusy((prev) => ({ ...prev, [listingId]: true }));
    try {
      const res = await apiService.updateListingStatus(listingId, { isActive: nextState });
      if (!res?.success) {
        throw new Error(res?.message || 'Unable to update listing status');
      }
      setListingItems((prev) =>
        prev.map((item) =>
          item.listing._id === listingId
            ? { ...item, listing: { ...item.listing, isActive: res.data.isActive, updatedAt: res.data.updatedAt } }
            : item
        )
      );
      setFeedback({ type: 'success', message: res.message || 'Listing status updated' });
    } catch (err) {
      console.error('Listing status update error:', err);
      setFeedback({ type: 'error', message: err.message || 'Unable to update listing status' });
    } finally {
      setListingBusy((prev) => ({ ...prev, [listingId]: false }));
    }
  };

  const handleListingDelete = async (listingId, listingTitle) => {
    const confirmed = window.confirm(`Delete "${listingTitle}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setListingBusy((prev) => ({ ...prev, [listingId]: true }));
    try {
      const res = await apiService.deleteListing(listingId);
      if (!res?.success) {
        throw new Error(res?.message || 'Unable to delete listing');
      }

      setListingItems((prev) => prev.filter((item) => item.listing._id !== listingId));
      setFeedback({ type: 'success', message: res.message || 'Listing deleted successfully' });
    } catch (err) {
      console.error('Listing delete error:', err);
      setFeedback({ type: 'error', message: err.message || 'Unable to delete listing' });
    } finally {
      setListingBusy((prev) => ({ ...prev, [listingId]: false }));
    }
  };

  const handleBookingResponse = async (bookingId, status) => {
    setBookingBusy((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const res = await apiService.updateBookingStatus(bookingId, { status });
      if (!res?.success) {
        throw new Error(res?.message || 'Unable to update booking');
      }
      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId ? { ...booking, status: res.data.status } : booking
        )
      );
      setFeedback({ type: 'success', message: `Booking ${status === 'confirmed' ? 'approved' : 'declined'}` });
    } catch (err) {
      console.error('Booking status update error:', err);
      setFeedback({ type: 'error', message: err.message || 'Unable to update booking' });
    } finally {
      setBookingBusy((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const pendingBookings = bookings.filter((booking) => booking.status === 'pending');
  const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed');

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading your host dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Alert variant="destructive">
            <AlertTitle>We hit a snag</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadData}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium text-foreground">Host Dashboard</h1>
            <p className="text-muted-foreground">Manage your listings and booking requests</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/create-listing">Create new listing</Link>
            </Button>
            <Button variant="secondary" onClick={loadData} className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        {feedback && (
          <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
            <AlertTitle>{feedback.type === 'error' ? 'Action failed' : 'Success'}</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <ListChecks className="h-4 w-4" /> Total Listings
              </div>
              <p className="text-3xl font-semibold">{summary.totalListings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <ShieldCheck className="h-4 w-4" /> Active
              </div>
              <p className="text-3xl font-semibold">{summary.activeListings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" /> Pending Requests
              </div>
              <p className="text-3xl font-semibold">{summary.pendingRequests}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" /> Upcoming Viewings
              </div>
              <p className="text-3xl font-semibold">{summary.upcomingViewings}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="confirmed">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {listingItems.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  You have not posted any listings yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {listingItems.map(({ listing, stats }) => (
                  <Card key={listing._id}>
                    <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {listing.title}
                          <Badge variant={listing.isActive ? 'default' : 'secondary'}>
                            {listing.isActive ? 'Open' : 'Full'}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{listing.location}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/listing/${listing._id}`}>View</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/booking/${listing._id}`}>Create viewing slot</Link>
                        </Button>
                        <Button
                          variant={listing.isActive ? 'destructive' : 'secondary'}
                          size="sm"
                          onClick={() => handleListingStatus(listing._id, !listing.isActive)}
                          disabled={Boolean(listingBusy[listing._id])}
                          className="inline-flex items-center gap-2"
                        >
                          {listing.isActive ? (
                            <PauseCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {listingBusy[listing._id]
                            ? 'Updating...'
                            : listing.isActive
                              ? 'Mark as full'
                              : 'Reopen listing'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleListingDelete(listing._id, listing.title)}
                          disabled={Boolean(listingBusy[listing._id])}
                          className="inline-flex items-center gap-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          {listingBusy[listing._id] ? 'Removing…' : 'Delete'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground uppercase">Total Requests</p>
                        <p className="text-2xl font-semibold">{stats.total}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground uppercase">Pending</p>
                        <p className="text-2xl font-semibold">{stats.pending}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground uppercase">Confirmed</p>
                        <p className="text-2xl font-semibold">{stats.confirmed}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground uppercase">Updated</p>
                        <p className="text-sm text-muted-foreground">{formatDate(listing.updatedAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Pending booking requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingBookings.length === 0 ? (
                  <p className="text-muted-foreground">No pending requests right now.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Listing</TableHead>
                        <TableHead>Guest</TableHead>
                        <TableHead>Viewing</TableHead>
                        <TableHead>Move-in</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingBookings.map((booking) => (
                        <TableRow key={booking._id}>
                          <TableCell>
                            <div className="font-medium">{booking.listing?.title}</div>
                            <div className="text-xs text-muted-foreground">{booking.listing?.location}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{booking.user?.name}</div>
                            <div className="text-xs text-muted-foreground">{booking.user?.email}</div>
                          </TableCell>
                          <TableCell>{formatDate(booking.viewingDate)} {booking.viewingTime}</TableCell>
                          <TableCell>{formatDate(booking.moveInDate)}</TableCell>
                          <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                            {booking.message || '—'}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleBookingResponse(booking._id, 'confirmed')}
                              disabled={Boolean(bookingBusy[booking._id])}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleBookingResponse(booking._id, 'rejected')}
                              disabled={Boolean(bookingBusy[booking._id])}
                            >
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confirmed">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming confirmed viewings</CardTitle>
              </CardHeader>
              <CardContent>
                {confirmedBookings.length === 0 ? (
                  <p className="text-muted-foreground">No confirmed bookings yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Listing</TableHead>
                        <TableHead>Guest</TableHead>
                        <TableHead>Viewing Date</TableHead>
                        <TableHead>Move-in Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {confirmedBookings.map((booking) => (
                        <TableRow key={booking._id}>
                          <TableCell>
                            <div className="font-medium">{booking.listing?.title}</div>
                            <div className="text-xs text-muted-foreground">{booking.listing?.location}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{booking.user?.name}</div>
                            <div className="text-xs text-muted-foreground">{booking.user?.phone}</div>
                          </TableCell>
                          <TableCell>{formatDate(booking.viewingDate)} {booking.viewingTime}</TableCell>
                          <TableCell>{formatDate(booking.moveInDate)}</TableCell>
                          <TableCell>
                            <Badge variant={statusLabelMap[booking.status]?.variant || 'outline'}>
                              {statusLabelMap[booking.status]?.label || booking.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default HostDashboard;
