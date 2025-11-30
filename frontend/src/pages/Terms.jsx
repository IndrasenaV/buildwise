import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

export default function Terms() {
  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="md">
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Buildwise AI" style={{ height: 28, marginRight: 8 }} />
            <span className="brand-text">Buildwise AI</span>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Terms and Conditions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Last updated: {new Date().toLocaleDateString()}
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>1. Acceptance of Terms</Typography>
          <Typography sx={{ mb: 2 }}>
            By creating an account or using Buildwise AI, you agree to these Terms and Conditions. If you do not agree, do not use the service.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>2. Use of Data and Privacy</Typography>
          <Typography sx={{ mb: 2 }}>
            You consent to our collection and use of data you provide or that is generated through your use of the service, including project information and interactions within the app. We may use aggregated, anonymized, or de-identified data to operate, improve, and develop the service and related features, including analytics and quality assurance.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>3. AI Output and Limitations</Typography>
          <Typography sx={{ mb: 2 }}>
            Buildwise AI may generate estimates, suggestions, or analysis using artificial intelligence. AI outputs can be incomplete, inaccurate, or otherwise faulty. You are responsible for independently evaluating and verifying any AI output before use. Buildwise AI and its affiliates are not liable for decisions made based on AI output.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>4. No Warranty</Typography>
          <Typography sx={{ mb: 2 }}>
            The service is provided “as is” and “as available” without warranties of any kind, express or implied, including but not limited to accuracy, reliability, non-infringement, merchantability, or fitness for a particular purpose.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>5. Limitation of Liability</Typography>
          <Typography sx={{ mb: 2 }}>
            To the maximum extent permitted by law, Buildwise AI will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or business arising out of or related to your use of the service.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>6. Acceptable Use</Typography>
          <Typography sx={{ mb: 2 }}>
            You agree not to misuse the service, including by violating applicable laws, infringing intellectual property, interfering with the service’s operation, or attempting to access accounts or data without authorization.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>7. Analytics and Tracking</Typography>
          <Typography sx={{ mb: 2 }}>
            We may use activity tracking and analytics (such as clickstream, usage metrics, device and event logs) to improve performance, reliability, and user experience. You consent to such tracking as part of your use of the service.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>8. Modifications</Typography>
          <Typography sx={{ mb: 2 }}>
            We may update these Terms from time to time. Continued use of the service after changes become effective constitutes acceptance of the updated Terms.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>9. Termination</Typography>
          <Typography sx={{ mb: 2 }}>
            We may suspend or terminate access for any reason, including violations of these Terms. Upon termination, your right to use the service ceases immediately.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>10. Governing Law</Typography>
          <Typography sx={{ mb: 2 }}>
            These Terms are governed by applicable laws in your jurisdiction, without regard to conflict of law principles.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>11. Contact</Typography>
          <Typography sx={{ mb: 0 }}>
            For questions about these Terms, contact us via your account representative or support channel.
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}


