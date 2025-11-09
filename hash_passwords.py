# hash_passwords.py
import bcrypt

# Get passwords to hash
password_admin = b"password"
password_user = b"secure" 

# Hash the passwords
hashed_admin = bcrypt.hashpw(password_admin, bcrypt.gensalt()).decode('utf-8')
hashed_user = bcrypt.hashpw(password_user, bcrypt.gensalt()).decode('utf-8')

print("Copy and run these SQL commands to update the passwords in the database")
print(f"UPDATE users SET password = '{hashed_admin}' WHERE username = 'reginedahan';")
print(f"UPDATE users SET password = '{hashed_user}' WHERE username = 'kayecasem';")
print("---------------------------------------------------------")