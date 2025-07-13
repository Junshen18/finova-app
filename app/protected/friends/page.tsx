"use client";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

import FriendList, { Friend } from "@/components/friends/friend-list";
import FriendRequests, { FriendRequest } from "@/components/friends/friend-request";
import FriendRequestModal from "@/components/friends/friend-request-modal";

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [receiverDisplayName, setReceiverDisplayName] = useState("");
  const [addLoading, setAddLoading] = useState(false);

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
    if (error || !data?.success) toast.error(error?.message || data?.message);
    else {
      toast.success(data.message);
      await fetchFriendsAndRequests();
    }
  };

  const handleReject = async (id: number) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("reject_friend_request", { friendship_id: id });
    if (error || !data?.success) toast.error(error?.message || data?.message);
    else {
      toast.success(data.message);
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
    <div className="max-w-xl w-full mx-auto py-8 px-8">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Friends</h1>
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

      <Button onClick={() => setShowModal(true)}>Send Friend Request</Button>

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
