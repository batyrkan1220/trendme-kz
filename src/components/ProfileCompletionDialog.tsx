import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, UserCircle } from "lucide-react";

export function ProfileCompletionDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user || checked) return;
    supabase
      .from("profiles")
      .select("name, phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setChecked(true);
        if (data && (!data.name || !data.phone)) {
          setName(data.name || "");
          setPhone(data.phone || "");
          setOpen(true);
        }
      });
  }, [user, checked]);

  const handleSave = async () => {
    if (!user) return;
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) {
      toast.error("Атыңызды енгізіңіз");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: trimmedName, phone: trimmedPhone || null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Профиль сақталды!");
      setOpen(false);
    } catch (err: any) {
      toast.error("Қате: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Профиліңізді толтырыңыз</DialogTitle>
          <DialogDescription className="text-center">
            Атыңыз бен телефон нөміріңізді енгізіңіз
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Аты-жөні *</Label>
            <Input
              id="profile-name"
              placeholder="Мысалы: Айдана"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Телефон нөмірі</Label>
            <Input
              id="profile-phone"
              placeholder="+7 777 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              type="tel"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full h-11 gradient-hero text-primary-foreground border-0 rounded-xl font-semibold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сақтау"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
