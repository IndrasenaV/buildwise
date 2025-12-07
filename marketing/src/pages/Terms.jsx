import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import logo from '../assets/logo.svg';

export default function Terms() {
  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <img src={logo} alt="BuildWise AI" style={{ height: 28, marginRight: 8 }} />
            <span className="brand-text">BuildWise AI</span>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
            Terms and Conditions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Last updated: {new Date().toLocaleDateString()}
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>1. Acceptance of Terms</Typography>
          <Typography sx={{ mb: 2 }}>
            By creating an account or using BuildWise AI, you agree to these Terms and Conditions. If you do not agree, do not use the service.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>2. Use of Data and Privacy</Typography>
          <Typography sx={{ mb: 2 }}>
            You consent to our collection and use of data you provide or that is generated through your use of the service, including project information and interactions within the app. We may use aggregated, anonymized, or de‑identified data to operate, improve, and develop the service and related features, including analytics and quality assurance.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>3. AI Output and Limitations</Typography>
          <Typography sx={{ mb: 2 }}>
            BuildWise AI may generate estimates, suggestions, or analysis using artificial intelligence. AI outputs can be incomplete, inaccurate, or otherwise faulty. You are responsible for independently evaluating and verifying any AI output before use. BuildWise AI and its affiliates are not liable for decisions made based on AI output.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>4. No Professional Advice</Typography>
          <Typography sx={{ mb: 2 }}>
            The service provides information for general purposes only and does not constitute professional, legal, engineering, financial, or construction advice. You should consult qualified professionals where appropriate.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>5. No Warranty</Typography>
          <Typography sx={{ mb: 2 }}>
            The service is provided “as is” and “as available” without warranties of any kind, express or implied, including but not limited to accuracy, reliability, non‑infringement, merchantability, or fitness for a particular purpose.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>6. Limitation of Liability</Typography>
          <Typography sx={{ mb: 2 }}>
            To the maximum extent permitted by law, BuildWise AI will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or business arising out of or related to your use of the service. To the extent any liability cannot be excluded, our aggregate liability will not exceed the greater of USD $100 or the amount you paid for the service in the three (3) months preceding the event giving rise to the claim.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>7. Acceptable Use</Typography>
          <Typography sx={{ mb: 2 }}>
            You agree not to misuse the service, including by violating applicable laws, infringing intellectual property, interfering with the service’s operation, or attempting to access accounts or data without authorization.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>8. Third‑Party Services</Typography>
          <Typography sx={{ mb: 2 }}>
            The service may integrate with third‑party products or services. We are not responsible for third‑party content, availability, or performance. Your use of third‑party services is governed by their terms and privacy policies.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>9. Analytics and Tracking</Typography>
          <Typography sx={{ mb: 2 }}>
            We may use activity tracking and analytics (such as clickstream, usage metrics, device and event logs) to improve performance, reliability, and user experience. You consent to such tracking as part of your use of the service.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>10. Beta and Experimental Features</Typography>
          <Typography sx={{ mb: 2 }}>
            Certain features may be released as beta or experimental and may change, break, or be withdrawn at any time without notice. Such features are provided without warranties of any kind.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>11. Indemnification</Typography>
          <Typography sx={{ mb: 2 }}>
            You agree to indemnify and hold harmless BuildWise AI, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses, including reasonable legal and accounting fees, arising out of or in any way connected with your use of the service or your violation of these Terms.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>12. Modifications</Typography>
          <Typography sx={{ mb: 2 }}>
            We may update these Terms from time to time. Continued use of the service after changes become effective constitutes acceptance of the updated Terms.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>13. Termination</Typography>
          <Typography sx={{ mb: 2 }}>
            We may suspend or terminate access for any reason, including violations of these Terms. Upon termination, your right to use the service ceases immediately.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>14. Governing Law</Typography>
          <Typography sx={{ mb: 2 }}>
            These Terms are governed by applicable laws in your jurisdiction, without regard to conflict of law principles.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>15. Contact</Typography>
          <Typography sx={{ mb: 0 }}>
            For questions about these Terms, contact us via your account representative or support channel.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}


