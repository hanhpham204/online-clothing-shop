#  Hướng Dẫn Khởi Chạy Database Fashion Store (Docker)

File này hướng dẫn anh em trong team cách khởi tạo nhanh cơ sở dữ liệu MySQL cho project website bán quần áo mà không cần cài đặt XAMPP hay chạy script thủ công. 

Mọi cấu hình bảng và dữ liệu mẫu đã được thiết lập sẵn. Chỉ cần chạy 1 lệnh là cả team sẽ có chung 1 cấu trúc DB giống hệt nhau để code.

##  1. Yêu Cầu Chuẩn Bị
- Đảm bảo máy đã cài đặt **Docker Desktop** và Docker đang chạy.
- Tắt XAMPP hoặc các service MySQL local khác (đang chiếm port `3306`) để tránh xung đột.

##  2. Cấu Trúc Thư Mục
Để Docker chạy đúng, đảm bảo 2 file này nằm cùng cấp trong thư mục:
- `docker-compose.yml`: File cấu hình container.
- `init.sql`: File chứa script tạo bảng và dữ liệu mẫu. (Docker sẽ tự động nạp file này ở lần chạy đầu tiên).

##  3. Cách Khởi Chạy
Mở Terminal / Command Prompt tại thư mục chứa file `docker-compose.yml` và chạy lệnh sau:

```bash
docker-compose up -d