import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import WestIcon from '@mui/icons-material/West';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default function TopNavbar() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: '#fff',
                color: '#001629',
                borderBottom: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Toolbar
                sx={{
                    minHeight: 64,
                    px: 2,
                    display: 'flex',
                }}
            >
                {/* Back Button */}
                {pathname !== '/dashboard' && <IconButton
                    edge="start"
                    onClick={() => {
                        router.push('/dashboard');
                        router.refresh();
                    }}
                    sx={{
                        bgcolor: '#F5F7FA',
                        width: 40,
                        height: 40,
                    }}
                >
                    <WestIcon fontSize="small" />
                </IconButton>}

                {/* Logo */}
                <Typography
                    sx={{
                        fontSize: '1.4rem',
                        fontWeight: 900,
                        letterSpacing: 0.5,
                        userSelect: 'none',
                        display: 'flex',
                        justifyContent: "right"
                    }}
                >
                    <span style={{ color: '#001629' }}>Food</span>
                    <span style={{ color: '#008A41' }}>Wise</span>
                </Typography>
            </Toolbar>
        </AppBar>
    );
}