import json
import time
import jwt
from datetime import datetime, timedelta, UTC # Добавили UTC

# --- Конфигурация ---
# ID вашей сервисной учетной записи
SERVICE_ACCOUNT_ID = "ajeho94nfn4nrd3mrvf4"

# ID ключа, который вы только что создали
KEY_ID = "ajeadodg9rb4fvce9ds3"

# Ваш закрытый ключ из файла key.json
# Убедитесь, что здесь НЕТ строки "PLEASE DO NOT REMOVE THIS LINE! Yandex.Cloud SA Key ID..."
PRIVATE_KEY = """-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCdek25epklffs8
aoMKZIiEBW42FUO0MU6d2i6HVm3nqLbZOBKNfWW9GPlBKyHG5mP0NPLrW0mOrw4r
EAWPLwb3n9QxqrLQy5s0nfkPT+n4jh1PdWymLVfAT9ppSOCq5jXCRiyUMhyHlPxk
RbniUONg//53n3HLJhukR+pp9/ZXPSQiN1N10+2f93MWCk4y8ZbmYjPg+DEbWM0u
ZgUAPrtwXMS3esnyRtEvBZANS7T5EXXZdHqq58A0lKXEl6idHsffUTD1gropD+iW
aTC9pcNXnvDj233DStTWyKsUSdxd8vphU4uWlUVvEixvdaDbBJXE3NJwZxAyCn0O
Z9CYI1LrAgMBAAECggIAOn3/mamyca0aIOY1FyqhVFxKA/ehBrCb0WEFkEpnlzjg
9czwgzJ1FChPCMgzCxRvQvlZ01a8ey2FdzRDxFvE3Dw3Dl2nfotp8kDNDkVyE9sB
gw6MFStZYTqn1xx1KrVIeYkkLMVyOF/74WjOswO1eUWMqLOJsFnOwZXeuY6bJuqf
GIScsUujrpRYq4ZztmjkLTlpZHqAES4TbAnSKTxAicH0RiBAmzytOf/tlg7pNR8a
+avihxsXziohonFx2hD9o9s4+8X4L833v6hZpQ/T6BmEgWX2quM0y4tIRMY6hnpW
7H8Dz0xl6e52cAWOi6n3qUkQ7g/ql1g+58auGE8EXQKBgQDQwTY8B94rjGtHUtv3
LhM6ZpDw7J58GZdR/KXJpTxrqyAoQ7sYOH2v923m0bB6xPCh1crHVB+X3Rdsvwky
7em1IP29VAN7rmEw9J3N3G4pVcviOk/cVYzOTLC9jktYkFyCttYJ2cEfZLGyMyOi
Wdq5m5TbkmEnS4OYWeS7NpgPdQKBgQDBHjdsWhiOx2cxqIfcH6c7g0bFzDm7HB6O
pMCieFSHA5REPPkPTWt201jBVOzRR4BzAEs2UWK11EY9J2iWHLfa9bfhqnqMf7fj
IJYvVsGQUnYO2OLcFiVNQBUJqPIzuOyRWWXDKyPndqAZVKk2d1tOOgwjchvXKrJ4
sxYN3fbs3wKBgQCaNA82+uzfqGNalVeNWIi1nCw2++L6cwD3fDSPJrLiKc+gTp/2
/UvC33hch8rgdXf3Y/Ddm0OXL6dtGhTWfS4lMVCeOWA1TZPX0Op8tfbeK9VmsIJr
lPplLftkmqcHrePYXuzu696frQciRmptNAjBEK8+HvwLRdnYgZbXwDVFPQKBgCIC
BTaSgyKZoOWQzSQJevSzAIKSnVQC9qqd/sJduFzyV2jQ5/c25gbN3yJkpzOPiOI3
mgcdu+lTUW8xgmx08Deh79jQobYeQ66+rVP2zi1xKBMjRIgHalg5QbsqwkQze415
Fb+R2EfJjxYG36mUyUJ0XHDdhmOUxEsXFnoorXQ3AoGAPNCClSUjeCxDG6IeiiWp
/Pfl/NqjB5F0PgAUxg4ok8Fukctcjp0g6DNDU8sqMPwKTSxa36byWgIiVJWnG
QYfE084SqtMrYmPIbwomB4A+wjk61S7qX4DMcTYUCOvtwM4Qwll0pcLPz0GKmE1w
n4tDjijcKquohNz5P37IW14=
-----END PRIVATE KEY-----
"""

# --- Генерация JWT ---
# Текущее время в UTC
now = datetime.now(UTC) # Использование timezone-aware UTC

# Полезная нагрузка JWT (claims)
payload = {
    'aud': 'https://iam.api.cloud.yandex.net/iam/v1/tokens', # Аудитория токена
    'iss': SERVICE_ACCOUNT_ID,                               # Издатель токена (ID сервисной учетной записи)
    'iat': int(now.timestamp()),                             # Время выдачи токена
    'exp': int((now + timedelta(hours=1)).timestamp())       # Время истечения токена (через 1 час)
}

# Заголовок JWT
headers = {
    'kid': KEY_ID  # ID ключа, который подписал токен
}

# Кодирование и подписание JWT
# Используем алгоритм 'PS256', так как Yandex.Cloud ожидает его для ключей сервисных учетных записей
encoded_jwt = jwt.encode(
    payload,
    PRIVATE_KEY,
    algorithm='PS256',
    headers=headers
)

print(encoded_jwt)