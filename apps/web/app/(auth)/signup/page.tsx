import { Box, Container } from '@mui/material';
import { SignupForm } from '@/features/auth/components/SignupForm';

export default function SignupPage() {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        bgcolor: 'background.default' 
      }}
    >
      <Container maxWidth="sm">
        <SignupForm />
      </Container>
    </Box>
  );
}