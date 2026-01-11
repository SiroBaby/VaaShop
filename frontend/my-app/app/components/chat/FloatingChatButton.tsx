"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { MessageCircle, Send } from "lucide-react";
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  IconButton,
  TextField,
  Button,
  Paper,
  Grid
} from "@mui/material";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USER_CHATS, GET_CHAT_BY_ID, GET_SHOP_CHATS, GET_SHOP_ID_BY_USER_ID } from "@/graphql/queries";
import { MARK_MESSAGES_AS_READ } from "@/graphql/mutations";
import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Refresh, Close } from "@mui/icons-material";
import { useSocket } from "@/contexts/SocketContext";
import { apolloClient } from "@/lib/apollo";
import React from "react";
import { useChat } from "@/contexts/ChatContext";

interface ChatItem {
  chat_id: string;
  id_user: string;
  shop_id: string;
  last_message_at: string | null;
  shop: {
    shop_id: string;
    shop_name: string;
    logo: string | null;
  } | null;
  user?: {
    id_user: string;
    user_name: string;
    avatar: string | null;
  };
  messages: {
    message_id: number;
    message: string;
    sender_type: "user" | "shop";
    sender_id: string;
    sent_at: string;
    is_read: boolean;
  }[];
}

export default function FloatingChatButton() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [shopId, setShopId] = useState<string | null>(null);
  const { isSignedIn, user } = useUser();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const {
    socket,
    isConnected,
    joinChatRoom,
    leaveChatRoom,
    sendMessage: sendSocketMessage,
  } = useSocket();
  const { setHandleChatCreated, isOpen, setIsOpen } = useChat();

  const [markMessagesAsRead] = useMutation(MARK_MESSAGES_AS_READ);

  // Đảm bảo chat không tự động mở khi component mount
  useEffect(() => {
    // Chỉ reset selectedChat khi component mount lần đầu
    setSelectedChat(null);
  }, []); // Empty dependency array for mount only

  // Xử lý trạng thái isOpen riêng biệt
  useEffect(() => {
    if (!isOpen) {
      setSelectedChat(null);
    }
  }, [isOpen]);

  // Lấy chats của người dùng
  const {
    loading: loadingUserChats,
    error: errorUserChats,
    data: userChatsData,
    refetch: refetchUserChats,
  } = useQuery(GET_USER_CHATS, {
    variables: { userId: user?.id },
    skip: !isSignedIn || !user,
    fetchPolicy: "network-only",
  });

  // Lấy chats của shop
  const {
    loading: loadingShopChats,
    error: errorShopChats,
    data: shopChatsData,
    refetch: refetchShopChats,
  } = useQuery(GET_SHOP_CHATS, {
    variables: { shopId },
    skip: !isSignedIn || !shopId,
    fetchPolicy: "network-only",
  });

  // Luôn lấy cả hai loại chat, vì shop cũng có thể chat với shop khác với tư cách người dùng
  useEffect(() => {
    if (isOpen && isSignedIn) {
      // console.log('Chat opened by user action, fetching data...');
      // Luôn fetch user chats
      refetchUserChats();
      
      // Fetch shop chats nếu người dùng có shop
      if (shopId) {
        refetchShopChats();
      }
    } else if (!isOpen) {
      // Reset selected chat when closing
      setSelectedChat(null);
    }
  }, [isOpen, isSignedIn, shopId, refetchShopChats, refetchUserChats]);

  // Lấy chi tiết chat đã chọn
  const {
    loading: loadingChatDetail,
    error: errorChatDetail,
    data: chatDetailData,
    refetch: refetchChatDetail,
  } = useQuery(GET_CHAT_BY_ID, {
    variables: { chatId: selectedChat },
    skip: !selectedChat,
    fetchPolicy: "network-only",
  });

  // Kiểm tra người dùng có shop không
  useEffect(() => {
    if (isSignedIn && user) {
      // Sử dụng apolloClient đã cấu hình sẵn
      apolloClient.query({
        query: GET_SHOP_ID_BY_USER_ID,
        variables: {
          id: user.id
        }
      })
      .then(result => {
        if (result.data?.getShopIdByUserId?.shop_id) {
          setShopId(result.data.getShopIdByUserId.shop_id);
        }
      })
      .catch(() => {
        // Không làm gì nếu lỗi, người dùng có thể không có shop
      });
    }
  }, [isSignedIn, user]);

  // Cuộn xuống dưới khi có tin nhắn mới
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatDetailData]);

  // Xử lý sự kiện socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Thêm event listener ngay cả khi không có selectedChat để lắng nghe tất cả tin nhắn mới
    const handleNewMessage = (data: { chat_id: string }) => {
      // console.log("New message received:", data);
      
      // Cập nhật danh sách chat khi có tin nhắn mới
      refetchUserChats();
      if (shopId) {
        refetchShopChats();
      }
      
      // Cập nhật chi tiết chat nếu đang hiển thị
      if (selectedChat === data.chat_id) {
        refetchChatDetail();
      }
    };

    socket.on("newMessage", handleNewMessage);

    // Nếu đã chọn chat, join room đó
    if (selectedChat) {
      joinChatRoom(selectedChat);
    }

    return () => {
      socket.off("newMessage", handleNewMessage);
      if (selectedChat) {
        leaveChatRoom(selectedChat);
      }
    };
  }, [socket, isConnected, selectedChat, shopId, joinChatRoom, leaveChatRoom, refetchChatDetail, refetchShopChats, refetchUserChats]);

  // Set up the chat created handler - chỉ set up handler, không tự động mở chat
  useEffect(() => {
    // console.log('Setting up chat created handler');
    setHandleChatCreated((chatId: string) => {
      // console.log('Chat created handler called with chatId:', chatId);
      // Set selected chat
      setSelectedChat(chatId);
      // Refetch để cập nhật danh sách chat
      refetchUserChats();
      if (shopId) {
        refetchShopChats();
      }
    });
  }, [setHandleChatCreated, shopId, refetchUserChats, refetchShopChats]);

  const handleOpen = () => {
    if (!isSignedIn) {
      toast.error("Please sign in to use the chat feature", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }
    // console.log('Opening chat from button click');
    setIsOpen(true);
  };

  const handleClose = () => {
    // console.log('Closing chat');
    setIsOpen(false);
    setSelectedChat(null);
  };

  const handleRefresh = () => {
    // Luôn làm mới user chats
    refetchUserChats();
    
    // Làm mới shop chats nếu người dùng có shop
    if (shopId) {
      refetchShopChats();
    }
    
    // Làm mới chi tiết chat nếu đang xem một chat cụ thể
    if (selectedChat) {
      refetchChatDetail();
    }
    
    toast.success("Đã cập nhật danh sách chat", {
      duration: 2000,
      position: "top-center",
    });
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId);
    if (user?.id) {
      markMessagesAsRead({
        variables: {
          chatId,
          userId: user.id
        }
      });
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat || !isSignedIn || !user || !isConnected) return;

    // Gửi tin nhắn với sender_id là user.id
    sendSocketMessage(selectedChat, message.trim(), user.id);
    setMessage("");
    
    // Thêm một timeout ngắn để refetch sau khi gửi tin nhắn
    setTimeout(() => {
      refetchChatDetail();
      // Luôn refetch user chats
      refetchUserChats();
      // Refetch shop chats nếu người dùng có shop
      if (shopId) {
        refetchShopChats();
      }
    }, 300);
  };

  const formatLastMessageTime = (lastMessageAt: string | null) => {
    if (!lastMessageAt) return "No messages yet";
    return formatDistanceToNow(new Date(lastMessageAt), { addSuffix: true });
  };

  const formatMessageTime = (sentAt: string) => {
    return format(new Date(sentAt), "h:mm a");
  };

  const renderChatList = () => {
    // Hiển thị cả danh sách chat của user và shop (nếu có)
    let allChats: ChatItem[] = [];
    let loading = false;
    let error = null;

    // Tải dữ liệu chat của user
    if (userChatsData?.getUserChats) {
      allChats = [...allChats, ...userChatsData.getUserChats];
    }

    // Tải dữ liệu chat của shop (nếu có)
    if (shopId && shopChatsData?.getShopChats) {
      allChats = [...allChats, ...shopChatsData.getShopChats];
    }

    // Sắp xếp theo thời gian tin nhắn cuối cùng (mới nhất lên đầu)
    allChats.sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return timeB - timeA;
    });

    // Loại bỏ các chat trùng lặp nếu có (khi người dùng vừa là user vừa là shop owner)
    const uniqueChats = allChats.filter((chat, index, self) => 
      self.findIndex(c => c.chat_id === chat.chat_id) === index
    );

    loading = loadingUserChats || (shopId ? loadingShopChats : false);
    error = errorUserChats || (shopId ? errorShopChats : null);

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" p={3}>
          <CircularProgress size={40} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box p={3} textAlign="center">
          <Typography color="error">Error loading chats. Please try again.</Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            sx={{ mt: 2 }}
          >
            Refresh
          </Button>
        </Box>
      );
    }

    if (uniqueChats.length === 0) {
      return (
        <Box p={3} textAlign="center">
          <Typography>No chats found. Start a conversation!</Typography>
        </Box>
      );
    }

    return (
      <List sx={{ width: "100%", maxHeight: "100%", overflow: "auto" }}>
        {uniqueChats.map((chat: ChatItem) => {
          // Sửa lại logic xác định shop owner - so sánh trực tiếp với chat.shop_id
          const isCurrentUserShopOwner = Boolean(shopId) && chat.shop_id === shopId;
          
          // Nếu người dùng là chủ shop, hiển thị thông tin của user
          // Ngược lại, hiển thị thông tin của shop
          const chatName = isCurrentUserShopOwner
            ? chat.user?.user_name || "Unknown User"
            : chat.shop?.shop_name || "Unknown Shop";
          
          const avatar = isCurrentUserShopOwner
            ? chat.user?.avatar || "/logo/avt-capy.png"
            : chat.shop?.logo || "/logo/avt-capy.png";

          // Thêm debug log để kiểm tra vai trò
          // console.log(`Chat ${chat.chat_id}:`, {
          //   userName: chat.user?.user_name,
          //   userId: chat.id_user,
          //   shopName: chat.shop?.shop_name,
          //   shopId: chat.shop_id,
          //   currentUserShopId: shopId,
          //   isCurrentUserShopOwner,
          //   displayingAs: isCurrentUserShopOwner ? 'shop' : 'user',
          //   chatName
          // });

          return (
            <ListItem
              key={chat.chat_id}
              onClick={() => handleChatSelect(chat.chat_id)}
              sx={{
                borderRadius: 1,
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                backgroundColor:
                  selectedChat === chat.chat_id
                    ? "rgba(25, 118, 210, 0.08)"
                    : "transparent",
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
              }}
            >
              <ListItemAvatar>
                <Avatar alt={chatName} src={avatar} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center">
                    <Typography component="span" fontWeight="medium">
                      {chatName}
                    </Typography>
                  </Box>
                }
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      noWrap
                      sx={{ maxWidth: "150px", display: "inline-block" }}
                    >
                      {chat.messages && chat.messages.length > 0
                        ? chat.messages[chat.messages.length - 1].message
                        : "No messages yet"}
                    </Typography>
                    <br />
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      {formatLastMessageTime(chat.last_message_at)}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          );
        })}
      </List>
    );
  };

  const renderChatArea = () => {
    if (!selectedChat) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height="100%"
          p={3}
        >
          <MessageCircle size={48} color="#ccc" />
          <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>
            Select a conversation to start messaging
          </Typography>
        </Box>
      );
    }

    if (loadingChatDetail) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
        >
          <CircularProgress />
        </Box>
      );
    }

    if (errorChatDetail) {
      return (
        <Box p={4} textAlign="center">
          <Typography color="error">
            Error loading chat. Please try again.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Refresh />}
            onClick={() => refetchChatDetail()}
            sx={{ mt: 2 }}
          >
            Refresh
          </Button>
        </Box>
      );
    }

    const chat = chatDetailData?.getChatById;
    if (!chat) {
      return (
        <Box p={4} textAlign="center">
          <Typography>Chat not found or might have been deleted.</Typography>
        </Box>
      );
    }

    // Sửa lại logic xác định shop owner - so sánh trực tiếp với chat.shop_id
    const isCurrentUserShopOwner = Boolean(shopId) && chat.shop_id === shopId;
    
    // Nếu người dùng là chủ shop, hiển thị thông tin của user
    // Ngược lại, hiển thị thông tin của shop
    const chatName = isCurrentUserShopOwner
      ? chat.user?.user_name || "Unknown User"
      : chat.shop?.shop_name || "Unknown Shop";
    
    const avatar = isCurrentUserShopOwner
      ? chat.user?.avatar || "/logo/avt-capy.png"
      : chat.shop?.logo || "/logo/avt-capy.png";

    return (
      <Box
        display="flex"
        flexDirection="column"
        height="100%"
        sx={{ borderLeft: "1px solid #e0e0e0" }}
      >
        {/* Header */}
        <Box
          px={2}
          py={1.5}
          display="flex"
          alignItems="center"
          sx={{ borderBottom: "1px solid #e0e0e0", bgcolor: "#f9f9f9" }}
        >
          <Avatar sx={{ mr: 1.5 }} src={avatar} />
          <Typography variant="subtitle1" fontWeight="medium">
            {chatName}
          </Typography>
        </Box>

        {/* Messages */}
        <Box
          flex={1}
          p={2}
          sx={{
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            bgcolor: "#f5f5f5",
          }}
        >
          {chat.messages?.length === 0 ? (
            <Box textAlign="center" my={4}>
              <Typography color="text.secondary">
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            chat.messages?.map((msg: {
              message_id: number;
              message: string;
              sender_id: string;
              sent_at: string;
            }) => {
              const isCurrentUser = msg.sender_id === user?.id;

              return (
                <Box
                  key={msg.message_id}
                  sx={{
                    alignSelf: isCurrentUser ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isCurrentUser ? "#1976d2" : "white",
                      color: isCurrentUser ? "white" : "text.primary",
                    }}
                  >
                    <Typography variant="body1">{msg.message}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.5,
                        textAlign: "right",
                        opacity: 0.8,
                      }}
                    >
                      {formatMessageTime(msg.sent_at)}
                    </Typography>
                  </Paper>
                </Box>
              );
            })
          )}
          <div ref={messageEndRef} />
        </Box>

        {/* Input */}
        <Box p={2} sx={{ bgcolor: "white" }}>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              size="small"
              autoComplete="off"
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!message.trim() || !isConnected}
              startIcon={<Send />}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleOpen}
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <MessageCircle />
      </Fab>

      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        keepMounted={false}
        disablePortal={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            height: "80vh",
            maxHeight: "80vh",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e0e0e0",
            p: 2,
          }}
        >
          <Box display="flex" alignItems="center">
            <Typography variant="h6" mr={1}>
              Your Messages
            </Typography>
            <IconButton
              onClick={handleRefresh}
              size="small"
              sx={{ ml: 1 }}
              title="Refresh"
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: "flex", overflow: "hidden" }}>
          <Grid container sx={{ height: "100%" }}>
            {/* Chat List Section */}
            <Grid item xs={4} sx={{ height: "100%", borderRight: "1px solid #e0e0e0" }}>
              {renderChatList()}
            </Grid>

            {/* Chat Area Section */}
            <Grid item xs={8} sx={{ height: "100%" }}>
              {renderChatArea()}
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
} 