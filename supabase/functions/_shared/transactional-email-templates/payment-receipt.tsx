import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'trendme.kz'

interface PaymentReceiptProps {
  planName?: string
  amount?: number
  currency?: string
  orderId?: string
  paymentId?: string
  paidAt?: string
  expiresAt?: string
  bonusDays?: number
}

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

const formatAmount = (amount?: number, currency?: string) => {
  if (amount == null) return '—'
  const formatted = new Intl.NumberFormat('ru-RU').format(amount)
  return `${formatted} ${currency || 'KZT'}`
}

const PaymentReceiptEmail = ({
  planName,
  amount,
  currency,
  orderId,
  paymentId,
  paidAt,
  expiresAt,
  bonusDays,
}: PaymentReceiptProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Оплата принята — {planName || 'подписка'} активирована</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Оплата принята ✅</Heading>
        <Text style={text}>
          Спасибо за оплату! Ваша подписка <b>{planName || 'trendme'}</b> успешно активирована.
        </Text>

        <Section style={card}>
          <Row label="Тариф" value={planName || '—'} />
          <Row label="Сумма" value={formatAmount(amount, currency)} />
          <Row label="Дата оплаты" value={formatDate(paidAt)} />
          <Row label="Действует до" value={formatDate(expiresAt)} />
          {bonusDays && bonusDays > 0 ? (
            <Row label="Бонусные дни" value={`+${bonusDays} дн.`} />
          ) : null}
          <Hr style={hr} />
          <Row label="Номер заказа" value={orderId || '—'} mono />
          {paymentId ? <Row label="Номер платежа" value={paymentId} mono /> : null}
        </Section>

        <Text style={text}>
          Перейти в кабинет:{' '}
          <a href="https://trendme.kz/dashboard" style={link}>
            trendme.kz/dashboard
          </a>
        </Text>

        <Text style={footer}>
          Этот чек носит информационный характер. Фискальный чек будет отправлен отдельно
          в соответствии с законодательством РК.
        </Text>
        <Text style={footer}>С уважением, команда {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

const Row = ({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0' }}>
    <tbody>
      <tr>
        <td style={{ ...rowLabel }}>{label}</td>
        <td style={{ ...rowValue, fontFamily: mono ? 'monospace' : 'inherit' }}>
          {value}
        </td>
      </tr>
    </tbody>
  </table>
)

export const template = {
  component: PaymentReceiptEmail,
  subject: (d: Record<string, any>) =>
    `Оплата принята — ${d?.planName || 'подписка trendme'}`,
  displayName: 'Чек об оплате',
  previewData: {
    planName: '1 месяц',
    amount: 9900,
    currency: 'KZT',
    orderId: 'abcd1234-efgh5678-1748474723',
    paymentId: '1748474723',
    paidAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    bonusDays: 0,
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
}
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0a0a0a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#333', lineHeight: '1.6', margin: '0 0 16px' }
const card = {
  background: '#fafafa',
  border: '1px solid #eee',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
}
const rowLabel = {
  fontSize: '13px',
  color: '#666',
  padding: '6px 0',
  textAlign: 'left' as const,
  width: '45%',
}
const rowValue = {
  fontSize: '14px',
  color: '#0a0a0a',
  padding: '6px 0',
  textAlign: 'right' as const,
  fontWeight: 600 as const,
}
const hr = { border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }
const link = { color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }
const footer = { fontSize: '12px', color: '#999', margin: '16px 0 0', lineHeight: '1.5' }
