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
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Сброс пароля для trendme</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://oacmuheaobrluhvkwayc.supabase.co/storage/v1/object/public/email-assets/logo.png"
          width="48"
          height="48"
          alt="trendme"
          style={{ marginBottom: '24px', borderRadius: '12px' }}
        />
        <Heading style={h1}>Сброс пароля</Heading>
        <Text style={text}>
          Мы получили запрос на сброс пароля вашего аккаунта trendme. Нажмите кнопку ниже, чтобы задать новый пароль.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Сбросить пароль
        </Button>
        <Text style={footer}>
          Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо. Ваш пароль останется прежним.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
const button = {
  backgroundColor: 'hsl(258, 80%, 58%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: 'hsl(250, 10%, 38%)', margin: '30px 0 0', opacity: '0.6' }
