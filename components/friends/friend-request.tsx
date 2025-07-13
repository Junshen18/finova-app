import { FaCheck, FaXmark } from "react-icons/fa6";

export interface FriendRequest {
  id: number;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  created_at: string;
}

interface Props {
  requests: FriendRequest[];
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
}

export default function FriendRequests({ requests, onAccept, onReject }: Props) {
  if (requests.length === 0) return null;

  return (
    <div className="mb-3 w-full">
      <h2 className="text-lg font-semibold mb-2">Pending Requests</h2>
      <ul>
        {requests.map((req) => (
          <li
            key={req.id}
            className="py-2 border-b flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              {req.sender_avatar ? (
                <img
                  src={req.sender_avatar}
                  alt={req.sender_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                  {req.sender_name[0]}
                </div>
              )}
              <span>{req.sender_name}</span>
            </div>
            <div className="flex gap-2">
              <div
                className="bg-green-500 px-2 py-1 rounded text-white cursor-pointer"
                onClick={() => onAccept(req.id)}
              >
                <FaCheck />
              </div>
              <div
                className="bg-red-500 px-2 py-1 rounded text-white cursor-pointer"
                onClick={() => onReject(req.id)}
              >
                <FaXmark />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
