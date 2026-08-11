import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import { Verified, CheckCircle, Cancel, AccountBalanceWallet } from '@mui/icons-material';
import { web3Service } from '../utils/web3';

export default function VerifyCertificatePage() {
  const [certificateId, setCertificateId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const handleConnectWallet = async () => {
  try {
    const account: string = await web3Service.connectWallet(); 
    setIsWalletConnected(true);
    setError(null);
    console.log('Connected account:', account);
  } catch (err: any) {
    setError(err.message || 'Failed to connect wallet');
    }
  };

  const handleVerify = async () => {
    if (!certificateId) {
      setError('Please enter a certificate ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCertificateData(null);

    try {
      const result = await web3Service.verifyCertificate(parseInt(certificateId));
      setCertificateData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to verify certificate');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          <Verified sx={{ mr: 1, color: '#1976d2' }} />
          Verify Certificate
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter a certificate ID to verify its authenticity on the blockchain.
        </Typography>

        {!isWalletConnected && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Please connect your wallet to verify certificates.
            <Button
              size="small"
              variant="outlined"
              startIcon={<AccountBalanceWallet />}
              onClick={handleConnectWallet}
              sx={{ ml: 2 }}
            >
              Connect Wallet
            </Button>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Certificate ID"
              type="number"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              disabled={isLoading}
              placeholder="Enter certificate ID number"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleVerify}
              disabled={isLoading || !certificateId || !isWalletConnected}
              sx={{ height: '56px' }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
          </Grid>
        </Grid>

        {certificateData && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3 }} />
            <Alert severity={certificateData.isValid ? 'success' : 'error'}>
              <Typography variant="h6">
                {certificateData.isValid ? (
                  <>
                    <CheckCircle sx={{ mr: 1 }} />
                    Certificate is VALID
                  </>
                ) : (
                  <>
                    <Cancel sx={{ mr: 1 }} />
                    Certificate is INVALID
                  </>
                )}
              </Typography>
            </Alert>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Certificate ID
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      #{certificateData.summary.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Student Name
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {certificateData.summary.studentName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Course
                    </Typography>
                    <Typography variant="body1">
                      {certificateData.summary.courseName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Grade
                    </Typography>
                    <Chip label={certificateData.summary.grade} color="primary" size="small" />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Issued Date
                    </Typography>
                    <Typography variant="body2">
                      {certificateData.summary.issuedDate.toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Issuer Address
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {certificateData.summary.issuer}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>
    </Box>
  );
}