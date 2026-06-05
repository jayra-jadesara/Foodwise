import { redirect } from 'next/navigation';

export default function RootPage() {
  // Automatically redirect to the app dashboard
  redirect('/dashboard');
}