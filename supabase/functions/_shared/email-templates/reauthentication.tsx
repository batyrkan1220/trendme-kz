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
      <Container style={container}>
        <Img
          src="https://oacmuheaobrluhvkwayc.supabase.co/storage/v1/object/public/email-assets/logo.png"
          width="48"
          height="48"
          alt="trendme"
          style={{ marginBottom: '24px', borderRadius: '12px' }}
        />
        <Heading style={h1}>Код подтверждения</Heading>
        <Text style={text}>Используйте код ниже для подтверждения вашей личности:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Код действует ограниченное время. Если вы не запрашивали его, просто проигнорируйте это письмо.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(230, 25%, 12%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(250, 10%, 38%)',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: 'hsl(258, 80%, 58%)',
  margin: '0 0 30px',
  letterSpacing: '4px',
}
const footer = { fontSize: '12px', color: 'hsl(250, 10%, 38%)', margin: '30px 0 0', opacity: '0.6' }
