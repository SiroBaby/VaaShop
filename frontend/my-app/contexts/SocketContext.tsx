"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@clerk/nextjs';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinChatRoom: (chatId: string) => void;
  leaveChatRoom: (chatId: string) => void;
  sendMessage: (chatId: string, message: string, senderId: string) => void;
  markMessagesAsRead: (chatId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinChatRoom: () => {},
  leaveChatRoom: () => {},
  sendMessage: () => {},
  markMessagesAsRead: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isSignedIn || !user) return;

    const socketInstance = io('https://vaashop.io.vn', {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
      path: '/socket.io/',
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isSignedIn, user]);

  const joinChatRoom = (chatId: string) => {
    if (socket && isConnected && user) {
      socket.emit('joinChatRoom', { chatId, userId: user.id });
    }
  };

  const leaveChatRoom = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit('leaveChatRoom', { chatId });
    }
  };

  const sendMessage = (chatId: string, message: string, senderId: string) => {
    if (socket && isConnected && user) {
      socket.emit('sendMessage', {
        chatId,
        message,
        senderId,
      });
    }
  };

  const markMessagesAsRead = (chatId: string) => {
    if (socket && isConnected && user) {
      socket.emit('markMessagesAsRead', {
        chatId,
        userId: user.id,
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinChatRoom,
        leaveChatRoom,
        sendMessage,
        markMessagesAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}; 