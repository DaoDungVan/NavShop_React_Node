# NavShop React + Node

Project này là bản làm lại từ PHP sang React Vite + Node.js + MySQL.

## Chạy local

```bash
npm install
npm run dev
```

Nếu muốn chỉnh database/password thì copy `.env.example` thành `.env` rồi sửa biến môi trường.

Mặc định:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Database: `navshop_react`
- Admin: `admin@gmail.com`
- Admin password: `admin123`

Server tự tạo database, tables, admin account và dữ liệu sản phẩm mẫu khi MySQL đang chạy.

## Cấu trúc chính

- `src/`: React UI.
- `src/state.jsx`: quản lý đăng nhập và giỏ hàng bằng Context + localStorage.
- `src/components/ChatWidget.jsx`: chatbox nổi cho khách, không cần đăng nhập.
- `src/pages/AdminChat.jsx`: màn admin nhận chat realtime.
- `server/index.js`: Express app, API routes, static uploads, Socket.IO.
- `server/socket.js`: luồng chat bot trước, sau đó chuyển admin realtime.
- `server/initDb.js`: tạo bảng MySQL và seed dữ liệu.

## Luồng chat để giải thích khi quay video

1. Khách mở website, chatbox nổi tự kết nối Socket.IO và tạo `visitor_token` trong localStorage.
2. Khách không cần đăng nhập vẫn chat được vì server nhận diện bằng `visitor_token`, không dùng user id.
3. Tin nhắn đầu tiên đi vào trạng thái `bot`. Hàm `botReply()` trong `server/socket.js` tự trả lời các câu hỏi thường gặp.
4. Khi khách bấm `Chat với admin` hoặc gõ nội dung muốn gặp admin, server đổi `chat_conversations.status` sang `waiting`.
5. Admin đăng nhập, vào `/admin/chat`, Socket.IO join room `admins` để thấy danh sách cuộc chat đang chờ.
6. Khi admin chọn một cuộc chat, server đưa admin vào room `chat:{conversationId}`.
7. Từ đó khách và admin nhắn realtime trong cùng một chatbox, khách không bị chuyển sang trang khác.

## Build

```bash
npm run lint
npm run build
```
