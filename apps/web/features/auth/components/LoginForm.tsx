'use client';

import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, Stack } from '@mui/material';
import { getSupabaseBrowserClient } from '@/shared/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from '@mui/material/Link';
import NextLink from 'next/link';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const supabase = getSupabaseBrowserClient();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
            router.refresh();
        }
    };

    return (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={3} component="form" onSubmit={handleLogin}>
                <Box text-align="center">
                    <Typography variant="h5" fontWeight={700}>Welcome Back</Typography>
                    <Typography variant="body2" color="text.secondary">Login to your FoodWise account</Typography>
                </Box>

                {error && <Alert severity="error">{error}</Alert>}

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
                />

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    sx={{ py: 1.5, fontWeight: 700 }}
                >
                    {loading ? 'Logging in...' : 'Sign In'}
                </Button>

                <Typography variant="body2" textAlign="center">
                    Don't have an account?{' '}
                    <Link component={NextLink} href="/signup" fontWeight={600} sx={{ cursor: 'pointer' }}>
                        Sign Up
                    </Link>
                </Typography>
            </Stack>
        </Paper>
    );
}