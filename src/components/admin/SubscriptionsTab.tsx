import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  CalendarIcon, CreditCard, Crown, Download, Loader2, Search, TrendingUp,
  Users, AlertTriangle, XCircle, CheckCircle2, Clock, RefreshCw,
  Mail, Plus, Eye, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PaymentRow = {
  id: string;
  order_id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  pg_payment_id: string | null;
  status: string;
  card_mask: string | null;
  bank_code: string | null;
  mcc: string | null;
  payment_organization: string | null;
  phone: string | null;
  commission: number | null;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  failure_code: string | null;
  failure_description: string | null;
  purchase_type: string | null;
  bonus_days: number | null;
  computed_expires_at: string | null;
  refund_status: string | null;
  refund_id: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  refund_reason: string | null;
  refund_failure_description: string | null;
};

const RefundBadge = ({ status }: { status: string | null }) => {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const map: Record<string, { cls: string; label: string }> = {
    initiated: { cls: "bg-sky-500/15 text-sky-600 border-sky-500/30", label: "🔄 Инициирован" },
    processing: { cls: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30", label: "⏳ Обработка" },
    success: { cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", label: "💸 Возвращён" },
    failed: { cls: "bg-red-500/15 text-red-600 border-red-500/30", label: "⚠ Не удался" },
  };
  const m = map[status] || { cls: "", label: status };
  return <Badge className={m.cls} variant="outline">{m.label}</Badge>;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  expires_at: string;
  started_at: string;
  is_active: boolean;
  amount_paid: number | null;
  bonus_days: number | null;
  order_id: string | null;
  payment_provider: string | null;
  note: string | null;
};

type Plan = { id: string; name: string; price_rub: number; duration_days: number };

type UserMap = Record<string, { email?: string | null; name?: string | null; avatar?: string | null }>;

const fmtMoney = (v: number | null | undefined) =>
  v == null ? "—" : `${new Intl.NumberFormat("ru-RU").format(v)} ₸`;

const fmtDate = (iso: string | null | undefined, withTime = false) => {
  if (!iso) return "—";
  try {
    return format(new Date(iso), withTime ? "dd.MM.yyyy HH:mm:ss" : "dd.MM.yyyy", { locale: ru });
  } catch {
    return iso;
  }
};

const daysBetween = (target: string) => {
  const ms = new Date(target).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "success")
    return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">✅ Оплачен</Badge>;
  if (status === "pending")
    return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">⏳ Ожидает</Badge>;
  if (status === "failed")
    return <Badge className="bg-red-500/15 text-red-600 border-red-500/30">❌ Отменён</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

const DaysLeftPill = ({ days }: { days: number }) => {
  if (days < 0)
    return <Badge className="bg-zinc-500/15 text-zinc-600 border-zinc-500/30">Истёк</Badge>;
  if (days < 3)
    return <Badge className="bg-red-500/15 text-red-600 border-red-500/30">{days} дн.</Badge>;
  if (days <= 7)
    return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">{days} дн.</Badge>;
  return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">{days} дн.</Badge>;
};

export default function SubscriptionsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedSub, setSelectedSub] = useState<SubscriptionRow | null>(null);

  const { data: plans = [] } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("id,name,price_rub,duration_days");
      return (data || []) as Plan[];
    },
  });
  const planMap = useMemo(() => Object.fromEntries(plans.map(p => [p.id, p])), [plans]);

  const { data: payments = [], isLoading: payLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data as PaymentRow[];
    },
  });

  const { data: subs = [], isLoading: subsLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .order("expires_at", { ascending: true })
        .limit(2000);
      if (error) throw error;
      return data as SubscriptionRow[];
    },
  });

  // Build user map (id -> {email,name}) via admin-users edge
  const userIds = useMemo(() => {
    const set = new Set<string>();
    payments.forEach(p => set.add(p.user_id));
    subs.forEach(s => set.add(s.user_id));
    return Array.from(set);
  }, [payments, subs]);

  const { data: userMap = {} } = useQuery({
    queryKey: ["admin-users-map", userIds.length],
    enabled: userIds.length > 0,
    queryFn: async (): Promise<UserMap> => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id,name")
        .in("user_id", userIds);
      const map: UserMap = {};
      (profiles || []).forEach(p => {
        map[p.user_id] = { name: p.name, email: null };
      });
      // Fetch emails through admin-users edge
      try {
        const headers = {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        };
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`,
          { headers },
        );
        if (res.ok) {
          const json = await res.json();
          const list = json.users || json || [];
          list.forEach((u: any) => {
            map[u.id] = { ...(map[u.id] || {}), email: u.email, name: map[u.id]?.name || u.user_metadata?.name };
          });
        }
      } catch (e) {
        console.warn("Failed to load user emails", e);
      }
      return map;
    },
  });

  // ============ STATS ============
  const stats = useMemo(() => {
    const now = Date.now();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    const activeSubs = subs.filter(
      s => s.is_active && new Date(s.expires_at).getTime() > now &&
           planMap[s.plan_id] && planMap[s.plan_id].price_rub > 0,
    );

    const successPayments = payments.filter(p => p.status === "success");
    const monthRevenue = successPayments
      .filter(p => new Date(p.paid_at || p.created_at).getTime() >= monthStart)
      .reduce((s, p) => s + (p.amount || 0), 0);
    const totalRevenue = successPayments.reduce((s, p) => s + (p.amount || 0), 0);

    const expiringSoon = activeSubs.filter(s => {
      const d = daysBetween(s.expires_at);
      return d >= 0 && d <= 3;
    });

    const churned30 = subs.filter(s => {
      if (s.is_active) return false;
      const exp = new Date(s.expires_at).getTime();
      return exp < now && exp > now - 30 * 86400000 && planMap[s.plan_id]?.price_rub > 0;
    });

    // Refund stats — month
    const monthRefunds = payments.filter(p =>
      p.refund_status === "success" &&
      p.refunded_at &&
      new Date(p.refunded_at).getTime() >= monthStart,
    );
    const monthRefundAmount = monthRefunds.reduce(
      (s, p) => s + (p.refund_amount ?? p.amount ?? 0), 0,
    );
    const pendingRefunds = payments.filter(
      p => p.refund_status === "initiated" || p.refund_status === "processing",
    ).length;

    return {
      active: activeSubs.length,
      monthRevenue,
      totalRevenue,
      expiringSoon: expiringSoon.length,
      churned: churned30.length,
      expiringList: expiringSoon,
      churnedList: churned30,
      monthRefundsCount: monthRefunds.length,
      monthRefundAmount,
      pendingRefunds,
    };
  }, [subs, payments, planMap]);

  // ============ FILTERED PAYMENTS ============
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (statusFilter === "refunds_all") {
        if (!p.refund_status) return false;
      } else if (statusFilter === "refund_pending") {
        if (p.refund_status !== "initiated" && p.refund_status !== "processing") return false;
      } else if (statusFilter === "refunded") {
        if (p.refund_status !== "success") return false;
      } else if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (planFilter !== "all" && p.plan_id !== planFilter) return false;
      const created = new Date(p.created_at).getTime();
      if (dateFrom && created < dateFrom.getTime()) return false;
      if (dateTo && created > dateTo.getTime() + 86400000) return false;
      if (search) {
        const q = search.toLowerCase();
        const u = userMap[p.user_id];
        const hay = [
          p.order_id, p.pg_payment_id, p.refund_id, u?.email, u?.name, p.phone,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [payments, statusFilter, planFilter, dateFrom, dateTo, search, userMap]);

  const activeSubsList = useMemo(
    () => subs.filter(
      s => s.is_active && new Date(s.expires_at).getTime() > Date.now() &&
           planMap[s.plan_id]?.price_rub > 0,
    ),
    [subs, planMap],
  );

  // ============ MUTATIONS ============
  const extendMutation = useMutation({
    mutationFn: async ({ subId, days }: { subId: string; days: number }) => {
      const sub = subs.find(s => s.id === subId);
      if (!sub) throw new Error("Subscription not found");
      const newExpiry = new Date(
        new Date(sub.expires_at).getTime() + days * 86400000,
      ).toISOString();
      const { error } = await supabase
        .from("user_subscriptions")
        .update({ expires_at: newExpiry })
        .eq("id", subId);
      if (error) throw error;
      return newExpiry;
    },
    onSuccess: () => {
      toast.success("Подписка продлена");
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    },
    onError: (e: any) => toast.error(e.message || "Не удалось продлить"),
  });

  const cancelMutation = useMutation({
    mutationFn: async (subId: string) => {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({ is_active: false, expires_at: new Date().toISOString() })
        .eq("id", subId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Подписка отменена");
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      setSelectedSub(null);
    },
    onError: (e: any) => toast.error(e.message || "Ошибка"),
  });

  // ============ CSV EXPORT ============
  const exportCSV = () => {
    const headers = [
      "Дата", "Пользователь", "Email", "Телефон", "Тариф", "Сумма",
      "Комиссия", "Номер платежа", "Номер заказа", "Карта", "Банк", "Статус",
      "Статус возврата", "Номер возврата", "Дата возврата", "Сумма возврата", "Причина возврата",
    ];
    const rows = filteredPayments.map(p => {
      const u = userMap[p.user_id];
      const plan = planMap[p.plan_id];
      return [
        fmtDate(p.paid_at || p.created_at, true),
        u?.name || "",
        u?.email || "",
        p.phone || "",
        plan?.name || "",
        p.amount,
        p.commission || 0,
        p.pg_payment_id || "",
        p.order_id,
        p.card_mask || "",
        p.bank_code || "",
        p.status,
        p.refund_status || "",
        p.refund_id || "",
        p.refunded_at ? fmtDate(p.refunded_at, true) : "",
        p.refund_amount ?? "",
        p.refund_reason || "",
      ];
    });
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Экспортировано ${rows.length} платежей`);
  };

  if (payLoading || subsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1 — STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={<Crown className="h-4 w-4" />} label="Активных подписок" value={stats.active} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Выручка месяц" value={fmtMoney(stats.monthRevenue)} />
        <StatCard icon={<Wallet className="h-4 w-4" />} label="Выручка всего" value={fmtMoney(stats.totalRevenue)} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Истекает ≤ 3 дн." value={stats.expiringSoon} tone="amber" />
        <StatCard icon={<XCircle className="h-4 w-4" />} label="Истекло (30 дн.)" value={stats.churned} tone="red" />
      </div>

      {/* SECTION 1b — REFUND STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={<RefreshCw className="h-4 w-4" />}
          label="Возвратов за месяц"
          value={`${stats.monthRefundsCount} · ${fmtMoney(stats.monthRefundAmount)}`}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Возвраты в обработке"
          value={stats.pendingRefunds}
          tone={stats.pendingRefunds > 0 ? "amber" : undefined}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Всего возвратов"
          value={payments.filter(p => p.refund_status === "success").length}
        />
      </div>

      {/* SECTION 2 — PAYMENTS */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" /> Платежи Freedom Pay
              <Badge variant="outline">{filteredPayments.length}</Badge>
            </CardTitle>
            <Button onClick={exportCSV} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-3">
            <div className="relative col-span-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск email / номер платежа"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger><SelectValue placeholder="Тариф" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все тарифы</SelectItem>
                {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Статус" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="success">Оплачен</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="failed">Отменён</SelectItem>
                <SelectItem value="refunds_all">— Все возвраты</SelectItem>
                <SelectItem value="refund_pending">— Возврат в обработке</SelectItem>
                <SelectItem value="refunded">— Успешно возвращено</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start font-normal">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dateFrom ? fmtDate(dateFrom.toISOString()) : "От"}
                  {" – "}
                  {dateTo ? fmtDate(dateTo.toISOString()) : "До"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex flex-col gap-2 p-2">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom}
                    className={cn("p-3 pointer-events-auto")} />
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo}
                    className={cn("p-3 pointer-events-auto")} />
                  <Button size="sm" variant="ghost"
                    onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                    Сброс
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Тариф</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead>№ платежа</TableHead>
                <TableHead>Карта</TableHead>
                <TableHead>Банк</TableHead>
                <TableHead className="text-right">Комиссия</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Возврат</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.slice(0, 200).map(p => {
                const u = userMap[p.user_id];
                const plan = planMap[p.plan_id];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{fmtDate(p.paid_at || p.created_at, true)}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{u?.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{u?.email || p.user_id.slice(0, 8)}</div>
                    </TableCell>
                    <TableCell>{plan?.name || "—"}</TableCell>
                    <TableCell className="text-right font-medium">{fmtMoney(p.amount)}</TableCell>
                    <TableCell className="font-mono text-xs">{p.pg_payment_id || "—"}</TableCell>
                    <TableCell className="text-xs">{p.card_mask || "—"}</TableCell>
                    <TableCell className="text-xs">{p.bank_code || "—"}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {fmtMoney(p.commission || 0)}
                    </TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell>
                      {p.refund_status ? (
                        <div
                          className="space-y-0.5"
                          title={[
                            p.refund_id && `№ возврата: ${p.refund_id}`,
                            p.refunded_at && `Дата: ${fmtDate(p.refunded_at, true)}`,
                            p.refund_amount != null && `Сумма: ${fmtMoney(p.refund_amount)}`,
                            p.refund_reason && `Причина: ${p.refund_reason}`,
                            p.refund_failure_description && `Ошибка: ${p.refund_failure_description}`,
                          ].filter(Boolean).join("\n")}
                        >
                          <RefundBadge status={p.refund_status} />
                          {p.refund_id && (
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {p.refund_id}
                            </div>
                          )}
                          {p.refunded_at && (
                            <div className="text-[10px] text-muted-foreground">
                              {fmtDate(p.refunded_at, true)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                    Нет платежей по выбранным фильтрам
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filteredPayments.length > 200 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Показаны первые 200 из {filteredPayments.length}. Используйте фильтры или CSV.
            </p>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3 — ACTIVE SUBSCRIPTIONS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5" /> Активные подписки
            <Badge variant="outline">{activeSubsList.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Тариф</TableHead>
                <TableHead>Начало</TableHead>
                <TableHead>Истекает</TableHead>
                <TableHead>Осталось</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead>№ заказа</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSubsList.slice(0, 200).map(s => {
                const u = userMap[s.user_id];
                const plan = planMap[s.plan_id];
                const days = daysBetween(s.expires_at);
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{u?.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{u?.email || s.user_id.slice(0, 8)}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{plan?.name || "—"}</Badge></TableCell>
                    <TableCell className="text-xs">{fmtDate(s.started_at)}</TableCell>
                    <TableCell className="text-xs">{fmtDate(s.expires_at)}</TableCell>
                    <TableCell><DaysLeftPill days={days} /></TableCell>
                    <TableCell className="text-right">{fmtMoney(s.amount_paid)}</TableCell>
                    <TableCell className="font-mono text-[10px]">{s.order_id?.slice(0, 14) || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedSub(s)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {activeSubsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    Нет активных платных подписок
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SECTION 5 — EXPIRING SOON */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-amber-600">
            <AlertTriangle className="h-5 w-5" /> Истекают в ближайшие 3 дня
            <Badge variant="outline">{stats.expiringList.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.expiringList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет подписок, истекающих в ближайшее время.</p>
          ) : (
            <div className="space-y-2">
              {stats.expiringList.map(s => {
                const u = userMap[s.user_id];
                const plan = planMap[s.plan_id];
                const days = daysBetween(s.expires_at);
                return (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border bg-amber-500/5">
                    <div>
                      <div className="text-sm font-medium">{u?.name || u?.email || s.user_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">
                        {plan?.name} · истекает {fmtDate(s.expires_at)} ({days} дн.)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline"
                        onClick={() => extendMutation.mutate({ subId: s.id, days: 30 })}>
                        <Plus className="h-3 w-3 mr-1" /> +30 дн.
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedSub(s)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 6 — CHURNED */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-600">
            <XCircle className="h-5 w-5" /> Не продлили (последние 30 дней)
            <Badge variant="outline">{stats.churnedList.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.churnedList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет churned пользователей за последние 30 дней.</p>
          ) : (
            <div className="space-y-2">
              {stats.churnedList.slice(0, 50).map(s => {
                const u = userMap[s.user_id];
                const plan = planMap[s.plan_id];
                return (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border bg-red-500/5">
                    <div>
                      <div className="text-sm font-medium">{u?.name || u?.email || s.user_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">
                        Был на: {plan?.name} · истёк {fmtDate(s.expires_at)}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" disabled
                      title="Email-кампании скоро будут доступны">
                      <Mail className="h-3 w-3 mr-1" /> Оффер
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 4 — DETAIL MODAL */}
      <SubscriptionDetailModal
        sub={selectedSub}
        onClose={() => setSelectedSub(null)}
        userMap={userMap}
        planMap={planMap}
        payments={payments}
        allSubs={subs}
        onExtend={(days) => selectedSub && extendMutation.mutate({ subId: selectedSub.id, days })}
        onCancel={() => selectedSub && cancelMutation.mutate(selectedSub.id)}
      />
    </div>
  );
}

function StatCard({
  icon, label, value, tone,
}: {
  icon: React.ReactNode; label: string; value: React.ReactNode;
  tone?: "amber" | "red";
}) {
  const toneClass = tone === "amber" ? "text-amber-600" : tone === "red" ? "text-red-600" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", toneClass)}>
          {icon} <span>{label}</span>
        </div>
        <div className={cn("text-2xl font-bold mt-1", toneClass)}>{value}</div>
      </CardContent>
    </Card>
  );
}

function SubscriptionDetailModal({
  sub, onClose, userMap, planMap, payments, allSubs, onExtend, onCancel,
}: {
  sub: SubscriptionRow | null;
  onClose: () => void;
  userMap: UserMap;
  planMap: Record<string, Plan>;
  payments: PaymentRow[];
  allSubs: SubscriptionRow[];
  onExtend: (days: number) => void;
  onCancel: () => void;
}) {
  const [bonusDays, setBonusDays] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const queryClient = useQueryClient();

  const u = sub ? userMap[sub.user_id] : null;
  const plan = sub ? planMap[sub.plan_id] : null;
  const order = useMemo(
    () => sub && payments.find(p => p.order_id === sub.order_id),
    [sub, payments],
  );
  const history = useMemo(
    () => sub ? allSubs
      .filter(s => s.user_id === sub.user_id)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      : [],
    [sub, allSubs],
  );
  const days = sub ? daysBetween(sub.expires_at) : 0;
  const totalDays = sub && plan ? plan.duration_days + (sub.bonus_days || 0) : 30;
  const progress = sub ? Math.max(0, Math.min(100, (days / totalDays) * 100)) : 0;

  const saveNote = async () => {
    if (!sub) return;
    const { error } = await supabase
      .from("profiles")
      .update({ admin_notes: adminNote })
      .eq("user_id", sub.user_id);
    if (error) toast.error(error.message);
    else toast.success("Заметка сохранена");
  };

  const addBonus = async () => {
    const n = parseInt(bonusDays, 10);
    if (!n || n <= 0 || !sub) return;
    onExtend(n);
    setBonusDays("");
  };

  return (
    <>
      <Dialog open={!!sub} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Подписка пользователя
            </DialogTitle>
          </DialogHeader>

          {sub && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <div className="font-semibold">{u?.name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{u?.email || sub.user_id}</div>
                </div>
                <Badge>{plan?.name || "—"}</Badge>
              </div>

              {/* Payment info */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Информация о платеже</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-xs">
                  <Info label="№ платежа" value={order?.pg_payment_id} mono />
                  <Info label="№ заказа" value={order?.order_id} mono />
                  <Info label="Дата оплаты" value={fmtDate(order?.paid_at || sub.started_at, true)} />
                  <Info label="Сумма" value={fmtMoney(order?.amount ?? sub.amount_paid)} />
                  <Info label="Комиссия" value={fmtMoney(order?.commission || 0)} />
                  <Info label="Метод" value={order?.card_mask || order?.payment_method || "—"} />
                  <Info label="Код банка" value={order?.bank_code || "—"} />
                  <Info label="MCC" value={order?.mcc || "—"} />
                  <Info label="Организация" value={order?.payment_organization || "—"} />
                  <Info label="Телефон" value={order?.phone || "—"} />
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Срок подписки</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Начало: <b>{fmtDate(sub.started_at)}</b></span>
                    <span>Истекает: <b>{fmtDate(sub.expires_at)}</b></span>
                  </div>
                  <Progress value={progress} className={cn(
                    "h-2",
                    days < 3 && "[&>div]:bg-red-500",
                    days >= 3 && days <= 7 && "[&>div]:bg-amber-500",
                  )} />
                  <div className="text-center text-sm">
                    Осталось <b>{Math.max(0, days)}</b> дн.
                    {sub.bonus_days ? <span className="text-emerald-600"> (+{sub.bonus_days} бонусных)</span> : null}
                  </div>
                </CardContent>
              </Card>

              {/* History */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">История подписок</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Тариф</TableHead>
                        <TableHead>Начало</TableHead>
                        <TableHead>Конец</TableHead>
                        <TableHead className="text-right">Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map(h => (
                        <TableRow key={h.id}>
                          <TableCell>{planMap[h.plan_id]?.name || "—"}</TableCell>
                          <TableCell className="text-xs">{fmtDate(h.started_at)}</TableCell>
                          <TableCell className="text-xs">{fmtDate(h.expires_at)}</TableCell>
                          <TableCell className="text-right">{fmtMoney(h.amount_paid)}</TableCell>
                          <TableCell>
                            {h.is_active && new Date(h.expires_at).getTime() > Date.now()
                              ? <Badge className="bg-emerald-500/15 text-emerald-600">Активна</Badge>
                              : <Badge variant="outline">Завершена</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Admin actions */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Действия администратора</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => onExtend(30)}>
                      <Plus className="h-3 w-3 mr-1" /> +30 дней
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onExtend(90)}>
                      <Plus className="h-3 w-3 mr-1" /> +90 дней
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmCancel(true)}>
                      <XCircle className="h-3 w-3 mr-1" /> Отменить подписку
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Бонусных дней"
                      value={bonusDays}
                      onChange={(e) => setBonusDays(e.target.value)}
                      className="max-w-[180px]"
                    />
                    <Button size="sm" onClick={addBonus}>Добавить</Button>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Заметка администратора</label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={2}
                      placeholder="Комментарий по подписке..."
                    />
                    <Button size="sm" variant="outline" className="mt-2" onClick={saveNote}>
                      Сохранить заметку
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    💸 Refund через Freedom Pay API будет добавлен на следующем этапе.
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить подписку?</AlertDialogTitle>
            <AlertDialogDescription>
              Подписка будет немедленно деактивирована. Пользователь автоматически
              перейдёт на пробный тариф при следующей проверке.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={onCancel} className="bg-destructive">
              Отменить подписку
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Info({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className={cn("font-medium", mono && "font-mono text-[11px] break-all")}>
        {value || "—"}
      </div>
    </div>
  );
}
