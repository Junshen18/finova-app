
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  receiverName: string;
  setReceiverName: (v: string) => void;
  loading: boolean;
}

export default function FriendRequestModal({
  show,
  onClose,
  onSubmit,
  receiverName,
  setReceiverName,
  loading,
}: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 text-black">
      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-lg font-semibold mb-2">Send Friend Request</h2>
        <Input
          placeholder="Enter friend's display name"
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
          required
          className="mb-4"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Request"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-white"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
