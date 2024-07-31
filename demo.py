from pymongo import MongoClient
import uuid
from os import path
import requests
import getpass

client = MongoClient("mongodb://127.0.0.1:27017/")  # Chuỗi kết nối đến MongoDB
db = client["ActivationCode"]  # Tên cơ sở dữ liệu
active_key_collection = db["key_active"]  # Tên collection chứa mã kích hoạt
device_id_collection = db['device_id']  # Tên collection chứa device id

url1 = "http://localhost:8080/authen"
url2 = "http://localhost:8080/check-authen"
url3 = "http://localhost:8080/check-login"

def check_active_key():
    print("Bạn chưa có mã kích hoạt")
    active_key = input("Hãy nhập mã kích hoạt phần mềm: ")
    with open("config.txt", "w") as file:
        file.write(active_key)
    device_id = uuid.getnode()
    print(f'Device ID: {device_id}')
    print(f'Active Key: {active_key}')
    r = requests.post(url1, json={'active_key': active_key, 'device_id': device_id})
    print("Request ok")
    is_login == False
    if r.status_code == 200:
        print('Cập nhật thành công:', r.json())  # In thông báo cập nhật thành công
        if is_login == False:
            print('Chuyen huong den trang login')
            username = input("Nhập username: ")
            # password = getpass.getpass('password: ')
            # print(password)
            password = input("Nhập password: ")
            r = requests.post(url3, json={'username': username, 'password': password})
            print('Request ok')
            if r.status_code==200:
                print('Đăng nhập thành công')
                print('Chuyển hướng đến Dashboard')
            else:
                print('Đăng nhập thất bại')
                print("Trở lại login")
    else:
        print('Cập nhật thất bại:', r.json())  
    
    if r.status_code == 404:
        print('Mã kích hoạt không tồn tại')
        check_active_key()
    

try:
    is_login = False
    isFile = path.exists("config.txt")
    
    if isFile:
        with open('config.txt', 'r') as file:
            active_key = file.read().strip()  # Đọc mã kích hoạt
            print(f'Active Key: {active_key}')
            device_id = uuid.getnode()
            print(f'Device ID: {device_id}')
            r = requests.post(url2, json={'active_key': active_key, 'device_id': device_id})
            print('Request ok')
            if r.status_code == 200:
                print('Kiểm tra thành công:', r.json())
                if is_login == True:
                    print('* Chuyển hướng đến Dashboard')
                else:
                    print('* Chuyển hướng đến Login')
            else:
                print('Kiểm tra thất bại:', r.json())
                check_active_key()
    else:
        check_active_key()

except Exception as e:
    print(f'Lỗi: {e}')
