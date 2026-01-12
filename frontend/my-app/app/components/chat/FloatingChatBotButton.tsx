'use client'
import { useEffect } from 'react';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';
import './n8n-chat-override.css'; // Import CSS ghi đè

export const FloatingChatBotButton = () => {
	useEffect(() => {
		// Tạo chatbot
		createChat({
			webhookUrl: 'https://n8n.sirobabycloud.io.vn/webhook/ac4b05d0-f698-4aed-9b2b-a5c7f06e13d0/chat',
            initialMessages: [
                'Xin chào! 👋',
                'Tôi có thể giúp gì cho bạn?'
            ]
		});

		// Script bổ sung để đảm bảo CSS được áp dụng sau khi n8n đã render
		const applyCustomStyles = () => {
			// Tìm tất cả các phần tử có thể thuộc về n8n chat
			const chatElements = document.querySelectorAll('[id^="n8n-chat"], [class*="n8n-chat"], [data-n8n-chat]');
			
			// Nếu tìm thấy, áp dụng CSS vào các phần tử
			if (chatElements.length > 0) {
				chatElements.forEach(element => {
					// Nếu là button, di chuyển lên
					if (element.tagName === 'BUTTON' || element.classList.contains('n8n-chat-button-container')) {
						(element as HTMLElement).style.bottom = '90px';
					}
					// Nếu là khung chat hoặc bubble
					else if (element.classList.contains('n8n-chat-bubble-container')) {
						(element as HTMLElement).style.bottom = '90px';
					}
					// Nếu là cửa sổ chat
					else if (element.classList.contains('n8n-chat-window-container')) {
						(element as HTMLElement).style.bottom = '120px';
					}
				});
			} else {
				// Nếu chưa tìm thấy, thử lại sau
				setTimeout(applyCustomStyles, 1000);
			}
		};

		// Chờ một chút để n8n render xong, sau đó áp dụng CSS
		setTimeout(applyCustomStyles, 1000);

		return () => {
			// Cleanup nếu cần
		};
	}, []);

	// Trả về div rỗng vì chatbot được render bởi thư viện n8n
	return (<div id="n8n-chat-container"></div>);
};

export default FloatingChatBotButton;