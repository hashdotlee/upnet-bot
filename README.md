# IT Team Management Discord Bot

Hệ thống quản lý nhân sự và công việc cho team IT thông qua Discord Bot và Google Sheets.

## Tính năng chính

- ✅ Đăng ký nhân viên IT
- 📋 Quản lý công việc với độ ưu tiên
- ⏰ Hệ thống nhắc việc tự động
- 📊 Thống kê và dashboard
- 📝 Báo cáo hàng ngày/tuần/tháng
- 🚨 Cảnh báo công việc quá hạn

## Cấu trúc Project

## Setup và Cài đặt

### 1. Thiết lập Discord Bot

1. Tạo bot tại [Discord Developer Portal](https://discord.com/developers/applications)
2. Lấy token và client ID
3. Thêm bot vào server với quyền cần thiết

### 2. Thiết lập Google Sheets

1. Tạo Google Sheet mới
2. Vào Tools > Script editor
3. Copy code từ Code.gs
4. Deploy as Web App và lấy URL

### 3. Cài đặt Bot

```bash
# Clone project
git clone [repository-url]

# Install dependencies
npm install

# Tạo file .env
cp .env.example .env

# Điền thông tin vào .env
DISCORD_TOKEN=your_token
GOOGLE_SHEETS_URL=your_script_url
CLIENT_ID=your_client_id

# Deploy commands
npm run deploy

# Chạy bot
npm start

## 18. Tạo file hướng dẫn cài đặt Google Apps Script

```markdown
# Hướng dẫn cài đặt Google Apps Script

## Bước 1: Tạo Google Sheet

1. Truy cập [Google Sheets](https://sheets.google.com)
2. Tạo spreadsheet mới
3. Đặt tên: "IT Team Management"

## Bước 2: Thêm Google Apps Script

1. Trong Google Sheet, chọn **Tools** > **Script editor**
2. Copy toàn bộ code từ file `Code.gs` vào editor
3. Đặt tên project: "IT Management System"

## Bước 3: Deploy Web App

1. Trong Apps Script editor, chọn **Deploy** > **New deployment**
2. Chọn type: **Web app**
3. Thiết lập:
   - Description: "IT Management API"
   - Execute as: **Me**
   - Who has access: **Anyone with the link**
4. Click **Deploy**
5. Copy Web app URL (cần cho file .env của Discord Bot)

## Bước 4: Thiết lập Trigger

1. Trong Apps Script editor, click biểu tượng đồng hồ (Triggers)
2. Click "+ Add Trigger"
3. Thiết lập:
   - Function: `checkReminders`
   - Event source: **Time-driven**
   - Type: **Minutes timer**
   - Interval: **Every minute**
4. Click **Save**

## Bước 5: Cho phép quyền truy cập

1. Khi deploy, Google sẽ yêu cầu authorization
2. Click **Review permissions**
3. Chọn tài khoản Google của bạn
4. Click **Allow**

## Lưu ý bảo mật

- URL Web app chỉ nên chia sẻ với người có trách nhiệm
- Không commit URL vào source control
- Có thể thêm authentication key nếu cần bảo mật cao hơn
