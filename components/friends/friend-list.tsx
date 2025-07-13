"use client";
import { FaEllipsis, FaUser } from "react-icons/fa6";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";

export interface Friend {
  friendship_id: number;
  friend_name: string;
  friend_avatar: string | null;
}

interface FriendListProps {
  friends: Friend[];
  onRemove: (id: number) => void;
}

export default function FriendList({ friends, onRemove }: FriendListProps) {
  if (friends.length === 0) return <p>No friends yet.</p>;

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-2">Friends List</h2>
      <ul className="w-full">
        {friends.map((friend) => (
          <li
            key={friend.friendship_id}
            className="py-2 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              {friend.friend_avatar ? (
                <img
                  src={friend.friend_avatar}
                  alt={friend.friend_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                  {friend.friend_name[0]}
                </div>
              )}
              <span>{friend.friend_name}</span>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <FaEllipsis />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="-translate-x-10">
                <AlertDialog>
                    <AlertDialogTrigger className="p-1">Unfriend</AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to remove this friend?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRemove(friend.friendship_id)}>Remove</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                </DropdownMenuContent>
            </DropdownMenu>
            
          </li>
        ))}
      </ul>
    </div>
  );
}
