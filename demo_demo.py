import hashlib
import uuid
from os import path
import requests
import subprocess


check_login_url = 'http://localhost:8080/check-login'
check_active_key_and_device_id_url = 'http://localhost:8080/check-authen'
check_enter_active_key_url = 'http://localhost:8080/authen'
add_id_active_key_to_account_collection = 'http://localhost:8080/add-id-active-key-to-account-collection'
account = {}

def add_username_and_password():
    # Kiểm tra xem thông tin tài khoản có trong account hay không
    if 'username' in account and 'password' in account:
        username = account['username']
        password = account['password']
        with open('config.txt', 'r') as file:
            active_key = file.read().strip()
        
        print(f"**************************** {username}")
        print(f"**************************** {password}")
        print(f"**************************** {active_key}")
        
        req = requests.post(add_id_active_key_to_account_collection, json={
            'username': username,
            'password': password,
            'active_key' : active_key
        })

        if req.status_code == 200:
            print('Thêm tài khoản thành công!')
        else:
            print('Thêm tài khoản thất bại:', req.json().get('error', 'Có lỗi xảy ra.'))
    else:
        print("Đăng nhập thành công")

def enter_and_active_key():
    while True:  # Lặp lại cho đến khi nhận được mã hợp lệ
        active_key = input('Nhập mã kích hoạt được cấp: ')
       
        device_id = subprocess.check_output('wmic csproduct get uuid').decode().split('\n')[1].strip()
        print(device_id)

        print(f'Mã thiết bị là: {device_id}')
        req = requests.post(check_enter_active_key_url, json={'active_key': active_key, 'device_id': device_id})
        
        if req.status_code == 200:
            print('********** Mã kích hoạt hợp lệ ********')
            with open("config.txt", "w") as file:
                file.write(active_key)
            check_active_key_and_device_id()
            break  # Thoát vòng lặp khi mã hợp lệ
        else:
            print(f'{req.json()}')

def check_active_key_and_device_id ():
    if path.exists('config.txt'):
        with open('config.txt', 'r') as file:
            active_key = file.read().strip()
            print(f'Mã kích hoạt là: {active_key}')
        
        device_id = subprocess.check_output('wmic csproduct get uuid').decode().split('\n')[1].strip()
        print(device_id)
        
        req = requests.post(check_active_key_and_device_id_url, json={'active_key': active_key, 'device_id': device_id})
        if req.status_code == 200:
            print('Mã kích hoạt và mã thiết bị hợp lệ')
            add_username_and_password()
            print('********* Chuyển hướng đến Dashboard ********')
        else:
            print('Mã kích hoạt hoặc mã thiết bị không hợp lệ hoặc đã kích hoạt, vui lòng nhập lại mã kích hoạt.')
            enter_and_active_key()  # Yêu cầu nhập lại mã kích hoạt
    else:
        print('Bạn chưa có mã kích hoạt, vui lòng nhập mã kích hoạt.')
        enter_and_active_key()  # Yêu cầu nhập mã kích hoạt

def login():
    while True:  # Lặp lại cho đến khi đăng nhập thành công
        username = input("Nhập vào username: ")
        password = input("Nhập vào password: ") 
        
        req = requests.post(check_login_url, json={'username': username, 'password': password})
        print("Request ok")
        
        if req.status_code == 200:
            print("Login thành công")
            account['username'] = username
            account['password'] = password
            check_active_key_and_device_id()  # Kiểm tra mã kích hoạt sau khi đăng nhập thành công
            break  # Thoát vòng lặp khi đăng nhập thành công
        else:
            print("Login thất bại, vui lòng thử lại.")

# Kiểm tra xem tệp config.txt có tồn tại không và gọi hàm tương ứng
if path.exists('config.txt'):
    check_active_key_and_device_id()
else:
    login()
