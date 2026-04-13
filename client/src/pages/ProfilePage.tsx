import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field, Input, Select } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../lib/types';

const toInitials = (firstName: string, lastName: string, name: string) =>
  `${firstName[0] || ''}${lastName[0] || name[0] || ''}`.toUpperCase() || 'U';

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const { data } = useQuery<User>({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/profile')).data
  });
  const [photoUrl, setPhotoUrl] = useState('');

  const mutation = useMutation({
    mutationFn: async (payload: User) => (await api.put('/profile', payload)).data,
    onSuccess: (updated) => {
      setPhotoUrl(updated.photoUrl || '');
      updateUser(updated);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  useEffect(() => {
    if (data) {
      setPhotoUrl(data.photoUrl || '');
    }
  }, [data]);

  if (!data) return null;

  const firstName = data.firstName || data.name.split(' ')[0] || '';
  const lastName = data.lastName || data.name.split(' ').slice(1).join(' ');
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || data.name;

  return (
    <Card>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Profile</p>
      <h2 className="mt-2 text-3xl font-bold">Personal information</h2>
      <form
        className="mt-6 space-y-8"
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);

          let nextPhotoUrl = photoUrl;
          const photoFile = formData.get('photo');

          if (photoFile instanceof File && photoFile.size > 0) {
            nextPhotoUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
              reader.onerror = () => reject(new Error('Unable to read image file'));
              reader.readAsDataURL(photoFile);
            });
          }

          mutation.mutate({
            ...data,
            name: [String(formData.get('firstName') || ''), String(formData.get('lastName') || '')].filter(Boolean).join(' ').trim() || data.name,
            email: String(formData.get('email')),
            firstName: String(formData.get('firstName')),
            lastName: String(formData.get('lastName')),
            phone: String(formData.get('phone')),
            bio: data.bio,
            gender: (formData.get('gender') || data.gender) as User['gender'],
            dob: String(formData.get('dob') || data.dob || ''),
            city: String(formData.get('city') || data.city || ''),
            state: String(formData.get('state') || data.state || ''),
            country: String(formData.get('country') || data.country || ''),
            photoUrl: nextPhotoUrl,
            riskPreference: (formData.get('riskPreference') || data.riskPreference) as User['riskPreference']
          });
        }}
      >
        <div className="flex flex-col gap-5 rounded-[28px] border border-slate-200 bg-slate-50/70 p-6 md:flex-row md:items-center dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-4">
            <label className="group cursor-pointer">
              <Input accept="image/*" className="hidden" name="photo" type="file" />
              {photoUrl ? (
                <img
                  alt={fullName}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-white transition group-hover:opacity-85 dark:ring-slate-950"
                  src={photoUrl}
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black text-2xl font-bold text-white transition group-hover:scale-[1.03] dark:bg-[#0f6f67]">
                  {toInitials(firstName, lastName, data.name)}
                </div>
              )}
            </label>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Profile photo</p>
              <h3 className="mt-2 text-2xl font-bold text-ink dark:text-white">{fullName || 'User profile'}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.email}</p>
              {!photoUrl && <p className="mt-2 text-sm text-accent">Click the avatar to add a photo</p>}
            </div>
          </div>
          {photoUrl && (
            <Field label="Change Photo">
              <Input accept="image/*" className="max-w-sm" name="photo" type="file" />
            </Field>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First Name">
            <Input name="firstName" defaultValue={firstName} />
          </Field>
          <Field label="Last Name">
            <Input name="lastName" defaultValue={lastName} />
          </Field>
          <Field label="Email">
            <Input name="email" defaultValue={data.email} type="email" />
          </Field>
          <Field label="Phone No">
            <Input name="phone" defaultValue={data.phone} type="tel" />
          </Field>
          <Field label="Gender">
            <Select name="gender" defaultValue={data.gender}>
              {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="DOB">
            <Input name="dob" defaultValue={data.dob} type="date" />
          </Field>
          <Field label="Risk Preference">
            <Select name="riskPreference" defaultValue={data.riskPreference}>
              {['Conservative', 'Balanced', 'Growth'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="City">
            <Input name="city" defaultValue={data.city} />
          </Field>
          <Field label="State">
            <Input name="state" defaultValue={data.state} />
          </Field>
          <Field label="Country">
            <Input name="country" defaultValue={data.country} />
          </Field>
        </div>

        <div>
          <Button disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save Profile'}</Button>
        </div>
      </form>
    </Card>
  );
};
