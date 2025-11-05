import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './assets/ImageWithFallback';
import apiService from '../services/api';
import { 
  Search, 
  Filter, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Wifi, 
  Heart,
  Star,
  Users
} from 'lucide-react';

export function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getListings();
        if (res.success) {
          setListings(res.data);

          if (Array.isArray(res.data) && res.data.length > 0) {
            const prices = res.data
              .map((item) => Number(item.price) || 0)
              .filter((value) => value >= 0);

            if (prices.length > 0) {
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);

              setPriceBounds({
                min: minPrice,
                max: maxPrice
              });

              setFilters((prev) => ({
                ...prev,
                priceRange: [minPrice, maxPrice]
              }));
            }
          }
        }
      } catch (e) {
        setError(e.message || 'Failed to load listings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  const [filters, setFilters] = useState({
    search: '',
    location: 'all',
  priceRange: [0, 0],
    roomType: 'all',
    bedrooms: 'all'
  });
  const [savedListings, setSavedListings] = useState([]);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const toggleSaved = (listingId) => {
    setSavedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const filteredListings = listings.filter(listing => {
    const loc = (listing.location || '').toLowerCase();
    const matchesSearch = (listing.title || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                         loc.includes(filters.search.toLowerCase());
    const matchesLocation = filters.location === 'all' || loc.includes(filters.location.toLowerCase());
    const matchesPrice = (listing.price || 0) >= filters.priceRange[0] && (listing.price || 0) <= filters.priceRange[1];
    const matchesRoomType = filters.roomType === 'all' || (listing.roomType || '').toLowerCase().includes(filters.roomType);
    const matchesBedrooms = filters.bedrooms === 'all' || String(listing.bedrooms) === filters.bedrooms;
    return matchesSearch && matchesLocation && matchesPrice && matchesRoomType && matchesBedrooms;
  });

  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case 'wifi': return <Wifi className="h-4 w-4" />;
      case 'parking': return <Car className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-medium text-foreground">Property Listings</h1>
            <p className="text-muted-foreground">Find your perfect flatshare</p>
            {error && <p className="text-destructive mt-2">{error}</p>}
          </div>
          <Button asChild>
            <Link to="/create-listing">Post a Listing</Link>
          </Button>
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
                      placeholder="Search by title or location..."
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
                      <SelectItem value="Lower Parel">Lower Parel</SelectItem>
                      <SelectItem value="Pune">Pune</SelectItem>
                      <SelectItem value="Navi Mumbai">Navi Mumbai</SelectItem>
                      <SelectItem value="Dadar">Dadar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range (₹/month)</Label>
                <div className="px-3">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => handleFilterChange('priceRange', value)}
                    max={Math.max(priceBounds.max, priceBounds.min + 1)}
                    min={priceBounds.min || 0}
                    step={1000}
                    className="w-full"
                    minStepsBetweenThumbs={1000}
                    disabled={priceBounds.max <= priceBounds.min}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>₹{filters.priceRange[0] || priceBounds.min}</span>
                  <span>₹{filters.priceRange[1] || priceBounds.max}</span>
                </div>
              </div>

              {/* Room Type and Bedrooms */}
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
                  <Label>Bedrooms</Label>
                  <Select value={filters.bedrooms} onValueChange={(value) => handleFilterChange('bedrooms', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4+ Bedrooms</SelectItem>
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
            {filteredListings.length} properties found
          </p>
          <Select defaultValue="relevance">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Most Relevant</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <Card key={listing._id} className="group hover:shadow-lg transition-shadow overflow-hidden">
              <div className="relative">
                <ImageWithFallback
                  src={listing.images?.[0]}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute top-2 right-2 bg-white/80 hover:bg-white ${
                    savedListings.includes(listing._id) ? 'text-red-500' : 'text-muted-foreground'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSaved(listing._id);
                  }}
                >
                  <Heart className={`h-4 w-4 ${savedListings.includes(listing._id) ? 'fill-current' : ''}`} />
                </Button>
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary">{listing.roomType}</Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-foreground line-clamp-1">{listing.title}</h3>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">{listing.rating?.average?.toFixed?.(1) || '0.0'}</span>
                  </div>
                </div>
                
                <div className="flex items-center text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{listing.location}</span>
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    <span>{listing.bedrooms}</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    <span>{listing.bathrooms}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{listing.roommates?.current || 0}/{listing.roommates?.max || 0}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {Array.isArray(listing.amenities) && listing.amenities.slice(0, 3).map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-1">
                      {getAmenityIcon(amenity)}
                      <span className="text-xs text-muted-foreground capitalize">{amenity}</span>
                    </div>
                  ))}
                  {Array.isArray(listing.amenities) && listing.amenities.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{listing.amenities.length - 3} more</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-medium text-foreground">₹{listing.price}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/listing/${listing._id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No properties found matching your criteria.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setFilters({
                search: '',
                location: 'all',
                priceRange: [15000, 100000],
                roomType: 'all',
                bedrooms: 'all'
              })}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}