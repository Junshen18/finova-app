"use client";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

import FriendList, { Friend } from "@/components/friends/friend-list";
import FriendRequests, { FriendRequest } from "@/components/friends/friend-request";
import FriendRequestModal from "@/components/friends/friend-request-modal";
import { FaQrcode, FaXmark, FaUserPlus } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CreateGroup from "@/components/create-group";

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [receiverDisplayName, setReceiverDisplayName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const router = useRouter();
  const fetchFriendsAndRequests = async () => {
    const supabase = createClient();
    const [{ data: friends, error: friendError }, { data: requests, error: requestError }] =
      await Promise.all([
        supabase.rpc("get_friends_list"),
        supabase.rpc("get_received_friend_requests"),
      ]);
    if (friendError || requestError) {
      toast.error(friendError?.message || requestError?.message || "Failed to load friends");
    }
    console.log(friends);
    setFriends(friends || []);
    setRequests(requests || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchFriendsAndRequests();
      setLoading(false);
    })();
  }, []);

  const handleSendFriendRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("send_friend_request", {
      receiver_display_name: receiverDisplayName,
    });
    if (error) toast.error(error.message || "Failed to send friend request");
    else toast.success(data.message || "Friend request sent!");
    setAddLoading(false);
    setReceiverDisplayName("");
    setShowModal(false);
  };

  const handleAccept = async (id: number) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("accept_friend_request", { friendship_id: id });
    if (error || !data?.success) {
      toast.error(error?.message || data?.message);
      console.log(error);
    }
    else {
      toast.success(data.message);
      console.log(data);
      await fetchFriendsAndRequests();
    }
  };

  const handleReject = async (id: number) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("reject_friend_request", { friendship_id: id });
    if (error || !data?.success){
        toast.error(error?.message || data?.message);
        console.log(error);
    }
    else {
      toast.success(data.message);
      console.log(data);
      await fetchFriendsAndRequests();
    }
  };

  const handleRemoveFriend = async (friendship_id: number) => {
    console.log(friendship_id);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("remove_friend", { friendship_id: friendship_id });
  
    if (error || !data?.success) {
      toast.error(error?.message || data?.message || "Failed to remove friend");
      console.log(error);
      return;
    }
  
    toast.success(data.message || "Friend removed");
  
    await fetchFriendsAndRequests();
  };

  return (
    <div className="max-w-xl w-full mx-auto py-8 px-6 gap-4 flex flex-col ">
      <Toaster />
      <div className="flex justify-between items-center ">
        <Link href="/protected/dashboard">
          <FaXmark className="text-2xl cursor-pointer"/>
        </Link>
        <h1 className="text-2xl font-bold ">Friends</h1>

          <FaQrcode className="text-2xl cursor-pointer" />

      </div>
      <div className="flex gap-2">
        <Button onClick={() => setShowModal(true)} className="" title="Send Friend Request" aria-label="Send Friend Request">
          <FaUserPlus className="text-xl" /> Send Friend Request
        </Button>
        <CreateGroup onCreated={fetchFriendsAndRequests} iconOnly />
      </div>
      <div className="flex flex-col gap-4 bg-foreground/5 rounded-lg p-4 justify-center items-center">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <FriendRequests
            requests={requests}
            onAccept={handleAccept}
            onReject={handleReject}
          />
          <FriendList friends={friends} onRemove={friendship_id => handleRemoveFriend(friendship_id)} />
        </>
      )}
      </div>
      


      <FriendRequestModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSendFriendRequest}
        receiverName={receiverDisplayName}
        setReceiverName={setReceiverDisplayName}
        loading={addLoading}
      />
    </div>
  );
}
