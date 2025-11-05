import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import apiService from '../services/api';
import { useAuth } from '../App';

export function CreateListing() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    bedrooms: 1,
    bathrooms: 1,
    roommates: { max: 1 },
    images: [''],
    amenities: [],
    roomType: 'Private Room',
    availableFrom: new Date().toISOString().slice(0,10)
  });
  const [img, setImg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!img.trim()) {
      setError('Please provide at least one image URL for your listing.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms)
      };

      payload.images = [img.trim()];

      if (!payload.roommates?.max || Number.isNaN(Number(payload.roommates.max))) {
        setError('Please specify how many roommates you can host.');
        setLoading(false);
        return;
      }

      payload.roommates = {
        ...payload.roommates,
        max: Number(payload.roommates.max)
      };

      const res = await apiService.createListing(payload);
      if (res.success) {
        if (res.user) {
          updateUser(res.user);
        }
        navigate(`/listing/${res.data._id}`);
      }
    } catch (e) {
      const validationMessage = Array.isArray(e.errors) && e.errors.length > 0
        ? e.errors.map((item) => item.message).join(', ')
        : null;
      setError(validationMessage || e.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Listing</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-destructive mb-2">{error}</p>}
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={e=>setForm({...form, location: e.target.value})} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹/mo)</Label>
                  <Input type="number" value={form.price} onChange={e=>setForm({...form, price: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Input type="number" value={form.bedrooms} onChange={e=>setForm({...form, bedrooms: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Input type="number" value={form.bathrooms} onChange={e=>setForm({...form, bathrooms: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Max Roommates</Label>
                <Input type="number" value={form.roommates.max} onChange={e=>setForm({...form, roommates: { ...form.roommates, max: Number(e.target.value) }})} required />
              </div>
              <div className="space-y-2">
                <Label>First Image URL</Label>
                <Input value={img} onChange={e=>setImg(e.target.value)} placeholder="https://..." required />
              </div>
              <div className="space-y-2">
                <Label>Room Type</Label>
                <select className="border rounded px-2 py-1" value={form.roomType} onChange={e=>setForm({...form, roomType: e.target.value})}>
                  <option>Private Room</option>
                  <option>Shared Room</option>
                  <option>Studio</option>
                  <option>Entire Place</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Available From</Label>
                <Input type="date" value={form.availableFrom} onChange={e=>setForm({...form, availableFrom: e.target.value})} required />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={()=>navigate('/listings')}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
