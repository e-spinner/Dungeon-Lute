import hashlib
import base64
import hmac
import os
import random

# Secret key for HMAC (should be kept secure)
SECRET_KEY = b'super_secret_key'

def hash_username(username, secret_key=SECRET_KEY):
    # Generate a random salt (should be kept secret and consistent per user if needed)
    salt = os.urandom(16)
    print(salt)
    salt = b'\xecOs\xfb\xc9\xc5`\xf1gY(\xf6\xd5-2\xf7'

    # Create an HMAC using the secret key, salt, and username
    hmac_hash = hmac.new(secret_key, salt + username.encode(), hashlib.sha256).digest()

    # Encode the hash in Base64 to ensure alphanumeric characters
    base64_hash = base64.urlsafe_b64encode(hmac_hash).decode('utf-8').upper()

    # Select three random, non-overlapping groups of four characters each
    random.seed(salt)
    indices = sorted(random.sample(range(0, len(base64_hash) - 4), 3))
    a = base64_hash[indices[0]:indices[0]+4]
    b = base64_hash[indices[1]:indices[1]+4]
    c = base64_hash[indices[2]:indices[2]+4]

    # Combine the groups to form the license key
    license = f'{a}-{b}-{c}'
    
    return license

# Example usage
username = "example_user"
hashed_username = hash_username(username)
print(hashed_username)
