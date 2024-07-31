import subprocess
device_id = subprocess.check_output('wmic csproduct get uuid').decode().split('\n')[1].strip()
print(device_id)
