'use client';

import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, Stack, Link } from '@mui/material';
import { getSupabaseBrowserClient } from '@/shared/lib/supabase/client';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = getSupabaseBrowserClient();
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
    <Paper elevation={0} sx={{ p: 1 }}>
      <Stack spacing={2} component="form" onSubmit={handleSignup}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Join FoodWise to start scanning smarter
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Full Name"
          type="text"
          fullWidth
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              height: 56,
              bgcolor: 'white',
            }
          }}
        />

        <TextField
          label="Email Address"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              height: 56,
              bgcolor: 'white',
            }
          }}
        />

        <TextField
          label="Password"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          helperText="At least 6 characters"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              height: 56,
              bgcolor: 'white',
            }
          }}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          sx={{
            py: 1.8,
            fontWeight: 800,
            borderRadius: 3,
            bgcolor: '#00A651', // Matching the "Proceed" green
            textTransform: 'none',
            fontSize: '1.1rem',
            boxShadow: 'none',
            "&:hover": { bgcolor: '#008a41' }
          }}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>

        <Typography
          variant="body2"
          sx={{ textAlign: 'center' }}
        >
          Already have an account?{' '}
          <Link
            component={NextLink}
            href="/login"
            sx={{
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Log In
          </Link>
        </Typography>
      </Stack>
    </Paper>
  );
}