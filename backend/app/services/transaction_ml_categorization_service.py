import os
import requests
import random
import json
import logging

YANDEX_ACCESS_KEY_ID = os.getenv("YANDEX_ACCESS_KEY_ID")
YANDEX_SECRET_ACCESS_KEY = os.getenv("YANDEX_SECRET_ACCESS_KEY")
YANDEX_FOLDER_ID = os.getenv("YANDEX_FOLDER_ID")

# Кэш для IAM-токена
_iam_token_cache = {"token": None, "expires_at": 0}

def get_iam_token():
    now = time.time()
    # Если токен ещё валиден — используем его
    if _iam_token_cache["token"] and _iam_token_cache["expires_at"] > now + 60:
        return _iam_token_cache["token"]
    # Получаем новый токен
    resp = requests.post(
        "https://iam.api.cloud.yandex.net/iam/v1/tokens",
        json={
            "access_key_id": YANDEX_ACCESS_KEY_ID,
            "secret_access_key": YANDEX_SECRET_ACCESS_KEY,
        },
        timeout=10
    )
    resp.raise_for_status()
    data = resp.json()
    token = data["iamToken"]
    # Токен живёт 12 часов, но лучше обновлять заранее (через 11ч)
    _iam_token_cache["token"] = token
    _iam_token_cache["expires_at"] = now + 11 * 3600
    return token

# Функция для вызова YandexGPT

def yandex_gpt_categorize(description, amount):
    prompt = (
        f"Категоризируй расход: '{description}', сумма: {amount}. "
        "Верни только название категории, без пояснений."
    )
    auth_header = f"Bearer {get_iam_token()}"
    headers = {
        "Authorization": auth_header,
        "Content-Type": "application/json"
    }
    data = {
        "modelUri": f"gpt://{YANDEX_FOLDER_ID}/yandexgpt-lite",
        "completionOptions": {"stream": False, "temperature": 0.1, "maxTokens": 20},
        "messages": [{"role": "user", "text": prompt}]
    }
    resp = requests.post(
        "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
        json=data, headers=headers, timeout=10
    )
    resp.raise_for_status()
    result = resp.json()
    return result['result']['alternatives'][0]['message']['text'].strip()

# Загрузка категорий для альтернатив (опционально)
CATEGORIES_PATH = os.path.join(os.path.dirname(__file__), '../initial_data/categories.json')
with open(CATEGORIES_PATH, encoding='utf-8') as f:
    CATEGORIES = json.load(f)

def ml_categorize_transaction(description: str, amount: float):
    logger = logging.getLogger(__name__)
    logger.info(f"ML Categorization request: description='{description}', amount={amount}")
    try:
        category = yandex_gpt_categorize(description, amount)
        logger.info(f"YandexGPT response: category='{category}'")
        # Альтернативы — случайные категории, кроме основной
        alternatives = random.sample([c for c in CATEGORIES if c != category], k=min(3, len(CATEGORIES)-1))
        logger.info(f"ML Categorization result: category='{category}', confidence=0.95, alternatives={alternatives}")
        return category, 0.95, alternatives
    except Exception as e:
        logger.error(f"YandexGPT call failed: {e}", exc_info=True)
        # Fallback: если облако недоступно — вернуть "Прочее"
        logger.info("ML Categorization fallback: category='Прочее', confidence=0.0, alternatives=[]")
        return "Прочее", 0.0, [] 