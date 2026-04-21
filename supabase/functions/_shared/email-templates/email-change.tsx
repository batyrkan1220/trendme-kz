/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Подтверждение смены email для trendme</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Section style={card}>
          <Img
            src="https://oacmuheaobrluhvkwayc.supabase.co/storage/v1/object/public/email-assets/logo.png"
            width="56"
            height="56"
            alt="trendme"
            style={logo}
          />
          <Heading style={h1}>Смена email</Heading>
          <Text style={text}>
            Вы запросили смену email вашего аккаунта trendme с{' '}
            <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
            на{' '}
            <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Подтвердить смену email
          </Button>
          <Text style={fallback}>
            Или скопируйте ссылку:<br />
            <Link href={confirmationUrl} style={fallbackLink}>{confirmationUrl}</Link>
          </Text>
          <Text style={footer}>
            Если вы не запрашивали смену email — немедленно защитите свой аккаунт.
          </Text>
        </Section>
        <Text style={brand}>trendme · тренды TikTok в реальном времени</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const NEON = 'hsl(72, 100%, 50%)'

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
  margin: 0,
  padding: '32px 16px',
}
const outer = { maxWidth: '520px', margin: '0 auto' }
const card = {
  background: 'linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)',
  border: '1px solid rgba(217, 255, 0, 0.18)',
  borderRadius: '20px',
  padding: '40px 32px',
  boxShadow: '0 20px 60px -20px rgba(217, 255, 0, 0.15)',
}
const logo = { marginBottom: '24px', borderRadius: '14px', display: 'block' }
const h1 = {
  fontSize: '24px',
  fontWeight: 700 as const,
  color: '#ffffff',
  margin: '0 0 16px',
  letterSpacing: '-0.5px',
}
const text = {
  fontSize: '15px',
  color: 'rgba(255,255,255,0.72)',
  lineHeight: '1.65',
  margin: '0 0 28px',
}
const link = { color: NEON, textDecoration: 'none' }
const button = {
  backgroundColor: NEON,
  color: '#0a0a0a',
  fontSize: '15px',
  fontWeight: 700 as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const fallback = {
  fontSize: '12px',
  color: 'rgba(255,255,255,0.5)',
  margin: '28px 0 0',
  lineHeight: '1.6',
  wordBreak: 'break-all' as const,
}
const fallbackLink = { color: NEON, textDecoration: 'underline' }
const footer = {
  fontSize: '12px',
  color: 'rgba(255,255,255,0.4)',
  margin: '24px 0 0',
}
const brand = {
  fontSize: '11px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '20px 0 0',
  letterSpacing: '0.5px',
}
