import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { useHospital } from "@/frontend/store/hospitalStore";
import type { RoomType } from "@/shared/types";

interface AddRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddRoomDialog({ open, onOpenChange }: AddRoomDialogProps) {
  const { addRoom } = useHospital();
  
  const [number, setNumber] = useState("");
  const [type, setType] = useState<RoomType>("General");
  const [ward, setWard] = useState("");
  const [floor, setFloor] = useState("1");
  const [beds, setBeds] = useState("1");
  const [rate, setRate] = useState("1000");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!number.trim() || !ward.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await addRoom({
        number: number.trim(),
        type,
        ward: ward.trim(),
        floor: parseInt(floor, 10) || 1,
        beds: parseInt(beds, 10) || 1,
        ratePerDay: parseFloat(rate) || 1000,
      });

      if (res.ok) {
        toast.success(res.message);
        // Clear form
        setNumber("");
        setWard("");
        setFloor("1");
        setBeds("1");
        setRate("1000");
        onOpenChange(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to add room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-primary" />
            Add New Room
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="room-number">Room Number *</Label>
              <Input
                id="room-number"
                placeholder="e.g. 101, A-12"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="room-type">Room Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as RoomType)}>
                <SelectTrigger id="room-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Semi-Private">Semi-Private</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Deluxe">Deluxe</SelectItem>
                  <SelectItem value="ICU">ICU</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="room-ward">Ward Name *</Label>
              <Input
                id="room-ward"
                placeholder="e.g. General Ward, Ward B"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="room-floor">Floor Number</Label>
              <Input
                id="room-floor"
                type="number"
                min="0"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="room-beds">Beds count</Label>
              <Input
                id="room-beds"
                type="number"
                min="1"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="room-rate">Rate per Day (₹) *</Label>
              <Input
                id="room-rate"
                type="number"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
