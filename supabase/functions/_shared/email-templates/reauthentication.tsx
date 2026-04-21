/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Ваш код подтверждения для trendme</Preview>
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
          <Heading style={h1}>Код подтверждения</Heading>
          <Text style={text}>Используйте код ниже для подтверждения вашей личности:</Text>
          <Section style={codeBox}>
            <Text style={codeStyle}>{token}</Text>
          </Section>
          <Text style={footer}>
            Код действует ограниченное время. Если вы не запрашивали его — просто проигнорируйте это письмо.
          </Text>
        </Section>
        <Text style={brand}>trendme · тренды TikTok в реальном времени</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
  margin: '0 0 24px',
}
const codeBox = {
  background: 'rgba(217, 255, 0, 0.08)',
  border: '1px solid rgba(217, 255, 0, 0.25)',
  borderRadius: '14px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '0 0 28px',
}
const codeStyle = {
  fontFamily: "'SF Mono', Menlo, Courier, monospace",
  fontSize: '32px',
  fontWeight: 700 as const,
  color: NEON,
  margin: 0,
  letterSpacing: '8px',
}
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
