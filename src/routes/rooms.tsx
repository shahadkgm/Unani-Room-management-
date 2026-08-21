import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/frontend/components/AppShell";
import { RoomBoard } from "@/frontend/components/RoomBoard";
import { useStats } from "@/frontend/store/hospitalStore";

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Room Board — Unani Hospital Room Management" },
      {
        name: "description",
        content:
          "Seat-map style room board for Unani Hospital. Tap an available room to admit a patient or an occupied room to view booking details.",
      },
      { property: "og:title", content: "Unani Hospital Room Board" },
      {
        property: "og:description",
        content: "Visual room allocation board with admission and discharge management.",
      },
    ],
  }),
  component: RoomsPage,
});

function RoomsPage() {
  const stats = useStats();
  return (
    <AppShell
      title="Room board"
      subtitle={`${stats.available} available · ${stats.occupied} occupied · ${stats.reserved} reserved · ${stats.maintenance} under maintenance`}
    >
      <RoomBoard />
    </AppShell>
  );
}
