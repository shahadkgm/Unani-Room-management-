import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { RoomTile } from "@/frontend/components/RoomTile";
import { StatusLegend } from "@/frontend/components/StatusBadge";
import { AdmissionDialog } from "@/frontend/components/AdmissionDialog";
import { RoomDetailsDialog } from "@/frontend/components/RoomDetailsDialog";
import { AddRoomDialog } from "@/frontend/components/AddRoomDialog";
import { useHospital } from "@/frontend/store/hospitalStore";
import type { Room } from "@/shared/types";

export function RoomBoard() {
  const { rooms, roomStatus, currentUser } = useHospital();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [admitRoom, setAdmitRoom] = useState<Room | null>(null);
  const [detailsRoom, setDetailsRoom] = useState<Room | null>(null);
  const [addRoomOpen, setAddRoomOpen] = useState(false);

  const wards = useMemo(() => {
    const filtered = rooms.filter((room) => {
      const matchesQuery =
        !query.trim() ||
        room.number.includes(query.trim()) ||
        room.type.toLowerCase().includes(query.trim().toLowerCase()) ||
        room.ward.toLowerCase().includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" || roomStatus(room.id) === statusFilter;
      return matchesQuery && matchesStatus;
    });
    const groups = new Map<string, Room[]>();
    for (const room of filtered) {
      const list = groups.get(room.ward) ?? [];
      list.push(room);
      groups.set(room.ward, list);
    }
    return [...groups.entries()];
  }, [rooms, query, statusFilter, roomStatus]);

  const handleSelect = (room: Room) => {
    if (roomStatus(room.id) === "maintenance") return; // maintenance rooms are not clickable
    setDetailsRoom(room);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search room number, type or ward"
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          {currentUser?.role === "admin" && (
            <Button onClick={() => setAddRoomOpen(true)} className="gap-1.5" size="sm">
              <Plus className="size-4" /> Add Room
            </Button>
          )}
        </div>
        <StatusLegend />
      </div>

      {wards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No rooms match this filter.
        </p>
      ) : (
        wards.map(([ward, wardRooms]) => (
          <section key={ward} className="space-y-3">
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-base font-semibold">{ward}</h2>
              <span className="text-xs text-muted-foreground">
                Floor {wardRooms[0]?.floor} · {wardRooms.length} rooms · {wardRooms[0]?.type}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {wardRooms.map((room) => (
                <RoomTile key={room.id} room={room} onSelect={handleSelect} />
              ))}
            </div>
          </section>
        ))
      )}

      <AdmissionDialog
        room={admitRoom}
        open={!!admitRoom}
        onOpenChange={(o) => !o && setAdmitRoom(null)}
      />
      <RoomDetailsDialog
        room={detailsRoom}
        open={!!detailsRoom}
        onOpenChange={(o) => !o && setDetailsRoom(null)}
      />
      <AddRoomDialog
        open={addRoomOpen}
        onOpenChange={setAddRoomOpen}
      />
    </div>
  );
}
