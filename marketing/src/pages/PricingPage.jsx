import React from 'react';
import { Box, Container, Grid, Card, CardContent, CardHeader, Typography, Stack, Divider, Button, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function PricingPage() {
	const plans = [
		{
			name: 'Guide',
			price: '$99 / month / home',
			tagline: 'Essentials to run your own build',
			features: [
				'Phase‑by‑phase tasks & checklists',
				'Quality check gates per trade',
				'Document templates & logs',
				'Email support'
			],
			cta: 'Start with Guide'
		},
		{
			name: 'AI Assurance',
			price: '$299 / month / home',
			tagline: 'AI plan + bid analysis',
			features: [
				'AI plan & drawing analysis',
				'Bid & contract checks',
				'Bid comparison across vendors',
				'Variance & omission flags',
				'Priority support'
			],
			featured: true,
			cta: 'Start with AI Assurance'
		},
		{
			name: 'Concierge',
			price: 'Custom',
			tagline: 'Dedicated coordinator / onsite',
			features: [
				'Dedicated builder coordinator',
				'Schedule & vendor orchestration',
				'Onsite support (optional)',
				'Executive reporting'
			],
			cta: 'Talk to sales'
		}
	];

	const addOns = [
		{
			name: 'Local Subcontractors',
			desc: 'Access to vetted local trades with performance references and faster bid cycles.',
			bullets: ['Vetted subs across major trades', 'RFI + bid support', 'Fair, comparable bids']
		},
		{
			name: 'Builder Discounts Access',
			desc: 'Pro pricing at tile, roofing, countertops, cabinets, paint, lumber & more.',
			bullets: ['Supplier introductions', 'SKU & selection guidance', 'Lead‑time planning']
		},
		{
			name: 'Designer & Architect Access',
			desc: 'Curated partners for concept, specs, and permit‑ready packages.',
			bullets: ['Interior design partners', 'Architectural partners', 'Value engineering support']
		}
	];

	return (
		<Box sx={{ py: 8 }}>
			<Container maxWidth="lg">
				<Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>Pricing & Plans</Typography>
				<Typography color="text.secondary" sx={{ mb: 4 }}>
					Choose a subscription that matches your project’s complexity. Add packages any time.
				</Typography>
				<Grid container spacing={2} sx={{ mb: 4 }}>
					{plans.map((p) => (
						<Grid item xs={12} md={4} key={p.name}>
							<Card variant="outlined" sx={{ height: '100%', borderColor: p.featured ? 'rgba(66,230,164,.4)' : '#1f2942', backgroundColor: '#121a2b' }}>
								<CardHeader
									title={p.name}
									subheader={p.tagline}
									subheaderTypographyProps={{ color: 'text.secondary' }}
								/>
								<CardContent>
									<Typography sx={{ fontSize: 28, fontWeight: 800, mb: 1, color: '#e6ebff' }}>{p.price}</Typography>
									<Divider sx={{ borderColor: '#1f2942', mb: 1 }} />
									<Stack spacing={1}>
										{p.features.map((f) => (
											<Stack key={f} direction="row" spacing={1} alignItems="center">
												<CheckCircleIcon color="success" fontSize="small" />
												<Typography color="text.secondary">{f}</Typography>
											</Stack>
										))}
									</Stack>
								</CardContent>
								<CardContent>
									<Button
										variant="contained"
										sx={{ color: '#0b1220' }}
										onClick={() => {
											window.location.hash = '#/'
											setTimeout(() => {
												const el = document.getElementById('contact')
												if (el) el.scrollIntoView({ behavior: 'smooth' })
											}, 50)
										}}
									>
										{p.cta}
									</Button>
									{p.featured ? <Chip label="Most Popular" color="success" size="small" sx={{ ml: 1 }} /> : null}
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>

				<Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Add‑On Packages</Typography>
				<Grid container spacing={2}>
					{addOns.map((a) => (
						<Grid item xs={12} md={4} key={a.name}>
							<Card variant="outlined" sx={{ height: '100%', borderColor: '#1f2942', backgroundColor: '#121a2b' }}>
								<CardContent>
									<Typography variant="h6">{a.name}</Typography>
									<Typography color="text.secondary" sx={{ mb: 1 }}>{a.desc}</Typography>
									<Stack spacing={1}>
										{a.bullets.map((b) => (
											<Stack key={b} direction="row" spacing={1} alignItems="center">
												<CheckCircleIcon color="success" fontSize="small" />
												<Typography color="text.secondary">{b}</Typography>
											</Stack>
										))}
									</Stack>
								</CardContent>
								<CardContent>
									<Button
										variant="outlined"
										onClick={() => {
											window.location.hash = '#/'
											setTimeout(() => {
												const el = document.getElementById('contact')
												if (el) el.scrollIntoView({ behavior: 'smooth' })
											}, 50)
										}}
									>
										Talk to us
									</Button>
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>
			</Container>
		</Box>
	);
}

