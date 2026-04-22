/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string; siteUrl: string; recipient: string; confirmationUrl: string; token?: string
}

export const SignupEmail = ({ recipient, token }: SignupEmailProps) => {
  const code = (token || '------').toString()
  const digits = code.padEnd(6, '•').slice(0, 6).split('')
  return (
    <Html lang="ru" dir="ltr">
      <Head />
      <Preview>Ваш код подтверждения trendme: {code}</Preview>
      <Body style={main}>
        <Container style={outer}>
          <Img src={LOGO} width="132" height="36" alt="trendme" style={logo} />
          <Section style={card}>
            <Heading style={h1}>Подтвердите email</Heading>
            <Text style={text}>
              Добро пожаловать в trendme. Введите код ниже, чтобы подтвердить{' '}
              <span style={emailSpan}>{recipient}</span> и открыть доступ к вирусным трендам TikTok.
            </Text>

            <table role="presentation" cellPadding={0} cellSpacing={0} style={codeTable}>
              <tbody>
                <tr>
                  {digits.map((d, i) => (
                    <td key={i} style={codeCell}>{d}</td>
                  ))}
                </tr>
              </tbody>
            </table>

            <Text style={meta}>Код действителен в течение 1 часа.</Text>
          </Section>
          <Text style={footer}>Если вы не создавали аккаунт — просто проигнорируйте это письмо.</Text>
          <Text style={brandFooter}>trendme · trendme.kz</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SignupEmail

const LOGO = 'https://oacmuheaobrluhvkwayc.supabase.co/storage/v1/object/public/email-assets/wordmark-dark.png'
const NEON = '#BFFF00'; const NEON_DIM = 'rgba(191,255,0,0.18)'
const BG = '#0a0a0a'; const SURFACE = '#111111'; const BORDER = 'rgba(255,255,255,0.08)'
const INK = '#FAFAFA'; const MUTED = '#A1A1AA'

const main = {
  backgroundColor: BG,
  backgroundImage: `radial-gradient(circle at 20% 0%, rgba(191,255,0,0.08), transparent 50%), radial-gradient(circle at 80% 100%, rgba(191,255,0,0.05), transparent 50%)`,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  margin: 0, padding: '48px 16px', color: INK,
}
const outer = { maxWidth: '520px', margin: '0 auto' }
const logo = { display: 'block', margin: '0 auto 28px' }
const card = {
  backgroundColor: SURFACE,
  backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))',
  border: `1px solid ${BORDER}`, borderRadius: '20px',
  padding: '40px 32px',
  boxShadow: `0 0 0 1px rgba(255,255,255,0.02), 0 24px 48px -16px rgba(0,0,0,0.6), 0 0 80px -40px ${NEON_DIM}`,
}
const h1 = { fontSize: '24px', fontWeight: 600 as const, color: INK, margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: '1.25' }
const text = { fontSize: '15px', color: MUTED, lineHeight: '1.65', margin: '0 0 28px' }
const emailSpan = { color: NEON, fontWeight: 500 as const }
const codeTable = { margin: '0 auto 20px', borderCollapse: 'separate' as const, borderSpacing: '6px' }
const codeCell = {
  width: '44px', height: '56px', textAlign: 'center' as const, verticalAlign: 'middle' as const,
  fontSize: '26px', fontWeight: 700 as const, color: INK, letterSpacing: '0.02em',
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: `1px solid ${BORDER}`, borderRadius: '10px', fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
}
const meta = { fontSize: '12px', color: MUTED, textAlign: 'center' as const, margin: '4px 0 0' }
const footer = { fontSize: '13px', color: MUTED, margin: '24px 4px 0', lineHeight: '1.6', textAlign: 'center' as const }
const brandFooter = { fontSize: '11px', color: '#52525B', textAlign: 'center' as const, margin: '20px 0 0', letterSpacing: '0.4px' }
