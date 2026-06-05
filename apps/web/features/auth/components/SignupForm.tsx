'use client';

import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, Stack, Link } from '@mui/material';
import { createClient } from '@/shared/lib/supabase/client';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Supabase by default requires email confirmation. 
      // If auto-confirm is on in your dashboard, this redirects.
      alert('Registration successful! Please check your email for a confirmation link.');
      router.push('/login');
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={3} component="form" onSubmit={handleSignup}>
        <Box textAlign="center">
          <Typography variant="h5" fontWeight={700}>Create Account</Typography>
          <Typography variant="body2" color="text.secondary">Join FoodWise to start scanning smarter</Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Full Name"
          type="text"
          fullWidth
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <TextField
          label="Email Address"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <TextField
          label="Password"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          helperText="At least 6 characters"
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          sx={{ py: 1.5, fontWeight: 700 }}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>

        <Typography variant="body2" textAlign="center">
          Already have an account?{' '}
          <Link component={NextLink} href="/login" fontWeight={600} sx={{ cursor: 'pointer' }}>
            Log In
          </Link>
        </Typography>
      </Stack>
    </Paper>
  );
}