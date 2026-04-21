/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string; siteUrl: string; recipient: string; confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Подтвердите email для trendme</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Img src={LOGO} width="120" height="32" alt="trendme" style={logo} />
        <Section style={card}>
          <Heading style={h1}>Подтвердите ваш email</Heading>
          <Text style={text}>
            Добро пожаловать в trendme. Подтвердите{' '}
            <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>,
            чтобы открыть доступ к вирусным трендам TikTok.
          </Text>
          <Button style={button} href={confirmationUrl}>Подтвердить email</Button>
          <Text style={fallback}>
            Или скопируйте ссылку:<br />
            <Link href={confirmationUrl} style={fallbackLink}>{confirmationUrl}</Link>
          </Text>
        </Section>
        <Text style={footer}>Если вы не создавали аккаунт — просто проигнорируйте это письмо.</Text>
        <Text style={brandFooter}>trendme · trendme.kz</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const LOGO = 'https://oacmuheaobrluhvkwayc.supabase.co/storage/v1/object/public/email-assets/wordmark.png'
const INDIGO = '#5E6AD2'; const INK = '#09090B'; const MUTED = '#71717A'; const BORDER = '#E4E4E7'

const main = {
  backgroundColor: '#FAFAFA',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  margin: 0, padding: '40px 16px', color: INK,
}
const outer = { maxWidth: '520px', margin: '0 auto' }
const logo = { display: 'block', margin: '0 4px 20px' }
const card = {
  backgroundColor: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: '16px',
  padding: '36px 32px',
  boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.08)',
}
const h1 = { fontSize: '22px', fontWeight: 600 as const, color: INK, margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: '1.3' }
const text = { fontSize: '15px', color: MUTED, lineHeight: '1.65', margin: '0 0 24px' }
const link = { color: INDIGO, textDecoration: 'none', fontWeight: 500 as const }
const button = {
  backgroundColor: INDIGO, color: '#ffffff', fontSize: '15px', fontWeight: 600 as const,
  borderRadius: '10px', padding: '12px 22px', textDecoration: 'none', display: 'inline-block',
}
const fallback = { fontSize: '12px', color: MUTED, margin: '24px 0 0', lineHeight: '1.6', wordBreak: 'break-all' as const }
const fallbackLink = { color: INDIGO, textDecoration: 'underline' }
const footer = { fontSize: '13px', color: MUTED, margin: '20px 4px 0', lineHeight: '1.6' }
const brandFooter = { fontSize: '11px', color: '#A1A1AA', textAlign: 'center' as const, margin: '24px 0 0', letterSpacing: '0.3px' }
