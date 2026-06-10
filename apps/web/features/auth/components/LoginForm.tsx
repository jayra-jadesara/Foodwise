'use client';

import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, Stack, InputAdornment } from '@mui/material';
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

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
            router.refresh();
        }
    };

    return (
        <Stack spacing={2} component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

            {/* Email Input Styled like the Screenshot */}
            <TextField
                placeholder="Enter your email address"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <Typography sx={{ fontWeight: 700, color: '#001629', pr: 1, borderRight: '1px solid #ddd', mr: 1 }}>
                                    @
                                </Typography>
                            </InputAdornment>
                        ),
                    },
                }}
                sx={{
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        height: 56,
                        bgcolor: 'white',
                    }
                }}
            />

            <TextField
                placeholder="Enter password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        height: 56,
                        bgcolor: 'white',
                    }
                }}
            />

            {/* Primary Green Action Button */}
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
                {loading ? 'Processing...' : 'Proceed'}
            </Button>

            {/* Footer Terms */}
            <Box sx={{ textAlign: 'center', px: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    By proceeding, I accept <Link href="#" sx={{ color: '#007bff', textDecoration: 'none' }}>Terms & Condition</Link> and <Link component={NextLink} href="/privacy" sx={{ color: '#007bff', textDecoration: 'none' }}>Privacy Policy</Link>
                </Typography>

                <Typography variant="body2" sx={{ mt: 3 }}>
                    New here?{" "}
                    <Link
                        component={NextLink}
                        href="/signup"
                        color="primary"
                        sx={{ fontWeight: 700 }}
                    >
                        Create Account
                    </Link>
                </Typography>
            </Box>
        </Stack>
    );
}